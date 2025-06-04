// src/components/messaging/ConversationItem.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS, FONTS, SIZES, NEUMORPHISM } from '../../Shared/Theme';

/**
 * Élément de conversation pour l'écran de messagerie
 * @param {Object} props - Propriétés du composant
 * @param {string} props.avatar - URL de l'avatar
 * @param {string} props.name - Nom de la conversation ou du contact
 * @param {string} props.message - Dernier message
 * @param {string} props.time - Horodatage du dernier message
 * @param {number} props.unread - Nombre de messages non lus
 * @param {boolean} props.isOnline - Si le contact est en ligne
 * @param {boolean} props.isGroup - Si c'est une conversation de groupe
 * @param {Function} props.onPress - Fonction à exécuter lors du clic
 * @param {Object} props.style - Styles supplémentaires
 */
const ConversationItem = ({
  avatar,
  name,
  message,
  time,
  unread = 0,
  isOnline = false,
  isGroup = false,
  onPress,
  style,
}) => {
  // Formater l'affichage du temps
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
  
  // Générer les initiales à partir du nom pour l'avatar par défaut
  const getInitials = (name) => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };
  
  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        {avatar ? (
          <Image source={{ uri: avatar }} style={styles.avatar} />
        ) : (
          <View style={[styles.defaultAvatar, { backgroundColor: isGroup ? COLORS.secondary : COLORS.primary }]}>
            <Text style={styles.initials}>
              {isGroup ? 
                <Icon name="people" size={20} color={COLORS.white} /> : 
                getInitials(name)
              }
            </Text>
          </View>
        )}
        
        {isOnline && (
          <View style={styles.onlineIndicator} />
        )}
      </View>
      
      <View style={styles.contentContainer}>
        <View style={styles.headerRow}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          <Text style={styles.time}>
            {formatTime(time)}
          </Text>
        </View>
        
        <View style={styles.messageRow}>
          <Text 
            style={[
              styles.message, 
              unread > 0 && styles.unreadMessage
            ]} 
            numberOfLines={1}
          >
            {message}
          </Text>
          
          {unread > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>
                {unread > 99 ? '99+' : unread}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: SIZES.md,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  defaultAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
  },
  initials: {
    ...FONTS.h3,
    color: COLORS.white,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    ...FONTS.h4,
    color: COLORS.textPrimary,
    flex: 1,
  },
  time: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
    marginLeft: SIZES.sm,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  message: {
    ...FONTS.body2,
    color: COLORS.textSecondary,
    flex: 1,
  },
  unreadMessage: {
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  unreadBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SIZES.sm,
    paddingHorizontal: 6,
  },
  unreadCount: {
    ...FONTS.caption,
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 10,
  },
});

export default ConversationItem;