// src/components/common/NotificationBadge.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS,  SIZES } from '../../Shared/Theme';

/**
 * Composant affichant un badge de notification avec un compteur
 * @param {Object} props - Propriétés du composant
 * @param {number} props.count - Nombre à afficher sur le badge
 * @param {Object} props.style - Styles supplémentaires à appliquer au badge
 * @param {string} props.color - Couleur du badge (par défaut COLORS.primary)
 * @param {number} props.size - Taille du badge (par défaut 20)
 * @param {Object} props.textStyle - Styles supplémentaires à appliquer au texte
 */
const NotificationBadge = ({ 
  count, 
  style, 
  color = COLORS.primary, 
  size = 20,
  textStyle 
}) => {
  // Si le compteur est 0 ou non défini, ne pas afficher le badge
  if (!count || count <= 0) {
    return null;
  }

  // Formater le nombre (par exemple, 99+ si le compteur dépasse 99)
  const displayCount = count > 99 ? '99+' : count.toString();

  // Ajuster la taille du badge en fonction du nombre de chiffres
  const badgeSize = displayCount.length > 1 ? size * 1.2 : size;
  
  return (
    <View 
      style={[
        styles.badge, 
        { 
          backgroundColor: color,
          width: badgeSize,
          height: badgeSize,
          borderRadius: badgeSize / 2,
        },
        style
      ]}
    >
      <Text style={[styles.badgeText, textStyle]}>
        {displayCount}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: -5,
    right: -5,
    zIndex: 10,
  },
  badgeText: {
    ...FONTS.caption,
    fontSize: 10,
    color: COLORS.white,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default NotificationBadge;