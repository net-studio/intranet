import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  StatusBar,
  ScrollView
} from 'react-native'
import Menu from '../Components/Menu';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import WelcomeHeader from '../Components/WelcomeHeader';
import Colors from '../Shared/Colors';
import { COLORS, FONTS, SIZES, NEUMORPHISM } from '../Shared/Theme';
import { fetchEvents, respondToEvent } from '../Shared/calendarService';

import CalendarStrip from '../Components/CalendarStrip';
import EventCard from '../Components/EventCard';
import RSVPButton from '../Components/RSVPButton';

export default function Agenda() {
  const navigation = useNavigation();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tabs pour les filtres
  const [activeTab, setActiveTab] = useState('meetings');
  const tabs = [
    { id: 'meetings', label: 'Rendez-vous', icon: 'people' },
    { id: 'rsvps', label: 'Réservations', icon: 'checkmark-circle' },
  ];

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (events.length > 0) {
      filterEventsByDate();
    }
  }, [selectedDate, activeTab, events]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await fetchEvents();
      setEvents(data);
      filterEventsByDate();
    } catch (error) {
      console.error('Erreur lors du chargement des événements:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterEventsByDate = () => {
    const selected = selectedDate.toDateString();
    let filtered = events.filter(event => {
      const eventDate = new Date(event.startDate).toDateString();
      return eventDate === selected;
    });

    if (activeTab === 'rsvps') {
      filtered = filtered.filter(event => event.requiresResponse);
    }

    setFilteredEvents(filtered);
  };

  const handleRSVP = async (eventId, response) => {
    try {
      await respondToEvent(eventId, response);
      // Mettre à jour l'état local pour refléter le changement
      const updatedEvents = events.map(event => {
        if (event.id === eventId) {
          return { ...event, userResponse: response };
        }
        return event;
      });
      setEvents(updatedEvents);
    } catch (error) {
      console.error('Erreur lors de la réponse à l\'événement:', error);
    }
  };

  // Rendu pour chaque section d'événements
  const renderEventList = () => {
    if (filteredEvents.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Icon name="calendar-outline" size={64} color={Colors.lightGray} />
          <Text style={styles.emptyText}>
            Aucun événement prévu pour cette journée
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={filteredEvents}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <EventCard
            event={item}
            onPress={() => navigation.navigate('EventDetails', { eventId: item.id })}
            onRSVP={(response) => handleRSVP(item.id, response)}
          />
        )}
        contentContainerStyle={styles.eventList}
      />
    );
  };

  // Rendu des RSVPs
  const renderRSVPSection = () => {
    const pendingRSVPs = events.filter(event =>
      event.requiresResponse && !event.userResponse
    );

    return (
      <View style={styles.rsvpContainer}>
        <Text style={styles.sectionTitle}>À confirmer</Text>
        {pendingRSVPs.length === 0 ? (
          <Text style={styles.emptyText}>Aucune confirmation en attente</Text>
        ) : (
          pendingRSVPs.map(event => (
            <View key={event.id} style={styles.rsvpCard}>
              <View style={styles.rsvpInfo}>
                <Text style={styles.rsvpTitle}>{event.title}</Text>
                <Text style={styles.rsvpDate}>
                  {new Date(event.startDate).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.rsvpActions}>
                <RSVPButton
                  onPress={() => handleRSVP(event.id, 'accepted')}
                  status="accept"
                />
                <RSVPButton
                  onPress={() => handleRSVP(event.id, 'declined')}
                  status="decline"
                />
              </View>
            </View>
          ))
        )}
      </View>
    );
  };

  // Rendu des participants
  const renderParticipants = () => {
    // Simuler des données de participants
    const participants = [
      { id: 1, initials: 'JD', name: 'John Doe' },
      { id: 2, initials: 'AM', name: 'Alice Miller' },
      { id: 3, initials: 'TS', name: 'Tom Smith' },
      { id: 4, initials: 'LB', name: 'Lisa Brown' },
      { id: 5, initials: 'RW', name: 'Robert Wilson' },
    ];

    return (
      <View style={styles.participantsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {participants.map(participant => (
            <TouchableOpacity
              key={participant.id}
              style={styles.participantCircle}
            >
              <Text style={styles.participantInitials}>
                {participant.initials}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  // Afficher les détails d'un événement
  const navigateToEventDetails = (event) => {
    navigation.navigate('EventDetails', { event });
  };

  // Créer un nouvel événement
  const navigateToCreateEvent = () => {
    navigation.navigate('CreateEvent');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <WelcomeHeader />

      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Agenda</Text>
          <Text style={styles.headerComing}>(coming soon !)</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={navigateToCreateEvent}
          >
            <Icon name="add" size={24} color={Colors.black} />
          </TouchableOpacity>
        </View>

        <View style={styles.dateSelector}>
          <Text style={styles.currentDate}>
            {selectedDate.toLocaleDateString('fr-FR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </Text>
          <TouchableOpacity style={styles.todayButton}>
            <Text style={styles.todayButtonText}>Today</Text>
          </TouchableOpacity>
        </View>

        <CalendarStrip
          selectedDate={selectedDate}
          onDateSelected={setSelectedDate}
        />
      </View>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.tabsContainer}>
          {tabs.map(tab => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tabButton,
                activeTab === tab.id && styles.activeTabButton
              ]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Icon
                name={tab.icon}
                size={18}
                color={activeTab === tab.id ? Colors.white : Colors.textPrimary}
              />
              <Text
                style={[
                  styles.tabLabel,
                  activeTab === tab.id && styles.activeTabLabel
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'meetings' ? (
          <>
            <Text style={styles.sectionTitle}>Rendez-vous</Text>
            {renderEventList()}

            <Text style={styles.sectionTitle}>Réservations</Text>
            {renderRSVPSection()}

            {renderParticipants()}
          </>
        ) : (
          renderRSVPSection()
        )}
      </ScrollView>
      <Menu />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    // backgroundColor: Colors.white,
  },
  header: {
    backgroundColor: Colors.white,
    paddingTop: 20,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginHorizontal: 8
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    backgroundColor: Colors.tertiary,
    padding:10,
    borderRadius:5
  },
  headerTitle: {
    fontFamily: 'System',
    fontWeight: '700',
    fontSize: 30,
    color: Colors.textPrimary,
  },
  headerComing: {
    fontFamily: 'System',
    fontWeight: '400',
    fontSize: 16,
    color: Colors.black,
  },
  headerSubtitle: {
    fontFamily: 'System',
    fontWeight: '400',
    fontSize: 12,
    color: Colors.textSecondary,
  },
  dateSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  currentDate: {
    fontFamily: 'System',
    fontWeight: '400',
    fontSize: 16,
    color: Colors.textPrimary,
  },
  todayButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  todayButtonText: {
    fontFamily: 'System',
    fontWeight: '400',
    fontSize: 12,
    color: Colors.white,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginVertical: 16,
    paddingHorizontal: 20,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginRight: 16,
  },
  activeTabButton: {
    backgroundColor: Colors.primary,
  },
  tabLabel: {
    fontFamily: 'System',
    fontWeight: '400',
    fontSize: 12,
    color: Colors.textPrimary,
    marginLeft: 8,
  },
  activeTabLabel: {
    color: Colors.white,
  },
  sectionTitle: {
    fontFamily: 'System',
    fontWeight: '600',
    fontSize: 20,
    color: Colors.textPrimary,
    paddingHorizontal: 20,
    marginBottom: 12,
    marginTop: 16,
  },
  eventList: {
    paddingHorizontal: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: Colors.white,
    marginHorizontal: 8,
    borderRadius: 8
  },
  emptyText: {
    fontFamily: 'System',
    fontWeight: '400',
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 16,
  },
  rsvpContainer: {
    paddingHorizontal: 20,
    marginBottom: 8,
    paddingBottom: 8,
    backgroundColor: Colors.white,
    marginHorizontal: 8,
    borderRadius: 8
  },
  rsvpCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  rsvpInfo: {
    flex: 1,
  },
  rsvpTitle: {
    fontFamily: 'System',
    fontWeight: '600',
    fontSize: 20,
    marginBottom: 4,
  },
  rsvpDate: {
    fontFamily: 'System',
    fontWeight: '400',
    fontSize: 12,
    color: Colors.textSecondary,
  },
  rsvpActions: {
    flexDirection: 'row',
  },
  participantsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    marginHorizontal: 8,
    borderRadius: 8
  },
  participantCircle: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  participantInitials: {
    fontFamily: 'System',
    fontWeight: '400',
    fontSize: 12,
    color: Colors.white,
    fontWeight: 'bold',
  },
  footer: {
    flex: 1,
    justifyContent: 'flex-end'
  },
  main: {
    flex: 1,
  }
});