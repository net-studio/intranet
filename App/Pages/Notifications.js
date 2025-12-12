// src/screens/NotificationsScreen.js
import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import notificationService from '../Shared/notificationService';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../Context/AuthContext';
import Menu from '../Components/Menu';
import WelcomeHeader from '../Components/WelcomeHeader';
import Colors from '../Shared/Colors';
import GlobalApi from '../Shared/GlobalApi';

/**
 * Écran de liste des notifications
 */
const Notifications = ({ navigation }) => {
  const { userData, setUserData } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const pageSize = 20;

  // Vérifier si l'utilisateur est connecté
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const documentId = userData.documentId; //await AsyncStorage.getItem('documentId');
        const isLogged = !!documentId;
        setIsLoggedIn(isLogged);
        // Si non connecté, rediriger vers l'écran de connexion
        if (!isLogged) {
          navigation.replace('home');
        }
      } catch (error) {
        console.error('Erreur lors de la vérification du statut de connexion:', error);
        setIsLoggedIn(false);
        navigation.replace('home');
      }
    };

    checkLoginStatus();
  }, [navigation]);

  // const firebaseConfig = {
  //   apiKey: "AIzaSyCM8PTl80T4EVTM1J8EttnGxRoGDyvjkrw",
  //   authDomain: "robine-intranet.firebaseapp.com",
  //   projectId: "robine-intranet",
  //   storageBucket: "robine-intranet.firebasestorage.app",
  //   messagingSenderId: "163697107056",
  //   appId: "1:163697107056:web:0e22b87484552bfd7654b5",
  //   measurementId: "G-59YJYKNSEF"
  // };
  // // Initialize Firebase
  // app.initializeApp(firebaseConfig);
  // const messaging = app.messaging();

  const fcmNotification = async () => {

    const token = 'fGtlhRLcO1WGL32J2OVDbA:APA91bGQQCfzR_fQL4s5TAUaBS2L6Xr8DmWQ8RXyiCpyI2LBvgJne-xKBWXhc6ciy5XIjOkUp63nuajiiwQhtek62BPeMNrMxpdLLVOGU3uamkrDA5xrIjY';
    const title = 'Test depuis l\'application';
    const body = 'Cette notification a été envoyée depuis l\'application';

    // Construire le message pour un seul appareil
    const message = {
      token,
      notification: {
        title,
        body,
      },
      data: {
        ...data,
        notificationId: String(data.notificationId || ""),
        createdAt: new Date().toISOString(),
      },
    };
    const messageId = await messaging.send(message);

  };

  // Fonction pour tester l'envoi de notifications
  const sendTestNotification = async () => {
    try {
      const documentId = await AsyncStorage.getItem('documentId');

      if (!documentId) {
        alert('Vous devez être connecté pour envoyer une notification');
        return;
      }

      // Obtenir l'ID du collaborateur
      const collaborateurResponse = await GlobalApi.filterCollaborateur(documentId.replace(/"/g, ''));
      const collaborateurs = collaborateurResponse.data.data;

      if (!collaborateurs || collaborateurs.length === 0) {
        alert('Collaborateur non trouvé');
        return;
      }

      const collaborateurId = collaborateurs[0].id;
      // const collaborateurId = collaborateurs[0].documentId.replace(/"/g, '');
      // const collaborateurId = documentId.replace(/"/g, '')

      // Envoyer une notification de test
      // const response = await api.post('/api/notifications/test', {
      //   collaborateurId,
      //   title: 'Test depuis l\'application',
      //   body: 'Cette notification a été envoyée depuis l\'application'
      // });
      const response = await GlobalApi.testNotification(
        {
          collaborateurId,
          data: {
            title: 'Test depuis l\'application',
            body: 'Cette notification a été envoyée depuis l\'application'
          },
        }
      );

      alert('Notification envoyée avec succès!');
      console.log('Résultat de l\'envoi:', response.data);
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la notification de test:', error);
      alert('Erreur lors de l\'envoi de la notification');
    }
  };

  // Fonction pour charger les notifications
  const loadNotifications = async (pageNum = 1, shouldRefresh = false) => {
    if (!isLoggedIn) return;

    if (shouldRefresh) {
      setRefreshing(true);
    } else if (pageNum === 1) {
      setLoading(true);
    }

    try {
      const result = await notificationService.getNotifications(pageNum, pageSize);

      // Mettre à jour l'état des notifications
      if (pageNum === 1) {
        setNotifications(result.data);
      } else {
        setNotifications(prev => [...prev, ...result.data]);
      }

      // Vérifier s'il y a plus de données à charger
      const { pagination } = result.meta;
      setHasMoreData(pagination.page < pagination.pageCount);

      // Mettre à jour le numéro de page
      setPage(pageNum);

      // Mettre à jour le badge de l'application
      await notificationService.updateBadgeCount();
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fonction pour gérer le pull-to-refresh
  const onRefresh = useCallback(() => {
    loadNotifications(1, true);
  }, [isLoggedIn]);

  // Fonction pour charger plus de notifications lors du défilement
  const loadMoreNotifications = () => {
    if (hasMoreData && !loading && !refreshing) {
      loadNotifications(page + 1);
    }
  };

  // Fonction pour marquer une notification comme lue
  const markAsRead = async (notification) => {
    if (!notification.read) {
      try {
        const success = await notificationService.markAsRead(notification.documentId);

        if (success) {
          // Mettre à jour l'état local
          setNotifications(prev =>
            prev.map(item =>
              item.id === notification.id
                ? { ...item, read: true }
                : item
            )
          );

          // Mettre à jour le badge de l'application
          await notificationService.updateBadgeCount();
        }
      } catch (error) {
        console.error('Erreur lors du marquage de la notification comme lue:', error);
      }
    }
  };

  // Fonction pour marquer toutes les notifications comme lues
  const markAllAsRead = async () => {
    try {
      const success = await notificationService.markAllAsRead();

      if (success) {
        // Mettre à jour l'état local
        setNotifications(prev =>
          prev.map(item => ({ ...item, read: true }))
        );

        // Mettre à jour le badge de l'application
        await notificationService.updateBadgeCount();
      }
    } catch (error) {
      console.error('Erreur lors du marquage de toutes les notifications comme lues:', error);
    }
  };

  // Fonction pour supprimer une notification
  const deleteNotification = async (notificationId) => {
    try {
      const success = await notificationService.deleteNotification(notificationId);

      if (success) {
        // Mettre à jour l'état local
        setNotifications(prev =>
          prev.filter(item => item.documentId !== notificationId)
        );

        // Mettre à jour le badge de l'application
        await notificationService.updateBadgeCount();
      }
    } catch (error) {
      console.error('Erreur lors de la suppression de la notification:', error);
    }
  };

  // Charger les notifications au montage et au focus de l'écran
  useFocusEffect(
    useCallback(() => {
      if (isLoggedIn) {
        loadNotifications(1);
      }
    }, [isLoggedIn])
  );

  // Rendu d'un élément de notification
  const renderNotificationItem = ({ item }) => {
    const formattedDate = formatDistanceToNow(new Date(item.createdAt), {
      addSuffix: true,
      locale: fr
    });

    return (
      <TouchableOpacity
        style={[styles.notificationItem, !item.read && styles.unreadItem]}
        onPress={() => {
          // Marquer comme lu
          markAsRead(item);

          // Gérer la navigation en fonction du type de notification
          if (item.data) {
            if (item.data.agendaId) {
              // Notification d'agenda → Info Équipe
              navigation.navigate('agenda');
            } else if (item.data.eventId) {
              // Notification d'event → Info Robine
              navigation.navigate('actualites');
            }
          }
        }}
      >
        <View style={styles.notificationContent}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.message}>{item.message}</Text>
          <Text style={styles.timeText}>{formattedDate}</Text>
        </View>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteNotification(item.documentId)}
        >
          <Ionicons name="trash-outline" size={20} color="#FF3B30" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  // Rendu du séparateur de liste
  const renderSeparator = () => <View style={styles.separator} />;

  // Rendu du footer de liste
  const renderFooter = () => {
    if (!hasMoreData) return null;

    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#007AFF" />
      </View>
    );
  };

  // Rendu lorsqu'il n'y a pas de notifications
  const renderEmptyComponent = () => {
    if (loading) return null;

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="notifications-off-outline" size={60} color="#CCCCCC" />
        <Text style={styles.emptyText}>Aucune notification</Text>
      </View>
    );
  };

  if (!isLoggedIn) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WelcomeHeader />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color={Colors.black} />
        </TouchableOpacity>
        {userData.documentId == 'ejj7ra6lycouw297dhbb34bb' ?
          <TouchableOpacity onPress={() => sendTestNotification()}>
            {/* <TouchableOpacity onPress={() => fcmNotification()}> */}
            <Text style={styles.testNotification}>Test FCM</Text>
          </TouchableOpacity>
          : null}
        <Text style={styles.headerTitle}>Notifications</Text>

        {notifications.length > 0 && (
          <TouchableOpacity onPress={markAllAsRead}>
            <Text style={styles.markAllButton}>Tout marquer comme lu</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        renderItem={renderNotificationItem}
        keyExtractor={item => item.id.toString()}
        ItemSeparatorComponent={renderSeparator}
        ListEmptyComponent={renderEmptyComponent}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#007AFF']}
          />
        }
        onEndReached={loadMoreNotifications}
        onEndReachedThreshold={0.5}
      />

      {loading && !refreshing && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      )}
      <Menu />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  header: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  testNotification: {
    backgroundColor: Colors.primary,
    color: Colors.white,
    paddingVertical: 3,
    paddingHorizontal: 12,
    borderRadius: 3
  },
  markAllButton: {
    color: '#007AFF',
    fontSize: 14,
  },
  notificationItem: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  unreadItem: {
    backgroundColor: '#F0F8FF',
  },
  notificationContent: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  timeText: {
    fontSize: 12,
    color: '#999999',
  },
  deleteButton: {
    justifyContent: 'center',
    paddingLeft: 16,
  },
  separator: {
    height: 1,
    backgroundColor: '#EEEEEE',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#999999',
    marginTop: 16,
  },
  loaderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});

export default Notifications;