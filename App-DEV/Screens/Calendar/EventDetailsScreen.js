// src/screens/calendar/EventDetailsScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Linking,
  Share,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS, FONTS, SIZES, NEUMORPHISM } from '../../Shared/Theme';

// Composants
import RSVPButton from '../../Components/Calendar/RSVPButton';

// Services
import { calendarService } from '../../Shared/strapiService';

const EventDetailsScreen = ({ route, navigation }) => {
  const { event } = route.params;
  const [userResponse, setUserResponse] = useState(event.userResponse);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Formatage de la date et de l'heure
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString([], {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Durée formatée
  const getDuration = () => {
    const start = new Date(event.startDate);
    const end = new Date(event.endDate);
    const durationMs = end - start;
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

    if (event.allDay) return 'Toute la journée';
    if (hours > 0 && minutes > 0) return `${hours}h ${minutes}min`;
    if (hours > 0) return `${hours}h`;
    return `${minutes}min`;
  };

  // Gestion du RSVP
  const handleRSVP = async (response) => {
    try {
      setIsSubmitting(true);
      await calendarService.respondToEvent(event.id, response);
      setUserResponse(response);
      Alert.alert('Succès', 'Votre réponse a été enregistrée.');
    } catch (error) {
      console.error('Erreur lors de la réponse à l\'événement:', error);
      Alert.alert('Erreur', 'Impossible d\'enregistrer votre réponse. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Partage de l'événement
  const shareEvent = async () => {
    try {
      await Share.share({
        message: `${event.title} - ${formatDate(event.startDate)} à ${formatTime(event.startDate)}${event.location ? ` à ${event.location.name}` : ''}.`,
        title: event.title
      });
    } catch (error) {
      console.error('Erreur lors du partage:', error);
    }
  };

  // Ouverture de l'emplacement dans Maps
  const openLocation = () => {
    if (!event.location || !event.location.coordinates) {
      Alert.alert('Information', 'Les coordonnées de localisation ne sont pas disponibles.');
      return;
    }

    const { latitude, longitude } = event.location.coordinates;
    const url = `https://maps.google.com/?q=${latitude},${longitude}`;
    
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        }
        Alert.alert('Erreur', 'Impossible d\'ouvrir l\'application Maps.');
      })
      .catch((error) => {
        console.error('Erreur lors de l\'ouverture de Maps:', error);
      });
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

  // Nom de la catégorie en français
  const getCategoryName = (category) => {
    switch (category) {
      case 'meeting': return 'Réunion';
      case 'conference': return 'Conférence';
      case 'training': return 'Formation';
      case 'social': return 'Événement social';
      default: return 'Événement';
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* En-tête */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareButton} onPress={shareEvent}>
            <Icon name="share-outline" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Informations principales */}
          <View style={styles.mainInfoContainer}>
            <View style={styles.categoryBadge}>
              <Icon
                name={getCategoryIcon(event.category)}
                size={24}
                color={COLORS.white}
              />
            </View>
            <Text style={styles.title}>{event.title}</Text>
            <Text style={styles.categoryText}>{getCategoryName(event.category)}</Text>
          </View>

          {/* Date et heure */}
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Icon name="calendar-outline" size={24} color={COLORS.primary} />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Date</Text>
                <Text style={styles.infoValue}>{formatDate(event.startDate)}</Text>
              </View>
            </View>

            <View style={styles.separator} />

            <View style={styles.infoRow}>
              <Icon name="time-outline" size={24} color={COLORS.primary} />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Heure</Text>
                <Text style={styles.infoValue}>
                  {event.allDay 
                    ? 'Toute la journée' 
                    : `${formatTime(event.startDate)} - ${formatTime(event.endDate)}`}
                </Text>
                <Text style={styles.infoDuration}>Durée: {getDuration()}</Text>
              </View>
            </View>

            {event.location && (
              <>
                <View style={styles.separator} />
                <TouchableOpacity style={styles.infoRow} onPress={openLocation}>
                  <Icon name="location-outline" size={24} color={COLORS.primary} />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Lieu</Text>
                    <Text style={styles.infoValue}>{event.location.name}</Text>
                    {event.location.address && (
                      <Text style={styles.infoSubValue}>{event.location.address}</Text>
                    )}
                  </View>
                  <Icon name="open-outline" size={20} color={COLORS.secondary} />
                </TouchableOpacity>
              </>
            )}

            {event.organizer && (
              <>
                <View style={styles.separator} />
                <View style={styles.infoRow}>
                  <Icon name="person-outline" size={24} color={COLORS.primary} />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Organisateur</Text>
                    <Text style={styles.infoValue}>{event.organizer.name}</Text>
                  </View>
                </View>
              </>
            )}
          </View>

          {/* Description */}
          {event.description && (
            <View style={styles.infoCard}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{event.description}</Text>
            </View>
          )}

          {/* Participants */}
          {event.participants && event.participants.length > 0 && (
            <View style={styles.infoCard}>
              <Text style={styles.sectionTitle}>Participants ({event.participants.length})</Text>
              
              <View style={styles.participantsList}>
                {event.participants.map((participant, index) => (
                  <View key={index} style={styles.participantItem}>
                    <View style={styles.participantAvatar}>
                      {participant.user.avatar ? (
                        <Image
                          source={{ uri: participant.user.avatar }}
                          style={styles.avatarImage}
                        />
                      ) : (
                        <Text style={styles.avatarInitials}>
                          {participant.user.name.substring(0, 2)}
                        </Text>
                      )}
                    </View>
                    <View style={styles.participantInfo}>
                      <Text style={styles.participantName}>{participant.user.name}</Text>
                      <Text style={styles.participantStatus}>
                        {participant.response === 'accepted' && 'Participe'}
                        {participant.response === 'tentative' && 'Peut-être'}
                        {participant.response === 'declined' && 'Ne participe pas'}
                        {!participant.response && 'Pas de réponse'}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Actions en bas de l'écran */}
        {event.requiresResponse && (
          <View style={styles.footerContainer}>
            <Text style={styles.rsvpTitle}>Votre réponse :</Text>
            
            <View style={styles.rsvpButtonsContainer}>
              {isSubmitting ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <>
                  <RSVPButton
                    status="accept"
                    selected={userResponse === 'accepted'}
                    onPress={() => handleRSVP('accepted')}
                  />
                  <RSVPButton
                    status="tentative"
                    selected={userResponse === 'tentative'}
                    onPress={() => handleRSVP('tentative')}
                  />
                  <RSVPButton
                    status="decline"
                    selected={userResponse === 'declined'}
                    onPress={() => handleRSVP('declined')}
                  />
                </>
              )}
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.md,
  },
  backButton: {
    padding: SIZES.xs,
  },
  shareButton: {
    padding: SIZES.xs,
  },
  scrollContent: {
    paddingHorizontal: SIZES.lg,
    paddingBottom: SIZES.xl,
  },
  mainInfoContainer: {
    alignItems: 'center',
    marginBottom: SIZES.xl,
  },
  categoryBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.md,
    ...NEUMORPHISM.medium,
  },
  title: {
    ...FONTS.h1,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SIZES.xs,
  },
  categoryText: {
    ...FONTS.body1,
    color: COLORS.textSecondary,
  },
  infoCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.md,
    padding: SIZES.lg,
    marginBottom: SIZES.lg,
    ...NEUMORPHISM.light,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.sm,
  },
  infoTextContainer: {
    flex: 1,
    marginLeft: SIZES.md,
  },
  infoLabel: {
    ...FONTS.body2,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  infoValue: {
    ...FONTS.h4,
    color: COLORS.textPrimary,
  },
  infoSubValue: {
    ...FONTS.body2,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  infoDuration: {
    ...FONTS.body2,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.lightGray,
    marginVertical: SIZES.xs,
  },
  sectionTitle: {
    ...FONTS.h3,
    color: COLORS.textPrimary,
    marginBottom: SIZES.md,
  },
  description: {
    ...FONTS.body1,
    color: COLORS.textPrimary,
    lineHeight: 24,
  },
  participantsList: {
    marginTop: SIZES.sm,
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  participantAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.md,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarInitials: {
    ...FONTS.body1,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    ...FONTS.body1,
    color: COLORS.textPrimary,
    fontWeight: 'bold',
  },
  participantStatus: {
    ...FONTS.body2,
    color: COLORS.textSecondary,
  },
  footerContainer: {
    backgroundColor: COLORS.white,
    padding: SIZES.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    ...NEUMORPHISM.top,
  },
  rsvpTitle: {
    ...FONTS.h4,
    color: COLORS.textPrimary,
    marginBottom: SIZES.md,
  },
  rsvpButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

export default EventDetailsScreen;