// src/screens/notifications/NotificationsScreen.js
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
import useNotifications from '../../Hooks/useNotifications';

// Composants
import NotificationItem from '../../Components/Notifications/NotificationItem';

const NotificationsScreen = ({ navigation }) => {
  const { 
    notifications, 
    loading, 
    fetchNotifications, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
  } = useNotifications();
  
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState('all'); // 'all' ou 'unread'

  // Charger les notifications au montage du composant
  useEffect(() => {
    loadNotifications();
  }, []);

  // Charger les notifications
  const loadNotifications = async (unreadOnly = false) => {
    try {
      setRefreshing(true);
      await fetchNotifications(unreadOnly);
    } finally {
      setRefreshing(false);
    }
  };

  // Filtrer les notifications selon l'onglet sélectionné
  const getFilteredNotifications = () => {
    if (selectedTab === 'unread') {
      return notifications.filter(notification => !notification.read);
    }
    return notifications;
  };

  // Gérer le clic sur une notification
  const handleNotificationPress = async (notification) => {
    // Marquer comme lue si pas déjà fait
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    
    // Naviguer vers l'écran approprié selon le type
    navigateToTarget(notification);
  };

  // Naviguer vers la cible d'une notification
  const navigateToTarget = (notification) => {
    const { type, data } = notification;
    
    switch (type) {
      case 'message':
        if (data?.conversationId) {
          navigation.navigate('ChatRoom', { conversationId: data.conversationId });
        }
        break;
      case 'document':
        if (data?.documentId) {
          navigation.navigate('DocumentViewer', { documentId: data.documentId });
        }
        break;
      case 'event':
        if (data?.eventId) {
          navigation.navigate('EventDetails', { eventId: data.eventId });
        }
        break;
      case 'news':
        if (data?.newsId) {
          navigation.navigate('NewsDetail', { newsId: data.newsId });
        }
        break;
      default:
        // Si pas de cible spécifique, rester sur l'écran des notifications
        break;
    }
  };

  // Gérer le marquage de toutes les notifications comme lues
  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      // Rafraîchir la liste
      loadNotifications();
    } catch (error) {
      console.error('Erreur lors du marquage de toutes les notifications comme lues:', error);
      Alert.alert('Erreur', 'Impossible de marquer les notifications comme lues');
    }
  };

  // Gérer la suppression d'une notification
  const handleDeleteNotification = async (notificationId) => {
    try {
      await deleteNotification(notificationId);
    } catch (error) {
      console.error('Erreur lors de la suppression de la notification:', error);
      Alert.alert('Erreur', 'Impossible de supprimer la notification');
    }
  };

  // Rendu d'un élément de notification
  const renderNotificationItem = ({ item }) => (
    <NotificationItem
      notification={item}
      onPress={() => handleNotificationPress(item)}
      onDelete={() => handleDeleteNotification(item.id)}
    />
  );

  // Rendu de l'en-tête avec onglets
  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.titleRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={COLORS.secondary} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Notifications</Text>
        
        <TouchableOpacity 
          style={styles.markAllButton}
          onPress={handleMarkAllAsRead}
          disabled={loading || notifications.every(n => n.read)}
        >
          <Text style={styles.markAllText}>Tout lire</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'all' && styles.activeTab]}
          onPress={() => {
            setSelectedTab('all');
            loadNotifications(false);
          }}
        >
          <Text style={[styles.tabText, selectedTab === 'all' && styles.activeTabText]}>
            Toutes
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'unread' && styles.activeTab]}
          onPress={() => {
            setSelectedTab('unread');
            loadNotifications(true);
          }}
        >
          <Text style={[styles.tabText, selectedTab === 'unread' && styles.activeTabText]}>
            Non lues
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {renderHeader()}
      
      <FlatList
        data={getFilteredNotifications()}
        renderItem={renderNotificationItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.notificationsList}
        refreshing={refreshing}
        onRefresh={() => loadNotifications(selectedTab === 'unread')}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon 
              name="notifications-off" 
              size={64} 
              color={COLORS.lightGray} 
            />
            <Text style={styles.emptyText}>
              {selectedTab === 'unread' 
                ? 'Aucune notification non lue'
                : 'Aucune notification'
              }
            </Text>
          </View>
        }
        ListFooterComponent={
          loading && !refreshing ? (
            <ActivityIndicator 
              size="small" 
              color={COLORS.primary} 
              style={styles.loadingFooter} 
            />
          ) : null
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.white,
    paddingTop: SIZES.md,
    paddingBottom: SIZES.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.lg,
    marginBottom: SIZES.md,
  },
  backButton: {
    padding: SIZES.xs,
  },
  headerTitle: {
    ...FONTS.h3,
    color: COLORS.textPrimary,
  },
  markAllButton: {
    padding: SIZES.xs,
  },
  markAllText: {
    ...FONTS.body2,
    color: COLORS.primary,
    fontWeight: '500',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: SIZES.lg,
  },
  tab: {
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.md,
    marginRight: SIZES.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    ...FONTS.body2,
    color: COLORS.textSecondary,
  },
  activeTabText: {
    ...FONTS.body2,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  notificationsList: {
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.md,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.xxl,
  },
  emptyText: {
    ...FONTS.body1,
    color: COLORS.textSecondary,
    marginTop: SIZES.lg,
  },
  loadingFooter: {
    paddingVertical: SIZES.lg,
  },
});

export default NotificationsScreen;