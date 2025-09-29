// src/hooks/useNotifications.js
import { useState, useEffect, useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import notificationService from '../Shared/notificationService';

/**
 * Hook personnalisé pour gérer les notifications dans l'application
 * @returns {Object} - Fonctions et données relatives aux notifications
 */
export const useNotifications = () => {
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
      // Configurer les notifications
      await notificationService.configureNotifications();
      
      // Vérifier les permissions
      const permitted = await notificationService.requestPermissions();
      setHasPermission(permitted);
      
      if (permitted) {
        // Enregistrer pour les notifications push
        await notificationService.registerForPushNotifications();
        
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
      const count = await notificationService.getUnreadCount();
      setNotificationCount(count);
      
      // Mettre à jour le badge de l'application
      await Notifications.setBadgeCountAsync(count);
      
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
      const result = await notificationService.getNotifications(page, pageSize, unreadOnly);
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
      const success = await notificationService.markAsRead(notificationId);
      
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
      const success = await notificationService.markAllAsRead();
      
      if (success) {
        // Mettre à jour toutes les notifications localement
        setNotifications(prevNotifications =>
          prevNotifications.map(notification => ({ ...notification, read: true }))
        );
        
        // Mettre à jour le compteur
        setNotificationCount(0);
        await Notifications.setBadgeCountAsync(0);
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
      const success = await notificationService.deleteNotification(notificationId);
      
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
  }, [updateBadgeCount]);

  /**
   * Gère l'interaction avec une notification
   * @param {Object} response - Réponse à la notification
   */
  const handleNotificationResponse = useCallback((response) => {
    const data = response.notification.request.content.data;
    
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
    
    // Marquer la notification comme lue
    const notificationId = response.notification.request.content.data.id;
    if (notificationId) {
      markAsRead(notificationId);
    }
  }, [navigation, markAsRead]);

  // Configurer les notifications au montage du composant
  useEffect(() => {
    initializeNotifications();
    
    // Configurer les écouteurs de notifications
    const unsubscribe = notificationService.setupNotificationListeners(
      handleNotificationReceived,
      handleNotificationResponse
    );
    
    // Nettoyage à la destruction du composant
    return () => {
      unsubscribe();
    };
  }, [initializeNotifications, handleNotificationReceived, handleNotificationResponse]);

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
  };
};

export default useNotifications;