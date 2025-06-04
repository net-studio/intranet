// src/api/authService.js
import api from './strapiService';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Service d'authentification pour gérer les opérations liées aux utilisateurs
 */
const authService = {
  /**
   * Connecte un utilisateur avec son email et mot de passe
   * @param {string} identifier - Email ou nom d'utilisateur
   * @param {string} password - Mot de passe
   * @returns {Promise<Object>} - Données de l'utilisateur
   */
  login: async (identifier, password) => {
    try {
      const response = await api.post('/api/auth/local', {
        identifier,
        password,
      });
      
      const { jwt, user } = response.data;
      
      // Stocker le token et les informations utilisateur
      await AsyncStorage.setItem('jwt_token', jwt);
      await AsyncStorage.setItem('user_id', user.id.toString());
      await AsyncStorage.setItem('user_data', JSON.stringify(user));
      
      // Définir le token d'autorisation pour les futures requêtes
      api.defaults.headers.common['Authorization'] = `Bearer ${jwt}`;
      
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
      console.error('Erreur d\'inscription:', error);
      throw error;
    }
  },
  
  /**
   * Déconnecte l'utilisateur actuel
   * @returns {Promise<boolean>} - Résultat de l'opération
   */
  logout: async () => {
    try {
      // Supprimer les données d'authentification
      await AsyncStorage.removeItem('jwt_token');
      await AsyncStorage.removeItem('user_id');
      await AsyncStorage.removeItem('user_data');
      
      // Supprimer le token d'autorisation des en-têtes par défaut
      delete api.defaults.headers.common['Authorization'];
      
      return true;
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
      throw error;
    }
  },
  
  /**
   * Vérifie si l'utilisateur est actuellement connecté
   * @returns {Promise<boolean>} - État de connexion
   */
  isAuthenticated: async () => {
    try {
      const token = await AsyncStorage.getItem('jwt_token');
      
      if (!token) {
        return false;
      }
      
      // Définir le token pour les futures requêtes
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Optionnel: vérifier si le token est valide avec une requête légère
      await api.get('/api/users/me');
      
      return true;
    } catch (error) {
      // Si une erreur est renvoyée, le token n'est probablement plus valide
      await authService.logout();
      return false;
    }
  },
  
  /**
   * Récupère les informations de l'utilisateur actuellement connecté
   * @returns {Promise<Object|null>} - Données de l'utilisateur ou null
   */
  getCurrentUser: async () => {
    try {
      const userData = await AsyncStorage.getItem('user_data');
      
      if (!userData) {
        // Si les données ne sont pas en cache, les récupérer du serveur
        const response = await api.get('/api/users/me?populate=*');
        const user = response.data;
        
        // Mettre à jour le cache
        await AsyncStorage.setItem('user_data', JSON.stringify(user));
        
        return user;
      }
      
      return JSON.parse(userData);
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
      
      const response = await api.put(`/api/users/${userId}`, {
        data: userData,
      });
      
      // Mettre à jour les données en cache
      const updatedUser = response.data.data;
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

export default authService;