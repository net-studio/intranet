// src/components/notifications/NotificationItem.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Swipeable } from 'react-native-gesture-handler';
import { COLORS, FONTS, SIZES, NEUMORPHISM } from '../../Shared/Theme';

/**
 * Élément de notification
 * @param {Object} props - Propriétés du composant
 * @param {Object} props.notification - Objet notification
 * @param {Function} props.onPress - Fonction à exécuter lors du clic
 * @param {Function} props.onDelete - Fonction à exécuter lors de la suppression
 */
const NotificationItem = ({ notification, onPress, onDelete }) => {
  // Formater le temps pour l'affichage
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    
    // Si c'est aujourd'hui, afficher l'heure
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // Si c'est cette semaine, afficher le jour
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    
    // Sinon, afficher la date
    return date.toLocaleDateString([], { day: 'numeric', month: 'short' });
  };
  
  // Obtenir l'icône en fonction du type de notification
  const getNotificationIcon = () => {
    switch (notification.type) {
      case 'message':
        return { name: 'chatbubble', color: '#4CAF50' };
      case 'document':
        return { name: 'document-text', color: '#2196F3' };
      case 'event':
        return { name: 'calendar', color: '#9C27B0' };
      case 'news':
        return { name: 'newspaper', color: '#FF9800' };
      case 'hr':
        return { name: 'briefcase', color: '#795548' };
      default:
        return { name: 'notifications', color: COLORS.primary };
    }
  };
  
  // Configuration de l'action de suppression lors du swipe
  const renderRightActions = (progress, dragX) => {
    const trans = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [0, 100],
      extrapolate: 'clamp',
    });
    
    return (
      <Animated.View
        style={[
          styles.deleteContainer,
          {
            transform: [{ translateX: trans }],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => {
            Alert.alert(
              'Supprimer la notification',
              'Êtes-vous sûr de vouloir supprimer cette notification ?',
              [
                { text: 'Annuler', style: 'cancel' },
                { text: 'Supprimer', onPress: onDelete, style: 'destructive' },
              ]
            );
          }}
        >
          <Icon name="trash" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </Animated.View>
    );
  };
  
  const icon = getNotificationIcon();
  
  return (
    <Swipeable renderRightActions={renderRightActions}>
      <TouchableOpacity
        style={[styles.container, !notification.read && styles.unreadContainer]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={[styles.iconContainer, { backgroundColor: icon.color + '20' }]}>
          <Icon name={icon.name} size={24} color={icon.color} />
        </View>
        
        <View style={styles.contentContainer}>
          <View style={styles.headerRow}>
            <Text 
              style={[
                styles.title, 
                !notification.read && styles.unreadTitle
              ]} 
              numberOfLines={1}
            >
              {notification.title}
            </Text>
            <Text style={styles.time}>
              {formatTime(notification.createdAt)}
            </Text>
          </View>
          
          <Text 
            style={[
              styles.message,
              !notification.read && styles.unreadMessage
            ]} 
            numberOfLines={2}
          >
            {notification.message}
          </Text>
        </View>
        
        {!notification.read && (
          <View style={styles.unreadIndicator} />
        )}
      </TouchableOpacity>
    </Swipeable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.md,
    padding: SIZES.md,
    marginBottom: SIZES.md,
    ...NEUMORPHISM.light,
  },
  unreadContainer: {
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.md,
  },
  contentContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    ...FONTS.h4,
    color: COLORS.textPrimary,
    flex: 1,
  },
  unreadTitle: {
    fontWeight: 'bold',
  },
  time: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
    marginLeft: SIZES.sm,
  },
  message: {
    ...FONTS.body2,
    color: COLORS.textSecondary,
  },
  unreadMessage: {
    color: COLORS.textPrimary,
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    position: 'absolute',
    top: SIZES.md,
    right: SIZES.md,
  },
  deleteContainer: {
    marginBottom: SIZES.md,
    width: 80,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  deleteButton: {
    backgroundColor: COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
    width: 70,
    height: '100%',
    borderRadius: SIZES.md,
  },
});

export default NotificationItem;