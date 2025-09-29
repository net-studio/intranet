// src/screens/hr/LeaveRequestsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import dayjs from 'dayjs';
import 'dayjs/locale/fr'
import DateTimePicker, { DateType, useDefaultStyles } from 'react-native-ui-datepicker';
import { COLORS, FONTS, SIZES, NEUMORPHISM } from '../Shared/Theme';
import { hrService } from '../Shared/strapiService';
import Menu from '../Components/Menu';
import WelcomeHeader from '../Components/WelcomeHeader';
import { ScrollView } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';

// Composant pour l'élément de demande de congé
const LeaveRequestItem = ({ item, onPress, onCancel }) => {
  // Formater la période de congé
  const formatDateRange = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const startStr = start.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short'
    });

    const endStr = end.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    return `${startStr} - ${endStr}`;
  };

  // Obtenir la couleur en fonction du statut
  const getStatusColor = () => {
    switch (item.statut) {
      case 'approved': return '#4CAF50';
      case 'rejected': return '#F44336';
      case 'pending': return '#FF9800';
      case 'cancelled': return '#9E9E9E';
      default: return COLORS.textSecondary;
    }
  };

  // Obtenir le texte du statut
  const getStatusText = () => {
    switch (item.statut) {
      case 'approved': return 'Approuvé';
      case 'rejected': return 'Refusé';
      case 'pending': return 'En attente';
      case 'cancelled': return 'Annulé';
      default: return 'Inconnu';
    }
  };

  return (
    <TouchableOpacity
      style={styles.requestItem}
      onPress={() => onPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.requestHeader}>
        <View style={styles.requestType}>
          <View
            style={[
              styles.requestTypeIndicator,
              { backgroundColor: getTypeColor(item.type) }
            ]}
          />
          <Text style={styles.requestTypeText}>
            {getTypeText(item.type)}
          </Text>
        </View>

        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor() + '20' }
          ]}
        >
          <Text style={[styles.statusText, { color: getStatusColor() }]}>
            {getStatusText()}
          </Text>
        </View>
      </View>

      <View style={styles.requestDetails}>
        <View style={styles.dateContainer}>
          <Icon name="calendar" size={16} color={COLORS.textSecondary} />
          <Text style={styles.dateText}>
            {formatDateRange(item.startDate, item.endDate)}
          </Text>
        </View>

        <View style={styles.daysContainer}>
          <Text style={styles.daysText}>
            {item.days} {item.days > 1 ? 'jours' : 'jour'}
          </Text>
        </View>
      </View>

      {item.reason && (
        <Text style={styles.reasonText} numberOfLines={2}>
          {item.reason}
        </Text>
      )}

      {item.statut === 'pending' && (
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => onCancel(item)}
        >
          <Icon name="close-circle" size={16} color={COLORS.error} />
          <Text style={styles.cancelText}>Annuler</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

// Obtenir la couleur en fonction du type de congé
const getTypeColor = (type) => {
  switch (type) {
    case 'annual': return '#4CAF50';
    case 'sick': return '#F44336';
    case 'personal': return '#2196F3';
    case 'other': return '#9C27B0';
    default: return COLORS.primary;
  }
};

// Obtenir le texte du type de congé
const getTypeText = (type) => {
  switch (type) {
    case 'annual': return 'Congés annuels';
    case 'sick': return 'Maladie';
    case 'personal': return 'Raison personnelle';
    case 'other': return 'Autre';
    default: return 'Congé';
  }
};

const LeaveRequests = () => {
  const navigation = useNavigation();
  const defaultStyles = useDefaultStyles();

  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState('all'); // 'all', 'pending', 'approved', 'rejected'

  // État pour le formulaire de nouvelle demande
  const [modalVisible, setModalVisible] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [leaveType, setLeaveType] = useState('annual');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const debugDate = (selectedDate) => {
    console.log("startDate : ", startDate)
    console.log("selectedDate : ", selectedDate.date)
  }

  useEffect(() => {
    loadLeaveRequests();
  }, [selectedTab]);

  const loadLeaveRequests = async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);

      // Récupérer les demandes de congés
      const requests = await hrService.getLeaveRequests();

      // Filtrer selon l'onglet sélectionné
      let filteredRequests = requests;
      if (selectedTab !== 'all') {
        filteredRequests = requests.filter(req => req.statut === selectedTab);
      }

      setLeaveRequests(filteredRequests);
    } catch (error) {
      console.error('Erreur lors du chargement des demandes de congés:', error);
      Alert.alert('Erreur', 'Impossible de charger les demandes de congés');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCancelRequest = async (request) => {
    Alert.alert(
      'Annuler la demande',
      'Êtes-vous sûr de vouloir annuler cette demande de congé ?',
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui',
          onPress: async () => {
            try {
              setLoading(true);
              await hrService.cancelLeaveRequest(request.id);
              await loadLeaveRequests(true);
            } catch (error) {
              console.error('Erreur lors de l\'annulation de la demande:', error);
              Alert.alert('Erreur', 'Impossible d\'annuler la demande');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleSubmitRequest = async () => {
    // Vérifier que la date de fin est après la date de début
    if (endDate < startDate) {
      Alert.alert('Erreur', 'La date de fin doit être après la date de début');
      return;
    }

    try {
      setSubmitting(true);

      await hrService.submitLeaveRequest(
        startDate.toISOString(),
        endDate.toISOString(),
        reason,
        leaveType
      );

      setModalVisible(false);
      await loadLeaveRequests(true);

      // Réinitialiser le formulaire
      const today = new Date();
      setStartDate(today);
      setEndDate(today);
      setLeaveType('annual');
      setReason('');

      Alert.alert('Succès', 'Votre demande de congé a été soumise avec succès');
    } catch (error) {
      console.error('Erreur lors de la soumission de la demande:', error);
      Alert.alert('Erreur', 'Impossible de soumettre la demande de congé');
    } finally {
      setSubmitting(false);
    }
  };

  // Rendu des onglets pour filtrer les demandes
  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      {['all', 'pending', 'approved', 'rejected'].map((tab) => (
        <TouchableOpacity
          key={tab}
          style={[styles.tab, selectedTab === tab && styles.selectedTab]}
          onPress={() => setSelectedTab(tab)}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === tab && styles.selectedTabText
            ]}
          >
            {tab === 'all' ? 'Tous' :
              tab === 'pending' ? 'En attente' :
                tab === 'approved' ? 'Approuvés' :
                  'Refusés'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // Rendu du formulaire de nouvelle demande
  const renderNewRequestModal = () => (
    <Modal
      visible={modalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <ScrollView style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Nouvelle demande de congé</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Icon name="close" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.formContainer}>
            {/* Type de congé */}
            <Text style={styles.formLabel}>Type de congé</Text>
            <View style={styles.typeButtonsContainer}>
              {['annual', 'sick', 'personal', 'other'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeButton,
                    leaveType === type && styles.selectedTypeButton
                  ]}
                  onPress={() => setLeaveType(type)}
                >
                  <View
                    style={[
                      styles.typeIndicator,
                      { backgroundColor: getTypeColor(type) }
                    ]}
                  />
                  <Text
                    style={[
                      styles.typeButtonText,
                      leaveType === type && styles.selectedTypeButtonText
                    ]}
                  >
                    {getTypeText(type)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Date de début */}
            <Text style={styles.formLabel}>Date de début</Text>
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={() => setShowStartPicker(true)}
            >
              <Icon name="calendar" size={20} color={COLORS.primary} />
              <Text style={styles.datePickerText}>
                {startDate.toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </Text>
            </TouchableOpacity>
            {showStartPicker && (
              <DateTimePicker
                timeZone="UTC"
                locale="fr"
                mode="single"
                date={startDate}
                onChange={(selectedDate) => setStartDate(selectedDate.date)}
                styles={defaultStyles}
              />
            )}

            {/* Date de fin */}
            <Text style={styles.formLabel}>Date de fin</Text>
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={() => setShowEndPicker(true)}
            >
              <Icon name="calendar" size={20} color={COLORS.primary} />
              <Text style={styles.datePickerText}>
                {endDate.toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </Text>
            </TouchableOpacity>
            {showEndPicker && (
              <DateTimePicker
                timeZone="UTC"
                locale="fr"
                mode="single"
                date={endDate}
                onChange={(selectedDate) => setEndDate(selectedDate.date)}
                styles={defaultStyles}
              />
            )}

            {/* Raison */}
            <Text style={styles.formLabel}>Raison (optionnelle)</Text>
            <TextInput
              style={styles.reasonInput}
              value={reason}
              onChangeText={setReason}
              placeholder="Expliquez brièvement la raison de votre congé..."
              placeholderTextColor={COLORS.darkGray}
              multiline
            />

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmitRequest}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Text style={styles.submitButtonText}>Soumettre</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <WelcomeHeader />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Demandes de congés</Text>

        <TouchableOpacity
          style={styles.newRequestButton}
          onPress={() => setModalVisible(true)}
        >
          <Icon name="add" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {renderTabs()}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Chargement des demandes...</Text>
        </View>
      ) : (
        <FlatList
          data={leaveRequests}
          renderItem={({ item }) => (
            <LeaveRequestItem
              item={item}
              onPress={(request) => navigation.navigate('LeaveRequestDetails', { request })}
              onCancel={handleCancelRequest}
            />
          )}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={() => loadLeaveRequests(true)}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="calendar" size={64} color={COLORS.lightGray} />
              <Text style={styles.emptyText}>
                Aucune demande de congé {selectedTab !== 'all' ? `"${selectedTab}"` : ''}
              </Text>
            </View>
          }
        />
      )}

      {renderNewRequestModal()}
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
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.md,
    paddingHorizontal: SIZES.lg,
  },
  backButton: {
    padding: SIZES.xs,
  },
  headerTitle: {
    ...FONTS.h3,
    color: COLORS.white,
    flex: 1,
    marginLeft: SIZES.md,
  },
  newRequestButton: {
    padding: SIZES.xs,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  tab: {
    paddingVertical: SIZES.xs,
    paddingHorizontal: SIZES.sm,
    marginRight: SIZES.sm,
    borderRadius: SIZES.sm,
  },
  selectedTab: {
    backgroundColor: COLORS.primary + '20',
  },
  tabText: {
    ...FONTS.body2,
    color: COLORS.textSecondary,
  },
  selectedTabText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  listContent: {
    padding: SIZES.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...FONTS.body1,
    color: COLORS.textSecondary,
    marginTop: SIZES.md,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.xxl,
  },
  emptyText: {
    ...FONTS.body1,
    color: COLORS.textSecondary,
    marginTop: SIZES.md,
    textAlign: 'center',
  },
  requestItem: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.md,
    padding: SIZES.md,
    marginBottom: SIZES.md,
    ...NEUMORPHISM.light,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  requestType: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  requestTypeIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: SIZES.xs,
  },
  requestTypeText: {
    ...FONTS.h4,
    color: COLORS.textPrimary,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: SIZES.sm,
  },
  statusText: {
    ...FONTS.caption,
    fontWeight: 'bold',
  },
  requestDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    ...FONTS.body2,
    color: COLORS.textSecondary,
    marginLeft: SIZES.xs,
  },
  daysContainer: {
    backgroundColor: COLORS.lightGray,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: SIZES.sm,
  },
  daysText: {
    ...FONTS.caption,
    color: COLORS.textPrimary,
    fontWeight: 'bold',
  },
  reasonText: {
    ...FONTS.body2,
    color: COLORS.textSecondary,
    marginBottom: SIZES.sm,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
  },
  cancelText: {
    ...FONTS.body2,
    color: COLORS.error,
    marginLeft: SIZES.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.lg,
    width: '90%',
    maxHeight: '80%',
    ...NEUMORPHISM.light,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
    padding: SIZES.lg,
  },
  modalTitle: {
    ...FONTS.h4,
    color: COLORS.textPrimary,
  },
  closeButton: {
    padding: SIZES.xs,
  },
  formContainer: {
    padding: SIZES.lg,
  },
  formLabel: {
    ...FONTS.h4,
    color: COLORS.textPrimary,
    marginBottom: SIZES.sm,
    marginTop: SIZES.md,
  },
  typeButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SIZES.sm,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.sm,
    marginRight: SIZES.sm,
    marginBottom: SIZES.sm,
    borderRadius: SIZES.sm,
    backgroundColor: COLORS.lightGray,
  },
  selectedTypeButton: {
    backgroundColor: COLORS.primary + '20',
  },
  typeIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: SIZES.xs,
  },
  typeButtonText: {
    ...FONTS.body2,
    color: COLORS.textSecondary,
  },
  selectedTypeButtonText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: SIZES.sm,
    padding: SIZES.md,
    marginBottom: SIZES.md,
  },
  datePickerText: {
    ...FONTS.body1,
    color: COLORS.textPrimary,
    marginLeft: SIZES.sm,
  },
  reasonInput: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: SIZES.sm,
    padding: SIZES.md,
    minHeight: 100,
    textAlignVertical: 'top',
    ...FONTS.body1,
    color: COLORS.textPrimary,
    marginBottom: SIZES.lg,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.md,
    padding: SIZES.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    ...FONTS.h4,
    color: COLORS.white,
  },
});

export default LeaveRequests;