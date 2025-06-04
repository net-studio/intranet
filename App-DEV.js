// App.js
// `@expo/metro-runtime` MUST be the first import to ensure Fast Refresh works on web.
import '@expo/metro-runtime';
import React, { useEffect, useState } from 'react';
import { StatusBar, LogBox, View, Text, Platform, Dimensions } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './App/Navigations/AppNavigator';
import { registerForPushNotifications } from './App/Shared/firebaseService';
import { COLORS } from './App/Shared/Theme';

// Ignorer certains avertissements non critiques
LogBox.ignoreLogs([
  'VirtualizedLists should never be nested',
  'Non-serializable values were found in the navigation state',
]);

// Configuration pour rendre la navigation disponible globalement
global.navigationRef = {
  navigate: (name, params) => {
    if (navigationRef.current) {
      navigationRef.current.navigate(name, params);
    }
  },
  goBack: () => {
    if (navigationRef.current) {
      navigationRef.current.goBack();
    }
  },
};

// Composant wrapper responsif qui limite la largeur sur le web
const ResponsiveWrapper = ({ children }) => {
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);

  // Mettre à jour la largeur de l'écran lors des changements de dimensions
  useEffect(() => {
    const updateLayout = () => {
      setScreenWidth(Dimensions.get('window').width);
    };

    Dimensions.addEventListener('change', updateLayout);
    return () => {
      // Nettoyer l'écouteur d'événement lors du démontage du composant
      // Pour les versions plus récentes de React Native, utilisez:
      // Dimensions.removeEventListener('change', updateLayout);
      
      // Note: pour les versions très récentes de React Native (0.65+), cette API a changé
      if (Dimensions.removeEventListener) {
        Dimensions.removeEventListener('change', updateLayout);
      }
    };
  }, []);

  // Vérifier si nous sommes sur le web
  const isWeb = Platform.OS === 'web';

  // Style pour le conteneur principal
  const containerStyle = {
    flex: 1,
    // Sur le web, nous centrons le contenu et limitons la largeur à 450px
    ...(isWeb && {
      alignSelf: 'center',
      maxWidth: 450,
      width: '100%',
      // Ajouter une ombre pour bien délimiter le contenu sur les grands écrans
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 5,
      // Pour les navigateurs qui supportent les styles CSS
      // @ts-ignore
      boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.1)',
      // Sur les écrans vraiment grands, ajouter une bordure
      ...(screenWidth > 500 && {
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderColor: '#e0e0e0',
      }),
    }),
  };

  return <View style={containerStyle}>{children}</View>;
};

const App = () => {
  // Enregistrer l'appareil pour les notifications au démarrage
  useEffect(() => {
    const setupNotifications = async () => {
      await registerForPushNotifications();
    };
    
    setupNotifications().catch(err => {
      console.error('Erreur lors de la configuration des notifications:', err);
    });
  }, []);
  
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ResponsiveWrapper>
        <AppNavigator />
      </ResponsiveWrapper>
    </SafeAreaProvider>
  );
};

export default App;