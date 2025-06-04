// firebase/config.js
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuration Firebase (à remplacer par vos propres clés)
const firebaseConfig = {
  apiKey: "AIzaSyCM8PTl80T4EVTM1J8EttnGxRoGDyvjkrw",
  authDomain: "robine-intranet.firebaseapp.com",
  projectId: "robine-intranet",
  storageBucket: "robine-intranet.firebasestorage.app",
  messagingSenderId: "163697107056",
  appId: "1:163697107056:web:0e22b87484552bfd7654b5",
  measurementId: "G-59YJYKNSEF"
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);

// Variable pour stocker l'instance de messaging
let messagingInstance = null;

// Fonction pour initialiser et obtenir messaging de manière asynchrone
const getMessagingInstance = async () => {
  try {
    // Vérifier si Firebase Cloud Messaging est pris en charge dans cet environnement
    const isMessagingSupported = await isSupported();

    if (!isMessagingSupported) {
      console.warn("Firebase Cloud Messaging n'est pas pris en charge dans cet environnement");
      return null;
    }

    // Si nous avons déjà une instance, la retourner
    if (messagingInstance) {
      return messagingInstance;
    }

    // Sinon, créer une nouvelle instance
    messagingInstance = getMessaging(app);
    return messagingInstance;
  } catch (error) {
    console.error("Erreur lors de l'initialisation de Firebase Messaging:", error);
    return null;
  }
};

// Stocker le token FCM
export const storeTokenInStorage = async (token) => {
  try {
    await AsyncStorage.setItem('fcmToken', token);
  } catch (error) {
    console.error('Erreur lors du stockage du token Firebase:', error);
  }
};

// Récupérer le token FCM depuis le stockage
export const getTokenFromStorage = async () => {
  try {
    return await AsyncStorage.getItem('fcmToken');
  } catch (error) {
    console.error('Erreur lors de la récupération du token Firebase:', error);
    return null;
  }
};

// Obtenir un nouveau token FCM
export const getFCMToken = async () => {
  try {
    // Vérifier si un token existe déjà
    const existingToken = await getTokenFromStorage();
    if (existingToken) return existingToken;

    // Obtenir l'instance de messaging
    const messagingInst = await getMessagingInstance();
    if (!messagingInst) {
      throw new Error("Impossible d'obtenir l'instance de messaging");
    }

    // Demander un nouveau token
    const token = await getToken(messagingInst, {
      vapidKey: 'BNaMdZ_77dwgy2T6Oiciuxpt-HjXPLYE_cyoQ67I-fGqcVNo7xehTXoX7nxkHF-jfFU1bU0_zSkId-a-mDihFD8' // Nécessaire pour les notifications Web
    });

    if (token) {
      await storeTokenInStorage(token);
      return token;
    }
  } catch (error) {
    console.error('Erreur lors de la génération du token Firebase:', error);
    return null;
  }
};

// Configurer l'écouteur de messages entrants (quand l'app est au premier plan)
export const onForegroundMessage = async (callback) => {
  try {
    const messagingInst = await getMessagingInstance();
    if (!messagingInst) {
      console.warn("Impossible de configurer l'écouteur de messages: messaging non disponible");
      return () => { }; // Retourner une fonction de nettoyage vide
    }
    console.log("onForegroundMessage");
    const messageId = await AsyncStorage.getItem('messageId');
    if (messageId !== payload.messageId) {
      await AsyncStorage.setItem('messageId', JSON.stringify(payload.messageId));
      return onMessage(messagingInst, (payload) => {
        callback(payload);
      });
    }
  } catch (error) {
    console.error("Erreur lors de la configuration de l'écouteur de messages:", error);
    return () => { }; // Retourner une fonction de nettoyage vide
  }
};

// Exporter l'instance de l'application et les fonctions utilitaires
export { app };
// Exporter une fonction pour obtenir messaging de manière asynchrone
export { getMessagingInstance as messaging };