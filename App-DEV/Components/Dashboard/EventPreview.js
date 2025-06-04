// src/components/dashboard/EventPreview.js
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
 * Composant d'aperçu d'événement pour le tableau de bord
 * @param {Object} props - Propriétés du composant
 * @param {Object} props.event - Données de l'événement
 * @param {Function} props.onPress - Fonction à exécuter lors du clic
 * @param {Object} props.style - Styles supplémentaires
 */
const EventPreview = ({
  event,
  onPress,
  style,
}) => {
  // Formatage de la date pour l'affichage
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
    });
  };
  
  // Formatage de l'heure pour l'affichage
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  // Déterminer l'icône basée sur le type d'événement
  const getEventIcon = () => {
    switch (event.category) {
      case 'meeting':
        return 'people';
      case 'conference':
        return 'easel';
      case 'training':
        return 'school';
      case 'social':
        return 'wine';
      default:
        return 'calendar';
    }
  };
  
  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.dateContainer}>
        <Text style={styles.day}>
          {formatDate(event.startDate).split(' ')[0]}
        </Text>
        <Text style={styles.month}>
          {formatDate(event.startDate).split(' ')[1]}
        </Text>
      </View>
      
      <View style={styles.contentContainer}>
        <Text style={styles.title} numberOfLines={1}>
          {event.title}
        </Text>
        
        <View style={styles.detailsRow}>
          <View style={styles.timeContainer}>
            <Icon name="time-outline" size={14} color={COLORS.textSecondary} />
            <Text style={styles.time}>
              {formatTime(event.startDate)}
            </Text>
          </View>
          
          {event.location && (
            <View style={styles.locationContainer}>
              <Icon name="location-outline" size={14} color={COLORS.textSecondary} />
              <Text style={styles.location} numberOfLines={1}>
                {event.location.name}
              </Text>
            </View>
          )}
        </View>
      </View>
      
      <View style={styles.iconContainer}>
        <Icon name={getEventIcon()} size={20} color={COLORS.white} />
      </View>
    </TouchableOpacity>
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
  dateContainer: {
    width: 40,
    marginRight: SIZES.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  day: {
    ...FONTS.h3,
    color: COLORS.primary,
  },
  month: {
    ...FONTS.body2,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    ...FONTS.h4,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SIZES.md,
  },
  time: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
    marginLeft: 2,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  location: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
    marginLeft: 2,
    flex: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SIZES.xs,
  },
});

export default EventPreview;