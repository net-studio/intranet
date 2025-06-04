// src/screens/calendar/CalendarScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS, FONTS, SIZES, NEUMORPHISM } from '../../Shared/Theme';

// Composants
import CalendarStrip from '../../Components/Calendar/CalendarStrip';
import EventCard from '../../Components/Calendar/EventCard';

// Services
import { calendarService } from '../../Shared/strapiService';

const CalendarScreen = ({ navigation }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fonction pour formater la date au format YYYY-MM-DD
  const formatDateForAPI = (date) => {
    return date.toISOString().split('T')[0];
  };

  // Charger les événements pour la date sélectionnée
  const loadEvents = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Créer la date de début (début de la journée sélectionnée)
      const startDate = new Date(selectedDate);
      startDate.setHours(0, 0, 0, 0);

      // Créer la date de fin (fin de la journée sélectionnée)
      const endDate = new Date(selectedDate);
      endDate.setHours(23, 59, 59, 999);

      // Formater les dates pour l'API
      const formattedStartDate = formatDateForAPI(startDate);
      const formattedEndDate = formatDateForAPI(endDate);

      // Récupérer les événements
      const eventsData = await calendarService.getEvents(formattedStartDate, formattedEndDate);
      
      // Trier les événements par heure de début
      const sortedEvents = eventsData.sort((a, b) => 
        new Date(a.attributes.startDate) - new Date(b.attributes.startDate)
      );

      // Transformer les données pour correspondre à la structure attendue par les composants
      const formattedEvents = sortedEvents.map(event => ({
        id: event.id,
        title: event.attributes.title,
        description: event.attributes.description,
        startDate: event.attributes.startDate,
        endDate: event.attributes.endDate,
        location: event.attributes.location,
        category: event.attributes.category || 'other',
        requiresResponse: event.attributes.requiresResponse,
        userResponse: event.attributes.userResponse,
        allDay: event.attributes.allDay,
        participants: event.attributes.participants || [],
        organizer: event.attributes.organizer,
      }));

      setEvents(formattedEvents);
    } catch (error) {
      console.error('Erreur lors du chargement des événements:', error);
      setError('Impossible de charger les événements. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  // Charger les événements lorsque la date sélectionnée change
  useEffect(() => {
    loadEvents();
  }, [selectedDate]);

  // Gérer le changement de date
  const handleDateSelected = (date) => {
    setSelectedDate(date);
  };

  // Gérer la réponse à un événement (RSVP)
  const handleRSVP = async (eventId, response) => {
    try {
      await calendarService.respondToEvent(eventId, response);
      
      // Mettre à jour l'état local
      const updatedEvents = events.map(event => {
        if (event.id === eventId) {
          return { ...event, userResponse: response };
        }
        return event;
      });
      
      setEvents(updatedEvents);
      
      Alert.alert('Succès', 'Votre réponse a été enregistrée.');
    } catch (error) {
      console.error('Erreur lors de la réponse à l\'événement:', error);
      Alert.alert('Erreur', 'Impossible d\'enregistrer votre réponse. Veuillez réessayer.');
    }
  };

  // Afficher les détails d'un événement
  const navigateToEventDetails = (event) => {
    navigation.navigate('EventDetails', { event });
  };

  // Créer un nouvel événement
  const navigateToCreateEvent = () => {
    navigation.navigate('CreateEvent');
  };

  // Rendu des événements
  const renderEventItem = ({ item }) => (
    <EventCard 
      event={item}
      onPress={() => navigateToEventDetails(item)}
      onRSVP={(response) => handleRSVP(item.id, response)}
    />
  );

  // Rendu du message si aucun événement
  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Icon name="calendar-outline" size={60} color={COLORS.lightGray} />
      <Text style={styles.emptyText}>Aucun événement prévu pour cette date</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* En-tête */}
        <View style={styles.header}>
          <Text style={styles.title}>Calendrier</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={navigateToCreateEvent}
          >
            <Icon name="add" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Calendrier strip */}
        <CalendarStrip
          selectedDate={selectedDate}
          onDateSelected={handleDateSelected}
        />

        {/* Date sélectionnée (format long) */}
        <View style={styles.selectedDateContainer}>
          <Icon name="calendar" size={20} color={COLORS.primary} />
          <Text style={styles.selectedDateText}>
            {selectedDate.toLocaleDateString([], { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Text>
        </View>

        {/* Liste des événements */}
        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loaderText}>Chargement des événements...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Icon name="alert-circle" size={40} color={COLORS.error} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadEvents}>
              <Text style={styles.retryButtonText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={events}
            renderItem={renderEventItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.eventsList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={renderEmptyComponent}
          />
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
    padding: SIZES.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.lg,
  },
  title: {
    ...FONTS.h1,
    color: COLORS.textPrimary,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    ...NEUMORPHISM.light,
  },
  selectedDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.lg,
  },
  selectedDateText: {
    ...FONTS.h3,
    color: COLORS.textPrimary,
    marginLeft: SIZES.sm,
  },
  eventsList: {
    flexGrow: 1,
    paddingBottom: SIZES.xl,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    ...FONTS.body1,
    color: COLORS.textSecondary,
    marginTop: SIZES.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.xl,
  },
  errorText: {
    ...FONTS.body1,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SIZES.md,
    marginBottom: SIZES.lg,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.lg,
    borderRadius: SIZES.md,
    ...NEUMORPHISM.light,
  },
  retryButtonText: {
    ...FONTS.body1,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SIZES.xxl,
  },
  emptyText: {
    ...FONTS.body1,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SIZES.md,
  },
});

export default CalendarScreen;