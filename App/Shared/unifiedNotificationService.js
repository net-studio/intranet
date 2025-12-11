// src/api/unifiedNotificationService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import api from './strapiService';
import GlobalApi from './GlobalApi';
// import { requestForToken, onMessageListener } from './Firebase';
import oneSignalService from './OneSignal';

/**
 * Service unifié pour gérer les notifications web (FCM) et mobile (Expo)
 */
const unifiedNotificationService = {
  /**
   * Initialise les notifications dans l'application
   * @returns {Promise<boolean>} - Résultat de l'opération
   */
  initialize: async () => {
    try {
      if (Platform.OS === 'web') {
        // ✅ Utiliser OneSignal au lieu de Firebase
        await oneSignalService.initialize();
        return true;
      } else {
        // Mobile reste inchangé pour l'instant
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
          }),
        });
        return true;
      }
    } catch (error) {
      console.error('Erreur initialisation:', error);
      return false;
    }
  },

  /**
   * Demande les permissions pour les notifications
   * @returns {Promise<boolean>} - True si les permissions sont accordées
   */
  requestPermissions: async () => {
    try {
      if (Platform.OS === 'web') {
        // Pour le web, FCM gère déjà les permissions
        return true;
      }

      if (!Device.isDevice) {
        // console.log('Les notifications push ne fonctionnent pas sur l\'émulateur');
        return false;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        // console.log('Permission des notifications refusée!');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erreur lors de la demande de permissions:', error);
      return false;
    }
  },

  /**
   * Enregistre l'appareil pour les notifications push
   * @returns {Promise<string|null>} - Token de notification ou null en cas d'erreur
   */
  registerForPushNotifications: async () => {
    try {
      if (Platform.OS === 'web') {
        // Pour le web, nous utilisons déjà requestForToken() dans initialize()
        const fcmToken = localStorage.getItem('fcmToken');
        if (fcmToken) {
          // Ne pas re-enregistrer si déjà fait dans initialize()
          // await unifiedNotificationService.registerTokenWithServer(fcmToken, 'web');
          return fcmToken;
        }
        return null;
      }

      const permissionGranted = await unifiedNotificationService.requestPermissions();

      if (!permissionGranted) {
        return null;
      }

      // Obtenir le token Expo pour les applications mobiles
      let token;

      try {
        const tokenData = await Notifications.getExpoPushTokenAsync({
          projectId: 'robine-intranet' // Remplacez par votre ID de projet si nécessaire
        });
        token = tokenData.data;
      } catch (tokenError) {
        console.warn('Erreur lors de la récupération du token Expo:', tokenError);

        try {
          const tokenData = await Notifications.getDevicePushTokenAsync();
          token = tokenData.data;
        } catch (deviceTokenError) {
          console.error('Impossible de récupérer le token de notification:', deviceTokenError);
          return null;
        }
      }

      if (!token) {
        // console.warn('Token de notification non obtenu');
        return null;
      }

      // Enregistrer le token sur le serveur
      const deviceType = Platform.OS;
      await unifiedNotificationService.registerTokenWithServer(token, deviceType);

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
   * @param {string} token - Token de notification
   * @param {string} deviceType - Type d'appareil (ios, android, web)
   * @returns {Promise<boolean>} - Résultat de l'opération
   */
  registerTokenWithServer: async (token, deviceType) => {
    try {
      // Utiliser documentId au lieu de user_id
      const documentId = await AsyncStorage.getItem('documentId');

      if (!documentId) {
        // console.warn('Impossible d\'enregistrer le token: utilisateur non connecté');
        return false;
      }

      // Obtenir l'ID du collaborateur à partir du documentId
      const collaborateurResponse = await GlobalApi.filterCollaborateur(documentId.replace(/"/g, ''));
      const collaborateurs = collaborateurResponse.data.data;

      if (!collaborateurs || collaborateurs.length === 0) {
        // console.warn('Collaborateur non trouvé avec le documentId:', documentId);
        return false;
      }

      // const collaborateurId = collaborateurs[0].documentId.replace(/"/g, '');
      const collaborateurId = collaborateurs[0].id;
      // console.log("collaborateurId : ", collaborateurId);
      // Vérifier si le token existe déjà
      // const existingTokensResponse = await api.get(`/api/fcm-tokens?filters[token][$eq]=${token}`);
      const existingTokensResponse = await GlobalApi.getApiToken(token);

      if (existingTokensResponse.data.data.length > 0) {
        // Token déjà enregistré, mise à jour de la date d'utilisation
        const tokenId = existingTokensResponse.data.data[0].documentId;
        // console.log("tokenId : ", tokenId)
        // await api.put(`/api/fcm-tokens/${tokenId}`, {
        await GlobalApi.updateToken(
          tokenId,
          {
            data: {
              lastUsed: new Date().toISOString(),
              user: collaborateurs[0].documentId.replace(/"/g, ''),
            },
            status: 'published',
          }
        );
        // console.log('Token mis à jour sur le serveur');
      } else {
        // Créer un nouveau token
        await GlobalApi.createToken({
          data: {
            token,
            device: deviceType,
            user: collaborateurs[0].documentId.replace(/"/g, ''),
            lastUsed: new Date().toISOString(),
          },
          status: 'published',
        });
        // console.log('Nouveau token créé sur le serveur');
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
    if (Platform.OS === 'web') {
      // Listener for FCM foreground messages is now in initialize().
      // This listener is for notification CLICKS relayed from the service worker.
      const swMessageListener = (event) => {
        if (event.data && event.data.type === 'NOTIFICATION_CLICK' && onNotificationResponse) {
          // console.log('App received NOTIFICATION_CLICK from SW:', event.data);
          onNotificationResponse(event.data);
          if (window.refreshNotificationCount) {
            window.refreshNotificationCount();
          }
        }
      };

      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', swMessageListener);
      }

      // Return a cleanup function
      return () => {
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.removeEventListener('message', swMessageListener);
        }
      };
    } else {
      // Mobile listeners remain unchanged
      const receivedSubscription = Notifications.addNotificationReceivedListener(
        notification => {
          if (onNotificationReceived) {
            onNotificationReceived(notification);
          }
          if (window.refreshNotificationCount) {
            window.refreshNotificationCount();
          }
        }
      );

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
    }
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
        // console.warn('Impossible de récupérer les notifications: utilisateur non connecté');
        return { data: [], meta: { pagination: { total: 0 } } };
      }

      // Obtenir l'ID du collaborateur à partir du documentId
      const collaborateurResponse = await GlobalApi.filterCollaborateur(documentId.replace(/"/g, ''));
      const collaborateurs = collaborateurResponse.data.data;

      if (!collaborateurs || collaborateurs.length === 0) {
        // console.warn('Collaborateur non trouvé avec le documentId:', documentId);
        return { data: [], meta: { pagination: { total: 0 } } };
      }

      const collaborateurId = collaborateurs[0].id;

      let queryParams = `filters[user][id]=${collaborateurId}&pagination[page]=${page}&pagination[pageSize]=${pageSize}&sort=createdAt:desc`;

      if (unreadOnly) {
        queryParams += '&filters[read][$eq]=false';
      }

      const response = await api.get(`/api/notifications?${queryParams}`);

      return {
        data: response.data.data.map(notification => ({
          id: notification.id,
          title: notification.attributes.title,
          message: notification.attributes.message,
          type: notification.attributes.type,
          read: notification.attributes.read,
          createdAt: notification.attributes.createdAt,
          data: notification.attributes.data || {},
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
      await api.put(`/api/notifications/${notificationId}`, {
        data: {
          read: true,
        },
      });

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
        // console.warn('Impossible de marquer les notifications: utilisateur non connecté');
        return false;
      }

      // Obtenir l'ID du collaborateur à partir du documentId
      const collaborateurResponse = await GlobalApi.filterCollaborateur(documentId.replace(/"/g, ''));
      const collaborateurs = collaborateurResponse.data.data;

      if (!collaborateurs || collaborateurs.length === 0) {
        // console.warn('Collaborateur non trouvé avec le documentId:', documentId);
        return false;
      }

      const collaborateurId = collaborateurs[0].id;

      await api.put('/api/notifications/mark-all-read', {
        collaborateurId,
      });

      return true;
    } catch (error) {
      console.error('Erreur lors du marquage de toutes les notifications comme lues:', error);
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
      if (Platform.OS === 'web') {
        // Utiliser les notifications natives du navigateur
        if ('Notification' in window) {
          const permission = await Notification.requestPermission();

          if (permission === 'granted') {
            const notification = new Notification(title, {
              body,
              data
            });

            return 'web-notification';
          } else {
            // console.log('Permission de notification web refusée');
            return null;
          }
        } else {
          // console.log('Les notifications ne sont pas supportées dans ce navigateur');
          return null;
        }
      } else {
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
      }
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
        // console.warn('Impossible de compter les notifications: utilisateur non connecté');
        return 0;
      }

      // Obtenir l'ID du collaborateur à partir du documentId
      const collaborateurResponse = await GlobalApi.filterCollaborateur(documentId.replace(/"/g, ''));
      const collaborateurs = collaborateurResponse.data.data;

      if (!collaborateurs || collaborateurs.length === 0) {
        // console.warn('Collaborateur non trouvé avec le documentId:', documentId);
        return 0;
      }

      const collaborateurId = collaborateurs[0].id;

      // const response = await api.get(`/api/notifications/count?collaborateurId=${collaborateurId}&filters[read][$eq]=false`);
      const response = await GlobalApi.getUnreadNotifications(documentId.replace(/"/g, ''));

      return response.data.data.length;
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
      const unreadCount = await unifiedNotificationService.getUnreadCount();

      if (Platform.OS === 'web') {
        // ✅ Badge API pour PWA (Chrome/Edge)
        if ('setAppBadge' in navigator) {
          if (unreadCount > 0) {
            navigator.setAppBadge(unreadCount);
          } else {
            navigator.clearAppBadge();
          }
        }
      } else {
        // Mobile
        await Notifications.setBadgeCountAsync(unreadCount);
      }

      return true;
    } catch (error) {
      console.error('Erreur badge:', error);
      return false;
    }
  },
};

export default unifiedNotificationService;