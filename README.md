# Sound Map App 🗺️🔊

A mobile application built with React Native (Expo) that allows users to record audio at specific locations and visualize these recordings on an interactive map.

## 🌟 Features (MVP)

* **Interactive Map**: View your current location and all recorded spots on a map.
* **Audio Recording**: Easily record ambient sound with a single tap.
* **Geolocation Tagging**: Every recording is automatically tagged with GPS coordinates.
* **Offline Persistence**: All data (recordings metadata and locations) is stored locally on the device using **SQLite**, ensuring data availability even without an internet connection.

## 🛠️ Tech Stack

* **Framework**: React Native (via Expo SDK 49+)
* **Language**: TypeScript
* **Maps**: `react-native-maps`
* **Location**: `expo-location`
* **Audio**: `expo-av`
* **Database**: `expo-sqlite` (for local data persistence)

## 🚀 Getting Started

Follow these steps to run the project locally on your machine.

### Prerequisites

* **Node.js** (LTS version recommended)
* **Expo CLI**: Install globally via `npm install -g expo-cli`
* **Expo Go App**: Installed on your physical iOS or Android device.

### Installation

1. **Clone the repository**:

2. **Install dependencies**:

    ```bash
    npm install
    # or if you use yarn:
    # yarn install
    ```

3. **Start the development server**:

    ```bash
    npx expo start
    ```

4. **Run on device**:
    * Scan the QR code displayed in the terminal with the **Expo Go** app on your phone.
    * Allow permissions for Location and Microphone when prompted.

## 📱 Usage

1. Open the app and wait for the map to load your current location (blue dot).
2. Tap the **"RECORD 🎙️"** button at the bottom to start recording audio.
3. Tap **"STOP 🛑"** to finish.
4. A red marker 📍 will appear on the map at the location where the recording finished.
5. Restart the app to verify that your markers are persistently saved!

## 🔮 Future Roadmap

* [ ] **Audio Playback**: Ability to play back recorded sounds directly from the map.
* [ ] **Decibel Analysis**: Analyze recorded audio to extract average dB levels.
* [ ] **Sound Classification**: Use ML (e.g., TensorFlow Lite) to classify sounds (traffic, nature, speech).
* [ ] **Heatmap Visualization**: Show noise pollution levels using heatmaps instead of individual pins.
* [ ] **Cloud Sync**: Optional backup of recordings to a remote server (e.g., Firebase).

