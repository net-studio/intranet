import React, { useState, useEffect, useContext, useCallback } from 'react';
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
import Menu from '../Components/Menu';
import WelcomeHeader from '../Components/WelcomeHeader';
import Colors from '../Shared/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { documentService } from '../Shared/strapiService';
import GlobalApi from '../Shared/GlobalApi'
import { AuthContext } from '../Context/AuthContext'
import { useNavigation } from '@react-navigation/native';

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
        <Icon name={getDocumentIcon()} size={28} color={Colors.primary} />
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

      <Icon name="chevron-forward" size={20} color={Colors.darkGray} />
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

export default function Docs() {

  const navigation = useNavigation();
  const { userData, setUserData } = useContext(AuthContext);
  const [documents, setDocuments] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [categories, setCategories] = useState([
    { id: 'all', name: 'Tous' },
    { id: 'pdf', name: 'PDF' },
    { id: 'doc', name: 'Word' },
    { id: 'xls', name: 'Excel' },
    { id: 'ppt', name: 'Présentations' },
    { id: 'img', name: 'Images' },
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
  
      // ÉTAPE 1: Télécharger le fichier
      const formData = new FormData();
      
      // Préparer le fichier selon la plateforme
      if (Platform.OS === 'web' && uploadInfo.file.file) {
        // Version web
        formData.append('files', uploadInfo.file.file);
      } else {
        // Version mobile
        formData.append('files', {
          uri: uploadInfo.file.uri,
          name: uploadInfo.file.name,
          type: uploadInfo.file.mimeType || 'application/octet-stream'
        });
      }
      
      // Télécharger le fichier
      const uploadResponse = await fetch(`${GlobalApi.API_URL}/api/upload`, {
        method: 'POST',
        headers: {
          "Authorization": "Bearer 99d2e241bb7ba3fba491061b820abeb2e2650afba3b407ed131a082bbe2da469550e49a0cfe830d3848b0c61da6f364f67b5b6dfe8bd05921e493402c5f584a7cd5f9fc3ecc5cb4063f6fc2504fda48072652354856b542230995295d7665b19db4cf0b58dc09162eb8e269d7957c5d19eb11a4a9ffba6ec04a8fc48787132bc"
        },
        body: formData
      });
  
      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.text();
        throw new Error(`Erreur d'upload: ${errorData}`);
      }
  
      // Récupérer les infos du fichier téléchargé
      const uploadedFiles = await uploadResponse.json();
      // console.log('Fichier téléchargé:', uploadedFiles);
      
      if (!uploadedFiles || uploadedFiles.length === 0) {
        throw new Error('Aucun fichier téléchargé');
      }
      // console.log("uploadInfo : ", uploadInfo);
      // ÉTAPE 2: Créer une entrée dans la collection "Docs"
      const docData = {
        data: {
          // title: uploadInfo.title,
          description: uploadInfo.description || '',
          type: uploadInfo.category || '',
          // type: uploadInfo.file.mimeType,
          name: uploadInfo.file.name,
          // Référencer le fichier téléchargé
          file: uploadedFiles[0].id,
          collaborateur: userData.documentId
        }
      };
      
      // Créer l'entrée dans la collection Docs
      const docResponse = await fetch(`${GlobalApi.API_URL}/api/docs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          "Authorization": "Bearer 99d2e241bb7ba3fba491061b820abeb2e2650afba3b407ed131a082bbe2da469550e49a0cfe830d3848b0c61da6f364f67b5b6dfe8bd05921e493402c5f584a7cd5f9fc3ecc5cb4063f6fc2504fda48072652354856b542230995295d7665b19db4cf0b58dc09162eb8e269d7957c5d19eb11a4a9ffba6ec04a8fc48787132bc"
        },
        body: JSON.stringify(docData)
      });
      
      if (!docResponse.ok) {
        const errorData = await docResponse.text();
        throw new Error(`Erreur de création de document: ${errorData}`);
      }
      
      const createdDoc = await docResponse.json();
      // console.log('Document créé:', createdDoc);
  
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
      Alert.alert('Erreur', `Impossible de téléverser le document: ${error.message}`);
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
              <Icon name="close" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {uploadInfo.file && (
            <View style={styles.filePreview}>
              <Icon name="document" size={32} color={Colors.primary} />
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
              placeholderTextColor={Colors.darkGray}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={uploadInfo.description}
              onChangeText={(text) => setUploadInfo(prev => ({ ...prev, description: text }))}
              placeholder="Entrez une description (optionnel)"
              placeholderTextColor={Colors.darkGray}
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
                <ActivityIndicator size="small" color={Colors.white} />
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
        <Icon name="document-outline" size={64} color={Colors.lightGray} />
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
        <Icon name="alert-circle" size={36} color={Colors.error} />
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

  return (
    <View style={styles.main}>
      <WelcomeHeader />
      <View>
        <View style={styles.container}>
          {/* En-tête */}
          <View style={styles.header}>
            <Text style={styles.title}>Documents</Text>
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={pickDocument}
            >
              <Icon name="add" size={24} color={Colors.white} />
            </TouchableOpacity>
          </View>

          {/* Barre de recherche */}
          <View style={styles.searchContainer}>
            <Icon name="search" size={20} color={Colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher un document..."
              placeholderTextColor={Colors.darkGray}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                style={styles.clearButton}
              >
                <Icon name="close-circle" size={20} color={Colors.textSecondary} />
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
                  colors={[Colors.primary]}
                  tintColor={Colors.primary}
                />
              }
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.2}
              ListFooterComponent={
                isLoading && !isRefreshing && documents.length > 0 ? (
                  <ActivityIndicator
                    size="small"
                    color={Colors.primary}
                    style={styles.loadMoreSpinner}
                  />
                ) : null
              }
            />
          )}
        </View>

        {/* Modal de téléversement */}
        {renderUploadModal()}

      </View>
      <View style={styles.footer}>
        <Menu />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontFamily: 'System',
    fontWeight: '700',
    fontSize: 32,
    color: Colors.textPrimary,
  },
  uploadButton: {
    backgroundColor: Colors.primary,
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontFamily: 'System',
    fontWeight: '400',
    fontSize: 16,
    color: Colors.textPrimary,
  },
  clearButton: {
    padding: 8,
  },
  categoriesContainer: {
    marginBottom: 20,
  },
  categoriesList: {
    paddingRight: 16,
  },
  categoryButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.white,
    borderRadius: 8,
    marginRight: 12,
  },
  selectedCategoryButton: {
    backgroundColor: Colors.primary,
  },
  categoryButtonText: {
    fontFamily: 'System',
    fontWeight: '400',
    fontSize: 12,
    color: Colors.textPrimary,
  },
  selectedCategoryButtonText: {
    color: Colors.white,
    fontWeight: 'bold',
  },
  documentsList: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  documentIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: Colors.bgColor,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  documentInfo: {
    flex: 1,
  },
  documentTitle: {
    fontFamily: 'System',
    fontWeight: '600',
    fontSize: 20,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  documentMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  documentType: {
    fontFamily: 'System',
    fontWeight: '400',
    fontSize: 12,
    color: Colors.textSecondary,
  },
  documentDate: {
    fontFamily: 'System',
    fontWeight: '600',
    fontSize: 8,
    color: Colors.textSecondary,
  },
  loadMoreSpinner: {
    marginVertical: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontFamily: 'System',
    fontWeight: '400',
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 16,
  },
  uploadEmptyButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 16,
  },
  uploadEmptyButtonText: {
    fontFamily: 'System',
    fontWeight: '400',
    fontSize: 16,
    color: Colors.white,
    fontWeight: 'bold',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontFamily: 'System',
    fontWeight: '400',
    fontSize: 16,
    color: Colors.error,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    fontFamily: 'System',
    fontWeight: '400',
    fontSize: 16,
    color: Colors.white,
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
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontFamily: 'System',
    fontWeight: '600',
    fontSize: 24,
    color: Colors.textPrimary,
  },
  modalCloseButton: {
    padding: 8,
  },
  filePreview: {
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 16,
    backgroundColor: Colors.lightBackground,
    borderRadius: 8,
  },
  fileName: {
    fontFamily: 'System',
    fontWeight: '400',
    fontSize: 16,
    color: Colors.textPrimary,
    marginTop: 12,
    marginBottom: 4,
  },
  fileSize: {
    fontFamily: 'System',
    fontWeight: '400',
    fontSize: 12,
    color: Colors.textSecondary,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontFamily: 'System',
    fontWeight: '400',
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  input: {
    backgroundColor: Colors.lightBackground,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: 'System',
    fontWeight: '400',
    fontSize: 16,
    color: Colors.textPrimary,
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  categoryPickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  categoryPicker: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: Colors.lightBackground,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedCategoryPicker: {
    backgroundColor: Colors.primary,
  },
  categoryPickerText: {
    fontFamily: 'System',
    fontWeight: '400',
    fontSize: 12,
    color: Colors.textPrimary,
  },
  selectedCategoryPickerText: {
    color: Colors.white,
  },
  progressContainer: {
    marginVertical: 16,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: Colors.lightGray,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progress: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  progressText: {
    fontFamily: 'System',
    fontWeight: '400',
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.lightGray,
    marginRight: 12,
  },
  cancelButtonText: {
    fontFamily: 'System',
    fontWeight: '400',
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: 'bold',
  },
  uploadButton: {
    backgroundColor: Colors.primary,
  },
  uploadButtonText: {
    fontFamily: 'System',
    fontWeight: '400',
    fontSize: 16,
    color: Colors.white,
    fontWeight: 'bold',
  },
  footer: {
    flex: 1,
    justifyContent: 'flex-end'
  },
  main: {
    flex: 1,
  }
})