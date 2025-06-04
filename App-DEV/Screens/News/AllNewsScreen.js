// src/screens/news/AllNewsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS, FONTS, SIZES, NEUMORPHISM } from '../../Shared/Theme';
import dataService from '../../Shared/dataService';

const AllNewsScreen = ({ navigation }) => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Chargement des actualités
  const loadNews = async (limit = 20) => {
    try {
      setError(null);
      const newsData = await dataService.fetchCompanyNews(limit);
      setNews(newsData);
    } catch (err) {
      console.error('Erreur lors du chargement des actualités:', err);
      setError('Impossible de charger les actualités. Veuillez réessayer.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Chargement initial
  useEffect(() => {
    loadNews();
  }, []);

  // Rafraîchissement
  const handleRefresh = () => {
    setRefreshing(true);
    loadNews();
  };

  // Formatage de la date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Rendu d'un élément d'actualité
  const renderNewsItem = ({ item }) => (
    <TouchableOpacity
      style={styles.newsCard}
      onPress={() => navigation.navigate('NewsDetail', { newsId: item.id })}
    >
      <View style={styles.newsContent}>
        {item.imageUrl && (
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.newsImage}
            resizeMode="cover"
          />
        )}
        <View style={styles.newsInfo}>
          <Text style={styles.newsTitle}>{item.title}</Text>
          {item.summary && <Text style={styles.newsSummary}>{item.summary}</Text>}
          <View style={styles.newsFooter}>
            <Text style={styles.newsDate}>{formatDate(item.publishedAt)}</Text>
            {item.author && (
              <Text style={styles.newsAuthor}>Par {item.author.name}</Text>
            )}
          </View>
        </View>
      </View>
      <Icon name="chevron-forward" size={20} color={COLORS.secondary} />
    </TouchableOpacity>
  );

  // Rendu quand la liste est vide
  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Icon name="newspaper-outline" size={60} color={COLORS.lightGray} />
      <Text style={styles.emptyText}>Aucune actualité disponible</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Actualités</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Chargement des actualités...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={60} color={COLORS.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setLoading(true);
              loadNews();
            }}
          >
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={news}
          renderItem={renderNewsItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={renderEmptyComponent}
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
    justifyContent: 'space-between',
    padding: SIZES.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  backButton: {
    padding: SIZES.xs,
  },
  headerTitle: {
    ...FONTS.h2,
    color: COLORS.textPrimary,
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
  listContainer: {
    padding: SIZES.lg,
  },
  newsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.md,
    marginBottom: SIZES.md,
    padding: SIZES.lg,
    ...NEUMORPHISM.light,
  },
  newsContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  newsImage: {
    width: 70,
    height: 70,
    borderRadius: SIZES.sm,
    marginRight: SIZES.md,
  },
  newsInfo: {
    flex: 1,
  },
  newsTitle: {
    ...FONTS.h4,
    color: COLORS.textPrimary,
    marginBottom: SIZES.xs,
  },
  newsSummary: {
    ...FONTS.body2,
    color: COLORS.textSecondary,
    marginBottom: SIZES.xs,
    lineHeight: 20,
  },
  newsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SIZES.xs,
  },
  newsDate: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
  },
  newsAuthor: {
    ...FONTS.caption,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.xxl,
  },
  emptyText: {
    ...FONTS.body1,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SIZES.md,
  },
});

export default AllNewsScreen;