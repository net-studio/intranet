// src/screens/search/SearchScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS, FONTS, SIZES, NEUMORPHISM } from '../../Shared/Theme';

// Services (assumant que nous avons besoin de chercher à travers différents types de contenus)
import { documentService, calendarService, hrService } from '../../Shared/strapiService';

// Composants
import EventCard from '../../Components/Calendar/EventCard';

const SearchScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Options de catégories de recherche
  const categories = [
    { id: 'all', label: 'Tout', icon: 'search' },
    { id: 'events', label: 'Événements', icon: 'calendar' },
    { id: 'documents', label: 'Documents', icon: 'document-text' },
    { id: 'people', label: 'Personnes', icon: 'people' },
  ];

  // Effectuer la recherche
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    setHasSearched(true);
    
    try {
      let results = [];

      // Recherche en fonction de la catégorie sélectionnée
      if (selectedCategory === 'all' || selectedCategory === 'events') {
        // Recherche d'événements
        const eventsData = await searchEvents(searchQuery);
        results = [...results, ...eventsData.map(event => ({
          ...event,
          type: 'event'
        }))];
      }

      if (selectedCategory === 'all' || selectedCategory === 'documents') {
        // Recherche de documents
        const documentsData = await searchDocuments(searchQuery);
        results = [...results, ...documentsData.map(doc => ({
          ...doc,
          type: 'document'
        }))];
      }

      if (selectedCategory === 'all' || selectedCategory === 'people') {
        // Recherche de personnes
        const peopleData = await searchPeople(searchQuery);
        results = [...results, ...peopleData.map(person => ({
          ...person,
          type: 'person'
        }))];
      }

      setSearchResults(results);
    } catch (error) {
      console.error('Erreur de recherche:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fonctions de recherche spécifiques (à adapter selon votre API)
  const searchEvents = async (query) => {
    try {
      // Cette implémentation dépendra de la façon dont votre API Strapi gère la recherche
      // C'est une implémentation fictive
      const events = await calendarService.getEvents();
      return events.filter(event => 
        event.attributes.title.toLowerCase().includes(query.toLowerCase()) ||
        (event.attributes.description && event.attributes.description.toLowerCase().includes(query.toLowerCase()))
      );
    } catch (error) {
      console.error('Erreur lors de la recherche d\'événements:', error);
      return [];
    }
  };

  const searchDocuments = async (query) => {
    try {
      // Implémentation fictive
      const documents = await documentService.getDocuments();
      return documents.filter(doc => 
        doc.attributes.title.toLowerCase().includes(query.toLowerCase()) ||
        (doc.attributes.description && doc.attributes.description.toLowerCase().includes(query.toLowerCase()))
      );
    } catch (error) {
      console.error('Erreur lors de la recherche de documents:', error);
      return [];
    }
  };

  const searchPeople = async (query) => {
    try {
      // Implémentation fictive - à adapter en fonction de votre API
      // Supposons qu'il y a une méthode pour obtenir les employés
      const employees = await hrService.getEmployees();
      return employees.filter(employee => 
        employee.attributes.firstName.toLowerCase().includes(query.toLowerCase()) ||
        employee.attributes.lastName.toLowerCase().includes(query.toLowerCase())
      );
    } catch (error) {
      console.error('Erreur lors de la recherche de personnes:', error);
      return [];
    }
  };

  // Effacer la recherche
  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
  };

  // Gérer les résultats de la recherche sélectionnés
  const handleResultPress = (item) => {
    switch (item.type) {
      case 'event':
        navigation.navigate('EventDetails', { event: item });
        break;
      case 'document':
        navigation.navigate('DocumentDetails', { document: item });
        break;
      case 'person':
        navigation.navigate('EmployeeProfile', { employee: item });
        break;
      default:
        console.warn('Type d\'élément non reconnu');
    }
  };

  // Rendu d'un résultat de recherche
  const renderSearchResult = ({ item }) => {
    if (item.type === 'event') {
      // Pour les événements, utilisons le composant EventCard
      return (
        <EventCard 
          event={item}
          onPress={() => handleResultPress(item)}
          compact={true}
          showActions={false}
        />
      );
    }

    // Pour les autres types de résultats
    return (
      <TouchableOpacity 
        style={styles.resultItem}
        onPress={() => handleResultPress(item)}
      >
        <View style={styles.resultIconContainer}>
          <Icon 
            name={item.type === 'document' ? 'document-text' : 'person'} 
            size={24} 
            color={COLORS.primary} 
          />
        </View>
        <View style={styles.resultContent}>
          <Text style={styles.resultTitle} numberOfLines={1}>
            {item.type === 'document' ? item.attributes.title : 
             `${item.attributes.firstName} ${item.attributes.lastName}`}
          </Text>
          <Text style={styles.resultSubtitle} numberOfLines={1}>
            {item.type === 'document' ? 
              (item.attributes.category || 'Document') : 
              (item.attributes.position || 'Employé')}
          </Text>
        </View>
        <Icon name="chevron-forward" size={20} color={COLORS.textSecondary} />
      </TouchableOpacity>
    );
  };

  // Rendu du message si aucun résultat
  const renderEmptyResults = () => {
    if (!hasSearched) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <Icon name="search-outline" size={60} color={COLORS.lightGray} />
        <Text style={styles.emptyText}>
          Aucun résultat trouvé pour "{searchQuery}"
        </Text>
        <Text style={styles.emptySuggestion}>
          Essayez avec d'autres mots-clés ou catégories
        </Text>
      </View>
    );
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* En-tête */}
          <View style={styles.header}>
            <Text style={styles.title}>Recherche</Text>
          </View>

          {/* Barre de recherche */}
          <View style={styles.searchContainer}>
            <Icon name="search" size={20} color={COLORS.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher..."
              placeholderTextColor={COLORS.darkGray}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
              autoCapitalize="none"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                <Icon name="close-circle" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Catégories de recherche */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryButton,
                  selectedCategory === category.id && styles.selectedCategory
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <Icon
                  name={category.icon}
                  size={18}
                  color={selectedCategory === category.id ? COLORS.white : COLORS.primary}
                />
                <Text
                  style={[
                    styles.categoryLabel,
                    selectedCategory === category.id && styles.selectedCategoryLabel
                  ]}
                >
                  {category.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Résultats de recherche */}
          {isLoading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loaderText}>Recherche en cours...</Text>
            </View>
          ) : (
            <FlatList
              data={searchResults}
              renderItem={renderSearchResult}
              keyExtractor={(item, index) => `${item.type}-${item.id || index}`}
              contentContainerStyle={styles.resultsList}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={renderEmptyResults}
            />
          )}
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    padding: SIZES.lg,
  },
  header: {
    marginBottom: SIZES.lg,
  },
  title: {
    ...FONTS.h1,
    color: COLORS.textPrimary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.md,
    paddingHorizontal: SIZES.md,
    marginBottom: SIZES.lg,
    ...NEUMORPHISM.light,
  },
  searchIcon: {
    marginRight: SIZES.sm,
  },
  searchInput: {
    flex: 1,
    height: 50,
    ...FONTS.body1,
    color: COLORS.textPrimary,
  },
  clearButton: {
    padding: SIZES.xs,
  },
  categoriesContainer: {
    flexDirection: 'row',
    marginBottom: SIZES.lg,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.md,
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.md,
    marginRight: SIZES.sm,
    ...NEUMORPHISM.light,
  },
  selectedCategory: {
    backgroundColor: COLORS.primary,
  },
  categoryLabel: {
    ...FONTS.body2,
    color: COLORS.textPrimary,
    marginLeft: SIZES.xs,
  },
  selectedCategoryLabel: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  resultsList: {
    flexGrow: 1,
    paddingBottom: SIZES.xl,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.md,
    padding: SIZES.md,
    marginBottom: SIZES.md,
    ...NEUMORPHISM.light,
  },
  resultIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.lightBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.md,
  },
  resultContent: {
    flex: 1,
  },
  resultTitle: {
    ...FONTS.h4,
    color: COLORS.textPrimary,
  },
  resultSubtitle: {
    ...FONTS.body2,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    ...FONTS.body1,
    color: COLORS.textSecondary,
    marginTop: SIZES.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SIZES.xxl,
  },
  emptyText: {
    ...FONTS.h3,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginTop: SIZES.lg,
    marginBottom: SIZES.sm,
  },
  emptySuggestion: {
    ...FONTS.body1,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});

export default SearchScreen;