// src/screens/calendar/CreateEventScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS, FONTS, SIZES, NEUMORPHISM } from '../../Shared/Theme';

// Services
import { calendarService } from '../../Shared/strapiService';

const CreateEventScreen = ({ navigation }) => {
  // États pour le formulaire
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('meeting'); // meeting, conference, training, social
  const [isPublic, setIsPublic] = useState(false);
  const [requiresRSVP, setRequiresRSVP] = useState(true);
  const [allDay, setAllDay] = useState(false);
  
  // Date et heure
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(() => {
    const date = new Date();
    date.setHours(date.getHours() + 1);
    return date;
  });
  
  // États pour les pickers
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  
  // État de chargement
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fonctions pour gérer les changements de date/heure
  const onStartDateChange = (event, selectedDate) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      const currentDate = new Date(selectedDate);
      const currentStartDate = new Date(startDate);
      
      // Conserver l'heure et les minutes actuelles
      currentDate.setHours(currentStartDate.getHours());
      currentDate.setMinutes(currentStartDate.getMinutes());
      
      setStartDate(currentDate);
      
      // Ajuster la date de fin si nécessaire
      if (currentDate > endDate) {
        const newEndDate = new Date(currentDate);
        newEndDate.setHours(newEndDate.getHours() + 1);
        setEndDate(newEndDate);
      }
    }
  };

  const onStartTimeChange = (event, selectedTime) => {
    setShowStartTimePicker(false);
    if (selectedTime) {
      const currentTime = new Date(selectedTime);
      const currentStartDate = new Date(startDate);
      
      // Conserver la date actuelle
      currentStartDate.setHours(currentTime.getHours());
      currentStartDate.setMinutes(currentTime.getMinutes());
      
      setStartDate(currentStartDate);
      
      // Ajuster l'heure de fin si nécessaire
      if (currentStartDate >= endDate) {
        const newEndDate = new Date(currentStartDate);
        newEndDate.setHours(newEndDate.getHours() + 1);
        setEndDate(newEndDate);
      }
    }
  };

  const onEndDateChange = (event, selectedDate) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      const currentDate = new Date(selectedDate);
      const currentEndDate = new Date(endDate);
      
      // Conserver l'heure et les minutes actuelles
      currentDate.setHours(currentEndDate.getHours());
      currentDate.setMinutes(currentEndDate.getMinutes());
      
      // Vérifier que la date de fin est après la date de début
      if (currentDate < startDate) {
        Alert.alert('Erreur', 'La date de fin doit être ultérieure à la date de début.');
        return;
      }
      
      setEndDate(currentDate);
    }
  };

  const onEndTimeChange = (event, selectedTime) => {
    setShowEndTimePicker(false);
    if (selectedTime) {
      const currentTime = new Date(selectedTime);
      const currentEndDate = new Date(endDate);
      
      // Conserver la date actuelle
      currentEndDate.setHours(currentTime.getHours());
      currentEndDate.setMinutes(currentTime.getMinutes());
      
      // Vérifier que l'heure de fin est après l'heure de début si même jour
      if (isSameDay(startDate, currentEndDate) && currentEndDate <= startDate) {
        Alert.alert('Erreur', 'L\'heure de fin doit être ultérieure à l\'heure de début.');
        return;
      }
      
      setEndDate(currentEndDate);
    }
  };

  // Vérifier si deux dates sont le même jour
  const isSameDay = (date1, date2) => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  // Formatter la date pour l'affichage
  const formatDate = (date) => {
    return date.toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' });
  };

  // Formatter l'heure pour l'affichage
  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Gérer le changement de catégorie
  const handleCategoryChange = (newCategory) => {
    setCategory(newCategory);
    setShowCategoryPicker(false);
  };

  // Obtenir le nom de la catégorie
  const getCategoryName = (categoryValue) => {
    switch (categoryValue) {
      case 'meeting': return 'Réunion';
      case 'conference': return 'Conférence';
      case 'training': return 'Formation';
      case 'social': return 'Événement social';
      default: return 'Autre';
    }
  };

  // Obtenir l'icône de la catégorie
  const getCategoryIcon = (categoryValue) => {
    switch (categoryValue) {
      case 'meeting': return 'people';
      case 'conference': return 'easel';
      case 'training': return 'school';
      case 'social': return 'wine';
      default: return 'calendar';
    }
  };

  // Valider et soumettre le formulaire
  const handleSubmit = async () => {
    // Validation de base
    if (!title.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir un titre pour l\'événement.');
      return;
    }

    // Vérifier que la date de fin est après la date de début
    if (endDate <= startDate && !allDay) {
      Alert.alert('Erreur', 'La date et l\'heure de fin doivent être ultérieures à la date et l\'heure de début.');
      return;
    }

    try {
      setIsSubmitting(true);

      // Préparer les données de l'événement
      const eventData = {
        title,
        description,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        location: location ? { name: location } : null,
        category,
        isPublic,
        requiresResponse: requiresRSVP,
        allDay,
      };

      // Appeler le service pour créer l'événement
      const result = await calendarService.createEvent(eventData);

      // Succès
      Alert.alert(
        'Succès',
        'L\'événement a été créé avec succès.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Erreur lors de la création de l\'événement:', error);
      Alert.alert('Erreur', 'Impossible de créer l\'événement. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Rendu du sélecteur de catégorie
  const renderCategoryPicker = () => {
    if (!showCategoryPicker) return null;

    const categories = [
      { value: 'meeting', label: 'Réunion' },
      { value: 'conference', label: 'Conférence' },
      { value: 'training', label: 'Formation' },
      { value: 'social', label: 'Événement social' },
      { value: 'other', label: 'Autre' },
    ];

    return (
      <View style={styles.pickerOverlay}>
        <View style={styles.pickerContainer}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>Sélectionner une catégorie</Text>
            <TouchableOpacity onPress={() => setShowCategoryPicker(false)}>
              <Icon name="close" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>
          
          {categories.map((item) => (
            <TouchableOpacity
              key={item.value}
              style={styles.categoryItem}
              onPress={() => handleCategoryChange(item.value)}
            >
              <View style={styles.categoryIconContainer}>
                <Icon name={getCategoryIcon(item.value)} size={20} color={COLORS.primary} />
              </View>
              <Text style={styles.categoryItemText}>{item.label}</Text>
              {category === item.value && (
                <Icon name="checkmark" size={20} color={COLORS.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        {/* En-tête */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nouvel événement</Text>
          <TouchableOpacity
            style={[styles.saveButton, (!title || isSubmitting) && styles.saveButtonDisabled]}
            disabled={!title || isSubmitting}
            onPress={handleSubmit}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Text style={styles.saveButtonText}>Créer</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          {/* Informations de base */}
          <View style={styles.section}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Titre *</Text>
              <TextInput
                style={styles.textInput}
                value={title}
                onChangeText={setTitle}
                placeholder="Titre de l'événement"
                maxLength={100}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Description de l'événement"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Lieu</Text>
              <TextInput
                style={styles.textInput}
                value={location}
                onChangeText={setLocation}
                placeholder="Lieu de l'événement"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Catégorie</Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShowCategoryPicker(true)}
              >
                <View style={styles.categoryContainer}>
                  <Icon name={getCategoryIcon(category)} size={20} color={COLORS.primary} />
                  <Text style={styles.pickerButtonText}>{getCategoryName(category)}</Text>
                </View>
                <Icon name="chevron-down" size={20} color={COLORS.darkGray} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Date et heure */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="time-outline" size={20} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Date et heure</Text>
            </View>

            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Toute la journée</Text>
              <Switch
                value={allDay}
                onValueChange={setAllDay}
                trackColor={{ false: COLORS.lightGray, true: COLORS.primary }}
                thumbColor={COLORS.white}
              />
            </View>

            {/* Date de début */}
            <View style={styles.dateTimeContainer}>
              <Text style={styles.dateTimeLabel}>Début</Text>
              <View style={styles.dateTimeButtons}>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowStartDatePicker(true)}
                >
                  <Icon name="calendar-outline" size={18} color={COLORS.primary} />
                  <Text style={styles.dateButtonText}>{formatDate(startDate)}</Text>
                </TouchableOpacity>

                {!allDay && (
                  <TouchableOpacity
                    style={styles.timeButton}
                    onPress={() => setShowStartTimePicker(true)}
                  >
                    <Icon name="time-outline" size={18} color={COLORS.primary} />
                    <Text style={styles.timeButtonText}>{formatTime(startDate)}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Date de fin */}
            <View style={styles.dateTimeContainer}>
              <Text style={styles.dateTimeLabel}>Fin</Text>
              <View style={styles.dateTimeButtons}>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowEndDatePicker(true)}
                >
                  <Icon name="calendar-outline" size={18} color={COLORS.primary} />
                  <Text style={styles.dateButtonText}>{formatDate(endDate)}</Text>
                </TouchableOpacity>

                {!allDay && (
                  <TouchableOpacity
                    style={styles.timeButton}
                    onPress={() => setShowEndTimePicker(true)}
                  >
                    <Icon name="time-outline" size={18} color={COLORS.primary} />
                    <Text style={styles.timeButtonText}>{formatTime(endDate)}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          {/* Options supplémentaires */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="options-outline" size={20} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Options</Text>
            </View>

            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Événement public</Text>
              <Switch
                value={isPublic}
                onValueChange={setIsPublic}
                trackColor={{ false: COLORS.lightGray, true: COLORS.primary }}
                thumbColor={COLORS.white}
              />
            </View>

            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Demander une réponse (RSVP)</Text>
              <Switch
                value={requiresRSVP}
                onValueChange={setRequiresRSVP}
                trackColor={{ false: COLORS.lightGray, true: COLORS.primary }}
                thumbColor={COLORS.white}
              />
            </View>
          </View>

          {/* Espacement pour éviter que le bouton de sauvegarde ne bloque le contenu */}
          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Date Pickers */}
      {showStartDatePicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display="default"
          onChange={onStartDateChange}
        />
      )}

      {showStartTimePicker && (
        <DateTimePicker
          value={startDate}
          mode="time"
          display="default"
          onChange={onStartTimeChange}
        />
      )}

      {showEndDatePicker && (
        <DateTimePicker
          value={endDate}
          mode="date"
          display="default"
          onChange={onEndDateChange}
        />
      )}

      {showEndTimePicker && (
        <DateTimePicker
          value={endDate}
          mode="time"
          display="default"
          onChange={onEndTimeChange}
        />
      )}

      {/* Sélecteur de catégorie */}
      {renderCategoryPicker()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  backButton: {
    padding: SIZES.xs,
  },
  headerTitle: {
    ...FONTS.h3,
    color: COLORS.textPrimary,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.xs,
    borderRadius: SIZES.sm,
  },
  saveButtonDisabled: {
    backgroundColor: COLORS.lightGray,
  },
  saveButtonText: {
    ...FONTS.body2,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  container: {
    flex: 1,
    padding: SIZES.lg,
  },
  section: {
    marginBottom: SIZES.xl,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.md,
    padding: SIZES.lg,
    ...NEUMORPHISM.light,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  sectionTitle: {
    ...FONTS.h4,
    color: COLORS.textPrimary,
    marginLeft: SIZES.xs,
  },
  inputContainer: {
    marginBottom: SIZES.lg,
  },
  inputLabel: {
    ...FONTS.body2,
    color: COLORS.textSecondary,
    marginBottom: SIZES.xs,
  },
  textInput: {
    backgroundColor: COLORS.background,
    borderRadius: SIZES.sm,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    ...FONTS.body1,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: SIZES.sm,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickerButtonText: {
    ...FONTS.body1,
    color: COLORS.textPrimary,
    marginLeft: SIZES.sm,
  },
  pickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  pickerContainer: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.md,
    width: '80%',
    padding: SIZES.lg,
    ...NEUMORPHISM.medium,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.md,
    paddingBottom: SIZES.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  pickerTitle: {
    ...FONTS.h4,
    color: COLORS.textPrimary,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  categoryIconContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.sm,
  },
  categoryItemText: {
    ...FONTS.body1,
    color: COLORS.textPrimary,
    flex: 1,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  switchLabel: {
    ...FONTS.body1,
    color: COLORS.textPrimary,
  },
  dateTimeContainer: {
    marginBottom: SIZES.md,
  },
  dateTimeLabel: {
    ...FONTS.body2,
    color: COLORS.textSecondary,
    marginBottom: SIZES.xs,
  },
  dateTimeButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: SIZES.sm,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    marginRight: SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  dateButtonText: {
    ...FONTS.body2,
    color: COLORS.textPrimary,
    marginLeft: SIZES.xs,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: SIZES.sm,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  timeButtonText: {
    ...FONTS.body2,
    color: COLORS.textPrimary,
    marginLeft: SIZES.xs,
  },
});

export default CreateEventScreen;