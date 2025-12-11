// App/Shared/OneSignal.js
import { Platform } from 'react-native';
import OneSignal from 'react-onesignal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import GlobalApi from './GlobalApi';

const ONESIGNAL_APP_ID = 'c1b372fc-2cb5-41ba-bb4a-87097f5d869f';

const oneSignalService = {
  /**
   * Initialise OneSignal
   */
  initialize: async () => {
    try {
      if (Platform.OS === 'web') {
        // Configuration pour Web/PWA
        await OneSignal.init({
          appId: ONESIGNAL_APP_ID,
          allowLocalhostAsSecureOrigin: true,
          notifyButton: {
            enable: false,
          },
        });

        // console.log('✅ OneSignal initialized for web');

        // Demander la permission et enregistrer
        await oneSignalService.registerUser();

        return true;
      } else {
        // Pour mobile (iOS/Android)
        // console.log('⚠️ OneSignal mobile non configuré pour le moment');
        return true;
      }
    } catch (error) {
      console.error('❌ Erreur initialisation OneSignal:', error);
      return false;
    }
  },

  /**
   * Demande la permission et enregistre l'utilisateur
   */
  registerUser: async () => {
    try {
      if (Platform.OS !== 'web') return;

      // Demander la permission
      const permission = await OneSignal.Notifications.requestPermission();
    //   console.log('🔔 Permission notifications:', permission);

      if (!permission) {
        // console.warn('⚠️ Permission refusée');
        return null;
      }

      // Attendre que OneSignal soit prêt
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Récupérer l'ID utilisateur OneSignal
      const userId = OneSignal.User?.PushSubscription?.id;

      if (userId) {
        // console.log('🔑 OneSignal User ID:', userId);
        await oneSignalService.linkUserToCollaborateur(userId);
        return userId;
      } else {
        // console.warn('⚠️ Pas de User ID OneSignal');
        return null;
      }
    } catch (error) {
      console.error('❌ Erreur registerUser:', error);
      return null;
    }
  },

  /**
   * Lie l'ID OneSignal au collaborateur dans Strapi
   */
  linkUserToCollaborateur: async (oneSignalUserId) => {
    try {
    //   console.log('🔗 Début linkUserToCollaborateur:', oneSignalUserId);

      const documentId = await AsyncStorage.getItem('documentId');

      if (!documentId) {
        // console.warn('⚠️ Pas de documentId');
        return false;
      }

      // Récupérer le collaborateur
      const collaborateurResponse = await GlobalApi.filterCollaborateur(documentId.replace(/"/g, ''));
      const collaborateurs = collaborateurResponse.data.data;

      if (!collaborateurs || collaborateurs.length === 0) {
        console.warn('⚠️ Collaborateur non trouvé');
        return false;
      }

      const collaborateurDocId = collaborateurs[0].documentId;
    //   console.log(`🔗 User trouvé - DocID: ${collaborateurDocId}`);

      // Vérifier si un token existe déjà
      const existingTokens = await GlobalApi.getApiToken(oneSignalUserId);

      if (existingTokens.data.data.length > 0) {
        // UPDATE - Mise à jour du token existant
        const tokenId = existingTokens.data.data[0].documentId;
        // console.log(`🔄 Mise à jour token ${tokenId}`);

        await GlobalApi.updateToken(tokenId, {
          data: {
            lastUsed: new Date().toISOString(),
            user: collaborateurDocId, // ✅ documentId
          },
        });
        // console.log('✅ Token mis à jour');
      } else {
        // CREATE - Création d'un nouveau token
        // console.log(`📝 Création nouveau token`);

        await GlobalApi.createToken({
          data: {
            token: oneSignalUserId,
            device: 'web',
            user: collaborateurDocId, // ✅ documentId
            lastUsed: new Date().toISOString(),
            active: true,
          },
        });
        // console.log('✅ Token créé et lié');
      }

      return true;
    } catch (error) {
      console.error('❌ Erreur linkUserToCollaborateur:', error);
      return false;
    }
  },

  /**
   * Configure les listeners pour les notifications
   */
  setupListeners: (onNotificationReceived, onNotificationOpened) => {
    if (Platform.OS !== 'web') return () => {};

    // Listener pour les notifications reçues
    OneSignal.on('notificationDisplay', (event) => {
    //   console.log('📬 Notification affichée:', event);
      if (onNotificationReceived) {
        onNotificationReceived(event);
      }
    });

    // Listener pour les clics
    OneSignal.on('notificationDismiss', (event) => {
    //   console.log('🗑️ Notification fermée:', event);
    });

    return () => {
    //   console.log('🧹 Cleanup OneSignal listeners');
    };
  },
};

export default oneSignalService;