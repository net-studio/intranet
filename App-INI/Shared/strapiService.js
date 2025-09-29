// src/api/strapiService.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuration de l'URL de base de l'API Strapi
export const API_URL = 'https://robine-api.net-studio.fr';
// export const API_URL = "http://localhost:1341";

// Créer une instance Axios avec configuration de base
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token d'authentification à chaque requête
api.interceptors.request.use(
  async (config) => {
    // const token = await AsyncStorage.getItem('jwt_token');
    const token = '99d2e241bb7ba3fba491061b820abeb2e2650afba3b407ed131a082bbe2da469550e49a0cfe830d3848b0c61da6f364f67b5b6dfe8bd05921e493402c5f584a7cd5f9fc3ecc5cb4063f6fc2504fda48072652354856b542230995295d7665b19db4cf0b58dc09162eb8e269d7957c5d19eb11a4a9ffba6ec04a8fc48787132bc';
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Service d'authentification
export const authService = {
  // Connexion utilisateur
  login: async (identifier, password) => {
    try {
      const response = await api.post('/api/auth/local', {
        identifier,
        password,
      });

      const { jwt, user } = response.data;

      // Stocker le token et les informations utilisateur
      await AsyncStorage.setItem('jwt_token', jwt);
      await AsyncStorage.setItem('documentId', user.documentId);
      await AsyncStorage.setItem('user_id', user.id.toString());
      await AsyncStorage.setItem('user_data', JSON.stringify(user));

      return user;
    } catch (error) {
      console.error('Erreur de connexion:', error);
      throw error;
    }
  },

  // Déconnexion
  logout: async () => {
    try {
      await AsyncStorage.removeItem('jwt_token');
      await AsyncStorage.removeItem('user_id');
      await AsyncStorage.removeItem('user_data');
      return true;
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
      throw error;
    }
  },

  // Vérifier si l'utilisateur est connecté
  isAuthenticated: async () => {
    const token = await AsyncStorage.getItem('jwt_token');
    return !!token;
  },

  // Récupérer les informations de l'utilisateur
  getCurrentUser: async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Erreur lors de la récupération des données utilisateur:', error);
      return null;
    }
  },
};

// Service pour les notifications
export const notificationService = {
  // Enregistrer une notification
  sendNotification: async (title, message, userId) => {
    try {
      const response = await api.post('/api/notifications', {
        data: {
          title: title,
          message: message,
          user: userId,
        },
      });
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de la notificationœ:', error);
      throw error;
    }
  },

  // Récupérer toutes les notifications de l'utilisateur
  getNotifications: async () => {
    try {
      const userId = await AsyncStorage.getItem('user_id');
      const response = await api.get(`/api/notifications?filters[user][id]=${userId}&sort=createdAt:desc`);
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des notifications:', error);
      throw error;
    }
  },

  // Marquer une notification comme lue
  markAsRead: async (notificationId) => {
    try {
      const response = await api.put(`/api/notifications/${notificationId}`, {
        data: {
          isRead: true,
        },
      });
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors du marquage de la notification:', error);
      throw error;
    }
  },

  // Enregistrer le token FCM
  registerFCMToken: async (token, deviceType) => {
    try {
      const userId = await AsyncStorage.getItem('user_id');
      const response = await api.post('/api/fcm-tokens', {
        data: {
          token,
          device: deviceType,
          user: userId,
        },
      });
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du token FCM:', error);
      throw error;
    }
  },
};

// Service pour les documents
export const documentService = {

  /**
 * Récupère les documents récents
 * @param {number} limit - Nombre maximum de documents à récupérer
 * @returns {Promise<Array>} - Liste des documents
 */
  fetchRecentDocs: async (documentId, limit = 5) => {
    try {
      const queryParams = `sort=updatedAt:desc&pagination[limit]=${limit}&filters[$or][0][collaborateur][documentId]=${documentId}&filters[$or][1][isPublic][$eq]=true&populate[0]=file&populate[1]=collaborateur`;

      const response = await api.get(`/api/docs?${queryParams}`);

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

  // Récupérer tous les documents
  getDocuments: async (page = 1, pageSize = 20) => {
    try {
      const response = await api.get(`/api/docs?populate=*&pagination[page]=${page}&pagination[pageSize]=${pageSize}`);
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des documents:', error);
      throw error;
    }
  },

  // Récupérer un document par ID
  getDocumentById: async (id) => {
    try {
      const response = await api.get(`/api/docs/${id}`);
      return response.data.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération du document ${id}:`, error);
      throw error;
    }
  },

  // Télécharger un document
  downloadDocument: async (id) => {
    try {
      const response = await api.get(`/api/docs/${id}/download`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error(`Erreur lors du téléchargement du document ${id}:`, error);
      throw error;
    }
  },
};

// Service pour le calendrier et les événements
export const calendarService = {
  // Récupérer tous les événements
  getEvents: async (startDate, endDate) => {
    try {
      let url = '/api/events?sort=startDate:asc';

      if (startDate && endDate) {
        url += `&filters[startDate][$gte]=${startDate}&filters[endDate][$lte]=${endDate}`;
      }

      const response = await api.get(url);
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des événements:', error);
      throw error;
    }
  },

  // Répondre à un événement (RSVP)
  respondToEvent: async (eventId, response) => {
    try {
      const userId = await AsyncStorage.getItem('user_id');
      const apiResponse = await api.post('/api/event-responses', {
        data: {
          event: eventId,
          user: userId,
          response,
        },
      });
      return apiResponse.data.data;
    } catch (error) {
      console.error(`Erreur lors de la réponse à l'événement ${eventId}:`, error);
      throw error;
    }
  },
};

// Service pour les ressources humaines
export const hrService = {

  // Récupérer les bulletins de salaire
  getSalarySlips: async (userData) => {
    const documentId = await AsyncStorage.getItem('documentId');
    try {
      const response = await api.get(`/api/salary-slips?filters[collaborateur][documentId]=${documentId.replace(/"/g, '')}&sort=date:desc`);
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des bulletins de salaire:', error);
      throw error;
    }
  },

  // Récupérer les demandes de congés
  getLeaveRequests: async (userData) => {
    const documentId = await AsyncStorage.getItem('documentId');
    try {
      const response = await api.get(`/api/leave-requests?filters[collaborateur][documentId]=${documentId.replace(/"/g, '')}&sort=createdAt:desc`);
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des demandes de congés:', error);
      throw error;
    }
  },

  // Soumettre une nouvelle demande de congé
  submitLeaveRequest: async (startDate, endDate, reason, type) => {
    const documentId = await AsyncStorage.getItem('documentId');
    try {
      const response = await api.post('/api/leave-requests', {
        data: {
          'collaborateur': documentId.replace(/"/g, ''),
          startDate,
          endDate,
          reason,
          type,
          statut: 'pending',
        },
      });
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors de la soumission de la demande de congé:', error);
      throw error;
    }
  },

  // Annuler une demande de congé
  cancelLeaveRequest: async (requestId) => {
    try {
      const response = await api.put(`/api/leave-requests/${requestId}`, {
        data: {
          status: 'cancelled',
        },
      });
      return response.data.data;
    } catch (error) {
      console.error(`Erreur lors de l'annulation de la demande de congé ${requestId}:`, error);
      throw error;
    }
  },

  // Récupérer toutes les demandes de congés (pour tous les employés)
  getAllLeaveRequests: async () => {
    try {
      const response = await api.get('/api/leave-requests?populate[0]=collaborateur&sort=createdAt:desc');
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des demandes de congés:', error);
      throw error;
    }
  },

  // Approuver une demande de congé
  approveLeaveRequest: async (requestId, approveReason, approvalDate) => {
    try {
      const response = await api.put(`/api/leave-requests/${requestId}`, {
        data: {
          statut: 'approved',
          reason: approveReason ? approveReason : '',
          approvalDate: approvalDate,
        },
      });
      return response.data.data;
    } catch (error) {
      console.error(`Erreur lors de l'approbation de la demande de congé ${requestId}:`, error);
      throw error;
    }
  },

  // Rejeter une demande de congé
  rejectLeaveRequest: async (requestId, rejectionReason) => {
    try {
      const response = await api.put(`/api/leave-requests/${requestId}`, {
        data: {
          statut: 'rejected',
          reason: rejectionReason,
        },
      });
      return response.data.data;
    } catch (error) {
      console.error(`Erreur lors du rejet de la demande de congé ${requestId}:`, error);
      throw error;
    }
  },

  // Récupérer les statistiques des congés
  getLeaveStatistics: async () => {
    try {
      // Ceci est un exemple - vous devrez créer cette route dans votre API Strapi
      // Ou calculer les statistiques côté client à partir des données récupérées
      const response = await api.get('/api/leave-statistics');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques de congés:', error);
      throw error;
    }
  },

  // Récupérer les politiques RH
  getHRPolicies: async () => {
    try {
      const response = await api.get('/api/hr-policies?sort=updatedAt:desc');
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des politiques RH:', error);
      throw error;
    }
  },

  // Récupérer les informations de l'employé
  getEmployeeInfo: async (userData) => {
    const documentId = await AsyncStorage.getItem('documentId');
    try {
      const response = await api.get(`/api/collaborateurs?populate[0]=photo&filters[documentId]=${documentId.replace(/"/g, '')}`);
      return response.data.data[0];
    } catch (error) {
      console.error('Erreur lors de la récupération des informations de l\'employé:', error);
      throw error;
    }
  },

  // Mettre à jour les informations personnelles
  updatePersonalInfo: async (userData, data) => {
    const documentId = await AsyncStorage.getItem('documentId');
    try {
      // const employeeId = await hrService.getEmployeeInfo().then(info => info.id);
      const response = await api.put(`/api/collaborateurs/${documentId.replace(/"/g, '')}`, {
        data: data,
      });
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour des informations personnelles:', error);
      throw error;
    }
  },
};