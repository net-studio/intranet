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
  Platform,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import DateTimePicker from 'react-native-ui-datepicker';
import { COLORS, FONTS, SIZES, NEUMORPHISM } from '../Shared/Theme';

// Services
import { createEvent } from '../Shared/calendarService';
import Menu from './Menu';

const CreateEvent = ({ navigation }) => {
  // États pour le formulaire
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('salon');
  const [isPublic, setIsPublic] = useState(false);
  const [requiresRSVP, setRequiresRSVP] = useState(true);
  const [allDay, setAllDay] = useState(false);

  // Date et heure
  const [startDate, setStartDate] = useState(dayjs());
  const [endDate, setEndDate] = useState(dayjs().add(1, 'hour'));

  // États pour les pickers
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(null);
  const [tempEndDate, setTempEndDate] = useState(null);

  // État de chargement
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Gestionnaires de changement de date
  const handleStartDateChange = (params) => {
    if (params.date) {
      setTempStartDate(dayjs(params.date));
    }
  };

  const handleEndDateChange = (params) => {
    if (params.date) {
      setTempEndDate(dayjs(params.date));
    }
  };

  const confirmStartDate = () => {
    if (tempStartDate) {
      setStartDate(tempStartDate);

      // Ajuster la date de fin si nécessaire
      if (tempStartDate.isAfter(endDate)) {
        setEndDate(tempStartDate.add(1, 'hour'));
      }
    }
    setShowStartDatePicker(false);
    setTempStartDate(null);
  };

  const confirmEndDate = () => {
    if (tempEndDate) {
      // Vérifier que la date de fin est après la date de début
      if (tempEndDate.isBefore(startDate)) {
        Alert.alert('Erreur', 'La date de fin doit être ultérieure à la date de début.');
        return;
      }
      setEndDate(tempEndDate);
    }
    setShowEndDatePicker(false);
    setTempEndDate(null);
  };

  // Formatter la date pour l'affichage
  const formatDate = (date) => {
    return dayjs(date).format('DD MMMM YYYY');
  };

  // Formatter l'heure pour l'affichage
  const formatTime = (date) => {
    return dayjs(date).format('HH:mm');
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
      case 'salon': return 'Salon';
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
      case 'salon': return 'wine';
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
    if (endDate.isBefore(startDate) || endDate.isSame(startDate)) {
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
      const result = await createEvent(eventData);

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
      { value: 'salon', label: 'Salon, Foire' },
      { value: 'social', label: 'Événement social' },
      { value: 'other', label: 'Autre' },
    ];

    return (
      <Modal
        visible={showCategoryPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCategoryPicker(false)}
      >
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
      </Modal>
    );
  };

  // Rendu du DateTimePicker pour la date de début
  const renderStartDatePicker = () => {
    if (!showStartDatePicker) return null;

    return (
      <Modal
        visible={showStartDatePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowStartDatePicker(false);
          setTempStartDate(null);
        }}
      >
        <View style={styles.datePickerOverlay}>
          <View style={styles.datePickerContainer}>
            <View style={styles.datePickerHeader}>
              <Text style={styles.datePickerTitle}>Date de début</Text>
              <TouchableOpacity onPress={() => {
                setShowStartDatePicker(false);
                setTempStartDate(null);
              }}>
                <Icon name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.selectedDateDisplay}>
              <Text style={styles.selectedDateLabel}>Date sélectionnée :</Text>
              <Text style={styles.selectedDateText}>
                {formatDate(tempStartDate || startDate)}
                {!allDay && ` à ${formatTime(tempStartDate || startDate)}`}
              </Text>
            </View>

            <DateTimePicker
              key={`start-${(tempStartDate || startDate).format()}`}
              mode="single"
              date={(tempStartDate || startDate).toDate()}
              onChange={handleStartDateChange}
              timePicker={!allDay}
              locale="fr"
              selectedItemColor={COLORS.primary}
            />

            <TouchableOpacity
              style={styles.confirmButton}
              onPress={confirmStartDate}
            >
              <Text style={styles.confirmButtonText}>Confirmer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  // Rendu du DateTimePicker pour la date de fin
  const renderEndDatePicker = () => {
    if (!showEndDatePicker) return null;

    return (
      <Modal
        visible={showEndDatePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowEndDatePicker(false);
          setTempEndDate(null);
        }}
      >
        <View style={styles.datePickerOverlay}>
          <View style={styles.datePickerContainer}>
            <View style={styles.datePickerHeader}>
              <Text style={styles.datePickerTitle}>Date de fin</Text>
              <TouchableOpacity onPress={() => {
                setShowEndDatePicker(false);
                setTempEndDate(null);
              }}>
                <Icon name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <DateTimePicker
              key={`end-${(tempEndDate || endDate).format()}`}
              mode="single"
              date={(tempEndDate || endDate).toDate()}
              onChange={handleEndDateChange}
              timePicker={!allDay}
              locale="fr"
              selectedItemColor={COLORS.primary}
            />

            <TouchableOpacity
              style={styles.confirmButton}
              onPress={confirmEndDate}
            >
              <Text style={styles.confirmButtonText}>Confirmer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => setShowStartDatePicker(true)}
              >
                <Icon name="calendar-outline" size={18} color={COLORS.primary} />
                <Text style={styles.dateTimeButtonText}>
                  {formatDate(startDate)}
                  {!allDay && ` à ${formatTime(startDate)}`}
                </Text>
                <Icon name="chevron-forward" size={18} color={COLORS.darkGray} />
              </TouchableOpacity>
            </View>

            {/* Date de fin */}
            <View style={styles.dateTimeContainer}>
              <Text style={styles.dateTimeLabel}>Fin</Text>
              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => setShowEndDatePicker(true)}
              >
                <Icon name="calendar-outline" size={18} color={COLORS.primary} />
                <Text style={styles.dateTimeButtonText}>
                  {formatDate(endDate)}
                  {!allDay && ` à ${formatTime(endDate)}`}
                </Text>
                <Icon name="chevron-forward" size={18} color={COLORS.darkGray} />
              </TouchableOpacity>
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
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Pickers */}
      {renderStartDatePicker()}
      {renderEndDatePicker()}
      {renderCategoryPicker()}

      <Menu />
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
    backgroundColor: COLORS.white,
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
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: SIZES.sm,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  dateTimeButtonText: {
    ...FONTS.body2,
    color: COLORS.textPrimary,
    marginLeft: SIZES.xs,
    flex: 1,
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerContainer: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.md,
    width: '80%',
    padding: SIZES.lg,
    maxHeight: '70%',
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
  datePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  datePickerContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: SIZES.xl,
    borderTopRightRadius: SIZES.xl,
    paddingTop: SIZES.lg,
    paddingHorizontal: SIZES.lg,
    paddingBottom: SIZES.xl,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  datePickerTitle: {
    ...FONTS.h3,
    color: COLORS.textPrimary,
  },
  confirmButton: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.sm,
    paddingVertical: SIZES.md,
    alignItems: 'center',
    marginTop: SIZES.md,
  },
  confirmButtonText: {
    ...FONTS.body1,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  selectedDateDisplay: {
    backgroundColor: COLORS.primary + '20',
    padding: SIZES.md,
    borderRadius: SIZES.sm,
    marginBottom: SIZES.md,
    alignItems: 'center',
  },
  selectedDateLabel: {
    ...FONTS.body2,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  selectedDateText: {
    ...FONTS.h4,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
});

export default CreateEvent;