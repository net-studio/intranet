// src/screens/documents/DocumentManagementScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  Platform,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, FONTS, SIZES, NEUMORPHISM } from '../../Shared/Theme';
import { API_URL, documentService } from '../../Shared/strapiService';

// Composant pour afficher un document dans la liste
const DocumentItem = ({ document, onPress, onLongPress }) => {
  // Déterminer l'icône en fonction du type de document
  const getDocumentIcon = () => {
    if (!document.type) return 'document-outline';
    
    const type = document.type.toLowerCase();
    if (type.includes('pdf')) return 'document-text-outline';
    if (type.includes('word') || type.includes('doc')) return 'document-outline';
    if (type.includes('excel') || type.includes('sheet') || type.includes('csv')) return 'grid-outline';
    if (type.includes('presentation') || type.includes('powerpoint')) return 'easel-outline';
    if (type.includes('image') || type.includes('photo')) return 'image-outline';
    
    return 'document-outline';
  };

  // Formater la date du document
  const formatDate = (dateString) => {
    if (!dateString) return 'Date inconnue';
    
    const date = new Date(dateString);
    return date.toLocaleDateString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <TouchableOpacity
      style={styles.documentItem}
      onPress={() => onPress(document)}
      onLongPress={() => onLongPress(document)}
      activeOpacity={0.8}
    >
      <View style={styles.documentIconContainer}>
        <Icon name={getDocumentIcon()} size={28} color={COLORS.primary} />
      </View>
      
      <View style={styles.documentInfo}>
        <Text style={styles.documentTitle} numberOfLines={1}>
          {document.title || document.name || 'Document sans titre'}
        </Text>
        
        <View style={styles.documentMetaRow}>
          <Text style={styles.documentType}>
            {document.type || 'Document'}
          </Text>
          <Text style={styles.documentDate}>
            {formatDate(document.updatedAt || document.createdAt)}
          </Text>
        </View>
      </View>
      
      <Icon name="chevron-forward" size={20} color={COLORS.darkGray} />
    </TouchableOpacity>
  );
};

// Composant pour afficher les catégories de documents
const CategoryFilter = ({ categories, selectedCategory, onCategoryPress }) => {
  return (
    <View style={styles.categoriesContainer}>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={categories}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.categoryButton,
              selectedCategory === item.id && styles.selectedCategoryButton
            ]}
            onPress={() => onCategoryPress(item.id)}
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
};

// Écran principal de gestion des documents
const DocumentManagementScreen = ({ navigation }) => {
  const [documents, setDocuments] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [categories, setCategories] = useState([
    { id: 'all', name: 'Tous' },
    { id: 'pdf', name: 'PDF' },
    { id: 'word', name: 'Word' },
    { id: 'excel', name: 'Excel' },
    { id: 'presentation', name: 'Présentations' },
    { id: 'image', name: 'Images' },
    { id: 'other', name: 'Autres' }
  ]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMoreDocuments, setHasMoreDocuments] = useState(true);
  const [error, setError] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadInfo, setUploadInfo] = useState({
    title: '',
    description: '',
    category: '',
    file: null
  });

  // Récupérer la liste des documents
  const fetchDocuments = useCallback(async (pageNumber = 1, refresh = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
        setPage(1);
      } else if (pageNumber === 1) {
        setIsLoading(true);
      }
      
      setError(null);
      
      const response = await documentService.getDocuments(pageNumber);
      const formattedDocuments = response.map(doc => ({
        id: doc.id,
        title: doc.title,
        name: doc.name,
        description: doc.description,
        type: doc.type,
        fileUrl: doc.file?.url,
        size: doc.file?.size,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
        category: doc.category,
        file: doc.file
      }));
      
      if (refresh || pageNumber === 1) {
        setDocuments(formattedDocuments);
      } else {
        setDocuments(prev => [...prev, ...formattedDocuments]);
      }
      
      setHasMoreDocuments(formattedDocuments.length === 20); // Si on récupère moins de 20 documents, c'est qu'on a atteint la fin
    } catch (error) {
      console.error('Erreur lors de la récupération des documents:', error);
      setError('Impossible de charger les documents. Veuillez réessayer plus tard.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Filtrer les documents en fonction de la catégorie et de la recherche
  useEffect(() => {
    let filtered = [...documents];
    
    // Filtrage par catégorie
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(doc => {
        const type = (doc.type || '').toLowerCase();
        return type.includes(selectedCategory.toLowerCase());
      });
    }
    
    // Filtrage par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(doc => {
        const title = (doc.title || '').toLowerCase();
        const name = (doc.name || '').toLowerCase();
        const description = (doc.description || '').toLowerCase();
        
        return title.includes(query) || name.includes(query) || description.includes(query);
      });
    }
    
    setFilteredDocuments(filtered);
  }, [documents, selectedCategory, searchQuery]);

  // Charger les documents au démarrage
  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Rafraîchir la liste des documents
  const handleRefresh = () => {
    fetchDocuments(1, true);
  };

  // Charger plus de documents
  const handleLoadMore = () => {
    if (!isLoading && hasMoreDocuments) {
      fetchDocuments(page + 1);
      setPage(prev => prev + 1);
    }
  };

  // Afficher les détails d'un document
  const handleDocumentPress = (document) => {
    navigation.navigate('DocumentViewer', { document });
  };

  // Gérer l'appui long sur un document
  const handleDocumentLongPress = (document) => {
    Alert.alert(
      'Options du document',
      `Que souhaitez-vous faire avec "${document.title || document.name || 'ce document'}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Partager', 
          onPress: () => {
            // Fonctionnalité de partage à implémenter
            Alert.alert('Info', 'Fonctionnalité de partage à venir');
          }
        },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => confirmDeleteDocument(document)
        }
      ]
    );
  };

  // Confirmer la suppression d'un document
  const confirmDeleteDocument = (document) => {
    Alert.alert(
      'Confirmer la suppression',
      'Êtes-vous sûr de vouloir supprimer ce document ? Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive',
          onPress: () => deleteDocument(document.id)
        }
      ]
    );
  };

  // Supprimer un document
  const deleteDocument = async (documentId) => {
    try {
      setIsLoading(true);
      
      // Fonction à implémenter dans le service
      // await documentService.deleteDocument(documentId);
      
      // Mettre à jour la liste des documents
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      Alert.alert('Succès', 'Document supprimé avec succès');
    } catch (error) {
      console.error('Erreur lors de la suppression du document:', error);
      Alert.alert('Erreur', 'Impossible de supprimer le document');
    } finally {
      setIsLoading(false);
    }
  };

  // Sélectionner un fichier à téléverser
  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true
      });
      
      if (result.canceled) {
        return;
      }
      
      const file = result.assets[0];
      
      setUploadInfo(prev => ({
        ...prev,
        title: file.name.split('.')[0],
        file: file,
        type: file.mimeType
      }));
      
      setShowUploadModal(true);
    } catch (error) {
      console.error('Erreur lors de la sélection du document:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner le document');
    }
  };

  // Téléverser un document
  const uploadDocument = async () => {
    if (!uploadInfo.file) {
      Alert.alert('Erreur', 'Veuillez sélectionner un fichier');
      return;
    }
    
    if (!uploadInfo.title.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir un titre pour le document');
      return;
    }
    
    try {
      setIsUploading(true);
      setUploadProgress(0);
      
      const formData = new FormData();
      formData.append('files', {
        uri: uploadInfo.file.uri,
        name: uploadInfo.file.name,
        type: uploadInfo.file.mimeType
      });
      
      formData.append('data', JSON.stringify({
        title: uploadInfo.title,
        description: uploadInfo.description,
        category: uploadInfo.category
      }));
      
      // Récupérer le token d'authentification
      const token = await AsyncStorage.getItem('jwt_token');
      
      // Configurer la requête
      const uploadConfig = {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: formData
      };
      
      // Téléverser le fichier
      const response = await fetch(`${API_URL}/api/upload`, uploadConfig);
      
      if (!response.ok) {
        throw new Error('Erreur lors du téléversement');
      }
      
      const responseData = await response.json();
      
      // Mettre à jour la liste des documents
      handleRefresh();
      
      // Fermer le modal
      setShowUploadModal(false);
      setUploadInfo({
        title: '',
        description: '',
        category: '',
        file: null
      });
      
      Alert.alert('Succès', 'Document téléversé avec succès');
    } catch (error) {
      console.error('Erreur lors du téléversement du document:', error);
      Alert.alert('Erreur', 'Impossible de téléverser le document');
    } finally {
      setIsUploading(false);
    }
  };

  // Rendu du modal de téléversement
  const renderUploadModal = () => (
    <Modal
      visible={showUploadModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowUploadModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Téléverser un document</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowUploadModal(false)}
            >
              <Icon name="close" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>
          
          {uploadInfo.file && (
            <View style={styles.filePreview}>
              <Icon name="document" size={32} color={COLORS.primary} />
              <Text style={styles.fileName} numberOfLines={1}>
                {uploadInfo.file.name}
              </Text>
              <Text style={styles.fileSize}>
                {Math.round(uploadInfo.file.size / 1024)} Ko
              </Text>
            </View>
          )}
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Titre*</Text>
            <TextInput
              style={styles.input}
              value={uploadInfo.title}
              onChangeText={(text) => setUploadInfo(prev => ({ ...prev, title: text }))}
              placeholder="Entrez un titre pour le document"
              placeholderTextColor={COLORS.darkGray}
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={uploadInfo.description}
              onChangeText={(text) => setUploadInfo(prev => ({ ...prev, description: text }))}
              placeholder="Entrez une description (optionnel)"
              placeholderTextColor={COLORS.darkGray}
              multiline={true}
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Catégorie</Text>
            <View style={styles.categoryPickerContainer}>
              {categories.filter(cat => cat.id !== 'all').map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryPicker,
                    uploadInfo.category === category.id && styles.selectedCategoryPicker
                  ]}
                  onPress={() => setUploadInfo(prev => ({ ...prev, category: category.id }))}
                >
                  <Text
                    style={[
                      styles.categoryPickerText,
                      uploadInfo.category === category.id && styles.selectedCategoryPickerText
                    ]}
                  >
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          {isUploading && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[styles.progress, { width: `${uploadProgress}%` }]}
                />
              </View>
              <Text style={styles.progressText}>{uploadProgress}%</Text>
            </View>
          )}
          
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowUploadModal(false)}
              disabled={isUploading}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modalButton, styles.uploadButton]}
              onPress={uploadDocument}
              disabled={isUploading || !uploadInfo.title.trim() || !uploadInfo.file}
            >
              {isUploading ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Text style={styles.uploadButtonText}>Téléverser</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Rendu des résultats vides
  const renderEmptyComponent = () => {
    if (isLoading && page === 1) return null;
    
    const message = searchQuery
      ? `Aucun document ne correspond à la recherche "${searchQuery}"`
      : selectedCategory !== 'all'
        ? `Aucun document dans la catégorie "${categories.find(c => c.id === selectedCategory)?.name}"`
        : 'Aucun document disponible';
        
    return (
      <View style={styles.emptyContainer}>
        <Icon name="document-outline" size={64} color={COLORS.lightGray} />
        <Text style={styles.emptyText}>{message}</Text>
        {!searchQuery && (
          <TouchableOpacity
            style={styles.uploadEmptyButton}
            onPress={pickDocument}
          >
            <Text style={styles.uploadEmptyButtonText}>Téléverser un document</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Rendu du message d'erreur
  const renderError = () => {
    if (!error) return null;
    
    return (
      <View style={styles.errorContainer}>
        <Icon name="alert-circle" size={36} color={COLORS.error} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={handleRefresh}
        >
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Rendu du composant principal
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* En-tête */}
        <View style={styles.header}>
          <Text style={styles.title}>Documents</Text>
          <TouchableOpacity 
            style={styles.uploadButton}
            onPress={pickDocument}
          >
            <Icon name="add" size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        {/* Barre de recherche */}
        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color={COLORS.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un document..."
            placeholderTextColor={COLORS.darkGray}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              onPress={() => setSearchQuery('')}
              style={styles.clearButton}
            >
              <Icon name="close-circle" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filtres par catégorie */}
        <CategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryPress={setSelectedCategory}
        />

        {/* Liste des documents */}
        {error ? (
          renderError()
        ) : (
          <FlatList
            data={filteredDocuments}
            renderItem={({ item }) => (
              <DocumentItem
                document={item}
                onPress={handleDocumentPress}
                onLongPress={handleDocumentLongPress}
              />
            )}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.documentsList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={renderEmptyComponent}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                colors={[COLORS.primary]}
                tintColor={COLORS.primary}
              />
            }
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.2}
            ListFooterComponent={
              isLoading && !isRefreshing && documents.length > 0 ? (
                <ActivityIndicator 
                  size="small" 
                  color={COLORS.primary}
                  style={styles.loadMoreSpinner}
                />
              ) : null
            }
          />
        )}
      </View>

      {/* Modal de téléversement */}
      {renderUploadModal()}
    </SafeAreaView>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.lg,
  },
  title: {
    ...FONTS.h1,
    color: COLORS.textPrimary,
  },
  uploadButton: {
    backgroundColor: COLORS.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    ...NEUMORPHISM.light,
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
    marginBottom: SIZES.lg,
  },
  categoriesList: {
    paddingRight: SIZES.md,
  },
  categoryButton: {
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.md,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.md,
    marginRight: SIZES.sm,
    ...NEUMORPHISM.light,
  },
  selectedCategoryButton: {
    backgroundColor: COLORS.primary,
  },
  categoryButtonText: {
    ...FONTS.body2,
    color: COLORS.textPrimary,
  },
  selectedCategoryButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  documentsList: {
    flexGrow: 1,
    paddingBottom: SIZES.xl,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.md,
    padding: SIZES.md,
    marginBottom: SIZES.md,
    ...NEUMORPHISM.light,
  },
  documentIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.lightBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.md,
  },
  documentInfo: {
    flex: 1,
  },
  documentTitle: {
    ...FONTS.h4,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  documentMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  documentType: {
    ...FONTS.body2,
    color: COLORS.textSecondary,
  },
  documentDate: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
  },
  loadMoreSpinner: {
    marginVertical: SIZES.lg,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SIZES.xxl,
  },
  emptyText: {
    ...FONTS.body1,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SIZES.lg,
    marginBottom: SIZES.md,
  },
  uploadEmptyButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.lg,
    borderRadius: SIZES.md,
    marginTop: SIZES.md,
  },
  uploadEmptyButtonText: {
    ...FONTS.body1,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.xl,
  },
  errorText: {
    ...FONTS.body1,
    color: COLORS.error,
    textAlign: 'center',
    marginTop: SIZES.md,
    marginBottom: SIZES.lg,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.lg,
    borderRadius: SIZES.md,
  },
  retryButtonText: {
    ...FONTS.body1,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  // Styles pour le modal de téléversement
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.md,
    padding: SIZES.lg,
    ...NEUMORPHISM.medium,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.lg,
  },
  modalTitle: {
    ...FONTS.h3,
    color: COLORS.textPrimary,
  },
  modalCloseButton: {
    padding: SIZES.xs,
  },
  filePreview: {
    alignItems: 'center',
    paddingVertical: SIZES.md,
    marginBottom: SIZES.md,
    backgroundColor: COLORS.lightBackground,
    borderRadius: SIZES.md,
  },
  fileName: {
    ...FONTS.body1,
    color: COLORS.textPrimary,
    marginTop: SIZES.sm,
    marginBottom: 4,
  },
  fileSize: {
    ...FONTS.body2,
    color: COLORS.textSecondary,
  },
  inputContainer: {
    marginBottom: SIZES.md,
  },
  inputLabel: {
    ...FONTS.body2,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  input: {
    backgroundColor: COLORS.lightBackground,
    borderRadius: SIZES.sm,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    ...FONTS.body1,
    color: COLORS.textPrimary,
  },
  textArea: {
    height: 100,
    paddingTop: SIZES.sm,
  },
  categoryPickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: SIZES.xs,
  },
  categoryPicker: {
    paddingVertical: SIZES.xs,
    paddingHorizontal: SIZES.sm,
    borderRadius: SIZES.sm,
    backgroundColor: COLORS.lightBackground,
    marginRight: SIZES.xs,
    marginBottom: SIZES.xs,
  },
  selectedCategoryPicker: {
    backgroundColor: COLORS.primary,
  },
  categoryPickerText: {
    ...FONTS.body2,
    color: COLORS.textPrimary,
  },
  selectedCategoryPickerText: {
    color: COLORS.white,
  },
  progressContainer: {
    marginVertical: SIZES.md,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: COLORS.lightGray,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progress: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  progressText: {
    ...FONTS.body2,
    color: COLORS.textSecondary,
    marginTop: SIZES.xs,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SIZES.md,
  },
  modalButton: {
    flex: 1,
    paddingVertical: SIZES.md,
    borderRadius: SIZES.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.lightGray,
    marginRight: SIZES.sm,
  },
  cancelButtonText: {
    ...FONTS.body1,
    color: COLORS.textPrimary,
    fontWeight: 'bold',
  },
  uploadButton: {
    backgroundColor: COLORS.primary,
  },
  uploadButtonText: {
    ...FONTS.body1,
    color: COLORS.white,
    fontWeight: 'bold',
  }
});

export default DocumentManagementScreen;