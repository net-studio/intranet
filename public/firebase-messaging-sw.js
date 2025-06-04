// This file must be placed at the root of your web project (public folder)
// It's required for Firebase Cloud Messaging to work on web browsers

// Import and configure the Firebase SDK
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCM8PTl80T4EVTM1J8EttnGxRoGDyvjkrw",
  authDomain: "robine-intranet.firebaseapp.com",
  projectId: "robine-intranet",
  storageBucket: "robine-intranet.firebasestorage.app",
  messagingSenderId: "163697107056",
  appId: "1:163697107056:web:0e22b87484552bfd7654b5",
  measurementId: "G-59YJYKNSEF"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Garder une trace des notifications affichées pour éviter les doublons
const displayedNotifications = new Set();

// Fonction utilitaire pour créer un ID unique de notification
function createNotificationId(payload) {
  const timestamp = Date.now();
  const title = payload.notification?.title + ' FCM' || 'notification';
  const body = payload.notification?.body || '';
  return payload.notification?.tag || `${title}-${body.substring(0, 20)}-${timestamp}`;
}

// Fonction utilitaire pour afficher une notification
function showNotificationIfNotDuplicate(title, options, notificationId) {
  // Vérifier si cette notification a déjà été affichée
  if (displayedNotifications.has(notificationId)) {
    console.log('Notification déjà affichée, ignorée:', notificationId);
    return Promise.resolve();
  }

  // Ajouter à la liste des notifications affichées
  displayedNotifications.add(notificationId);

  // Nettoyer les anciens IDs (garder seulement les 50 derniers)
  if (displayedNotifications.size > 50) {
    const firstItem = displayedNotifications.values().next().value;
    displayedNotifications.delete(firstItem);
  }

  // Vérifier si une notification avec le même tag existe déjà
  return self.registration.getNotifications({ tag: notificationId }).then(notifications => {
    if (notifications.length === 0) {
      return self.registration.showNotification(title, options);
    } else {
      console.log('Notification avec ce tag existe déjà:', notificationId);
      return Promise.resolve();
    }
  });
}

// Background push notification handling
messaging.onBackgroundMessage((payload) => {
  console.log('Background message received:', payload);

  const notificationId = createNotificationId(payload);
  const notificationTitle = payload.notification?.title + ' SW BG' || 'Notification';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: payload.notification?.icon || '/logo192.png',
    badge: payload.notification?.badge || '/logo192.png',
    tag: notificationId,
    data: {
      ...payload.data,
      source: 'background',
      timestamp: Date.now()
    },
    requireInteraction: payload.notification?.requireInteraction || false,
    renotify: false,
    silent: payload.notification?.silent || false,
    actions: payload.notification?.actions || []
  };

  showNotificationIfNotDuplicate(notificationTitle, notificationOptions, notificationId);
});

// Écouter les messages de l'application principale pour les notifications foreground
self.addEventListener('message', (event) => {
  console.log('Message reçu dans le service worker:', event.data);

  if (event.data && event.data.type === 'FOREGROUND_NOTIFICATION') {
    const payload = event.data.payload;
    const notificationId = createNotificationId(payload);

    const notificationTitle = payload.notification?.title + ' SW FG' || 'Notification';
    const notificationOptions = {
      body: payload.notification?.body || '',
      icon: payload.notification?.icon || '/logo192.png',
      badge: payload.notification?.badge || '/logo192.png',
      tag: notificationId,
      data: {
        ...payload.data,
        source: 'foreground',
        timestamp: Date.now()
      },
      requireInteraction: payload.notification?.requireInteraction || false,
      renotify: false,
      silent: payload.notification?.silent || false,
      actions: payload.notification?.actions || []
    };

    // Vérifier si l'onglet est visible avant d'afficher la notification
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      let isTabVisible = false;

      windowClients.forEach(client => {
        if (client.visibilityState === 'visible' &&
          client.url.startsWith(self.location.origin)) {
          isTabVisible = true;
        }
      });

      // Afficher la notification même si l'onglet est visible (comportement personnalisable)
      // Vous pouvez modifier cette logique selon vos besoins
      if (event.data.forceShow || !isTabVisible) {
        showNotificationIfNotDuplicate(notificationTitle, notificationOptions, notificationId);
      } else {
        console.log('Onglet visible, notification foreground ignorée');
      }
    });
  }
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Notification click detected:', event);

  // Close the notification
  event.notification.close();

  // Supprimer de la liste des notifications affichées
  if (event.notification.tag) {
    displayedNotifications.delete(event.notification.tag);
  }

  const clickedNotification = event.notification;
  const notificationData = clickedNotification.data;

  // Déterminer l'URL à ouvrir en fonction des données de la notification
  let urlToOpen = self.location.origin;

  if (notificationData && notificationData.url) {
    urlToOpen = notificationData.url;
  } else if (notificationData && notificationData.path) {
    urlToOpen = new URL(notificationData.path, self.location.origin).href;
  }

  const promiseChain = clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  }).then((windowClients) => {
    let windowToFocus;

    // Chercher une fenêtre existante
    for (let i = 0; i < windowClients.length; i++) {
      const client = windowClients[i];
      if (client.url === urlToOpen || client.url.startsWith(self.location.origin)) {
        windowToFocus = client;
        break;
      }
    }

    if (!windowToFocus) {
      // Ouvrir une nouvelle fenêtre
      return clients.openWindow(urlToOpen).then((windowClient) => {
        if (windowClient) {
          // Attendre un peu que la fenêtre se charge avant d'envoyer le message
          setTimeout(() => {
            windowClient.postMessage({
              type: 'NOTIFICATION_CLICK',
              notification: {
                title: clickedNotification.title,
                body: clickedNotification.body,
                data: notificationData
              }
            });
          }, 1000);
        }
        return windowClient;
      });
    } else {
      // Focuser sur la fenêtre existante
      windowToFocus.focus();

      // Naviguer vers l'URL si différente
      if (windowToFocus.url !== urlToOpen && notificationData?.path) {
        windowToFocus.navigate(urlToOpen);
      }

      windowToFocus.postMessage({
        type: 'NOTIFICATION_CLICK',
        notification: {
          title: clickedNotification.title,
          body: clickedNotification.body,
          data: notificationData
        }
      });

      return windowToFocus;
    }
  });

  event.waitUntil(promiseChain);
});

// Gérer les actions des notifications (si vous en avez)
self.addEventListener('notificationclose', (event) => {
  console.log('Notification fermée:', event.notification.tag);

  if (event.notification.tag) {
    displayedNotifications.delete(event.notification.tag);
  }
});

// Nettoyer les anciennes notifications au démarrage
self.addEventListener('activate', (event) => {
  console.log('Service Worker activé');
  event.waitUntil(
    Promise.all([
      // Nettoyer les anciennes notifications
      self.registration.getNotifications().then(notifications => {
        console.log(`Nettoyage de ${notifications.length} anciennes notifications`);
        notifications.forEach(notification => notification.close());
      }),
      // Prendre le contrôle de toutes les pages
      self.clients.claim()
    ])
  );
});

// Installation du service worker
self.addEventListener('install', (event) => {
  console.log('Service Worker installé');
  // Forcer l'activation immédiate
  self.skipWaiting();
});