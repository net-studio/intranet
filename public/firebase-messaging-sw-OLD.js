// Import the functions you need from the SDKs you need
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-analytics-compat.js');

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
firebase.initializeApp({
  apiKey: "AIzaSyCM8PTl80T4EVTM1J8EttnGxRoGDyvjkrw",
  authDomain: "robine-intranet.firebaseapp.com",
  projectId: "robine-intranet",
  storageBucket: "robine-intranet.firebasestorage.app",
  messagingSenderId: "163697107056",
  appId: "1:163697107056:web:0e22b87484552bfd7654b5",
  measurementId: "G-59YJYKNSEF"
});


// Initialize Firebase
const messaging = firebase.messaging();

let pushToken;
messaging.getToken(messaging, { vapidKey: "BNaMdZ_77dwgy2T6Oiciuxpt-HjXPLYE_cyoQ67I-fGqcVNo7xehTXoX7nxkHF-jfFU1bU0_zSkId-a-mDihFD8" })
.then((currentToken) => {
    if (currentToken) {
        console.log("SW FCM token> ", currentToken);
        pushToken = currentToken;
    } else {
        console.log("SW No Token available");
    }
})
.catch((error) => {
    console.log("SW An error ocurred while retrieving token. ", error);
});

messaging.onBackgroundMessage((payload) => {
console.log(
    '[firebase-messaging-sw.js] Received background message ',
    payload
);
// Customize notification here
// const notificationTitle = 'Robine Intranet';
// const notificationOptions = {
//     // body: 'Background Message body.',
//     icon: 'https://robine-app.net-studio.fr/logo192.png',
// };

// self.registration.showNotification(notificationTitle, notificationOptions);
});