// src/api/messagingService.js
import api from './strapiService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import firebaseConfig from './firebaseConfig';
import { onForegroundMessage, getFCMToken } from './firebaseConfig';
import GlobalApi from './GlobalApi';
import { Platform } from 'react-native';

/**
 * Service pour gérer la messagerie dans l'application
 */
const messagingService = {
  /**
   * Récupère toutes les conversations de l'utilisateur
   * @returns {Promise<Array>} - Liste des conversations
   */
  fetchConversations: async () => {
    try {
      const userId = await AsyncStorage.getItem('user_id');
      const response = await api.get(`/api/conversations?filters[participants][user][id]=${userId}&populate[0]=participants.user&populate[1]=lastMessage&sort=updatedAt:desc`);

      return response.data.data.map(conversation => {
        // Formater les données pour l'affichage
        const participants = conversation.participants.data || [];

        // Filtrer pour obtenir les autres participants (pas l'utilisateur actuel)
        const otherParticipants = participants.filter(
          participant => participant.user.data.id.toString() !== userId
        );

        // Si c'est une conversation de groupe, utiliser le nom de groupe
        // Sinon, utiliser le nom du participant
        const displayName = conversation.isGroup
          ? conversation.name
          : (otherParticipants.length > 0
            ? otherParticipants[0].user.data.username
            : 'Conversation');

        // Récupérer le dernier message s'il existe
        const lastMessage = conversation.lastMessage?.data
          ? {
            id: conversation.lastMessage.data.id,
            content: conversation.lastMessage.data.content,
            createdAt: conversation.lastMessage.data.createdAt,
            sent_by: conversation.lastMessage.data.sent_by?.data?.id || null,
          }
          : null;

        // Récupérer l'avatar du premier participant (pour les conversations individuelles)
        let avatarUrl = null;
        if (otherParticipants.length > 0 && otherParticipants[0].user.data.avatar) {
          avatarUrl = otherParticipants[0].user.data.avatar.data?.url;
        }

        return {
          id: conversation.id,
          documentId: conversation.documentId,
          name: displayName,
          avatar: avatarUrl,
          lastMessage,
          isGroup: conversation.isGroup,
          unreadCount: conversation.unreadCount || 0,
          participants: participants.map(p => ({
            id: p.user.data.id,
            username: p.user.data.username,
            avatar: p.user.data.avatar?.data?.url || null,
          })),
          updatedAt: conversation.updatedAt,
        };
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des conversations:', error);
      return [];
    }
  },

  /**
   * Récupère les messages d'une conversation spécifique
   * @param {string|number} conversationId - ID de la conversation
   * @param {number} page - Numéro de page
   * @param {number} pageSize - Taille de la page
   * @returns {Promise<Object>} - Messages paginés
   */
  fetchMessages: async (userData, page = 1, pageSize = 20) => {
    try {
      // Marquer la conversation comme lue
      await messagingService.markConversationAsRead(userData);

      const response = (await GlobalApi.getMessages(page, pageSize));
      // Inverser l'ordre pour avoir les messages les plus récents en bas
      const messages = response.data.data.map(message => ({
        id: message.id,
        content: message.content,
        sent_by: message.sent_by,
        attachments: message.attachments,
        createdAt: message.createdAt,
        read: message.read,
      }));

      return {
        data: messages,
        meta: response.data.meta,
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des messages:', error);
      return { data: [], meta: { pagination: { total: 0 } } };
    }
  },

  /**
   * Envoie un nouveau message
   * @param {string|number} conversationId - ID de la conversation
   * @param {string} content - Contenu du message
   * @param {Array} attachments - Pièces jointes du message
   * @returns {Promise<Object>} - Message créé
   */
  sendMessage: async (userData, content, attachments = []) => {
    try {
      // Préparer les données du message
      const messageData = {
        data: {
          "content": content,
          "sent_by": userData.documentId,
          "read": false,
        }
      };

      // Si des pièces jointes sont présentes, les télécharger d'abord
      if (attachments.length > 0) {
        const formData = new FormData();

        // Ajouter chaque pièce jointe au FormData
        attachments.forEach((attachment, index) => {
          // Préparer le fichier selon la plateforme
          if (Platform.OS === 'web' && attachment.file) {
            // Version web
            formData.append('files', attachment.file);
          } else {
            // Version mobile
            formData.append('files', {
              uri: attachment.uri,
              name: attachment.name,
              type: attachment.type || 'application/octet-stream'
            });
          }
        });

        // Télécharger les fichiers
        const uploadResponse = await fetch(`${GlobalApi.API_URL}/api/upload`, {
          method: 'POST',
          headers: {
            "Authorization": "Bearer 99d2e241bb7ba3fba491061b820abeb2e2650afba3b407ed131a082bbe2da469550e49a0cfe830d3848b0c61da6f364f67b5b6dfe8bd05921e493402c5f584a7cd5f9fc3ecc5cb4063f6fc2504fda48072652354856b542230995295d7665b19db4cf0b58dc09162eb8e269d7957c5d19eb11a4a9ffba6ec04a8fc48787132bc"
          },
          body: formData
        });

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.text();
          throw new Error(`Erreur d'upload: ${errorData}`);
        }

        // Récupérer les infos du fichier téléchargé
        const uploadedFiles = await uploadResponse.json();

        if (!uploadedFiles || uploadedFiles.length === 0) {
          throw new Error('Aucun fichier téléchargé');
        }

        // Récupérer les IDs des fichiers téléchargés
        if (uploadedFiles && uploadedFiles.length > 0) {
          messageData.data.attachments = uploadedFiles.map((file) => ({
            "id": file.id
          }));
        }
      }

      // Envoyer le message
      const response = await GlobalApi.setNewMessage(messageData);

      // // Mettre à jour le dernier message de la conversation
      // await api.put(`/api/messages`, {
      //   data: {
      //     lastMessage: response.data.data.id,
      //   },
      // });

      // Retourner le message créé
      return {
        documentId: response.data.documentId,
        ...response.data,
        sent_by: {
          documentId: userData.documentId,
        },
      };
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      throw error;
    }
  },

  /**
   * Crée une nouvelle conversation
   * @param {Array} participantIds - IDs des participants
   * @param {string} name - Nom de la conversation (pour les groupes)
   * @param {boolean} isGroup - Si c'est une conversation de groupe
   * @returns {Promise<Object>} - Conversation créée
   */
  createConversation: async (participantIds, name = null, isGroup = false) => {
    try {
      const userId = await AsyncStorage.getItem('user_id');

      // S'assurer que l'utilisateur actuel est inclus dans les participants
      if (!participantIds.includes(parseInt(userId))) {
        participantIds.push(parseInt(userId));
      }

      // Vérifier si une conversation existe déjà entre ces participants (pour les conversations non-groupe)
      if (!isGroup && participantIds.length === 2) {
        const existingConversation = await messagingService.findExistingConversation(participantIds);
        if (existingConversation) {
          return existingConversation;
        }
      }

      // Préparer les données des participants
      const participants = participantIds.map(id => ({
        user: id,
        role: id.toString() === userId ? 'admin' : 'member',
      }));

      // Créer la conversation
      const response = await api.post('/api/conversations', {
        data: {
          name: isGroup ? name : null,
          isGroup,
          participants,
          // createdBy: userId,
        },
      });

      return {
        id: response.data.data.id,
        ...response.data.data.attributes,
      };
    } catch (error) {
      console.error('Erreur lors de la création de la conversation:', error);
      throw error;
    }
  },

  /**
   * Cherche une conversation existante entre les participants donnés
   * @param {Array} participantIds - IDs des participants
   * @returns {Promise<Object|null>} - Conversation trouvée ou null
   */
  findExistingConversation: async (participantIds) => {
    try {
      const sortedIds = [...participantIds].sort().join(',');
      const response = await api.get(`/api/conversations/find-direct?participantIds=${sortedIds}`);

      if (response.data && response.data.data) {
        return {
          id: response.data.data.id,
          ...response.data.data.attributes,
        };
      }

      return null;
    } catch (error) {
      // Vérifier si c'est une erreur 404 (conversation non trouvée)
      if (error.response && error.response.status === 404) {
        // C'est normal, aucune conversation trouvée
        return null;
      }

      console.error('Erreur lors de la recherche d\'une conversation existante:', error);
      return null;
    }
  },


  // Marque une conversation comme lue
  markConversationAsRead: async (userData) => {
    try {
      const userId = userData.documentId;

      // 1. Obtenir les messages non lus dans cette conversation
      const messagesResponse = (await GlobalApi.getUnreadMessages(userId));

      const unreadMessages = messagesResponse.data.data || [];
      console.log(`Marquage de ${unreadMessages.length} messages comme lus`);

      // 2. Marquer chaque message comme lu
      for (const message of unreadMessages) {
        await GlobalApi.updateMessage(message.documentId, {
          data: {
            "read": true
          }
        })
      }

      // // 3. Mettre à jour le compteur dans la conversation
      // // await api.put(`/api/conversations/${conversationId}`, {
      // await api.put(`/api/conversations/${documentId}`, {
      //   data: {
      //     unreadCount: 0
      //   }
      // });

      return true;
    } catch (error) {
      console.error('Erreur lors du marquage comme lu:', error);
      return false;
    }
  },

  /**
   * Recherche des utilisateurs pour créer une nouvelle conversation
   * @param {string} query - Terme de recherche
   * @param {number} page - Numéro de page
   * @param {number} pageSize - Taille de la page
   * @returns {Promise<Object>} - Utilisateurs paginés
   */
  searchUsers: async (query = '', page = 1, pageSize = 20) => {
    try {
      const userId = await AsyncStorage.getItem('user_id');

      // Construire les paramètres de requête
      let queryParams = `pagination[page]=${page}&pagination[pageSize]=${pageSize}`;

      // Exclure l'utilisateur actuel
      queryParams += `&filters[id][$ne]=${userId}`;

      // Ajouter le terme de recherche s'il est fourni
      if (query) {
        queryParams += `&filters[$or][0][username][$containsi]=${query}&filters[$or][1][email][$containsi]=${query}`;
      }

      // const response = await api.get(`/api/users?${queryParams}&populate=avatar`);
      const response = await api.get(`/api/users?${queryParams}`);

      return {
        data: response.data.map(user => ({
          id: user.id,
          username: user.username,
          email: user.email,
          avatar: user.avatar?.url || null,
        })),
        meta: response.data.meta,
      };
    } catch (error) {
      console.error('Erreur lors de la recherche d\'utilisateurs:', error);
      return { data: [], meta: { pagination: { total: 0 } } };
    }
  },

  /**
   * Obtient le nombre total de messages non lus
   * @returns {Promise<number>} - Nombre de messages non lus
   */
  getUnreadMessagesCount: async () => {
    try {
      const userId = await AsyncStorage.getItem('user_id');

      const response = await api.get(`/api/conversations/unread-count?userId=${userId}`);

      return response.data.count || 0;
    } catch (error) {
      console.error('Erreur lors du comptage des messages non lus:', error);
      return 0;
    }
  },

  /**
   * Configure les écouteurs pour les mises à jour en temps réel (avec Firebase)
   * @param {Function} onNewMessage - Fonction à appeler lors de la réception d'un nouveau message
   * @returns {Function} - Fonction pour désabonner les écouteurs
   */
  setupRealtimeListeners: (onNewMessage) => {
    try {
      // Initialiser le token FCM si on n'en a pas encore
      getFCMToken().then(token => {
        if (token) {
          console.log('Token FCM initialisé:', token);
        } else {
          console.warn('Impossible d\'obtenir un token FCM');
        }
      });

      // Écouter les messages en temps réel (nécessite Firebase)
      const unsubscribe = onForegroundMessage((message) => {
        console.log('Message FCM reçu:', message);
        const { data } = message;

        if (data?.type === 'new_message') {
          // Notification de nouveau message
          try {
            const messageData = JSON.parse(data.message);
            console.log('Nouveau message reçu via FCM:', messageData);

            // Vérifier si le message existe déjà dans l'état local (pour éviter les doublons)
            if (onNewMessage) {
              onNewMessage(messageData);
            }
          } catch (error) {
            console.error('Erreur lors du parsing du message:', error);
          }
        }
      });

      return unsubscribe;
    } catch (error) {
      console.error('Erreur lors de la configuration des écouteurs en temps réel:', error);
      return () => { };
    }
  },

  // Ffonction pour vérifier les nouveaux messages périodiquement
  // Cela sert de fallback en cas de problème avec FCM
  pollForNewMessages: async (lastMessageId, callback) => {
    try {
      if (!lastMessageId) return null;

      const result = await GlobalApi.getMessagesAfterID(lastMessageId);

      if (result.data && result.data.data && result.data.data.length > 0) {
        const newMessages = result.data.data.map(message => ({
          id: message.id,
          content: message.content,
          sent_by: message.sent_by,
          attachments: message.attachments?.data?.map(attachment => ({
            id: attachment.id,
            url: attachment.url,
            mime: attachment.mime,
            name: attachment.name,
          })) || [],
          createdAt: message.createdAt,
          read: message.read,
        }));

        if (callback) {
          newMessages.forEach(msg => callback(msg));
        }

        return newMessages[newMessages.length - 1].id;
      }

      return lastMessageId;
    } catch (error) {
      console.error('Erreur lors du polling des nouveaux messages:', error);
      return lastMessageId;
    }
  }
};

export default messagingService;