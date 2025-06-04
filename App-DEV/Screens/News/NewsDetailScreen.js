// src/screens/news/NewsDetailScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS, FONTS, SIZES, NEUMORPHISM } from '../../Shared/Theme';
import dataService from '../../Shared/dataService';
import Markdown from 'react-native-markdown-display';

const NewsDetailScreen = ({ route, navigation }) => {
  const { newsId } = route.params;
  const [newsItem, setNewsItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Chargement des détails de l'actualité
  useEffect(() => {
    const fetchNewsDetail = async () => {
      try {
        setLoading(true);
        setError(null);

        // Récupérer toutes les actualités
        const allNews = await dataService.fetchCompanyNews(100);
        // Trouver l'actualité correspondante par ID
        const newsDetail = allNews.find(news => news.id === newsId);

        if (newsDetail) {
          setNewsItem(newsDetail);
        } else {
          setError('Actualité non trouvée.');
        }
      } catch (err) {
        console.error('Erreur lors du chargement des détails de l\'actualité:', err);
        setError('Impossible de charger les détails de l\'actualité. Veuillez réessayer.');
      } finally {
        setLoading(false);
      }
    };

    fetchNewsDetail();
  }, [newsId]);

  // Formatage de la date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Partage de l'actualité
  const shareNews = async () => {
    if (!newsItem) return;

    try {
      await Share.share({
        message: `${newsItem.title} - ${newsItem.summary || ''}`,
        title: newsItem.title,
      });
    } catch (error) {
      console.error('Erreur lors du partage:', error);
    }
  };

  // Options de style pour le markdown
  const markdownStyles = {
    body: {
      ...FONTS.body1,
      color: COLORS.textPrimary,
      lineHeight: 24,
    },
    heading1: {
      ...FONTS.h2,
      color: COLORS.textPrimary,
      marginTop: SIZES.lg,
      marginBottom: SIZES.md,
    },
    heading2: {
      ...FONTS.h3,
      color: COLORS.textPrimary,
      marginTop: SIZES.lg,
      marginBottom: SIZES.md,
    },
    heading3: {
      ...FONTS.h4,
      color: COLORS.textPrimary,
      marginTop: SIZES.md,
      marginBottom: SIZES.sm,
    },
    paragraph: {
      ...FONTS.body1,
      color: COLORS.textPrimary,
      marginBottom: SIZES.md,
      lineHeight: 24,
    },
    link: {
      color: COLORS.primary,
      textDecorationLine: 'underline',
    },
    blockquote: {
      borderLeftWidth: 4,
      borderLeftColor: COLORS.secondary,
      paddingLeft: SIZES.md,
      opacity: 0.8,
    },
    image: {
      marginVertical: SIZES.md,
      borderRadius: SIZES.sm,
    },
    list_item: {
      marginBottom: SIZES.xs,
    },
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* En-tête */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.shareButton} onPress={shareNews}>
          <Icon name="share-outline" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Chargement de l'actualité...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={60} color={COLORS.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.retryButtonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      ) : (
        newsItem && (
          <ScrollView
            style={styles.container}
            showsVerticalScrollIndicator={false}
          >
            {/* Image principale */}
            {newsItem.imageUrl && (
              <Image
                source={{ uri: newsItem.imageUrl }}
                style={styles.heroImage}
                resizeMode="cover"
              />
            )}

            {/* Contenu de l'actualité */}
            <View style={styles.contentContainer}>
              {/* Titre et méta-informations */}
              <Text style={styles.title}>{newsItem.title}</Text>
              <View style={styles.metaContainer}>
                <Text style={styles.date}>{formatDate(newsItem.publishedAt)}</Text>
                {newsItem.author && (
                  <Text style={styles.author}>Par {newsItem.author.name}</Text>
                )}
              </View>

              {/* Résumé */}
              {newsItem.summary && (
                <View style={styles.summaryContainer}>
                  <Text style={styles.summary}>{newsItem.summary}</Text>
                </View>
              )}

              {/* Contenu principal */}
              <View style={styles.mainContent}>
                <Markdown style={markdownStyles}>
                  {newsItem.content}
                </Markdown>
              </View>

              {/* Bouton de partage en bas */}
              <TouchableOpacity
                style={styles.shareNewsButton}
                onPress={shareNews}
              >
                <Icon name="share-social-outline" size={20} color={COLORS.white} />
                <Text style={styles.shareNewsButtonText}>Partager cette actualité</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  backButton: {
    padding: SIZES.xs,
  },
  shareButton: {
    padding: SIZES.xs,
  },
  container: {
    flex: 1,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.xl,
  },
  errorText: {
    ...FONTS.body1,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SIZES.md,
    marginBottom: SIZES.lg,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.lg,
    borderRadius: SIZES.md,
    ...NEUMORPHISM.light,
  },
  retryButtonText: {
    ...FONTS.body1,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  heroImage: {
    width: '100%',
    height: 200,
  },
  contentContainer: {
    padding: SIZES.lg,
  },
  title: {
    ...FONTS.h1,
    color: COLORS.textPrimary,
    marginBottom: SIZES.md,
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SIZES.lg,
  },
  date: {
    ...FONTS.body2,
    color: COLORS.textSecondary,
  },
  author: {
    ...FONTS.body2,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  summaryContainer: {
    backgroundColor: COLORS.lightGray,
    borderRadius: SIZES.sm,
    padding: SIZES.md,
    marginBottom: SIZES.lg,
  },
  summary: {
    ...FONTS.body1,
    fontStyle: 'italic',
    color: COLORS.textPrimary,
  },
  mainContent: {
    marginBottom: SIZES.xl,
  },
  shareNewsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.sm,
    paddingVertical: SIZES.md,
    paddingHorizontal: SIZES.lg,
    marginVertical: SIZES.lg,
    ...NEUMORPHISM.medium,
  },
  shareNewsButtonText: {
    ...FONTS.body1,
    color: COLORS.white,
    fontWeight: 'bold',
    marginLeft: SIZES.sm,
  },
});

export default NewsDetailScreen;