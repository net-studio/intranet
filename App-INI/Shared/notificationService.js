// src/api/notificationService.js
import api from './strapiService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import GlobalApi from './GlobalApi';

/**
 * Service de gestion des notifications de l'application
 */
const notificationService = {
  /**
   * Configure les notifications pour l'application
   * @returns {Promise<boolean>} - Résultat de l'opération
   */
  configureNotifications: async () => {
    try {
      // Configurer le comportement des notifications quand l'app est au premier plan
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });

      return true;
    } catch (error) {
      console.error('Erreur lors de la configuration des notifications:', error);
      return false;
    }
  },

  /**
   * Demande les permissions pour les notifications push
   * @returns {Promise<boolean>} - True si l'autorisation est accordée
   */
  requestPermissions: async () => {
    try {
      // Si nous sommes sur le web, les notifications ne sont pas supportées de la même façon
      // if (Platform.OS === 'web') {
      //   console.log('Les notifications push ne sont pas complètement prises en charge sur le web');
      //   return false;
      // }

      if (!Device.isDevice) {
        console.log('Les notifications push ne fonctionnent pas sur l\'émulateur');
        return false;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      // Si les notifications sont refusées après demande
      if (finalStatus !== 'granted') {
        console.log('Permission des notifications refusée!');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erreur lors de la demande de permissions de notifications:', error);
      return false;
    }
  },

  /**
   * Enregistre l'appareil pour les notifications push
   * @returns {Promise<string|null>} - Token d'exposition ou null en cas d'erreur
   */
  registerForPushNotifications: async () => {
    try {
      // Si nous sommes sur le web, les notifications ne sont pas supportées de la même façon
      // if (Platform.OS === 'web') {
      //   console.log('Les notifications push ne sont pas complètement prises en charge sur le web');
      //   return null;
      // }

      const permissionGranted = await notificationService.requestPermissions();

      if (!permissionGranted) {
        return null;
      }

      // Obtenir le token - pour les applications React Native standard
      let token;

      try {
        // Version sans project ID (pour React Native standard)
        const tokenData = await Notifications.getExpoPushTokenAsync();
        token = tokenData.data;
      } catch (tokenError) {
        console.warn('Erreur lors de la récupération du token sans projectId:', tokenError);

        // Alternative: vous pouvez définir votre propre ID de projet ici si nécessaire
        // const PROJECT_ID = 'robine-intranet'; // À remplacer par votre ID réel si vous en avez un

        // Tentative avec un ID de projet générique (pourrait ne pas fonctionner)
        try {
          const tokenData = await Notifications.getDevicePushTokenAsync();
          token = tokenData.data;
        } catch (deviceTokenError) {
          console.error('Impossible de récupérer le token de notification:', deviceTokenError);
          return null;
        }
      }

      if (!token) {
        console.warn('Token de notification non obtenu');
        return null;
      }

      // Enregistrer le token sur le serveur
      const deviceType = Platform.OS;
      await notificationService.registerTokenWithServer(token, deviceType);

      // Si la plateforme est Android, définir le canal de notification
      if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      return token;
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement pour les notifications push:', error);
      return null;
    }
  },

  /**
   * Enregistre le token de notification sur le serveur
   * @param {string} token - Token d'exposition
   * @param {string} deviceType - Type d'appareil (ios, android)
   * @returns {Promise<boolean>} - Résultat de l'opération
   */
  registerTokenWithServer: async (token, deviceType) => {
    try {
      // Utiliser documentId au lieu de user_id
      const documentId = await AsyncStorage.getItem('documentId');

      if (!documentId) {
        console.warn('Impossible d\'enregistrer le token: utilisateur non connecté');
        return false;
      }

      // Obtenir l'ID du collaborateur à partir du documentId
      const collaborateurResponse = await GlobalApi.filterCollaborateur(documentId.replace(/"/g, ''));
      const collaborateurs = collaborateurResponse.data.data;

      if (!collaborateurs || collaborateurs.length === 0) {
        console.warn('Collaborateur non trouvé avec le documentId:', documentId);
        return false;
      }

      const collaborateurId = collaborateurs[0].id;

      // Vérifier si le token existe déjà
      const existingTokensResponse = await api.get(`/api/fcm-tokens?filters[token][$eq]=${token}`);

      if (existingTokensResponse.data.data.length > 0) {
        // Token déjà enregistré, mise à jour de la date d'utilisation
        const tokenId = existingTokensResponse.data.data[0].id;
        await api.put(`/api/fcm-tokens/${tokenId}`, {
          data: {
            lastUsed: new Date().toISOString(),
            user: collaborateurId
          },
        });
      } else {
        // Créer un nouveau token
        await api.post('/api/fcm-tokens', {
          data: {
            token,
            device: deviceType,
            user: collaborateurId,
            lastUsed: new Date().toISOString(),
          },
        });
      }

      return true;
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du token:', error);
      return false;
    }
  },

  /**
   * Configure les écouteurs de notifications
   * @param {Function} onNotificationReceived - Fonction à appeler quand une notification est reçue
   * @param {Function} onNotificationResponse - Fonction à appeler quand l'utilisateur interagit avec une notification
   * @returns {Function} - Fonction pour annuler les abonnements
   */
  setupNotificationListeners: (onNotificationReceived, onNotificationResponse) => {
    // Vérifier si nous sommes sur le web
    // if (Platform.OS === 'web') {
    //   console.log('Les listeners de notifications ne sont pas complètement pris en charge sur le web');
    //   return () => {}; // Fonction de nettoyage vide
    // }

    // Écouter les notifications reçues lorsque l'application est au premier plan
    const receivedSubscription = Notifications.addNotificationReceivedListener(
      notification => {
        if (onNotificationReceived) {
          onNotificationReceived(notification);
        }
      }
    );

    // Écouter les réponses aux notifications
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(
      response => {
        if (onNotificationResponse) {
          onNotificationResponse(response);
        }
      }
    );

    // Retourne une fonction pour annuler les abonnements
    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  },

  /**
   * Récupère les notifications de l'utilisateur
   * @param {number} page - Numéro de page
   * @param {number} pageSize - Taille de la page
   * @param {boolean} unreadOnly - Si vrai, récupère uniquement les notifications non lues
   * @returns {Promise<Object>} - Notifications paginées
   */
  getNotifications: async (page = 1, pageSize = 20, unreadOnly = false) => {
    try {
      // Utiliser documentId au lieu de user_id
      const documentId = await AsyncStorage.getItem('documentId');

      if (!documentId) {
        console.warn('Impossible de récupérer les notifications: utilisateur non connecté');
        return { data: [], meta: { pagination: { total: 0 } } };
      }

      // Obtenir l'ID du collaborateur à partir du documentId
      const collaborateurResponse = await GlobalApi.filterCollaborateur(documentId.replace(/"/g, ''));
      const collaborateurs = collaborateurResponse.data.data;

      if (!collaborateurs || collaborateurs.length === 0) {
        console.warn('Collaborateur non trouvé avec le documentId:', documentId);
        return { data: [], meta: { pagination: { total: 0 } } };
      }

      const collaborateurId = collaborateurs[0].id;

      let queryParams = `filters[user][documentId][$eq]=${documentId.replace(/"/g, '')}&pagination[page]=${page}&pagination[pageSize]=${pageSize}&sort=createdAt:desc`;

      if (unreadOnly) {
        queryParams += '&filters[read][$eq]=false';
      }

      const response = await GlobalApi.getNotifications(documentId.replace(/"/g, ''), page, pageSize);
      return {
        data: response.data.data.map(notification => ({
          id: notification.id,
          documentId: notification.documentId,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          read: notification.read,
          createdAt: notification.createdAt,
          data: notification.data || {},
        })),
        meta: response.data.meta,
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des notifications:', error);
      return { data: [], meta: { pagination: { total: 0 } } };
    }
  },

  /**
   * Marque une notification comme lue
   * @param {string|number} notificationId - ID de la notification
   * @returns {Promise<boolean>} - Résultat de l'opération
   */
  markAsRead: async (notificationId) => {
    try {
      await GlobalApi.updateNotification(
        notificationId,
        {
          data: {
            read: true,
          },
        }
      );

      return true;
    } catch (error) {
      console.error('Erreur lors du marquage de la notification comme lue:', error);
      return false;
    }
  },

  /**
   * Marque toutes les notifications comme lues
   * @returns {Promise<boolean>} - Résultat de l'opération
   */
  markAllAsRead: async () => {
    try {
      // Utiliser documentId au lieu de user_id
      const documentId = await AsyncStorage.getItem('documentId');

      if (!documentId) {
        console.warn('Impossible de marquer les notifications: utilisateur non connecté');
        return false;
      }

      // Obtenir l'ID du collaborateur à partir du documentId
      // const collaborateurResponse = await api.get(`/api/collaborateurs?filters[documentId][$eq]=${documentId}`);
      const collaborateurResponse = await GlobalApi.filterCollaborateur(documentId.replace(/"/g, ''));
      const collaborateurs = collaborateurResponse.data.data;

      if (!collaborateurs || collaborateurs.length === 0) {
        console.warn('Collaborateur non trouvé avec le documentId:', documentId);
        return false;
      }

      const collaborateurId = collaborateurs[0].id;

      // await api.post('/api/notifications/mark-all-read', {
      //   collaborateurId,
      // });
      await GlobalApi.markAllAsRead(
        {
          collaborateurId,
        }
      );

      return true;
    } catch (error) {
      console.error('Erreur lors du marquage de toutes les notifications comme lues:', error);
      return false;
    }
  },

  /**
   * Supprime une notification
   * @param {string|number} notificationId - ID de la notification
   * @returns {Promise<boolean>} - Résultat de l'opération
   */
  deleteNotification: async (notificationId) => {
    try {
      // await api.delete(`/api/notifications/${notificationId}`);
      await GlobalApi.deleteNotification(notificationId);

      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression de la notification:', error);
      return false;
    }
  },

  /**
   * Envoie une notification locale
   * @param {string} title - Titre de la notification
   * @param {string} body - Corps de la notification
   * @param {Object} data - Données additionnelles
   * @returns {Promise<string>} - ID de la notification
   */
  sendLocalNotification: async (title, body, data = {}) => {
    try {
      // Vérifier si nous sommes sur le web
      if (Platform.OS === 'web') {
        // Sur le web, on peut essayer d'utiliser les notifications web natives
        if ('Notification' in window) {
          const permission = await Notification.requestPermission();

          if (permission === 'granted') {
            const notification = new Notification(title, {
              body,
              data
            });

            return 'web-notification';
          } else {
            console.log('Permission de notification web refusée');
            return null;
          }
        } else {
          console.log('Les notifications ne sont pas supportées dans ce navigateur');
          return null;
        }
      }

      // Pour mobile, utiliser Expo Notifications
      const notificationContent = {
        title,
        body,
        data,
      };

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: notificationContent,
        trigger: null, // Notification immédiate
      });

      return notificationId;
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la notification locale:', error);
      return null;
    }
  },

  /**
   * Obtient le nombre de notifications non lues
   * @returns {Promise<number>} - Nombre de notifications non lues
   */
  getUnreadCount: async () => {
    try {
      // Utiliser documentId au lieu de user_id
      const documentId = await AsyncStorage.getItem('documentId');

      if (!documentId) {
        console.warn('Impossible de compter les notifications: utilisateur non connecté');
        return 0;
      }

      // Obtenir l'ID du collaborateur à partir du documentId
      const collaborateurResponse = await api.get(`/api/collaborateurs?filters[documentId]=${documentId}`);
      const collaborateurs = collaborateurResponse.data.data;

      if (!collaborateurs || collaborateurs.length === 0) {
        console.warn('Collaborateur non trouvé avec le documentId:', documentId);
        return 0;
      }

      const collaborateurId = collaborateurs[0].id;

      const response = await api.get(`/api/notifications/count?collaborateurId=${collaborateurId}&filters[read][$eq]=false`);

      return response.data;
    } catch (error) {
      console.error('Erreur lors du comptage des notifications non lues:', error);
      return 0;
    }
  },

  /**
   * Met à jour le badge de l'application avec le nombre de notifications non lues
   * @returns {Promise<boolean>} - Résultat de l'opération
   */
  updateBadgeCount: async () => {
    try {
      // Si nous sommes sur le web, les badges ne sont pas supportés de la même façon
      if (Platform.OS === 'web') {
        return false;
      }

      const unreadCount = await notificationService.getUnreadCount();

      await Notifications.setBadgeCountAsync(unreadCount);

      return true;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du badge:', error);
      return false;
    }
  },
};

export default notificationService;