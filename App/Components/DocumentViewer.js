// src/screens/documents/DocumentViewerScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Platform,
  Image
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS, FONTS, SIZES } from '../Shared/Theme';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as WebBrowser from 'expo-web-browser';
import { WebView } from 'react-native-webview';
import { API_URL } from '../Shared/strapiService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DocumentViewer = ({ route, navigation }) => {

  const { document, documentId } = route.params;
  const [currentDocument, setCurrentDocument] = useState(document);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [fileUrl, setFileUrl] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadDocument = async () => {
      try {
        setLoading(true);

        if (!document && documentId) {
          // Si nous n'avons que l'ID, récupérer le document
          const response = await fetch(`${API_URL}/api/docs/${documentId}?populate=file`);
          const data = await response.json();
          setCurrentDocument(data.data);
        }

        // Récupérer l'URL complète du fichier
        const documentToUse = document || currentDocument;
        if (documentToUse && documentToUse.file) {
          const baseUrl = API_URL || '';
          const filePath = typeof documentToUse.file === 'string'
            ? documentToUse.file
            : (documentToUse.file.url || documentToUse.fileUrl || '');

          const fullUrl = filePath.startsWith('http') ? filePath : `${baseUrl}${filePath}`;
          // console.log('Type de document détecté:', getDocumentType());
          // console.log('URL complète du fichier:', fullUrl);
          setFileUrl(fullUrl);
        } else {
          setError('Fichier non disponible');
        }
      } catch (error) {
        console.error('Erreur lors du chargement du document:', error);
        setError('Impossible de charger le document');
      } finally {
        setLoading(false);
      }
    };

    loadDocument();
  }, [document, documentId]);

  // Télécharger le document
  const downloadDocument = async () => {
    try {
      setDownloading(true);

      if (!fileUrl) {
        throw new Error('URL du fichier non disponible');
      }

      // Déterminer le nom du fichier
      const fileName = currentDocument.name || 'document';

      // Récupérer le token JWT pour l'autorisation
      const token = await AsyncStorage.getItem('jwt_token');

      // Créer le répertoire local si nécessaire
      const dirInfo = await FileSystem.getInfoAsync(FileSystem.documentDirectory + 'downloads');
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(FileSystem.documentDirectory + 'downloads');
      }

      // Chemin local pour le fichier téléchargé
      const localUri = `${FileSystem.documentDirectory}downloads/${fileName}`;

      // Télécharger le fichier
      const downloadResumable = FileSystem.createDownloadResumable(
        fileUrl,
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
    } catch (error) {
      console.error('Erreur lors du téléchargement du document:', error);
      Alert.alert('Erreur', 'Impossible de télécharger le document');
    } finally {
      setDownloading(false);
    }
  };

  // Ouvrir le document dans le navigateur
  const openInBrowser = async () => {
    try {
      if (!fileUrl) {
        throw new Error('URL du fichier non disponible');
      }

      await WebBrowser.openBrowserAsync(fileUrl);
    } catch (error) {
      console.error('Erreur lors de l\'ouverture du document dans le navigateur:', error);
      Alert.alert('Erreur', 'Impossible d\'ouvrir le document dans le navigateur');
    }
  };

  // Rendre le contenu du document selon son type
  const renderDocumentContent = () => {
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Chargement du document...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContainer}>
          <Icon name="alert-circle" size={64} color={COLORS.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      );
    }

    // Déterminer le type de document
    const documentType = getDocumentType();
    // console.log("fileUrl : ", fileUrl)
    // Pour les images, PDFs et autres formats supportés par WebView
    // Pour les images, utilisez le composant Image au lieu de WebView
    if (documentType === 'image') {
      return (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: fileUrl }}
            style={styles.imagePreview}
            resizeMode="contain"
          />
        </View>
      );
    // } else if (documentType === 'pdf') {
    //   // Utiliser WebView pour les PDFs
    //   // Using Google docs as a viewer proxy
    //   // const yourPdfURL="https://example/document.pdf"
    //   // <WebView
    //   //   source={{ uri: https://docs.google.com/gview?embedded=true&url=${yourPdfURL)} }}
    //   //   style={{ width:"100%",height:"100%"}}
    //   // />
    //   return (
    //     <WebView
    //       // source={{ uri: fileUrl }}
    //       // style={styles.webView}
    //       source={{ uri: `https://docs.google.com/gview?embedded=true&url=${fileUrl}` }}
    //       style={{ width:"100%",height:"100%"}}
    //       renderLoading={() => (
    //         <View style={styles.webViewLoading}>
    //           <ActivityIndicator size="large" color={COLORS.primary} />
    //         </View>
    //       )}
    //       startInLoadingState={true}
    //       originWhitelist={['*']}
    //       javaScriptEnabled={true}
    //       domStorageEnabled={true}
    //       scalesPageToFit={true}
    //     />
    //   );
    }

    // Pour les autres types de fichiers, afficher un message
    return (
      <View style={styles.centerContainer}>
        <Icon name="document" size={64} color={COLORS.primary} />
        <Text style={styles.messageText}>
          Ce type de document ne peut pas être prévisualisé directement.
        </Text>
        <Text style={styles.submessageText}>
          Utilisez les options ci-dessous pour télécharger ou ouvrir le document.
        </Text>
      </View>
    );
  };

  // Déterminer le type de document
  const getDocumentType = () => {
    if (!currentDocument || !fileUrl) return 'unknown';
    // console.log("currentDocument : ", currentDocument);
    // Vérifier d'abord le type MIME s'il est disponible
    if (currentDocument.file?.mime || currentDocument.mimeType) {
      const mimeType = currentDocument.file?.mime || currentDocument.mimeType;
      // console.log("mimeType : ", mimeType);
      if (mimeType.startsWith('image/')) return 'image';
      if (mimeType === 'application/pdf') return 'pdf';
      // autres types MIME...
    }

    // Fallback sur l'extension du fichier
    const fileName = currentDocument.name || fileUrl.split('/').pop() || '';
    const extension = fileName.split('.').pop().toLowerCase();
    // console.log("extension : ", extension);
    if (['pdf'].includes(extension)) return 'pdf';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(extension)) return 'image';
    if (['doc', 'docx'].includes(extension)) return 'word';
    if (['xls', 'xlsx'].includes(extension)) return 'excel';
    if (['ppt', 'pptx'].includes(extension)) return 'powerpoint';

    return 'other';
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>

        <View style={styles.titleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {currentDocument?.name || 'Document'}
          </Text>
          {currentDocument?.type && (
            <Text style={styles.documentType}>
              {currentDocument.type.toUpperCase()}
            </Text>
          )}
        </View>

        <TouchableOpacity style={styles.moreButton}>
          <Icon name="ellipsis-vertical" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.contentContainer}>
        {renderDocumentContent()}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.footerButton}
          onPress={downloadDocument}
          disabled={downloading || !fileUrl}
        >
          {downloading ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <>
              <Icon name="download" size={20} color={COLORS.white} />
              <Text style={styles.footerButtonText}>Télécharger</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.footerButton}
          onPress={openInBrowser}
          disabled={!fileUrl}
        >
          <Icon name="open" size={20} color={COLORS.white} />
          <Text style={styles.footerButtonText}>Ouvrir</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.footerButton}
          onPress={() => {
            // TODO: Fonctionnalité de partage
            Alert.alert('Info', 'Fonctionnalité de partage à venir');
          }}
        >
          <Icon name="share-social" size={20} color={COLORS.white} />
          <Text style={styles.footerButtonText}>Partager</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  pdfContainer: {
    flex: 1,
  },
  pdf: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  previewButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 16,
  },
  previewButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
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
  titleContainer: {
    flex: 1,
    marginHorizontal: SIZES.md,
  },
  headerTitle: {
    ...FONTS.h4,
    color: COLORS.white,
  },
  documentType: {
    ...FONTS.caption,
    color: COLORS.white + 'CC',
  },
  moreButton: {
    padding: SIZES.xs,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.xl,
  },
  loadingText: {
    ...FONTS.body1,
    color: COLORS.textSecondary,
    marginTop: SIZES.md,
  },
  errorText: {
    ...FONTS.body1,
    color: COLORS.error,
    marginTop: SIZES.md,
    textAlign: 'center',
  },
  messageText: {
    ...FONTS.body1,
    color: COLORS.textPrimary,
    marginTop: SIZES.md,
    textAlign: 'center',
  },
  submessageText: {
    ...FONTS.body2,
    color: COLORS.textSecondary,
    marginTop: SIZES.sm,
    textAlign: 'center',
  },
  webView: {
    flex: 1,
  },
  webViewLoading: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  footer: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingVertical: Platform.OS === 'ios' ? SIZES.xl : SIZES.md,
    paddingBottom: Platform.OS === 'ios' ? 34 : SIZES.md,
    justifyContent: 'space-around',
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerButtonText: {
    ...FONTS.body2,
    color: COLORS.white,
    marginLeft: SIZES.xs,
    fontWeight: '500',
  },
});

export default DocumentViewer;