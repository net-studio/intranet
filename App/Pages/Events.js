import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  ScrollView
} from 'react-native';
import Menu from '../Components/Menu';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import WelcomeHeader from '../Components/WelcomeHeader';
import Colors from '../Shared/Colors';
import { fetchEvents, respondToEvent } from '../Shared/calendarService';

import EventCard from '../Components/EventCard';
import RSVPButton from '../Components/RSVPButton';
import MonthlyCalendar from '../Components/MonthlyCalendar';

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

  // Gestionnaire de sélection de date depuis le calendrier
  const handleDateSelect = (date) => {
    setSelectedDate(date);
  };

  // Aller à aujourd'hui
  const goToToday = () => {
    setSelectedDate(new Date());
  };

  // Rendu pour chaque section d'événements
  const renderEventList = () => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Chargement...</Text>
        </View>
      );
    }

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
        scrollEnabled={false}
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
                  {new Date(event.startDate).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
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
          <TouchableOpacity
            style={styles.addButton}
            onPress={navigateToCreateEvent}
          >
            <Icon name="add" size={24} color={Colors.white} />
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
          <TouchableOpacity style={styles.todayButton} onPress={goToToday}>
            <Text style={styles.todayButtonText}>Aujourd'hui</Text>
          </TouchableOpacity>
        </View>

        {/* Calendrier mensuel avec sélection de date */}
        <MonthlyCalendar 
          events={events} 
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
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
            <View style={styles.eventSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  Événements du {selectedDate.toLocaleDateString('fr-FR', { 
                    day: 'numeric', 
                    month: 'long' 
                  })}
                </Text>
                <View style={styles.eventCount}>
                  <Text style={styles.eventCountText}>
                    {filteredEvents.length}
                  </Text>
                </View>
              </View>
              {renderEventList()}
            </View>

            {renderRSVPSection()}
          </>
        ) : (
          renderRSVPSection()
        )}
      </ScrollView>

      <Menu />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: Colors.white,
    paddingTop: 20,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginHorizontal: 8,
    marginBottom: 8,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    backgroundColor: Colors.robine,
    padding: 10,
    borderRadius: 5,
  },
  headerTitle: {
    fontFamily: 'System',
    fontWeight: '700',
    fontSize: 30,
    color: Colors.white,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  currentDate: {
    fontFamily: 'System',
    fontWeight: '600',
    fontSize: 16,
    color: Colors.textPrimary,
    flex: 1,
  },
  todayButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  todayButtonText: {
    fontFamily: 'System',
    fontWeight: '500',
    fontSize: 12,
    color: Colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
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
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  activeTabButton: {
    backgroundColor: Colors.primary,
    elevation: 4,
  },
  tabLabel: {
    fontFamily: 'System',
    fontWeight: '500',
    fontSize: 14,
    color: Colors.textPrimary,
    marginLeft: 8,
  },
  activeTabLabel: {
    color: Colors.white,
    fontWeight: '600',
  },
  eventSection: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: 'System',
    fontWeight: '600',
    fontSize: 18,
    color: Colors.textPrimary,
  },
  eventCount: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  eventCountText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  eventList: {
    paddingHorizontal: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    borderRadius: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
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
    marginBottom: 16,
  },
  rsvpCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  rsvpInfo: {
    flex: 1,
    marginRight: 12,
  },
  rsvpTitle: {
    fontFamily: 'System',
    fontWeight: '600',
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  rsvpDate: {
    fontFamily: 'System',
    fontWeight: '400',
    fontSize: 14,
    color: Colors.textSecondary,
  },
  rsvpActions: {
    flexDirection: 'row',
    gap: 8,
  },
});