export default {
  "name": "robine-app",
  "slug": "robine-app",
  "version": "1.0.0",
  "orientation": "portrait",
  "icon": "./assets/icon.png",
  "userInterfaceStyle": "automatic",
  "newArchEnabled": true,
  "splash": {
    "image": "./assets/splash-icon.png",
    "resizeMode": "contain",
    "backgroundColor": "#ffffff"
  },
  "notification": {
    "icon": "./assets/logo192.png",
    "color": "#ffffff",
    "androidMode": "default",
    "androidCollapsedTitle": "Robine Intranet"
  },
  "ios": {
    "supportsTablet": true
  },
  "android": {
    "adaptiveIcon": {
      "foregroundImage": "./assets/adaptive-icon.png",
      "backgroundColor": "#ffffff"
    }
  },
  "web": {
    "favicon": "./assets/favicon.png",
    "notification": {
      "icon": "./assets/logo192.png",
      "color": "#ffffff",
      "androidMode": "default",
      "androidCollapsedTitle": "Robine Intranet",
      "vapidPublicKey": "BNaMdZ_77dwgy2T6Oiciuxpt-HjXPLYE_cyoQ67I-fGqcVNo7xehTXoX7nxkHF-jfFU1bU0_zSkId-a-mDihFD8"
    }
  },
  "plugins": [
    "expo-font",
    [
      'expo-notifications',
      {
        vapidPublicKey: "BNaMdZ_77dwgy2T6Oiciuxpt-HjXPLYE_cyoQ67I-fGqcVNo7xehTXoX7nxkHF-jfFU1bU0_zSkId-a-mDihFD8",
        icon: './assets/logo192.png',
        color: '#FF0000',
      },
    ],
  ]
};