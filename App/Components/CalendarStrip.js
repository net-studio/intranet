// src/components/calendar/CalendarStrip.js
import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { COLORS, FONTS, SIZES} from '../Shared/Theme';

const { width } = Dimensions.get('window');
const DAY_WIDTH = 60;

const CalendarStrip = ({ selectedDate, onDateSelected }) => {
  const scrollViewRef = useRef(null);
  const today = new Date();
  
  // Créer un tableau de dates (30 jours avant et après aujourd'hui)
  const getDates = () => {
    const dates = [];
    const startDate = new Date();
    startDate.setDate(today.getDate() - 30);
    
    for (let i = 0; i < 61; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      dates.push(date);
    }
    
    return dates;
  };
  
  const dates = getDates();
  
  // Faire défiler jusqu'à la date sélectionnée
  useEffect(() => {
    const dateIndex = dates.findIndex(date => 
      date.toDateString() === selectedDate.toDateString()
    );
    
    if (dateIndex !== -1 && scrollViewRef.current) {
      // Centrer la date sélectionnée
      scrollViewRef.current.scrollTo({
        x: (dateIndex * DAY_WIDTH) - (width / 2) + (DAY_WIDTH / 2),
        animated: true,
      });
    }
  }, [selectedDate]);
  
  const isToday = (date) => {
    return date.toDateString() === today.toDateString();
  };
  
  const isSelected = (date) => {
    return date.toDateString() === selectedDate.toDateString();
  };
  
  const getDayName = (date) => {
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    return days[date.getDay()];
  };
  
  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {dates.map((date, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.dayContainer,
              isSelected(date) && styles.selectedDayContainer
            ]}
            onPress={() => onDateSelected(date)}
          >
            <Text
              style={[
                styles.dayName,
                isSelected(date) && styles.selectedDayText
              ]}
            >
              {getDayName(date)}
            </Text>
            <View
              style={[
                styles.dateCircle,
                isToday(date) && styles.todayCircle,
                isSelected(date) && styles.selectedDateCircle
              ]}
            >
              <Text
                style={[
                  styles.dateText,
                  isToday(date) && styles.todayText,
                  isSelected(date) && styles.selectedDateText
                ]}
              >
                {date.getDate()}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 90,
    marginBottom: SIZES.md,
  },
  scrollContent: {
    paddingVertical: SIZES.sm,
  },
  dayContainer: {
    width: DAY_WIDTH,
    alignItems: 'center',
    paddingVertical: SIZES.sm,
  },
  selectedDayContainer: {
    backgroundColor: 'transparent',
  },
  dayName: {
    ...FONTS.body2,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  selectedDayText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  dateCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  todayCircle: {
    backgroundColor: COLORS.lightGray,
  },
  selectedDateCircle: {
    backgroundColor: COLORS.primary,
  },
  dateText: {
    ...FONTS.body1,
    color: COLORS.textPrimary,
  },
  todayText: {
    fontWeight: 'bold',
  },
  selectedDateText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
});

export default CalendarStrip;