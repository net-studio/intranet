// Firebase Cloud Messaging Configuration File.
// Read more at https://firebase.google.com/docs/cloud-messaging/js/client && https://firebase.google.com/docs/cloud-messaging/js/receive

import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
    apiKey: "AIzaSyCM8PTl80T4EVTM1J8EttnGxRoGDyvjkrw",
    authDomain: "robine-intranet.firebaseapp.com",
    projectId: "robine-intranet",
    storageBucket: "robine-intranet.firebasestorage.app",
    messagingSenderId: "163697107056",
    appId: "1:163697107056:web:0e22b87484552bfd7654b5",
    measurementId: "G-59YJYKNSEF"
};

initializeApp(firebaseConfig);

const messaging = getMessaging();

export const requestForToken = () => {
    // The method getToken(): Promise<string> allows FCM to use the VAPID key credential
    // when sending message requests to different push services
    return getToken(messaging, { vapidKey: `BNaMdZ_77dwgy2T6Oiciuxpt-HjXPLYE_cyoQ67I-fGqcVNo7xehTXoX7nxkHF-jfFU1bU0_zSkId-a-mDihFD8` }) //to authorize send requests to supported web push services
        .then((currentToken) => {
            if (currentToken) {
                console.log('current token for client: ', currentToken);

                if (localStorage.getItem('fcmToken') && currentToken !== localStorage.getItem('fcmToken')) {
                    localStorage.setItem('fcmToken', currentToken);
                } else if (!localStorage.getItem('fcmToken')) {
                    localStorage.setItem('fcmToken', currentToken);
                }
            } else {
                console.log('No registration token available. Request permission to generate one.');
            }
        })
        .catch((err) => {
            console.log('An error occurred while retrieving token. ', err);
        });
};

// Handle incoming messages. Called when:
// - a message is received while the app has focus
export const onMessageListener = () =>
    new Promise((resolve) => {
        onMessage(messaging, (payload) => {
            console.log("onMessageListener : ", payload.messageId);
            resolve(payload);
        });
    });
