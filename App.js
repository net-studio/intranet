// `@expo/metro-runtime` MUST be the first import to ensure Fast Refresh works on web.
import '@expo/metro-runtime';
import { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Platform, Dimensions, StyleSheet, View } from 'react-native';
import { AuthContext } from './App/Context/AuthContext';
import Services from './App/Shared/Services';
import Login from './App/Pages/Login';
import { NavigationContainer } from '@react-navigation/native';
import HomeNavigation from './App/Navigations/HomeNavigation';
// import { requestForToken, onMessageListener } from './App/Shared/Firebase';
import unifiedNotificationService from './App/Shared/unifiedNotificationService';

export default function AppIni() {

  // requestForToken();

  // onMessageListener()
  //   .then((payload) => {
  //     ServiceWorkerRegistration.showNotification(
  //       payload?.notification?.title,
  //       {
  //         body: payload?.notification?.body,
  //         icon: './assets/logo192.png'
  //       }
  //     );
  //   })
  //   .catch((err) => console.log('failed: ', err));

  const [screenDimensions, setScreenDimensions] = useState({ height: "100%", width: "100%" })
  const { height: screenHeight, width: screenWidth } = screenDimensions
  const [userData, setUserData] = useState();

  useEffect(() => {
    // Initialiser les services de notification
    unifiedNotificationService.initialize().then(success => {
      if (success) {
        console.log('Notifications initialized successfully');
        // unifiedNotificationService.registerForPushNotifications(); // initialize() gère déjà l'enregistrement du token pour le web
      } else {
        console.warn('Failed to initialize notifications');
      }
    });

    // // Configurer les écouteurs de notification
    // const unsubscribe = unifiedNotificationService.setupNotificationListeners(
    //   (notification) => {
    //     console.log('Notification received:', notification);
    //     // Vous pouvez ajouter une logique supplémentaire ici
    //   },
    //   (response) => {
    //     console.log('Notification response:', response);
    //     // Logique pour gérer les clics sur les notifications
    //   }
    // );

    // Récupérer les données utilisateur
    Services.getUserAuth().then(resp => {
      if (resp) {
        setUserData(resp);
      } else {
        setUserData(null);
      }
    })

    // return undefined;

    // Nettoyer les écouteurs lors du démontage
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [])

  return (
    <View style={{ height: screenHeight, width: screenWidth, overflow: "hidden", alignItems: 'center', flex: 1, backgroundColor: '#eee' }}>
      <View style={styles.container}>
        <AuthContext.Provider value={{ userData, setUserData }}>
          {userData ?
            <NavigationContainer>
              <HomeNavigation />
            </NavigationContainer>
            : <Login />}
        </AuthContext.Provider>
        <StatusBar style="auto" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    flex: 1,
    maxWidth: 450,
    ...Platform.select({
      ios: {
        width: Dimensions.get('screen').width,
      },
      android: {
        width: Dimensions.get('screen').width,
      },
      default: {
        width: Dimensions.get('window').width,
      },
    }),
  },
});
