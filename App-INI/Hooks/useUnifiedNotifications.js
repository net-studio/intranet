// src/hooks/useUnifiedNotifications.js
import { useState, useEffect, useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import unifiedNotificationService from '../Shared/unifiedNotificationService';

/**
 * Hook personnalisé pour gérer les notifications à travers différentes plateformes
 * @returns {Object} - Fonctions et données relatives aux notifications
 */
export const useUnifiedNotifications = () => {
  const [notificationCount, setNotificationCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [hasPermission, setHasPermission] = useState(false);
  const navigation = useNavigation();

  /**
   * Initialise les notifications et vérifie les permissions
   */
  const initializeNotifications = useCallback(async () => {
    try {
      // Initialiser le service de notification unifié
      const success = await unifiedNotificationService.initialize();
      setHasPermission(success);
      
      if (success) {
        // Enregistrer pour les notifications push
        await unifiedNotificationService.registerForPushNotifications();
        
        // Mettre à jour le badge
        await updateBadgeCount();
      }
    } catch (error) {
      console.error('Erreur lors de l\'initialisation des notifications:', error);
    }
  }, []);

  /**
   * Met à jour le compteur de notifications
   */
  const updateBadgeCount = useCallback(async () => {
    try {
      setLoading(true);
      const count = await unifiedNotificationService.getUnreadCount();
      setNotificationCount(count);
      
      // Mettre à jour le badge de l'application (seulement sur mobile)
      if (Platform.OS !== 'web') {
        await Notifications.setBadgeCountAsync(count);
      }
      
      return count;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du badge:', error);
      return 0;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Récupère les notifications de l'utilisateur
   * @param {boolean} unreadOnly - Si vrai, récupère uniquement les notifications non lues
   * @param {number} page - Numéro de page
   * @param {number} pageSize - Taille de la page
   */
  const fetchNotifications = useCallback(async (unreadOnly = false, page = 1, pageSize = 20) => {
    try {
      setLoading(true);
      const result = await unifiedNotificationService.getNotifications(page, pageSize, unreadOnly);
      setNotifications(result.data);
      return result;
    } catch (error) {
      console.error('Erreur lors de la récupération des notifications:', error);
      return { data: [], meta: { pagination: { total: 0 } } };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Marque une notification comme lue
   * @param {string|number} notificationId - ID de la notification
   */
  const markAsRead = useCallback(async (notificationId) => {
    try {
      const success = await unifiedNotificationService.markAsRead(notificationId);
      
      if (success) {
        // Mettre à jour localement la notification
        setNotifications(prevNotifications =>
          prevNotifications.map(notification =>
            notification.id === notificationId
              ? { ...notification, read: true }
              : notification
          )
        );
        
        // Mettre à jour le compteur
        await updateBadgeCount();
      }
      
      return success;
    } catch (error) {
      console.error('Erreur lors du marquage de la notification comme lue:', error);
      return false;
    }
  }, [updateBadgeCount]);

  /**
   * Marque toutes les notifications comme lues
   */
  const markAllAsRead = useCallback(async () => {
    try {
      const success = await unifiedNotificationService.markAllAsRead();
      
      if (success) {
        // Mettre à jour toutes les notifications localement
        setNotifications(prevNotifications =>
          prevNotifications.map(notification => ({ ...notification, read: true }))
        );
        
        // Mettre à jour le compteur
        setNotificationCount(0);
        
        // Réinitialiser le badge (seulement sur mobile)
        if (Platform.OS !== 'web') {
          await Notifications.setBadgeCountAsync(0);
        }
      }
      
      return success;
    } catch (error) {
      console.error('Erreur lors du marquage de toutes les notifications comme lues:', error);
      return false;
    }
  }, []);

  /**
   * Supprime une notification
   * @param {string|number} notificationId - ID de la notification
   */
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      const success = await unifiedNotificationService.deleteNotification(notificationId);
      
      if (success) {
        // Supprimer la notification localement
        setNotifications(prevNotifications =>
          prevNotifications.filter(notification => notification.id !== notificationId)
        );
        
        // Mettre à jour le compteur si nécessaire
        await updateBadgeCount();
      }
      
      return success;
    } catch (error) {
      console.error('Erreur lors de la suppression de la notification:', error);
      return false;
    }
  }, [updateBadgeCount]);

  /**
   * Gère la réception d'une notification
   * @param {Object} notification - Notification reçue
   */
  const handleNotificationReceived = useCallback((notification) => {
    // Mise à jour du compteur de notifications
    updateBadgeCount();
    
    // On pourrait aussi ajouter la notification à la liste locale
    // si elle concerne l'utilisateur actuel
    console.log('Notification reçue:', notification);
  }, [updateBadgeCount]);

  /**
   * Gère l'interaction avec une notification
   * @param {Object} response - Réponse à la notification
   */
  const handleNotificationResponse = useCallback((response) => {
    // Adaptation pour gérer à la fois les notifications web et mobiles
    let data;
    let notificationId;
    
    if (Platform.OS === 'web') {
      // Format pour les notifications web
      data = response.notification?.data || {};
      notificationId = data.id;
    } else {
      // Format pour les notifications Expo
      data = response.notification.request.content.data || {};
      notificationId = data.id;
    }
    
    console.log('Réponse de notification:', response);
    
    // Naviguer vers l'écran approprié en fonction du type de notification
    if (data && data.screen) {
      const { screen, params } = data;
      
      // Si la notification concerne une entité spécifique
      if (screen === 'MessageDetails' && params && params.conversationId) {
        navigation.navigate('ChatRoom', { conversationId: params.conversationId });
      } else if (screen === 'DocumentDetails' && params && params.documentId) {
        navigation.navigate('DocumentViewer', { documentId: params.documentId });
      } else if (screen === 'EventDetails' && params && params.eventId) {
        navigation.navigate('EventDetails', { eventId: params.eventId });
      } else {
        // Naviguer vers l'écran général des notifications
        navigation.navigate('Notifications');
      }
    } else {
      // Par défaut, aller à l'écran des notifications
      navigation.navigate('Notifications');
    }
    
    // Marquer la notification comme lue si on a un ID
    if (notificationId) {
      markAsRead(notificationId);
    }
  }, [navigation, markAsRead]);

  // Configurer les notifications au montage du composant
  useEffect(() => {
    // initializeNotifications(); // This is ALREADY CALLED in its own useEffect. No need to call again.

    // Configurer les écouteurs de notifications
    // This will now correctly set up mobile listeners, and for web,
    // the NOTIFICATION_CLICK listener from the service worker.
    const unsubscribe = unifiedNotificationService.setupNotificationListeners(
      handleNotificationReceived, // For in-app UI updates (e.g., badge, list)
      handleNotificationResponse  // For handling clicks
    );
    
    // Nettoyage à la destruction du composant
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
    // Ensure dependencies are correct. `initializeNotifications` is not directly used here,
    // but its action (calling unifiedNotificationService.initialize) is a prerequisite.
    // The direct dependencies are the callbacks.
  }, [handleNotificationReceived, handleNotificationResponse]);
  // Removed initializeNotifications from deps array as it's in its own effect.

  // Mettre à jour le compteur de notifications périodiquement (toutes les 30 secondes)
  useEffect(() => {
    const intervalId = setInterval(() => {
      updateBadgeCount();
    }, 30000);
    
    return () => clearInterval(intervalId);
  }, [updateBadgeCount]);

  return {
    notificationCount,
    notifications,
    loading,
    hasPermission,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    updateBadgeCount,
    sendLocalNotification: unifiedNotificationService.sendLocalNotification,
  };
};

export default useUnifiedNotifications;