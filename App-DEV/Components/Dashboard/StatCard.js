// src/components/dashboard/StatCard.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS, FONTS, SIZES, NEUMORPHISM } from '../../Shared/Theme';

/**
 * Carte de statistiques pour afficher un compteur avec une icône
 * @param {Object} props - Propriétés du composant
 * @param {string} props.title - Titre de la statistique
 * @param {number} props.count - Valeur de la statistique
 * @param {string} props.icon - Nom de l'icône Ionicons
 * @param {string} props.color - Couleur principale (pour l'icône et l'arrière-plan)
 * @param {Function} props.onPress - Fonction à exécuter lors du clic
 * @param {Object} props.style - Styles supplémentaires
 */
const StatCard = ({
  title,
  count,
  icon,
  color = COLORS.primary,
  onPress,
  style,
}) => {
  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={!onPress}
    >
      <View style={styles.contentContainer}>
        <Text style={styles.title}>{title}</Text>
        
        <View style={styles.countRow}>
          <Text style={styles.count}>{count}</Text>
          
          <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
            <Icon name={icon} size={20} color={color} />
          </View>
        </View>
      </View>
      
      <View 
        style={[
          styles.progressIndicator, 
          { width: `${Math.min(100, count)}%`, backgroundColor: color }
        ]} 
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.md,
    padding: SIZES.md,
    marginBottom: SIZES.md,
    overflow: 'hidden',
    position: 'relative',
    ...NEUMORPHISM.light,
    flex: 1,
    marginHorizontal: SIZES.xs,
  },
  contentContainer: {
    justifyContent: 'space-between',
    zIndex: 1,
  },
  title: {
    ...FONTS.body2,
    color: COLORS.textSecondary,
    marginBottom: SIZES.sm,
  },
  countRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  count: {
    ...FONTS.h2,
    color: COLORS.textPrimary,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressIndicator: {
    position: 'absolute',
    height: 4,
    bottom: 0,
    left: 0,
    borderBottomLeftRadius: SIZES.md,
    borderBottomRightRadius: SIZES.md,
    opacity: 0.7,
  },
});

export default StatCard;