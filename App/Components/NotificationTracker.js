// src/components/NotificationTracker.js
import React, { useState, useEffect, useCallback, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import notificationService from '../Shared/notificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../Context/AuthContext';

/**
 * Composant de suivi des notifications
 * Il affiche le nombre de notifications non lues et permet d'accéder à la liste des notifications
 */
const NotificationTracker = () => {
  const { userData, setUserData } = useContext(AuthContext);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigation = useNavigation();

  // Vérifier si l'utilisateur est connecté
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const documentId = await AsyncStorage.getItem('documentId');
        setIsLoggedIn(!!documentId);
      } catch (error) {
        console.error('Erreur lors de la vérification du statut de connexion:', error);
        setIsLoggedIn(false);
      }
    };

    checkLoginStatus();
  }, []);

  // Fonction pour mettre à jour le compteur de notifications non lues
  const updateUnreadCount = async () => {
    if (!isLoggedIn) return;

    setIsLoading(true);
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
      
      // Mettre à jour le badge de l'application
      await notificationService.updateBadgeCount();
    } catch (error) {
      console.error('Erreur lors de la mise à jour du compteur de notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Configurer les écouteurs de notifications
  useEffect(() => {
    if (!isLoggedIn) return;

    // Configurer les notifications
    notificationService.configureNotifications();
    
    // Demander les permissions pour les notifications
    notificationService.requestPermissions();
    
    // Enregistrer pour les notifications push
    notificationService.registerForPushNotifications();
    
    // Configurer les écouteurs
    const cleanup = notificationService.setupNotificationListeners(
      // Quand une notification est reçue
      (notification) => {
        // Mettre à jour le compteur de notifications non lues
        updateUnreadCount();
      },
      // Quand l'utilisateur interagit avec une notification
      (response) => {
        // Rediriger vers l'écran des notifications
        navigation.navigate('Notifications');
      }
    );
    
    // Nettoyer les écouteurs lors du démontage
    return () => {
      cleanup();
    };
  }, [isLoggedIn]);

  // Mettre à jour le compteur lorsque l'écran est focus
  useFocusEffect(
    useCallback(() => {
      if (!isLoggedIn) return;

      updateUnreadCount();
      
      // Configurer un intervalle pour vérifier régulièrement les nouvelles notifications
      const interval = setInterval(updateUnreadCount, 60000); // vérifier toutes les minutes
      
      return () => clearInterval(interval);
    }, [isLoggedIn])
  );

  // Naviguer vers l'écran des notifications
  const navigateToNotifications = () => {
    navigation.navigate('Notifications');
  };

  // Si l'utilisateur n'est pas connecté, ne pas afficher le tracker
  if (!isLoggedIn) {
    return null;
  }

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={navigateToNotifications}
      disabled={isLoading}
    >
      <Ionicons name="notifications" size={24} color="#007AFF" />
      
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 8,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'red',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default NotificationTracker;