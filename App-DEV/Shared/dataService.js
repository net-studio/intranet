// src/api/dataService.js
import { default as api } from './strapiService';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Service de données pour récupérer les différentes informations de l'intranet
 */
const dataService = {
  /**
   * Récupère les notifications de l'utilisateur actuel
   * @param {boolean} unreadOnly - Si true, retourne uniquement les notifications non lues
   * @param {number} limit - Nombre maximum de notifications à récupérer
   * @returns {Promise<Array>} - Liste des notifications
   */
  fetchNotifications: async (unreadOnly = false, limit = 10) => {
    try {
      const userId = await AsyncStorage.getItem('user_id');
      let queryParams = `filters[user][id]=${userId}&sort=createdAt:desc&pagination[limit]=${limit}`;
      
      if (unreadOnly) {
        queryParams += '&filters[read][$eq]=false';
      }
      
      const response = await api.get(`/api/notifications?${queryParams}`);
      
      return response.data.data.map(notification => ({
        id: notification.id,
        title: notification.attributes.title,
        message: notification.attributes.message,
        type: notification.attributes.type,
        read: notification.attributes.read,
        createdAt: notification.attributes.createdAt,
        data: notification.attributes.data || {},
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des notifications:', error);
      return [];
    }
  },
  
  /**
   * Récupère le nombre de notifications non lues pour l'utilisateur actuel
   * @returns {Promise<number>} - Nombre de notifications non lues
   */
  getUnreadNotificationsCount: async () => {
    try {
      const userId = await AsyncStorage.getItem('user_id');
      const response = await api.get(`/api/notifications/count?filters[user][id]=${userId}&filters[read][$eq]=false`);
      
      return response.data;
    } catch (error) {
      console.error('Erreur lors du comptage des notifications non lues:', error);
      return 0;
    }
  },
  
  /**
   * Marque une notification comme lue
   * @param {string|number} notificationId - ID de la notification
   * @returns {Promise<Object>} - Notification mise à jour
   */
  markNotificationAsRead: async (notificationId) => {
    try {
      const response = await api.put(`/api/notifications/${notificationId}`, {
        data: {
          read: true,
        },
      });
      
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors du marquage de la notification comme lue:', error);
      throw error;
    }
  },
  
  /**
   * Récupère les documents récents
   * @param {number} limit - Nombre maximum de documents à récupérer
   * @returns {Promise<Array>} - Liste des documents
   */
  fetchRecentDocs: async (limit = 5) => {
    try {
      const userId = await AsyncStorage.getItem('user_id');
      const queryParams = `sort=updatedAt:desc&pagination[limit]=${limit}&filters[$or][0][owner][id]=${userId}&filters[$or][1][isPublic][$eq]=true&populate[0]=file&populate[1]=owner`;
      
      const response = await api.get(`/api/documents?${queryParams}`);
      
      return response.data.data.map(doc => ({
        id: doc.id,
        name: doc.name,
        description: doc.description || '',
        type: doc.type,
        fileUrl: doc.file?.url || null,
        updatedAt: doc.updatedAt,
        owner: doc.owner ? {
          id: doc.owner.id,
          username: doc.owner.username,
        } : null,
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des documents récents:', error);
      return [];
    }
  },
  
  /**
   * Récupère les actualités de l'entreprise
   * @param {number} limit - Nombre maximum d'actualités à récupérer
   * @returns {Promise<Array>} - Liste des actualités
   */
  fetchCompanyNews: async (limit = 5) => {
    try {
      const queryParams = `sort=publishedAt:desc&pagination[limit]=${limit}&populate[0]=image&populate[1]=author`;
      
      const response = await api.get(`/api/actualites?${queryParams}`);
      
      return response.data.data.map(news => ({
        id: news.id,
        title: news.attributes.title,
        content: news.attributes.content,
        summary: news.attributes.summary || '',
        imageUrl: news.attributes.image.data?.attributes.url || null,
        publishedAt: news.attributes.publishedAt,
        author: news.attributes.author.data ? {
          id: news.attributes.author.data.id,
          name: news.attributes.author.data.attributes.name,
        } : null,
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des actualités:', error);
      return [];
    }
  },
  
  /**
   * Récupère les événements à venir
   * @param {number} days - Nombre de jours à l'avance
   * @param {number} limit - Nombre maximum d'événements à récupérer
   * @returns {Promise<Array>} - Liste des événements
   */
  fetchUpcomingEvents: async (days = 7, limit = 3) => {
    try {
      const userId = await AsyncStorage.getItem('user_id');
      
      // Calculer la date de début (aujourd'hui) et de fin (aujourd'hui + days)
      const startDate = new Date().toISOString();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + days);
      
      const queryParams = `filters[startDate][$gte]=${startDate}&filters[startDate][$lte]=${endDate.toISOString()}&filters[$or][0][participants][user][id]=${userId}&filters[$or][1][isPublic][$eq]=true&sort=startDate:asc&pagination[limit]=${limit}&populate[0]=organizer&populate[1]=location`;
      
      const response = await api.get(`/api/events?${queryParams}`);
      
      return response.data.data.map(event => ({
        id: event.id,
        title: event.attributes.title,
        description: event.attributes.description || '',
        startDate: event.attributes.startDate,
        endDate: event.attributes.endDate,
        location: event.attributes.location.data ? {
          id: event.attributes.location.data.id,
          name: event.attributes.location.data.attributes.name,
        } : null,
        organizer: event.attributes.organizer.data ? {
          id: event.attributes.organizer.data.id,
          username: event.attributes.organizer.data.attributes.username,
        } : null,
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des événements à venir:', error);
      return [];
    }
  },
  
  /**
   * Récupère les statistiques globales pour le tableau de bord
   * @returns {Promise<Object>} - Statistiques
   */
  fetchDashboardStats: async () => {
    try {
      const userId = await AsyncStorage.getItem('user_id');
      
      // Récupérer le nombre de documents
      const docsResponse = await api.get(`/api/documents/count?filters[$or][0][owner][id]=${userId}&filters[$or][1][isPublic][$eq]=true`);
      
      // Récupérer le nombre de notifications non lues
      const notifResponse = await api.get(`/api/notifications/count?filters[user][id]=${userId}&filters[read][$eq]=false`);
      
      // Récupérer le nombre d'événements à venir
      const startDate = new Date().toISOString();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30); // 30 jours
      
      const eventsResponse = await api.get(`/api/events/count?filters[startDate][$gte]=${startDate}&filters[startDate][$lte]=${endDate.toISOString()}&filters[$or][0][participants][user][id]=${userId}&filters[$or][1][isPublic][$eq]=true`);
      
      // Récupérer le nombre de messages non lus
      const messagesResponse = await api.get(`/api/messages/unread-count?userId=${userId}`);
      
      return {
        documentsCount: docsResponse.data,
        notificationsCount: notifResponse.data,
        upcomingEventsCount: eventsResponse.data,
        unreadMessagesCount: messagesResponse.data,
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques du tableau de bord:', error);
      return {
        documentsCount: 0,
        notificationsCount: 0,
        upcomingEventsCount: 0,
        unreadMessagesCount: 0,
      };
    }
  },
};

export default dataService;