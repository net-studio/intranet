// src/screens/hr/admin/LeaveRequestAdmin.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, FONTS, SIZES, NEUMORPHISM } from '../Shared/Theme';
import { hrService } from '../Shared/strapiService';
import Menu from '../Components/Menu';
import WelcomeHeader from '../Components/WelcomeHeader';

const LeaveRequestAdmin = ({ navigation }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'approved', 'rejected'

  useEffect(() => {
    loadLeaveRequests();
  }, []);

  // Ajout de useFocusEffect pour rafraîchir la liste quand on revient à cet écran
  useFocusEffect(
    useCallback(() => {
      loadLeaveRequests();
      return () => {
        // Fonction de nettoyage (optionnelle)
      };
    }, [])
  );

  // Charger les demandes de congés
  const loadLeaveRequests = async () => {
    try {
      setLoading(true);
      const data = await hrService.getAllLeaveRequests();
      setRequests(data);
    } catch (error) {
      console.error('Erreur lors du chargement des demandes de congés:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Gérer le rafraîchissement de la liste
  const handleRefresh = () => {
    setRefreshing(true);
    loadLeaveRequests();
  };

  // Formater la date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short'
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
  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return '#4CAF50';
      case 'rejected': return '#F44336';
      case 'pending': return '#FF9800';
      case 'cancelled': return '#9E9E9E';
      default: return COLORS.textSecondary;
    }
  };

  // Obtenir le texte du statut
  const getStatusText = (status) => {
    switch (status) {
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

  // Filtrer les demandes en fonction du statut sélectionné
  const filteredRequests = filter === 'all'
    ? requests
    : requests.filter(request => request.statut === filter);

  // Rendu d'un élément de la liste
  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.requestCard}
      onPress={() => navigation.navigate('LeaveRequestDetailsAdmin', { request: item })}
    >
      <View style={styles.requestHeader}>
        <View style={styles.employeeInfo}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {item.collaborateur?.prenom
                  ? `${item.collaborateur.prenom.split(' ')[0][0]}${item.collaborateur.prenom.split(' ')[1] ? item.collaborateur.prenom.split(' ')[1][0] : ''}`
                  : "NN"}
                {item.collaborateur?.nom
                  ? `${item.collaborateur.nom.split(' ')[0][0]}${item.collaborateur.nom.split(' ')[1] ? item.collaborateur.nom.split(' ')[1][0] : ''}`
                  : "NN"}
              </Text>
            </View>
          </View>
          <View>
            <Text style={styles.employeeName}>{item.collaborateur?.prenom || "Employé"} {item.collaborateur?.nom || ""}</Text>
            <Text style={styles.employeeId}>ID: {item.collaborateur?.documentId || "N/A"}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.statut) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.statut) }]}>
            {getStatusText(item.statut)}
          </Text>
        </View>
      </View>

      <View style={styles.requestDetails}>
        <View style={styles.typeContainer}>
          <View
            style={[
              styles.typeIndicator,
              { backgroundColor: getTypeColor(item.type) }
            ]}
          />
          <Text style={styles.typeText}>{getTypeText(item.type)}</Text>
        </View>

        <View style={styles.datesContainer}>
          <View style={styles.dateItem}>
            <Text style={styles.dateLabel}>Début</Text>
            <Text style={styles.dateValue}>{formatDate(item.startDate)}</Text>
          </View>
          <View style={styles.dateSeparator}>
            <Icon name="arrow-forward" size={16} color={COLORS.textSecondary} />
          </View>
          <View style={styles.dateItem}>
            <Text style={styles.dateLabel}>Fin</Text>
            <Text style={styles.dateValue}>{formatDate(item.endDate)}</Text>
          </View>
          <View style={styles.dateItem}>
            <Text style={styles.dateLabel}>Durée</Text>
            <Text style={styles.dateValue}>{calculateDays(item.startDate, item.endDate)} jour(s)</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Rendu des filtres
  const renderFilters = () => (
    <View style={styles.filterContainer}>
      <TouchableOpacity
        style={[
          styles.filterButton,
          filter === 'all' && styles.filterButtonActive
        ]}
        onPress={() => setFilter('all')}
      >
        <Text
          style={[
            styles.filterButtonText,
            filter === 'all' && styles.filterButtonTextActive
          ]}
        >
          Tous
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.filterButton,
          filter === 'pending' && styles.filterButtonActive
        ]}
        onPress={() => setFilter('pending')}
      >
        <Text
          style={[
            styles.filterButtonText,
            filter === 'pending' && styles.filterButtonTextActive
          ]}
        >
          En attente
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.filterButton,
          filter === 'approved' && styles.filterButtonActive
        ]}
        onPress={() => setFilter('approved')}
      >
        <Text
          style={[
            styles.filterButtonText,
            filter === 'approved' && styles.filterButtonTextActive
          ]}
        >
          Approuvés
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.filterButton,
          filter === 'rejected' && styles.filterButtonActive
        ]}
        onPress={() => setFilter('rejected')}
      >
        <Text
          style={[
            styles.filterButtonText,
            filter === 'rejected' && styles.filterButtonTextActive
          ]}
        >
          Refusés
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Rendu de l'état vide
  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Icon name="calendar-outline" size={60} color={COLORS.darkGray} />
      <Text style={styles.emptyText}>
        {filter === 'all'
          ? 'Aucune demande de congé trouvée'
          : `Aucune demande ${filter === 'pending' ? 'en attente' : filter === 'approved' ? 'approuvée' : 'refusée'}`}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <WelcomeHeader />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Gestion des congés</Text>
      </View>

      {renderFilters()}

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredRequests}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={renderEmptyComponent}
        />
      )}
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
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.md,
    paddingHorizontal: SIZES.lg,
    justifyContent: 'center',
  },
  headerTitle: {
    ...FONTS.h2,
    color: COLORS.white,
    textAlign: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.md,
    backgroundColor: COLORS.white,
    ...NEUMORPHISM.small,
  },
  filterButton: {
    paddingVertical: SIZES.xs,
    paddingHorizontal: SIZES.sm,
    borderRadius: SIZES.sm,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary + '20',
  },
  filterButtonText: {
    ...FONTS.body2,
    color: COLORS.textSecondary,
  },
  filterButtonTextActive: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: SIZES.lg,
    paddingBottom: 100, // Pour le menu en bas
  },
  requestCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.md,
    padding: SIZES.md,
    marginBottom: SIZES.lg,
    ...NEUMORPHISM.light,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  employeeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: SIZES.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    ...FONTS.h4,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  employeeName: {
    ...FONTS.h4,
    color: COLORS.textPrimary,
  },
  employeeId: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: SIZES.sm,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  requestDetails: {
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    paddingTop: SIZES.md,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  typeIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: SIZES.xs,
  },
  typeText: {
    ...FONTS.body2,
    color: COLORS.textPrimary,
  },
  datesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateItem: {
    alignItems: 'center',
  },
  dateLabel: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  dateValue: {
    ...FONTS.body2,
    color: COLORS.textPrimary,
  },
  dateSeparator: {
    paddingHorizontal: SIZES.xs,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SIZES.xl,
  },
  emptyText: {
    ...FONTS.h4,
    color: COLORS.darkGray,
    textAlign: 'center',
    marginTop: SIZES.md,
  },
});

export default LeaveRequestAdmin;
