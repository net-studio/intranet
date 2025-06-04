// src/components/dashboard/StatCard.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Colors from '../Shared/Colors';

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
  color = Colors.robine,
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

      {/* <View
        style={[
          styles.progressIndicator,
          { width: `${Math.min(100, count)}%`, backgroundColor: color }
        ]}
      /> */}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '48%',
    padding: 16,
    borderRadius: 8,
    backgroundColor: Colors.white,
  },
  contentContainer: {
    justifyContent: 'space-between',
    zIndex: 1,
  },
  title: {
    fontFamily: 'System',
    fontWeight: '400',
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  countRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  count: {
    fontFamily: 'System',
    fontWeight: '700',
    fontSize: 32,
    color: Colors.textPrimary,
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
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    opacity: 0.7,
  },
});

export default StatCard;