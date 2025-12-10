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
                    allowLocalhostAsSecureOrigin: true, // Pour dev local
                    notifyButton: {
                        enable: false, // Désactive le bouton par défaut
                    },
                });

                console.log('✅ OneSignal initialized for web');

                // Demander la permission et enregistrer
                await oneSignalService.registerUser();

                return true;
            } else {
                // Pour mobile (iOS/Android) - à implémenter plus tard si nécessaire
                console.log('⚠️ OneSignal mobile non configuré pour le moment');
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

            // ✅ Demander la permission avec la bonne méthode
            const permission = await OneSignal.Notifications.requestPermission();
            console.log('🔔 Permission notifications:', permission);

            if (!permission) {
                console.warn('⚠️ Permission refusée');
                return null;
            }

            // Attendre que OneSignal soit prêt
            await new Promise(resolve => setTimeout(resolve, 2000));

            // ✅ Récupérer l'ID utilisateur avec la bonne méthode
            const userId = OneSignal.User?.PushSubscription?.id;

            if (userId) {
                console.log('🔑 OneSignal User ID:', userId);
                // Lier l'utilisateur OneSignal à ton collaborateur
                await oneSignalService.linkUserToCollaborateur(userId);
                return userId;
            } else {
                console.warn('⚠️ Pas de User ID OneSignal');

                // Alternative : utiliser l'External User ID
                const externalId = await oneSignalService.getExternalUserId();
                if (externalId) {
                    console.log('🔑 OneSignal External ID:', externalId);
                    return externalId;
                }

                return null;
            }
        } catch (error) {
            console.error('❌ Erreur registerUser:', error);
            return null;
        }
    },

    /**
     * Récupère l'External User ID (fallback)
     */
    getExternalUserId: async () => {
        try {
            const documentId = await AsyncStorage.getItem('documentId');
            if (documentId) {
                const cleanDocId = documentId.replace(/"/g, '');
                // Définir l'external user ID
                await OneSignal.login(cleanDocId);
                console.log('🔗 OneSignal login avec External ID:', cleanDocId);
                return cleanDocId;
            }
            return null;
        } catch (error) {
            console.error('❌ Erreur getExternalUserId:', error);
            return null;
        }
    },

    /**
     * Lie l'ID OneSignal au collaborateur dans Strapi
     */
    linkUserToCollaborateur: async (oneSignalUserId) => {
        try {
            const documentId = await AsyncStorage.getItem('documentId');

            if (!documentId) {
                console.warn('⚠️ Pas de documentId, utilisateur non connecté');
                return false;
            }

            // Récupérer le collaborateur
            const collaborateurResponse = await GlobalApi.filterCollaborateur(documentId.replace(/"/g, ''));
            const collaborateurs = collaborateurResponse.data.data;

            if (!collaborateurs || collaborateurs.length === 0) {
                console.warn('⚠️ Collaborateur non trouvé');
                return false;
            }

            const collaborateurId = collaborateurs[0].id;
            const collaborateurDocId = collaborateurs[0].documentId;

            console.log(`🔗 Liaison OneSignal ID ${oneSignalUserId} → Collaborateur ${collaborateurDocId}`);

            // Vérifier si un token existe déjà
            const existingTokens = await GlobalApi.getApiToken(oneSignalUserId);

            if (existingTokens.data.data.length > 0) {
                // Mettre à jour
                const tokenId = existingTokens.data.data[0].documentId;
                await GlobalApi.updateToken(tokenId, {
                    data: {
                        lastUsed: new Date().toISOString(),
                        user: collaborateurDocId,
                    },
                });
                console.log('✅ Token OneSignal mis à jour');
            } else {
                // Créer
                await GlobalApi.createToken({
                    data: {
                        token: oneSignalUserId,
                        device: 'web',
                        user: collaborateurDocId,
                        lastUsed: new Date().toISOString(),
                        active: true,
                    },
                });
                console.log('✅ Token OneSignal créé');
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
        if (Platform.OS !== 'web') return () => { };

        // Listener pour les notifications reçues (en foreground)
        OneSignal.on('notificationDisplay', (event) => {
            console.log('📬 Notification affichée:', event);
            if (onNotificationReceived) {
                onNotificationReceived(event);
            }
        });

        // Listener pour les clics sur les notifications
        OneSignal.on('notificationDismiss', (event) => {
            console.log('🗑️ Notification fermée:', event);
        });

        // Retourner fonction de cleanup (vide pour OneSignal web)
        return () => {
            console.log('🧹 Cleanup OneSignal listeners');
        };
    },
};

export default oneSignalService;