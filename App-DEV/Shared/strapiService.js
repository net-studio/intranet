// src/api/strapiService.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuration de l'URL de base de l'API Strapi
const API_URL = 'https://robine-api.net-studio.fr';

// Créer une instance Axios avec configuration de base
const api = axios.create({
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

let logoutCallbacks = [];

// Service d'authentification
const authService = {
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
      await AsyncStorage.setItem('user_doc_id', user.documentId);
      await AsyncStorage.setItem('user_id', user.id.toString());
      await AsyncStorage.setItem('user_data', JSON.stringify(user));
      // await AsyncStorage.setItem('user_data', user);

      return user;
    } catch (error) {
      console.error('Erreur de connexion:', error);
      throw error;
    }
  },

  /**
   * Inscrit un nouvel utilisateur
   * @param {Object} userData - Données de l'utilisateur
   * @returns {Promise<Object>} - Données de l'utilisateur créé
   */
  register: async (userData) => {
    try {
      // Inscription de base avec le plugin users-permissions
      const response = await api.post('/api/auth/local/register', {
        username: userData.username || userData.email,
        email: userData.email,
        password: userData.password,
      });

      // Récupérer le token et les infos utilisateur
      const { jwt, user } = response.data;

      // Stocker le token temporairement pour la mise à jour du profil
      api.defaults.headers.common['Authorization'] = `Bearer ${jwt}`;

      // Créer ou mettre à jour le profil employé avec les informations supplémentaires
      if (userData.firstName || userData.lastName) {
        await api.post('/api/employee-profiles', {
          data: {
            user: user.id,
            firstName: userData.firstName,
            lastName: userData.lastName,
          },
        });
      }

      return response.data;
    } catch (error) {
      console.error('Erreur d\'inscription détaillée:', error.response ? {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      } : error.message);
      throw error;
    }
  },

  // Assurez-vous que la déconnexion est complète
  logout: async () => {
    try {
      // Supprimez d'abord tous les tokens
      await AsyncStorage.removeItem('jwt_token');
      await AsyncStorage.removeItem('user_id');
      await AsyncStorage.removeItem('user_data');

      // Supprimez également d'autres données potentiellement utilisées
      await AsyncStorage.removeItem('notifications_enabled');
      await AsyncStorage.removeItem('dark_mode_enabled');
      await AsyncStorage.removeItem('email_notifications');

      // Assurez-vous que les headers d'autorisation sont supprimés
      api.defaults.headers.common['Authorization'] = '';

      return true;
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
      throw error;
    }
  },

  onLogout: (callback) => {
    logoutCallbacks.push(callback);
    return () => {
      // Fonction pour se désabonner
      logoutCallbacks = logoutCallbacks.filter(cb => cb !== callback);
    };
  },

  // Vérifier si l'utilisateur est connecté
  isAuthenticated: async () => {
    try {
      const token = await AsyncStorage.getItem('jwt_token');
      // Vérification plus rigoureuse du token
      return !!token && token.length > 0;
    } catch (error) {
      console.error('Erreur lors de la vérification d\'authentification:', error);
      return false;
    }
  },

  // Récupérer les informations de l'utilisateur
  getCurrentUser: async () => {
    try {
      const userData = await AsyncStorage.getItem('user_data');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Erreur lors de la récupération des données utilisateur:', error);
      return null;
    }
  },

  /**
   * Demande une réinitialisation de mot de passe
   * @param {string} email - Email de l'utilisateur
   * @returns {Promise<Object>} - Résultat de l'opération
   */
  forgotPassword: async (email) => {
    try {
      const response = await api.post('/api/auth/forgot-password', {
        email,
      });

      return response.data;
    } catch (error) {
      console.error('Erreur lors de la demande de réinitialisation de mot de passe:', error);
      throw error;
    }
  },

  /**
   * Réinitialise le mot de passe avec un code reçu par email
   * @param {string} code - Code de réinitialisation
   * @param {string} password - Nouveau mot de passe
   * @param {string} passwordConfirmation - Confirmation du nouveau mot de passe
   * @returns {Promise<Object>} - Résultat de l'opération
   */
  resetPassword: async (code, password, passwordConfirmation) => {
    try {
      const response = await api.post('/api/auth/reset-password', {
        code,
        password,
        passwordConfirmation,
      });

      return response.data;
    } catch (error) {
      console.error('Erreur lors de la réinitialisation du mot de passe:', error);
      throw error;
    }
  },

  /**
   * Met à jour les informations de l'utilisateur actuel
   * @param {Object} userData - Nouvelles données utilisateur
   * @returns {Promise<Object>} - Données utilisateur mises à jour
   */
  updateUser: async (userData) => {
    try {
      const userId = await AsyncStorage.getItem('user_id');
      const userDocId = await AsyncStorage.getItem('user_doc_id');

      const response = await api.put(`/api/users/${userId}`, userData);

      // Mettre à jour les données en cache
      const updatedUser = response.data;
      await AsyncStorage.setItem('user_data', JSON.stringify(updatedUser));

      return updatedUser;
    } catch (error) {
      console.error('Erreur lors de la mise à jour des informations utilisateur:', error);
      throw error;
    }
  },

  /**
   * Enregistre le token FCM de l'appareil pour les notifications push
   * @param {string} fcmToken - Token Firebase Cloud Messaging
   * @param {string} deviceType - Type d'appareil ('ios', 'android', 'web')
   * @returns {Promise<Object>} - Résultat de l'opération
   */
  registerFCMToken: async (fcmToken, deviceType) => {
    try {
      const userId = await AsyncStorage.getItem('user_id');

      if (!userId) {
        throw new Error('Utilisateur non connecté');
      }

      // Vérifier si le token existe déjà
      const response = await api.get(`/api/fcm-tokens?filters[token][$eq]=${fcmToken}`);

      if (response.data.data.length > 0) {
        // Le token existe déjà, le mettre à jour
        const tokenId = response.data.data[0].id;
        await api.put(`/api/fcm-tokens/${tokenId}`, {
          data: {
            lastUsed: new Date().toISOString(),
          },
        });
      } else {
        // Créer un nouveau token
        await api.post('/api/fcm-tokens', {
          data: {
            token: fcmToken,
            device: deviceType,
            user: userId,
            lastUsed: new Date().toISOString(),
          },
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du token FCM:', error);
      return { success: false, error: error.message };
    }
  },
};

// Service pour les notifications
const notificationService = {
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
const documentService = {
  // Récupérer tous les documents
  getDocuments: async (page = 1, pageSize = 20) => {
    try {
      const response = await api.get(`/api/documents?pagination[page]=${page}&populate=file&pagination[pageSize]=${pageSize}`);
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des documents:', error);
      throw error;
    }
  },

  // Récupérer un document par ID
  getDocumentById: async (id) => {
    try {
      const response = await api.get(`/api/documents/${id}`);
      return response.data.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération du document ${id}:`, error);
      throw error;
    }
  },

  // Télécharger un document
  downloadDocument: async (id) => {
    try {
      const response = await api.get(`/api/documents/${id}/download`, {
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
const calendarService = {
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
  /**
 * Crée un nouvel événement dans le calendrier
 * @param {Object} eventData - Les données de l'événement à créer
 * @returns {Promise<Object>} - L'événement créé
 */
  createEvent: async (eventData) => {
    try {
      const userId = await AsyncStorage.getItem('user_id');

      // Préparer les données pour l'API
      const data = {
        title: eventData.title,
        description: eventData.description || '',
        startDate: eventData.startDate,
        endDate: eventData.endDate,
        allDay: eventData.allDay || false,
        isPublic: eventData.isPublic || false,
        requiresResponse: eventData.requiresResponse || false,
        category: eventData.category || 'other',
        organizer: userId,
      };

      // Ajouter la localisation si présente
      if (eventData.location && eventData.location.name) {
        // Vérifier si la localisation existe déjà
        const locationResponse = await api.get(`/api/locations?filters[name][$eq]=${encodeURIComponent(eventData.location.name)}`);

        if (locationResponse.data.data && locationResponse.data.data.length > 0) {
          // Utiliser une localisation existante
          data.location = locationResponse.data.data[0].id;
        } else {
          // Créer une nouvelle localisation
          const newLocationResponse = await api.post('/api/locations', {
            data: {
              name: eventData.location.name,
              address: eventData.location.address || '',
            },
          });

          data.location = newLocationResponse.data.data.id;
        }
      }

      // Ajouter les participants (organisateur par défaut)
      data.participants = [
        {
          user: userId,
          response: 'accepted',
        },
      ];

      // Créer l'événement
      const response = await api.post('/api/events', {
        data: data,
      });

      return response.data.data;
    } catch (error) {
      console.error('Erreur lors de la création de l\'événement:', error);
      throw error;
    }
  },
};

// Service pour les ressources humaines
const hrService = {
  // Récupérer les bulletins de salaire
  getSalarySlips: async () => {
    try {
      const userId = await AsyncStorage.getItem('user_id');
      const response = await api.get(`/api/salary-slips?filters[user][id]=${userId}&sort=date:desc`);
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des bulletins de salaire:', error);
      throw error;
    }
  },

  // Récupérer les demandes de congés
  getLeaveRequests: async () => {
    try {
      const userId = await AsyncStorage.getItem('user_id');
      const response = await api.get(`/api/leave-requests?filters[user][id]=${userId}&sort=createdAt:desc`);
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des demandes de congés:', error);
      throw error;
    }
  },

  // Soumettre une nouvelle demande de congé
  submitLeaveRequest: async (startDate, endDate, reason, type) => {
    try {
      const userId = await AsyncStorage.getItem('user_id');
      const response = await api.post('/api/leave-requests', {
        data: {
          user: userId,
          startDate,
          endDate,
          reason,
          type,
          status: 'pending',
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
  getEmployeeInfo: async () => {
    try {
      const userId = await AsyncStorage.getItem('user_id');
      const response = await api.get(`/api/employees?filters[user][id]=${userId}`);
      return response.data.data[0];
    } catch (error) {
      console.error('Erreur lors de la récupération des informations de l\'employé:', error);
      throw error;
    }
  },

  // Mettre à jour les informations personnelles
  updatePersonalInfo: async (data) => {
    try {
      const employeeId = await hrService.getEmployeeInfo().then(info => info.id);
      const response = await api.put(`/api/employees/${employeeId}`, {
        data: data,
      });
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour des informations personnelles:', error);
      throw error;
    }
  },
};

// Export de l'instance api par défaut pour qu'elle puisse être importée dans dataService.js
export default api;

// Export des autres services
export { authService, notificationService, documentService, calendarService, hrService };