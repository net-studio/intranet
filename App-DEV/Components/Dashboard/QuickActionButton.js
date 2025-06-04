// src/components/dashboard/QuickActionButton.js
import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS, SIZES, NEUMORPHISM } from '../../Shared/Theme';
import NotificationBadge from '../Common/NotificationBadge';

/**
 * Bouton d'action rapide avec icône et éventuellement un badge de notification
 * @param {Object} props - Propriétés du composant
 * @param {string} props.icon - Nom de l'icône Ionicons
 * @param {Function} props.onPress - Fonction à exécuter lors du clic
 * @param {string} props.color - Couleur de l'icône
 * @param {number} props.size - Taille de l'icône
 * @param {number} props.notificationCount - Nombre de notifications à afficher
 * @param {boolean} props.active - Indique si le bouton est actif
 * @param {Object} props.style - Styles supplémentaires pour le bouton
 */
const QuickActionButton = ({
  icon,
  onPress,
  color = COLORS.secondary,
  size = 24,
  notificationCount = 0,
  active = false,
  style,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        active && styles.activeButton,
        style
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <Icon name={icon} size={size} color={active ? COLORS.white : color} />
        
        {notificationCount > 0 && (
          <NotificationBadge 
            count={notificationCount} 
            size={16} 
            color={active ? COLORS.white : COLORS.primary}
            style={active ? styles.activeBadge : null}
            textStyle={active ? { color: COLORS.primary } : null}
          />
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    margin: SIZES.xs,
    ...NEUMORPHISM.light,
  },
  activeButton: {
    backgroundColor: COLORS.primary,
  },
  iconContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeBadge: {
    backgroundColor: COLORS.white,
  },
});

export default QuickActionButton;