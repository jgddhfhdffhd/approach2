# ✈️ APPROACH – Global Airport Navigation App

APPROACH is a cross-platform mobile application that helps users locate, explore, and navigate to airports around the world. Built with <React Native + Firebase>, the app supports real-time comments, photo sharing, social features, and offline-friendly navigation.

---

## 📱 Features

- 🌍 Global Airport Map – Browse worldwide airports using Leaflet in WebView
- 📍 Nearest Airport Navigation – IP-based location + OSRM routing + compass guidance
- 💬 Comment System – Leave comments with images, timestamps, and avatars
- 📷 Photo Upload – Take or select photos and save them to personal Flight Album
- 🧑‍🤝‍🧑 Friends & Chat – Add friends, accept requests, and chat in real time
- 👤 Profile Edit – Change nickname and avatar (support camera/gallery/album)
- ☁️ Firebase Integration – Auth, Firestore, Storage, and real-time listeners

---

## 🚀 Installation

> This project was developed using <Expo SDK 52> and <React Native 0.76>.

1. Clone the repository:
git clone https://github.com/jgddhfhdffhd/approach2.git
cd approach2

2. Install dependencies:
npm install

3. Start the app:
npx expo start

This app uses Firebase and external APIs. Make sure to have a valid internet connection and replace all API placeholders with your own.

API Configuration:
All sensitive API keys have been removed for security.

Please manually replace the following placeholders in the code before running:
#YOUR_RAPIDAPI_KEY

These appear in files such as:
AirportDetail.tsx – for AbstractAPI time zone
MapScreen.tsx / NearestAirportScreen.tsx – for aviation data
firebase.ts – for Firebase config

4. Build APK：
Install EAS CLI (if not installed):
npm install -g eas-cli

Log into your Expo account:
eas login

Build the APK:
eas build -p android --profile preview

Notes：
Tested on physical Android devices and make sure to replace all placeholder API keys with your own before deployment


