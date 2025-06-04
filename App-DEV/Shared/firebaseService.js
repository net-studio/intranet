// src/services/firebaseService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import React, { useEffect } from 'react';
import { messaging, getFCMToken, onForegroundMessage } from './firebaseConfig';

// Clé pour stocker le token des notifications
const FCM_TOKEN_KEY = 'fcm_token';

// Demande de permissions pour les notifications
export const requestNotificationPermission = async () => {
  try {
    // Dans un environnement web, nous utilisons l'API Notification du navigateur
    if (typeof Notification !== 'undefined') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } else if (Platform.OS === 'ios' || Platform.OS === 'android') {
      // Pour une application hybride React Native, nous supposons que les permissions
      // sont gérées par le manifeste natif ou par les paramètres de l'appareil
      return true;
    } else {
      console.warn('Les notifications ne sont pas prises en charge dans cet environnement');
      return false;
    }
  } catch (error) {
    console.error('Erreur lors de la demande de permission pour les notifications:', error);
    return false;
  }
};

// Enregistre le token FCM
export const registerForPushNotifications = async () => {
  try {
    // Vérifier si on a déjà un token
    const existingToken = await AsyncStorage.getItem(FCM_TOKEN_KEY);

    // Obtenir le token FCM actuel
    const fcmToken = await getFCMToken();
    
    if (!fcmToken) {
      console.warn("Impossible d'obtenir un token FCM");
      return null;
    }

    // Si le token a changé, le mettre à jour
    if (existingToken !== fcmToken) {
      await AsyncStorage.setItem(FCM_TOKEN_KEY, fcmToken);
      // Envoyer le token à votre backend Strapi
      await sendTokenToServer(fcmToken);
    }

    return fcmToken;
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement pour les notifications push:', error);
    return null;
  }
};

// Envoi du token au serveur Strapi
const sendTokenToServer = async (token) => {
  // Récupérer l'ID de l'utilisateur actuel
  const userId = await AsyncStorage.getItem('user_id');

  if (!userId) {
    console.warn('Impossible d\'envoyer le token FCM: utilisateur non connecté');
    return;
  }

  try {
    const response = await fetch('https://robine-api.net-studio.fr/api/fcm-tokens', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await AsyncStorage.getItem('jwt_token')}`,
      },
      body: JSON.stringify({
        data: {
          user: userId,
          token: token,
          device: Platform.OS,
        }
      }),
    });

    if (!response.ok) {
      throw new Error('Erreur lors de l\'envoi du token au serveur');
    }

    console.log('Token FCM enregistré avec succès sur le serveur');
  } catch (error) {
    console.error('Erreur lors de l\'envoi du token FCM au serveur:', error);
  }
};

// Configuration des gestionnaires de notifications
export const setupNotificationListeners = async () => {
  try {
    // Vérifier si le service est disponible
    const messagingAvailable = await messaging();
    if (!messagingAvailable) {
      console.warn('Firebase Messaging n\'est pas disponible dans cet environnement');
      return () => {}; // Retourner une fonction de nettoyage vide
    }

    // Configurer l'écouteur pour les messages en premier plan
    const unsubscribe = await onForegroundMessage(async (payload) => {
      console.log('Notification reçue en premier plan:', payload);
      
      // Si nécessaire, vous pouvez afficher une notification personnalisée ici
      // ou naviguer vers l'écran approprié
      if (payload.data) {
        handleNotificationNavigation(payload);
      }
    });

    // REMARQUE: Dans la version web de Firebase Messaging, il n'existe pas d'équivalent direct 
    // pour onNotificationOpenedApp ou getInitialNotification
    // Ces fonctionnalités doivent être gérées différemment, généralement via l'API 
    // de service worker de Firebase ou via votre logique d'application personnalisée

    // Pour une PWA (Progressive Web App) avec React Native Web, vous pouvez
    // utiliser le code suivant pour gérer les clics sur les notifications:
    
    // Si nous sommes dans un environnement où navigator.serviceWorker est disponible
    if (typeof navigator !== 'undefined' && navigator.serviceWorker) {
      // Écouter les messages du service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('Message reçu du service worker:', event.data);
        
        // Si le message contient des données de notification
        if (event.data.firebaseMessaging && event.data.firebaseMessaging.payload) {
          const payload = event.data.firebaseMessaging.payload;
          console.log('Notification cliquée:', payload);
          
          // Gérer la navigation
          handleNotificationNavigation(payload);
        }
      });
    }

    // Retourner la fonction de nettoyage
    return unsubscribe;
  } catch (error) {
    console.error('Erreur lors de la configuration des écouteurs de notifications:', error);
    return () => {}; // Retourner une fonction de nettoyage vide en cas d'erreur
  }
};

// Gérer la navigation basée sur le type de notification
const handleNotificationNavigation = (remoteMessage) => {
  // Extraire les informations de la notification
  const { data } = remoteMessage;

  if (!data || !data.type) {
    console.warn('Type de notification non spécifié');
    return;
  }

  // Vérifier si la navigation est disponible
  if (!global.navigationRef || !global.navigationRef.navigate) {
    console.warn('Navigation non disponible');
    return;
  }

  // Importer la navigation globale
  const { navigate } = global.navigationRef;

  // Router vers l'écran approprié en fonction du type de notification
  switch (data.type) {
    case 'message':
      navigate('ChatRoom', { conversationId: data.conversationId });
      break;
    case 'document':
      navigate('DocumentDetails', { documentId: data.documentId });
      break;
    case 'event':
      navigate('EventDetails', { eventId: data.eventId });
      break;
    case 'hr':
      navigate('HR', { notificationId: data.notificationId });
      break;
    case 'news':
      navigate('NewsDetail', { newsId: data.newsId });
      break;
    default:
      navigate('Notifications');
      break;
  }
};

// Hook personnalisé pour les notifications
export const useNotificationsSetup = () => {
  React.useEffect(() => {
    // Variable pour stocker la fonction de nettoyage
    let cleanupFunction = () => {};
    
    // Demander les permissions et s'enregistrer pour les notifications
    const setup = async () => {
      try {
        const hasPermission = await requestNotificationPermission();

        if (hasPermission) {
          await registerForPushNotifications();
          const unsubscribe = await setupNotificationListeners();
          
          // Stocker la fonction de nettoyage
          cleanupFunction = unsubscribe;
        }
      } catch (error) {
        console.error('Erreur dans le setup des notifications:', error);
      }
    };

    setup();

    // Fonction de nettoyage lors du démontage du composant
    return () => {
      if (typeof cleanupFunction === 'function') {
        cleanupFunction();
      }
    };
  }, []);
};

// Configurer les sujets de notification (topics)
// Remarque: Les abonnements aux topics ne sont pas pris en charge directement 
// dans la version web de Firebase Messaging. Il faut les gérer côté serveur.
export const subscribeToTopic = async (topic) => {
  try {
    // Obtenir le token FCM actuel
    const token = await getFCMToken();
    if (!token) {
      console.warn(`Impossible de s'abonner au sujet ${topic}: Pas de token FCM`);
      return;
    }
    
    // Pour s'abonner à un topic avec la version web de Firebase Messaging,
    // vous devez envoyer une requête à votre serveur backend, qui utilisera
    // l'API Admin de Firebase pour gérer les abonnements.
    console.log(`Envoi d'une requête d'abonnement au sujet ${topic} pour le token ${token}`);
    
    // Exemple d'appel à votre backend (à implémenter)
    // await fetch('https://votre-api.com/subscribe-to-topic', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ token, topic })
    // });
    
    console.log(`Abonné au sujet: ${topic}`);
  } catch (error) {
    console.error(`Erreur lors de l'abonnement au sujet ${topic}:`, error);
  }
};

export const unsubscribeFromTopic = async (topic) => {
  try {
    // Obtenir le token FCM actuel
    const token = await getFCMToken();
    if (!token) {
      console.warn(`Impossible de se désabonner du sujet ${topic}: Pas de token FCM`);
      return;
    }
    
    // Pour se désabonner d'un topic avec la version web de Firebase Messaging,
    // vous devez également passer par votre serveur backend.
    console.log(`Envoi d'une requête de désabonnement du sujet ${topic} pour le token ${token}`);
    
    // Exemple d'appel à votre backend (à implémenter)
    // await fetch('https://votre-api.com/unsubscribe-from-topic', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ token, topic })
    // });
    
    console.log(`Désabonné du sujet: ${topic}`);
  } catch (error) {
    console.error(`Erreur lors du désabonnement du sujet ${topic}:`, error);
  }
};