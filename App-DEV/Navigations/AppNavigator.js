// src/navigation/AppNavigator.js
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar, Platform, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../Shared/Theme';

// Services
import { authService } from '../Shared/strapiService';
import { useNotificationsSetup } from '../Shared/firebaseService';

// Écrans d'authentification
import LoginScreen from '../Auth/LoginScreen';
import RegisterScreen from '../Auth/RegisterScreen';
import ForgotPasswordScreen from '../Auth/ForgotPasswordScreen';

// Écrans principaux
import DashboardScreen from '../Screens/Dashboard/DashboardScreen';
import MessagingScreen from '../Screens/Messaging/MessagingScreen';
import ChatRoomScreen from '../Screens/Messaging/ChatRoomScreen';
import NewMessageScreen from '../Screens/Messaging/NewMessageScreen';
import DocumentManagementScreen from '../Screens/Documents/DocumentManagementScreen';
import DocumentViewerScreen from '../Screens/Documents/DocumentViewerScreen';
import CalendarScreen from '../Screens/Calendar/CalendarScreen';
import CreateEventScreen from '../Screens/Calendar/CreateEventScreen';
import EventDetailsScreen from '../Screens/Calendar/EventDetailsScreen';
import HRScreen from '../Screens/HR/HRScreen';
import SalarySlipsScreen from '../Screens/HR/SalarySlipsScreen';
import LeaveRequestsScreen from '../Screens/HR/LeaveRequestsScreen';
import HRPoliciesScreen from '../Screens/HR/HRPoliciesScreen';
import ProfileScreen from '../Screens/Profile/ProfileScreen';
import NotificationsScreen from '../Screens/Notifications/NotificationsScreen';
import SearchScreen from '../Screens/Search/SearchScreen';
import SettingsScreen from '../Screens/Settings/SettingsScreen';
import AllNewsScreen from '../Screens/News/AllNewsScreen';
import NewsDetailScreen from '../Screens/News/NewsDetailScreen';

// Créer les navigateurs
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Référence pour la navigation (utilisée par les services)
const navigationRef = React.createRef();

// Navigateur d'authentification
const AuthNavigator = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
    }}
  >
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
  </Stack.Navigator>
);

// Navigateur d'onglets principal
const MainTabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: COLORS.primary,
      tabBarInactiveTintColor: COLORS.darkGray,
      tabBarStyle: {
        backgroundColor: COLORS.white,
        borderTopColor: COLORS.lightGray,
        height: Platform.OS === 'ios' ? 90 : 60,
        paddingBottom: Platform.OS === 'ios' ? 30 : 10,
      },
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;

        if (route.name === 'DashboardTab') {
          iconName = focused ? 'home' : 'home-outline';
        } else if (route.name === 'Profile') {
          iconName = focused ? 'person' : 'person-outline';
        } else if (route.name === 'MessagingTab') {
          iconName = focused ? 'chatbubble' : 'chatbubble-outline';
        } else if (route.name === 'DocumentsTab') {
          iconName = focused ? 'document-text' : 'document-text-outline';
        } else if (route.name === 'CalendarTab') {
          iconName = focused ? 'calendar' : 'calendar-outline';
        } else if (route.name === 'HRTab') {
          iconName = focused ? 'briefcase' : 'briefcase-outline';
        } else if (route.name === 'Settings') {
          iconName = focused ? 'settings' : 'settings-outline';
        }

        return <Icon name={iconName} size={size} color={color} />;
      },
    })}
  >
    <Tab.Screen
      name="DashboardTab"
      component={DashboardScreen}
      options={{ tabBarLabel: 'Accueil' }}
    />
    <Tab.Screen
      name="Profile"
      component={ProfileScreen}
      options={{ tabBarLabel: 'Profil' }}
    />
    <Tab.Screen
      name="MessagingTab"
      component={MessagingScreen}
      options={{ tabBarLabel: 'Messages' }}
    />
    <Tab.Screen
      name="DocumentsTab"
      component={DocumentManagementScreen}
      options={{ tabBarLabel: 'Documents' }}
    />
    <Tab.Screen
      name="CalendarTab"
      component={CalendarScreen}
      options={{ tabBarLabel: 'Agenda' }}
    />
    <Tab.Screen
      name="HRTab"
      component={HRScreen}
      options={{ tabBarLabel: 'RH' }}
    />
    <Tab.Screen
      name="Settings"
      component={SettingsScreen}
      options={{ tabBarLabel: 'Config' }}
    />
  </Tab.Navigator>
);

// Navigateur principal de l'application
const AppNavigator = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Configuration des notifications push
  useNotificationsSetup();

  // Vérifier l'état d'authentification au démarrage
  useEffect(() => {
    // const checkAuth = async () => {
    //   const auth = await authService.isAuthenticated();
    //   setIsAuthenticated(auth);
    //   setIsLoading(false);
    // };
    const checkAuth = async () => {
      const auth = await authService.isAuthenticated();
      if (isAuthenticated !== auth) {
        setIsAuthenticated(auth);
      }
      setIsLoading(false);
    };

    checkAuth();

    // Sur le web, vérifier l'authentification toutes les secondes
    // Sur mobile, vérifier moins fréquemment pour optimiser la batterie
    const interval = Platform.OS === 'web'
      ? setInterval(checkAuth, 1000)
      : setInterval(checkAuth, 5000);

    return () => clearInterval(interval);

    // S'abonner aux événements de déconnexion
    const unsubscribe = authService.onLogout(() => {
      setIsAuthenticated(false);
    });

    // Nettoyer l'abonnement lors du démontage
    return unsubscribe;
  }, [isAuthenticated]);

  // Afficher un écran de chargement pendant la vérification
  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background }}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {isAuthenticated ? (
          <>
            {/* Écrans principaux */}
            <Stack.Screen name="Main" component={MainTabNavigator} />
            <Stack.Screen name="ChatRoom" component={ChatRoomScreen} />
            <Stack.Screen name="NewMessage" component={NewMessageScreen} />
            <Stack.Screen name="DocumentViewer" component={DocumentViewerScreen} />
            <Stack.Screen name="EventDetails" component={EventDetailsScreen} />
            <Stack.Screen name="CreateEvent" component={CreateEventScreen} />
            <Stack.Screen name="SalarySlips" component={SalarySlipsScreen} />
            <Stack.Screen name="LeaveRequests" component={LeaveRequestsScreen} />
            <Stack.Screen name="HRPolicies" component={HRPoliciesScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="Search" component={SearchScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="AllNews" component={AllNewsScreen} />
            <Stack.Screen name="NewsDetail" component={NewsDetailScreen} />
          </>
        ) : (
          // Écrans d'authentification
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

// Exporter la référence pour la navigation
export { navigationRef };

export default AppNavigator;