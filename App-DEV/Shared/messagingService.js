// src/api/messagingService.js
import api from './strapiService';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import firebaseConfig from './firebaseConfig';
import { onForegroundMessage } from './firebaseConfig';

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
            sentBy: conversation.lastMessage.data.sentBy?.data?.id || null,
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
  fetchMessages: async (documentId, conversationId, page = 1, pageSize = 20) => {
    try {
      // Marquer la conversation comme lue
      await messagingService.markConversationAsRead(documentId, conversationId);

      const response = await api.get(
        `/api/messages?filters[conversation][id]=${conversationId}&sort=createdAt:desc&pagination[page]=${page}&pagination[pageSize]=${pageSize}&populate[0]=sentBy&populate[1]=attachments`
      );

      // Inverser l'ordre pour avoir les messages les plus récents en bas
      const messages = [...response.data.data].reverse().map(message => ({
        id: message.id,
        content: message.content,
        sentBy: message.sentBy,
        attachments: message.attachments?.data?.map(attachment => ({
          id: attachment.id,
          url: attachment.url,
          mime: attachment.mime,
          name: attachment.name,
        })) || [],
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
  sendMessage: async (documentId, conversationId, content, attachments = []) => {
    try {
      const userId = await AsyncStorage.getItem('user_id');

      // Préparer les données du message
      const messageData = {
        content,
        conversation: conversationId,
        sentBy: userId,
        read: false,
      };

      // Si des pièces jointes sont présentes, les télécharger d'abord
      if (attachments.length > 0) {
        const formData = new FormData();

        // Ajouter chaque pièce jointe au FormData
        attachments.forEach((attachment, index) => {
          const fileType = attachment.type || 'application/octet-stream';
          const fileName = attachment.name || `file-${index}`;

          formData.append('files', {
            uri: attachment.uri,
            type: fileType,
            name: fileName,
          });
        });

        // Télécharger les fichiers
        const uploadResponse = await api.post('/api/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        // Récupérer les IDs des fichiers téléchargés
        if (uploadResponse.data && uploadResponse.data.length > 0) {
          messageData.attachments = uploadResponse.data.map(file => file.id);
        }
      }

      // Envoyer le message
      const response = await api.post('/api/messages', {
        data: messageData,
      });

      // Mettre à jour le dernier message de la conversation
      await api.put(`/api/conversations/${documentId}`, {
        data: {
          lastMessage: response.data.data.id,
        },
      });

      // Retourner le message créé
      return {
        id: response.data.data.id,
        ...response.data.data.attributes,
        sentBy: {
          id: userId,
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

  // /**
  //  * Marque une conversation comme lue
  //  * @param {string|number} conversationId - ID de la conversation
  //  * @returns {Promise<boolean>} - Résultat de l'opération
  //  */
  // markConversationAsRead: async (conversationId) => {
  //   try {
  //     const userId = await AsyncStorage.getItem('user_doc_id');

  //     // Appeler l'API pour marquer les messages comme lus
  //     const response = await api.post('/api/messages/mark-as-read', {
  //       data: {  // Ajouter data pour s'assurer que la structure est correcte
  //         conversationId: parseInt(conversationId),
  //         userId: userId
  //       }
  //     });

  //     // Mettre à jour le compteur de non lus dans la conversation
  //     if (response.data && response.data.success) {
  //       console.log(`${response.data.markedCount} messages marqués comme lus`);
  //     }

  //     return true;
  //   } catch (error) {
  //     console.error('Erreur lors du marquage de la conversation comme lue:', error);
  //     // Si l'API n'est pas disponible, essayez au moins de mettre à jour le compteur
  //     try {
  //       await api.put(`/api/conversations/${conversationId}`, {
  //         data: {
  //           unreadCount: 0
  //         }
  //       });
  //       return true;
  //     } catch (innerError) {
  //       console.error('Erreur secondaire:', innerError);
  //       return false;
  //     }
  //   }
  // },
  /**
   * Marque une conversation comme lue en utilisant uniquement les API standard
   */
  markConversationAsRead: async (documentId, conversationId) => {
    try {
      const userId = await AsyncStorage.getItem('user_id');

      // 1. Obtenir les messages non lus dans cette conversation
      const messagesResponse = await api.get('/api/messages', {
        params: {
          'filters[conversation][id][$eq]': conversationId,
          'filters[read][$eq]': false,
          'filters[sentBy][id][$ne]': userId,
          'pagination[limit]': 100
        }
      });

      const unreadMessages = messagesResponse.data.data || [];
      console.log(`Marquage de ${unreadMessages.length} messages comme lus`);

      // 2. Marquer chaque message comme lu
      for (const message of unreadMessages) {
        await api.put(`/api/messages/${message.documentId}`, {
          data: {
            read: true
          }
        });
      }

      // 3. Mettre à jour le compteur dans la conversation
      // await api.put(`/api/conversations/${conversationId}`, {
      await api.put(`/api/conversations/${documentId}`, {
        data: {
          unreadCount: 0
        }
      });

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
   * @param {Function} onConversationUpdate - Fonction à appeler lors de la mise à jour d'une conversation
   * @returns {Function} - Fonction pour désabonner les écouteurs
   */
  setupRealtimeListeners: (onNewMessage, onConversationUpdate) => {
    try {
      // Écouter les messages en temps réel (nécessite Firebase)
      const unsubscribe = onForegroundMessage((message) => {
        const { data } = message;

        if (data?.type === 'new_message') {
          // Notification de nouveau message
          const messageData = JSON.parse(data.message);
          if (onNewMessage) {
            onNewMessage(messageData);
          }
        } else if (data?.type === 'conversation_update') {
          // Notification de mise à jour de conversation
          const conversationData = JSON.parse(data.conversation);
          if (onConversationUpdate) {
            onConversationUpdate(conversationData);
          }
        }
      });

      return unsubscribe;
    } catch (error) {
      console.error('Erreur lors de la configuration des écouteurs en temps réel:', error);
      return () => { };
    }
  },
};

export default messagingService;