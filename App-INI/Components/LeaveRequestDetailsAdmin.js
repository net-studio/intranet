// src/screens/hr/admin/LeaveRequestDetailsAdmin.js - Version corrigée
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import { COLORS, FONTS, SIZES, NEUMORPHISM } from '../Shared/Theme';
import { hrService, notificationService } from '../Shared/strapiService';
import Menu from '../Components/Menu';
import WelcomeHeader from '../Components/WelcomeHeader';

const LeaveRequestDetailsAdmin = ({ route, navigation }) => {
  const { request } = route.params;
  const [loading, setLoading] = useState(false);
  // État local pour suivre le statut de la demande
  const [currentStatus, setCurrentStatus] = useState(request.statut);

  // États pour le modal de rejet
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // États pour le modal d'approbation
  const [approveModalVisible, setApproveModalVisible] = useState(false);
  const [approveReason, setApproveReason] = useState('');

  // Formater la date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Calculer le nombre de jours entre deux dates
  const calculateDays = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1; // On inclut le premier jour
  };

  // Obtenir la couleur en fonction du statut
  const getStatusColor = () => {
    switch (currentStatus) {
      case 'approved': return '#4CAF50';
      case 'rejected': return '#F44336';
      case 'pending': return '#FF9800';
      case 'cancelled': return '#9E9E9E';
      default: return COLORS.textSecondary;
    }
  };

  // Obtenir le texte du statut
  const getStatusText = () => {
    switch (currentStatus) {
      case 'approved': return 'Approuvé';
      case 'rejected': return 'Refusé';
      case 'pending': return 'En attente';
      case 'cancelled': return 'Annulé';
      default: return 'Inconnu';
    }
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

  // Approuver la demande
  const handleApproveRequest = async () => {
    try {
      setLoading(true);

      // Créer la date d'approbation (date et heure actuelles)
      const approvalDate = new Date().toISOString();

      // Appel API pour approuver la demande
      await hrService.approveLeaveRequest(
        request.documentId,
        approveReason,
        approvalDate
      );

      // Appel API pour envoyer une notification
      await notificationService.sendNotification(
        'Demande de congés',
        'Votre demande de congés à été validée',
        request.collaborateur?.documentId
      );

      // Mettre à jour le statut local
      setCurrentStatus('approved');

      // Fermer le modal d'approbation s'il est ouvert
      setApproveModalVisible(false);

      Alert.alert(
        'Succès',
        'La demande a été approuvée avec succès',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      console.error('Erreur lors de l\'approbation:', error);
      Alert.alert('Erreur', 'Impossible d\'approuver la demande');
    } finally {
      setLoading(false);
    }
  };

  // Ouvrir le modal d'approbation
  const handleShowApproveModal = () => {
    setApproveReason('');
    setApproveModalVisible(true);
  };

  // Ouvrir le modal de rejet
  const handleShowRejectModal = () => {
    setRejectionReason('');
    setRejectModalVisible(true);
  };

  // Rejeter la demande
  const handleRejectRequest = async () => {
    if (!rejectionReason.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir un motif de refus');
      return;
    }

    try {
      setSubmitting(true);

      // Appel API pour rejeter la demande
      await hrService.rejectLeaveRequest(
        request.documentId,
        rejectionReason,
      );

      // Appel API pour envoyer une notification
      await notificationService.sendNotification(
        'Demande de congés',
        'Votre demande de congés à été refusée : ' + rejectionReason,
        request.collaborateur?.documentId
      );

      // Mettre à jour le statut local
      setCurrentStatus('rejected');

      setRejectModalVisible(false);

      Alert.alert(
        'Succès',
        'La demande a été refusée avec succès',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      console.error('Erreur lors du refus:', error);
      Alert.alert('Erreur', 'Impossible de refuser la demande');
    } finally {
      setSubmitting(false);
    }
  };

  // Rendu du modal de rejet
  const renderRejectModal = () => (
    <Modal
      visible={rejectModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setRejectModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Refuser la demande</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setRejectModalVisible(false)}
            >
              <Icon name="close" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.formLabel}>Motif du refus</Text>
            <TextInput
              style={styles.reasonInput}
              value={rejectionReason}
              onChangeText={setRejectionReason}
              placeholder="Veuillez expliquer la raison du refus..."
              placeholderTextColor={COLORS.darkGray}
              multiline
            />

            <TouchableOpacity
              style={styles.rejectSubmitButton}
              onPress={handleRejectRequest}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Text style={styles.rejectSubmitButtonText}>Confirmer le refus</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Rendu du modal d'approbation
  const renderApproveModal = () => (
    <Modal
      visible={approveModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setApproveModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Approuver la demande</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setApproveModalVisible(false)}
            >
              <Icon name="close" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.formLabel}>Motif d'approbation (facultatif)</Text>
            <TextInput
              style={styles.reasonInput}
              value={approveReason}
              onChangeText={setApproveReason}
              placeholder="Veuillez expliquer la raison de l'approbation (facultatif)..."
              placeholderTextColor={COLORS.darkGray}
              multiline
            />

            <TouchableOpacity
              style={styles.approveSubmitButton}
              onPress={handleApproveRequest}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Text style={styles.approveSubmitButtonText}>Confirmer l'approbation</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
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
        <Text style={styles.headerTitle}>Détails de la demande</Text>
      </View>

      <ScrollView style={styles.container}>
        <View style={styles.card}>
          <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor() + '20' }]}>
              <Text style={[styles.statusText, { color: getStatusColor() }]}>
                {getStatusText()}
              </Text>
            </View>
          </View>

          <View style={styles.employeeContainer}>
            <View style={styles.employeeAvatarContainer}>
              <View style={styles.employeeAvatar}>
                <Text style={styles.employeeInitials}>
                  {request.collaborateur?.prenom
                    ? `${request.collaborateur.prenom.split(' ')[0][0]}${request.collaborateur.prenom.split(' ')[1] ? request.collaborateur.prenom.split(' ')[1][0] : ''}`
                    : "NN"}
                  {request.collaborateur?.nom
                    ? `${request.collaborateur.nom.split(' ')[0][0]}${request.collaborateur.nom.split(' ')[1] ? request.collaborateur.nom.split(' ')[1][0] : ''}`
                    : "NN"}
                </Text>
              </View>
            </View>
            <View style={styles.employeeInfo}>
              <Text style={styles.employeeName}>{request.collaborateur?.prenom || "Employé"} {request.collaborateur?.nom || ""}</Text>
              <Text style={styles.employeeId}>ID: {request.collaborateur?.documentId || "N/A"}</Text>
            </View>
          </View>

          <View style={styles.typeContainer}>
            <View
              style={[
                styles.typeIndicator,
                { backgroundColor: getTypeColor(request.type) }
              ]}
            />
            <Text style={styles.typeText}>{getTypeText(request.type)}</Text>
          </View>

          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date de début:</Text>
              <Text style={styles.detailValue}>{formatDate(request.startDate)}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date de fin:</Text>
              <Text style={styles.detailValue}>{formatDate(request.endDate)}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Durée:</Text>
              <Text style={styles.detailValue}>
                {calculateDays(request.startDate, request.endDate)} jour(s)
              </Text>
            </View>

            {request.reason && (
              <View style={styles.reasonContainer}>
                <Text style={styles.detailLabel}>Motif:</Text>
                <Text style={styles.reasonText}>{request.reason}</Text>
              </View>
            )}

            {(request.rejectionReason && currentStatus === 'rejected') && (
              <View style={styles.reasonContainer}>
                <Text style={[styles.detailLabel, { color: COLORS.error }]}>
                  Motif du refus:
                </Text>
                <Text style={styles.rejectionReason}>{request.rejectionReason}</Text>
              </View>
            )}
          </View>

          <View style={styles.dateInfoContainer}>
            <Text style={styles.dateInfoText}>
              Demande créée le {formatDate(request.createdAt)}
            </Text>
            {request.updatedAt !== request.createdAt && (
              <Text style={styles.dateInfoText}>
                Dernière mise à jour le {formatDate(request.updatedAt)}
              </Text>
            )}
          </View>

          {currentStatus === 'pending' && (
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity
                style={[styles.actionButton, styles.approveButton]}
                onPress={handleShowApproveModal}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <>
                    <Icon name="checkmark" size={20} color={COLORS.white} />
                    <Text style={styles.actionButtonText}>Approuver</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.rejectButton]}
                onPress={handleShowRejectModal}
                disabled={loading}
              >
                <Icon name="close" size={20} color={COLORS.white} />
                <Text style={styles.actionButtonText}>Refuser</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {renderRejectModal()}
      {renderApproveModal()}
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
    marginLeft: SIZES.md,
  },
  container: {
    flex: 1,
    padding: SIZES.lg,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.md,
    padding: SIZES.lg,
    ...NEUMORPHISM.light,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: SIZES.md,
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: SIZES.sm,
  },
  statusText: {
    ...FONTS.h4,
    fontWeight: 'bold',
  },
  employeeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.lg,
    paddingBottom: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  employeeAvatarContainer: {
    marginRight: SIZES.md,
  },
  employeeAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary + '30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  employeeInitials: {
    ...FONTS.h3,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    ...FONTS.h3,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  employeeId: {
    ...FONTS.body2,
    color: COLORS.textSecondary,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.lg,
  },
  typeIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: SIZES.sm,
  },
  typeText: {
    ...FONTS.h3,
    color: COLORS.textPrimary,
  },
  detailsContainer: {
    marginBottom: SIZES.lg,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: SIZES.md,
  },
  detailLabel: {
    fontSize: 16,
    color: COLORS.textSecondary,
    width: '40%',
  },
  detailValue: {
    ...FONTS.body1,
    color: COLORS.textPrimary,
    flex: 1,
  },
  reasonContainer: {
    marginTop: SIZES.md,
  },
  reasonText: {
    ...FONTS.body1,
    color: COLORS.textPrimary,
    marginTop: SIZES.xs,
    lineHeight: 24,
  },
  rejectionReason: {
    ...FONTS.body1,
    color: COLORS.error,
    marginTop: SIZES.xs,
    lineHeight: 24,
  },
  dateInfoContainer: {
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    paddingTop: SIZES.md,
    marginBottom: SIZES.lg,
  },
  dateInfoText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginBottom: SIZES.xs,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 8,
  },
  approveButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    fontSize: 16,
    color: COLORS.white,
    marginLeft: 8,
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
  approveSubmitButton: {
    backgroundColor: '#4CAF50',
    borderRadius: SIZES.md,
    padding: SIZES.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveSubmitButtonText: {
    ...FONTS.h4,
    color: COLORS.white,
  },
  rejectSubmitButton: {
    backgroundColor: COLORS.error,
    borderRadius: SIZES.md,
    padding: SIZES.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectSubmitButtonText: {
    ...FONTS.h4,
    color: COLORS.white,
  },
});

export default LeaveRequestDetailsAdmin;