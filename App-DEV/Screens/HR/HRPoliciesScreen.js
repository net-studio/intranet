// src/screens/hr/HRPoliciesScreen.js
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
import { COLORS, FONTS, SIZES, NEUMORPHISM } from '../../Shared/Theme';
import { hrService } from '../../Shared/strapiService';

// Composant pour un élément de politique RH
const HRPolicyItem = ({ item, onPress }) => {
  // Formater la date de mise à jour
  const formatUpdateDate = (dateString) => {
    if (!dateString) return 'Date inconnue';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };
  
  // Obtenir l'icône en fonction de la catégorie
  const getCategoryIcon = () => {
    switch (item.category) {
      case 'general': return 'information-circle';
      case 'leave': return 'calendar';
      case 'benefits': return 'gift';
      case 'conduct': return 'shield-checkmark';
      case 'safety': return 'warning';
      default: return 'document-text';
    }
  };
  
  // Obtenir le texte de la catégorie
  const getCategoryText = () => {
    switch (item.category) {
      case 'general': return 'Général';
      case 'leave': return 'Congés';
      case 'benefits': return 'Avantages';
      case 'conduct': return 'Conduite';
      case 'safety': return 'Sécurité';
      default: return 'Autre';
    }
  };
  
  return (
    <TouchableOpacity
      style={styles.policyItem}
      onPress={() => onPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.policyIconContainer}>
        <Icon name={getCategoryIcon()} size={24} color={COLORS.white} />
      </View>
      
      <View style={styles.policyContent}>
        <Text style={styles.policyTitle} numberOfLines={1}>
          {item.title}
        </Text>
        
        <Text style={styles.policyDescription} numberOfLines={2}>
          {item.description || 'Aucune description disponible'}
        </Text>
        
        <View style={styles.policyFooter}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>
              {getCategoryText()}
            </Text>
          </View>
          
          <Text style={styles.updateDate}>
            Mis à jour le {formatUpdateDate(item.updatedAt)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const HRPoliciesScreen = ({ navigation }) => {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Catégories disponibles
  const categories = [
    { id: 'all', name: 'Tous' },
    { id: 'general', name: 'Général' },
    { id: 'leave', name: 'Congés' },
    { id: 'benefits', name: 'Avantages' },
    { id: 'conduct', name: 'Conduite' },
    { id: 'safety', name: 'Sécurité' },
  ];

  useEffect(() => {
    loadPolicies();
  }, [selectedCategory]);

  const loadPolicies = async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);
      
      // Récupérer les politiques RH
      const allPolicies = await hrService.getHRPolicies();
      
      // Filtrer selon la catégorie sélectionnée
      let filteredPolicies = allPolicies;
      if (selectedCategory !== 'all') {
        filteredPolicies = allPolicies.filter(
          policy => policy.category === selectedCategory
        );
      }
      
      setPolicies(filteredPolicies);
    } catch (error) {
      console.error('Erreur lors du chargement des politiques RH:', error);
      Alert.alert('Erreur', 'Impossible de charger les politiques RH');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Ouvrir un document
  const handleOpenPolicy = (policy) => {
    if (policy.documentUrl) {
      navigation.navigate('DocumentViewer', { 
        document: {
          name: policy.title,
          fileUrl: policy.documentUrl,
          type: 'pdf',
        } 
      });
    } else {
      Alert.alert('Info', 'Aucun document associé à cette politique');
    }
  };

  // Rendu du filtre par catégorie
  const renderCategoryFilter = () => (
    <View style={styles.categoriesContainer}>
      <FlatList
        data={categories}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.categoryButton,
              selectedCategory === item.id && styles.selectedCategoryButton
            ]}
            onPress={() => setSelectedCategory(item.id)}
          >
            <Text 
              style={[
                styles.categoryButtonText,
                selectedCategory === item.id && styles.selectedCategoryButtonText
              ]}
            >
              {item.name}
            </Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.categoriesList}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Politiques RH</Text>
        
        <TouchableOpacity
          style={styles.searchButton}
          onPress={() => navigation.navigate('Search', { screen: 'HRPolicies' })}
        >
          <Icon name="search" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>
      
      {renderCategoryFilter()}
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Chargement des politiques...</Text>
        </View>
      ) : (
        <FlatList
          data={policies}
          renderItem={({ item }) => (
            <HRPolicyItem
              item={item}
              onPress={handleOpenPolicy}
            />
          )}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={() => loadPolicies(true)}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="document-text" size={64} color={COLORS.lightGray} />
              <Text style={styles.emptyText}>
                Aucune politique RH disponible
                {selectedCategory !== 'all' && ` dans la catégorie "${selectedCategory}"`}
              </Text>
            </View>
          }
        />
      )}
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
  searchButton: {
    padding: SIZES.xs,
  },
  categoriesContainer: {
    backgroundColor: COLORS.white,
    paddingVertical: SIZES.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  categoriesList: {
    paddingHorizontal: SIZES.lg,
  },
  categoryButton: {
    paddingVertical: SIZES.xs,
    paddingHorizontal: SIZES.md,
    marginRight: SIZES.sm,
    borderRadius: SIZES.sm,
    backgroundColor: COLORS.lightGray,
  },
  selectedCategoryButton: {
    backgroundColor: COLORS.primary,
  },
  categoryButtonText: {
    ...FONTS.body2,
    color: COLORS.textSecondary,
  },
  selectedCategoryButtonText: {
    color: COLORS.white,
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
  policyItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.md,
    padding: SIZES.md,
    marginBottom: SIZES.md,
    ...NEUMORPHISM.light,
  },
  policyIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.md,
  },
  policyContent: {
    flex: 1,
  },
  policyTitle: {
    ...FONTS.h4,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  policyDescription: {
    ...FONTS.body2,
    color: COLORS.textSecondary,
    marginBottom: SIZES.sm,
  },
  policyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    backgroundColor: COLORS.lightGray,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: SIZES.sm,
  },
  categoryText: {
    ...FONTS.caption,
    color: COLORS.textPrimary,
  },
  updateDate: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
  },
});

export default HRPoliciesScreen;