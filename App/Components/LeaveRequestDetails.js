// src/screens/hr/LeaveRequestDetails.js
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
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import { COLORS, FONTS, SIZES, NEUMORPHISM } from '../Shared/Theme';
import { hrService } from '../Shared/strapiService';
import Menu from './Menu';
import WelcomeHeader from './WelcomeHeader';

const LeaveRequestDetails = ({ route, navigation }) => {
  const { request } = route.params;
  const [loading, setLoading] = useState(false);

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
    switch (request.statut) {
      case 'approved': return '#4CAF50';
      case 'rejected': return '#F44336';
      case 'pending': return '#FF9800';
      case 'cancelled': return '#9E9E9E';
      default: return COLORS.textSecondary;
    }
  };

  // Obtenir le texte du statut
  const getStatusText = () => {
    switch (request.statut) {
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

  // Annuler la demande de congé
  const handleCancelRequest = () => {
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
              Alert.alert(
                'Succès',
                'Votre demande a été annulée avec succès',
                [
                  {
                    text: 'OK',
                    onPress: () => navigation.goBack()
                  }
                ]
              );
            } catch (error) {
              console.error('Erreur lors de l\'annulation:', error);
              Alert.alert('Erreur', 'Impossible d\'annuler la demande');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

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

            {request.rejectionReason && request.statut === 'rejected' && (
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

          {request.statut === 'pending' && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancelRequest}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <>
                  <Icon name="close-circle" size={20} color={COLORS.white} />
                  <Text style={styles.cancelButtonText}>Annuler cette demande</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
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
    fontSize:16,
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
    fontSize:12,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginBottom: SIZES.xs,
  },
  cancelButton: {
    backgroundColor: COLORS.error,
    borderRadius: SIZES.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.md,
    paddingHorizontal: SIZES.lg,
  },
  cancelButtonText: {
    ...FONTS.h4,
    color: COLORS.white,
    marginLeft: SIZES.sm,
  },
});

export default LeaveRequestDetails;