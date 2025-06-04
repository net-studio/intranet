// src/components/calendar/EventCard.js
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

// Composant pour les boutons de réponse RSVP
import RSVPButton from './RSVPButton';

const EventCard = ({ 
  event, 
  onPress, 
  onRSVP, 
  showActions = true, 
  compact = false 
}) => {
  // Formatage de l'heure de l'événement
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Formatage de la date de l'événement
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString([], { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short' 
    });
  };
  
  // Génération d'une couleur de badge en fonction de la catégorie
  const getCategoryColor = (category) => {
    switch (category) {
      case 'meeting': return COLORS.primary;
      case 'conference': return '#6C5CE7';
      case 'training': return '#00B894';
      case 'social': return '#FDCB6E';
      default: return COLORS.secondary;
    }
  };
  
  // Icône en fonction de la catégorie d'événement
  const getCategoryIcon = (category) => {
    switch (category) {
      case 'meeting': return 'people';
      case 'conference': return 'easel';
      case 'training': return 'school';
      case 'social': return 'wine';
      default: return 'calendar';
    }
  };
  
  // Rendu de la partie supérieure de la carte (info principale)
  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.timeContainer}>
        <Text style={styles.time}>{formatTime(event.startDate)}</Text>
        {!compact && (
          <Text style={styles.duration}>
            {event.allDay ? 'Toute la journée' : `jusqu'à ${formatTime(event.endDate)}`}
          </Text>
        )}
      </View>
      
      <View style={styles.titleContainer}>
        <Text style={styles.title} numberOfLines={1}>{event.title}</Text>
        {!compact && event.location && (
          <View style={styles.locationContainer}>
            <Icon name="location" size={14} color={COLORS.textSecondary} />
            <Text style={styles.location} numberOfLines={1}>
              {event.location.name}
            </Text>
          </View>
        )}
      </View>
      
      <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(event.category) }]}>
        <Icon 
          name={getCategoryIcon(event.category)} 
          size={16} 
          color={COLORS.white} 
        />
      </View>
    </View>
  );
  
  // Rendu des actions possibles (confirmation de présence)
  const renderActions = () => {
    if (!showActions || !event.requiresResponse) return null;
    
    return (
      <View style={styles.actionsContainer}>
        <Text style={styles.rsvpLabel}>Répondre:</Text>
        <View style={styles.rsvpButtons}>
          <RSVPButton 
            status="accept" 
            selected={event.userResponse === 'accepted'}
            onPress={() => onRSVP('accepted')} 
          />
          <RSVPButton 
            status="tentative" 
            selected={event.userResponse === 'tentative'}
            onPress={() => onRSVP('tentative')} 
          />
          <RSVPButton 
            status="decline" 
            selected={event.userResponse === 'declined'}
            onPress={() => onRSVP('declined')} 
          />
        </View>
      </View>
    );
  };
  
  // Rendu de la liste des participants (avatars)
  const renderParticipants = () => {
    // Si pas de participants ou mode compact, ne pas afficher
    if (compact || !event.participants || event.participants.length === 0) return null;
    
    // Limiter le nombre de participants affichés
    const displayParticipants = event.participants.slice(0, 5);
    const remainingCount = event.participants.length - 5;
    
    return (
      <View style={styles.participantsContainer}>
        <Text style={styles.participantsLabel}>Participants:</Text>
        <View style={styles.avatarsContainer}>
          {displayParticipants.map((participant, index) => (
            <View 
              key={index} 
              style={[
                styles.avatarCircle, 
                { marginLeft: index > 0 ? -10 : 0 }
              ]}
            >
              {participant.user.avatar ? (
                <Image 
                  source={{ uri: participant.user.avatar }} 
                  style={styles.avatar} 
                />
              ) : (
                <Text style={styles.avatarInitials}>
                  {participant.user.name.substring(0, 2)}
                </Text>
              )}
            </View>
          ))}
          
          {remainingCount > 0 && (
            <View style={[styles.avatarCircle, { marginLeft: -10 }]}>
              <Text style={styles.avatarInitials}>+{remainingCount}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };
  
  // Construction du composant principal
  return (
    <TouchableOpacity 
      style={[
        styles.container, 
        compact ? styles.compactContainer : null
      ]} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      {renderHeader()}
      {renderParticipants()}
      {renderActions()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.md,
    padding: SIZES.md,
    marginBottom: SIZES.md,
    ...NEUMORPHISM.light,
  },
  compactContainer: {
    padding: SIZES.sm,
    marginBottom: SIZES.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeContainer: {
    marginRight: SIZES.md,
  },
  time: {
    ...FONTS.h4,
    color: COLORS.textPrimary,
  },
  duration: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    ...FONTS.h4,
    color: COLORS.textPrimary,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  location: {
    ...FONTS.body2,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  categoryBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SIZES.sm,
  },
  participantsContainer: {
    marginTop: SIZES.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantsLabel: {
    ...FONTS.body2,
    color: COLORS.textSecondary,
    marginRight: SIZES.sm,
  },
  avatarsContainer: {
    flexDirection: 'row',
  },
  avatarCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  avatarInitials: {
    ...FONTS.caption,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  actionsContainer: {
    marginTop: SIZES.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rsvpLabel: {
    ...FONTS.body2,
    color: COLORS.textSecondary,
  },
  rsvpButtons: {
    flexDirection: 'row',
  },
});

export default EventCard;