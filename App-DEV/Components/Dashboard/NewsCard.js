// src/components/dashboard/NewsCard.js
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
 * Carte d'actualité pour afficher les news de l'entreprise
 * @param {Object} props - Propriétés du composant
 * @param {string} props.title - Titre de l'actualité
 * @param {string} props.subtitle - Sous-titre ou description courte
 * @param {string} props.date - Date de publication (format texte)
 * @param {string|Object} props.image - Image ou icône associée à l'actualité
 * @param {Function} props.onPress - Fonction à exécuter lors du clic
 * @param {Object} props.style - Styles supplémentaires
 */
const NewsCard = ({
  title,
  subtitle,
  date,
  image,
  onPress,
  style,
}) => {
  // Déterminer si l'image est une URI ou un module local
  const isImageUri = typeof image === 'string';
  
  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.imageContainer}>
        {isImageUri ? (
          <Image
            source={{ uri: image }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <Image
            source={image}
            style={styles.image}
            resizeMode="contain"
          />
        )}
      </View>
      
      <View style={styles.contentContainer}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        
        <Text style={styles.subtitle} numberOfLines={2}>
          {subtitle}
        </Text>
        
        <View style={styles.footer}>
          <Text style={styles.date}>{date}</Text>
          
          <View style={styles.iconContainer}>
            <Icon name="arrow-forward" size={16} color={COLORS.primary} />
          </View>
        </View>
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
  imageContainer: {
    width: 60,
    height: 60,
    borderRadius: SIZES.sm,
    backgroundColor: COLORS.lightGray,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.md,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  title: {
    ...FONTS.h4,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  subtitle: {
    ...FONTS.body2,
    color: COLORS.textSecondary,
    marginBottom: SIZES.xs,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    ...FONTS.caption,
    color: COLORS.darkGray,
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default NewsCard;