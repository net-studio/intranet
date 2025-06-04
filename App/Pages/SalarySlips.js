// src/screens/hr/SalarySlipsScreen.js
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
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS, FONTS, SIZES, NEUMORPHISM } from '../Shared/Theme';
import { hrService } from '../Shared/strapiService';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Menu from '../Components/Menu';
import WelcomeHeader from '../Components/WelcomeHeader';

// Composants locaux
const SalarySlipItem = ({ item, onDownload, downloading }) => {
  // Formater le mois et l'année
  const formatMonthYear = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  };

  // Formater le montant avec la devise
  const formatAmount = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  return (
    <TouchableOpacity
      style={styles.slipItem}
      onPress={() => onDownload(item)}
      disabled={downloading === item.id}
    >
      <View style={styles.slipIconContainer}>
        <Icon name="document-text" size={24} color={COLORS.primary} />
      </View>

      <View style={styles.slipContent}>
        <Text style={styles.slipTitle}>
          Bulletin de salaire {formatMonthYear(item.date)}
        </Text>
        <Text style={styles.slipAmount}>
          {formatAmount(item.amount)}
        </Text>
      </View>

      {downloading === item.id ? (
        <ActivityIndicator size="small" color={COLORS.primary} />
      ) : (
        <TouchableOpacity
          style={styles.downloadButton}
          onPress={() => onDownload(item)}
        >
          <Icon name="download" size={20} color={COLORS.white} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const SalarySlips = ({ navigation }) => {
  const [salarySlips, setSalarySlips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [downloading, setDownloading] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [years, setYears] = useState([]);

  useEffect(() => {
    loadSalarySlips();
  }, [selectedYear]);

  const loadSalarySlips = async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);

      // Récupérer les bulletins de salaire
      const slips = await hrService.getSalarySlips(selectedYear);
      setSalarySlips(slips);

      // Extraire les années disponibles
      if (refresh || years.length === 0) {
        const allSlips = await hrService.getSalarySlips();
        const availableYears = [...new Set(allSlips.map(
          slip => new Date(slip.date).getFullYear()
        ))].sort((a, b) => b - a); // Trier en ordre décroissant

        setYears(availableYears);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des bulletins de salaire:', error);
      Alert.alert('Erreur', 'Impossible de charger les bulletins de salaire');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDownload = async (slip) => {
    try {
      setDownloading(slip.id);

      if (!slip.fileUrl) {
        throw new Error('Aucun fichier disponible pour ce bulletin');
      }

      // Récupérer le token JWT pour l'autorisation
      const token = await AsyncStorage.getItem('jwt_token');

      // Créer le répertoire local si nécessaire
      const dirInfo = await FileSystem.getInfoAsync(FileSystem.documentDirectory + 'downloads');
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(FileSystem.documentDirectory + 'downloads');
      }

      // Format du nom de fichier
      const date = new Date(slip.date);
      const fileName = `Bulletin_${date.getFullYear()}_${date.getMonth() + 1}.pdf`;

      // Chemin local pour le fichier téléchargé
      const localUri = `${FileSystem.documentDirectory}downloads/${fileName}`;

      // Télécharger le fichier
      const downloadResumable = FileSystem.createDownloadResumable(
        slip.fileUrl,
        localUri,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      const { uri } = await downloadResumable.downloadAsync();

      // Vérifier si le partage est disponible sur cet appareil
      const isAvailable = await Sharing.isAvailableAsync();

      if (isAvailable) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert('Info', 'Le partage n\'est pas disponible sur cet appareil');
      }

      // Marquer le bulletin comme téléchargé
      await hrService.markSalarySlipAsDownloaded(slip.id);
      loadSalarySlips(true);
    } catch (error) {
      console.error('Erreur lors du téléchargement du bulletin:', error);
      Alert.alert('Erreur', 'Impossible de télécharger le bulletin');
    } finally {
      setDownloading(null);
    }
  };

  // Rendu du sélecteur d'année
  const renderYearSelector = () => (
    <View style={styles.yearSelectorContainer}>
      <Text style={styles.yearSelectorLabel}>Année :</Text>
      <View style={styles.yearButtons}>
        {years.map(year => (
          <TouchableOpacity
            key={year}
            style={[
              styles.yearButton,
              selectedYear === year && styles.selectedYearButton
            ]}
            onPress={() => setSelectedYear(year)}
          >
            <Text style={[
              styles.yearButtonText,
              selectedYear === year && styles.selectedYearButtonText
            ]}>
              {year}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
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

        <Text style={styles.headerTitle}>Bulletins de salaire</Text>

        <View style={styles.headerRight}>
          <TouchableOpacity>
            <Icon name="help-circle" size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>

      {renderYearSelector()}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Chargement des bulletins...</Text>
        </View>
      ) : (
        <FlatList
          data={salarySlips}
          renderItem={({ item }) => (
            <SalarySlipItem
              item={item}
              onDownload={handleDownload}
              downloading={downloading}
            />
          )}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={() => loadSalarySlips(true)}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="document-text" size={64} color={COLORS.lightGray} />
              <Text style={styles.emptyText}>
                Aucun bulletin disponible pour {selectedYear}
              </Text>
            </View>
          }
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
  headerRight: {
    paddingLeft: SIZES.sm,
  },
  yearSelectorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: SIZES.md,
    paddingHorizontal: SIZES.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  yearSelectorLabel: {
    ...FONTS.body1,
    color: COLORS.textPrimary,
    marginRight: SIZES.md,
  },
  yearButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  yearButton: {
    paddingVertical: SIZES.xs,
    paddingHorizontal: SIZES.sm,
    borderRadius: SIZES.sm,
    marginRight: SIZES.xs,
    backgroundColor: COLORS.lightGray,
  },
  selectedYearButton: {
    backgroundColor: COLORS.primary,
  },
  yearButtonText: {
    ...FONTS.body2,
    color: COLORS.textPrimary,
  },
  selectedYearButtonText: {
    color: COLORS.white,
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
  slipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.md,
    padding: SIZES.md,
    marginBottom: SIZES.md,
    ...NEUMORPHISM.light,
  },
  slipIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.md,
  },
  slipContent: {
    flex: 1,
  },
  slipTitle: {
    ...FONTS.h4,
    color: COLORS.textPrimary,
  },
  slipAmount: {
    ...FONTS.body2,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  downloadButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SalarySlips;