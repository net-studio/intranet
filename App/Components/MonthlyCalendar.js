import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Colors from '../Shared/Colors';

const { width } = Dimensions.get('window');

const MonthlyCalendar = ({ events = [], selectedDate, onDateSelect }) => {
  const [currentDate, setCurrentDate] = useState(selectedDate || new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Synchroniser currentDate avec selectedDate si elle change de l'extérieur
  useEffect(() => {
    if (selectedDate) {
      setCurrentDate(selectedDate);
    }
  }, [selectedDate]);

  const categoryColors = {
    meeting: '#3b82f6',
    conference: '#a855f7',
    training: '#22c55e',
    salon: '#3e7816',
    social: '#f97316',
    other: '#6b7280'
  };

  const categoryLabels = {
    meeting: 'Réunion',
    conference: 'Conférence',
    training: 'Formation',
    salon: 'Salon',
    social: 'Social',
    other: 'Autre'
  };

  const daysOfWeek = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const adjustedStartDay = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;
    
    return { daysInMonth, startingDayOfWeek: adjustedStartDay };
  };

  const getEventStatusForDay = (event, day) => {
    const eventStartDate = new Date(event.startDate);
    const eventEndDate = new Date(event.endDate);
    
    const currentDayDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    );
    
    // Normaliser à minuit
    const normalizedCurrentDay = new Date(currentDayDate.setHours(0, 0, 0, 0));
    const normalizedStartDate = new Date(eventStartDate.setHours(0, 0, 0, 0));
    const normalizedEndDate = new Date(eventEndDate.setHours(0, 0, 0, 0));
    
    // Déterminer le statut
    if (normalizedCurrentDay.getTime() === normalizedStartDate.getTime() && 
        normalizedCurrentDay.getTime() === normalizedEndDate.getTime()) {
      return 'single'; // Événement d'un seul jour
    } else if (normalizedCurrentDay.getTime() === normalizedStartDate.getTime()) {
      return 'start'; // Premier jour
    } else if (normalizedCurrentDay.getTime() === normalizedEndDate.getTime()) {
      return 'end'; // Dernier jour
    } else {
      return 'continue'; // Jour intermédiaire
    }
  };

  const getEventsForDay = (day) => {
    const validEvents = Array.isArray(events) ? events : [];
    return validEvents.filter(event => {
      const eventStartDate = new Date(event.startDate);
      const eventEndDate = new Date(event.endDate);
      
      // Créer la date du jour en cours dans le calendrier
      const currentDayDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        day
      );
      
      // Normaliser les dates à minuit pour la comparaison
      const normalizedCurrentDay = new Date(currentDayDate.setHours(0, 0, 0, 0));
      const normalizedStartDate = new Date(eventStartDate.setHours(0, 0, 0, 0));
      const normalizedEndDate = new Date(eventEndDate.setHours(0, 0, 0, 0));
      
      // Vérifier si le jour courant est entre la date de début et de fin (inclus)
      return normalizedCurrentDay >= normalizedStartDate && normalizedCurrentDay <= normalizedEndDate;
    });
  };

  const previousMonth = () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    setCurrentDate(newDate);
  };

  const nextMonth = () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    setCurrentDate(newDate);
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
  const today = new Date();
  
  const isToday = (day) => {
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const isSelectedDay = (day) => {
    if (!selectedDate) return false;
    return (
      day === selectedDate.getDate() &&
      currentDate.getMonth() === selectedDate.getMonth() &&
      currentDate.getFullYear() === selectedDate.getFullYear()
    );
  };

  const handleDayPress = (day, dayEvents) => {
    // Créer la nouvelle date sélectionnée
    const newSelectedDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    );
    
    // Appeler le callback de sélection si fourni
    if (onDateSelect) {
      onDateSelect(newSelectedDate);
    }

    // Si des événements existent, afficher le modal
    if (dayEvents.length > 0) {
      setSelectedEvent(dayEvents[0]);
      setModalVisible(true);
    }
  };

  const renderCalendarDays = () => {
    const days = [];
    const totalCells = startingDayOfWeek + daysInMonth;
    const rows = Math.ceil(totalCells / 7);
    
    for (let row = 0; row < rows; row++) {
      const rowDays = [];
      
      for (let col = 0; col < 7; col++) {
        const cellIndex = row * 7 + col;
        const dayNumber = cellIndex - startingDayOfWeek + 1;
        
        if (cellIndex < startingDayOfWeek || dayNumber > daysInMonth) {
          rowDays.push(
            <View key={`empty-${cellIndex}`} style={styles.emptyDay} />
          );
        } else {
          const dayEvents = getEventsForDay(dayNumber);
          const isTodayDate = isToday(dayNumber);
          const isSelected = isSelectedDay(dayNumber);
          
          rowDays.push(
            <TouchableOpacity
              key={dayNumber}
              style={[
                styles.day,
                isTodayDate && styles.dayToday,
                isSelected && styles.daySelected
              ]}
              onPress={() => handleDayPress(dayNumber, dayEvents)}
            >
              <Text style={[
                styles.dayNumber,
                isTodayDate && styles.dayNumberToday,
                isSelected && styles.dayNumberSelected
              ]}>
                {dayNumber}
              </Text>
              {dayEvents.length > 0 && (
                <View style={styles.eventDotsContainer}>
                  {dayEvents.slice(0, 3).map((event, index) => {
                    const status = getEventStatusForDay(event, dayNumber);
                    return (
                      <View
                        key={index}
                        style={[
                          status === 'single' ? styles.eventDot : styles.eventBar,
                          status === 'start' && styles.eventBarStart,
                          status === 'continue' && styles.eventBarContinue,
                          status === 'end' && styles.eventBarEnd,
                          { backgroundColor: categoryColors[event.category] || categoryColors.other }
                        ]}
                      />
                    );
                  })}
                  {dayEvents.length > 3 && (
                    <Text style={styles.moreEventsText}>+{dayEvents.length - 3}</Text>
                  )}
                </View>
              )}
            </TouchableOpacity>
          );
        }
      }
      
      days.push(
        <View key={`row-${row}`} style={styles.calendarRow}>
          {rowDays}
        </View>
      );
    }
    
    return days;
  };

  return (
    <View style={styles.container}>
      {/* Navigation */}
      <View style={styles.navigation}>
        <TouchableOpacity onPress={previousMonth} style={styles.navButton}>
          <Icon name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        
        <Text style={styles.monthLabel}>
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </Text>
        
        <TouchableOpacity onPress={nextMonth} style={styles.navButton}>
          <Icon name="chevron-forward" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* En-têtes des jours */}
      <View style={styles.weekHeader}>
        {daysOfWeek.map((day, index) => (
          <View key={index} style={styles.dayHeader}>
            <Text style={styles.dayHeaderText}>{day}</Text>
          </View>
        ))}
      </View>

      {/* Grille du calendrier */}
      <View style={styles.calendarGrid}>
        {renderCalendarDays()}
      </View>

      {/* Modal détails événement */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedEvent && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedEvent.title}</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Icon name="close" size={24} color={Colors.textPrimary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalBody}>
                  <View style={styles.modalRow}>
                    <Icon name="time-outline" size={20} color={Colors.textSecondary} />
                    <Text style={styles.modalText}>
                      {formatTime(selectedEvent.startDate)} - {formatTime(selectedEvent.endDate)}
                    </Text>
                  </View>

                  {selectedEvent.location && (
                    <View style={styles.modalRow}>
                      <Icon name="location-outline" size={20} color={Colors.textSecondary} />
                      <Text style={styles.modalText}>
                        {selectedEvent.location.name || selectedEvent.location}
                      </Text>
                    </View>
                  )}

                  {selectedEvent.organizer && (
                    <View style={styles.modalRow}>
                      <Icon name="person-outline" size={20} color={Colors.textSecondary} />
                      <Text style={styles.modalText}>
                        Organisé par {selectedEvent.organizer.name}
                      </Text>
                    </View>
                  )}

                  {selectedEvent.participants && selectedEvent.participants.length > 0 && (
                    <View style={styles.participantsSection}>
                      <Text style={styles.participantsTitle}>Participants:</Text>
                      <View style={styles.participantsList}>
                        {selectedEvent.participants.map((p, i) => (
                          <View key={i} style={styles.participantTag}>
                            <Text style={styles.participantText}>
                              {p.user ? p.user.name : p.name}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {selectedEvent.description && (
                    <View style={styles.descriptionSection}>
                      <Text style={styles.descriptionTitle}>Description:</Text>
                      <Text style={styles.descriptionText}>{selectedEvent.description}</Text>
                    </View>
                  )}

                  <View style={styles.badges}>
                    <View style={[
                      styles.categoryBadge,
                      { backgroundColor: categoryColors[selectedEvent.category] || categoryColors.other }
                    ]}>
                      <Text style={styles.badgeText}>
                        {categoryLabels[selectedEvent.category] || 'Autre'}
                      </Text>
                    </View>
                    {selectedEvent.isPublic && (
                      <View style={styles.publicBadge}>
                        <Text style={styles.publicBadgeText}>Public</Text>
                      </View>
                    )}
                  </View>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  navigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  navButton: {
    padding: 8,
  },
  monthLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  weekHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayHeader: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  dayHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  calendarGrid: {
    flexDirection: 'column',
  },
  calendarRow: {
    flexDirection: 'row',
  },
  emptyDay: {
    flex: 1,
    aspectRatio: 1,
    margin: 2,
  },
  day: {
    flex: 1,
    aspectRatio: 1,
    margin: 2,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayToday: {
    backgroundColor: '#eff6ff',
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  daySelected: {
    backgroundColor: Colors.primary || '#3b82f6',
    borderWidth: 2,
    borderColor: Colors.primary || '#3b82f6',
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  dayNumberToday: {
    color: '#3b82f6',
    fontWeight: 'bold',
  },
  dayNumberSelected: {
    color: Colors.white,
    fontWeight: 'bold',
  },
  eventDotsContainer: {
    flexDirection: 'row',
    marginTop: 4,
    gap: 2,
    alignItems: 'center',
  },
  eventDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  eventBar: {
    width: 12,
    height: 3,
    borderRadius: 1.5,
  },
  eventBarStart: {
    borderTopLeftRadius: 3,
    borderBottomLeftRadius: 3,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  eventBarContinue: {
    borderRadius: 0,
  },
  eventBarEnd: {
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },
  moreEventsText: {
    fontSize: 8,
    color: Colors.textSecondary,
    marginLeft: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    flex: 1,
  },
  modalBody: {
    gap: 16,
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalText: {
    fontSize: 16,
    color: Colors.textPrimary,
    flex: 1,
  },
  participantsSection: {
    marginTop: 8,
  },
  participantsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  participantsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  participantTag: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  participantText: {
    fontSize: 14,
    color: Colors.textPrimary,
  },
  descriptionSection: {
    marginTop: 8,
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 14,
    color: Colors.white,
    fontWeight: '500',
  },
  publicBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  publicBadgeText: {
    fontSize: 14,
    color: '#166534',
    fontWeight: '500',
  },
});

export default MonthlyCalendar;