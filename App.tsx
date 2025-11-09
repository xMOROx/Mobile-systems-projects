import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { Audio } from 'expo-av';
import * as SQLite from 'expo-sqlite';

interface RecordingEntry {
  id: number;
  uri: string;
  latitude: number;
  longitude: number;
  timestamp: number;
}

const db = SQLite.openDatabaseSync('soundmap.db');

export default function App() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [recording, setRecording] = useState<Audio.Recording | undefined>(undefined);
  const [recordingsList, setRecordingsList] = useState<RecordingEntry[]>([]);

  useEffect(() => {
    db.withTransactionSync(() => {
      db.execSync(
        'CREATE TABLE IF NOT EXISTS recordings (id INTEGER PRIMARY KEY AUTOINCREMENT, uri TEXT, latitude REAL, longitude REAL, timestamp INTEGER);'
      );
    });

    fetchRecordings();

    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }
      try {
        let currentLocation = await Location.getCurrentPositionAsync({});
        setLocation(currentLocation);
      } catch (error) {
        setErrorMsg('Could not fetch location. Please check GPS.');
      }
    })();
  }, []);

  const fetchRecordings = () => {
    try {
      const recordings = db.getAllSync<RecordingEntry>('SELECT * FROM recordings');
      setRecordingsList(recordings);
    } catch (error) {
      console.error('Error fetching recordings:', error);
    }
  };

  const saveRecordingToDB = (uri: string, loc: Location.LocationObject) => {
    db.withTransactionSync(() => {
      try {
        const result = db.runSync(
          'INSERT INTO recordings (uri, latitude, longitude, timestamp) values (?, ?, ?, ?)',
          [uri, loc.coords.latitude, loc.coords.longitude, Date.now()]
        );
        console.log('Recording saved to DB with ID:', result.lastInsertRowId);
        fetchRecordings();
      } catch (error) {
        console.error('Error saving recording:', error);
        throw error;
      }
    });
  };

  async function startRecording() {
    try {
      if (!location) {
        Alert.alert("Wait for location", "Please wait until your location is determined.");
        return;
      }
      console.log('Requesting permissions..');
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      console.log('Starting recording..');
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(newRecording);
      console.log('Recording started');
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  }

  async function stopRecording() {
    if (!recording) return;

    console.log('Stopping recording..');
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(undefined);

      console.log('Recording stopped and stored at', uri);

      if (location && uri) {
        saveRecordingToDB(uri, location);
      }
    } catch (error) {
      console.error('Error stopping recording', error);
    }
  }

  let mapContent = (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#0000ff" />
      <Text style={{ marginTop: 10 }}>{errorMsg ? errorMsg : 'Loading map...'}</Text>
    </View>
  );

  if (location) {
    const initialRegion: Region = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };

    mapContent = (
      <MapView
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={true}
      >
        {recordingsList.map((rec) => (
          <Marker
            key={rec.id}
            coordinate={{ latitude: rec.latitude, longitude: rec.longitude }}
            title={`Recording #${rec.id}`}
            description={`Time: ${new Date(rec.timestamp).toLocaleString()}`}
            pinColor="red"
          />
        ))}
      </MapView>
    );
  }

  return (
    <View style={styles.container}>
      {mapContent}
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={[styles.recordButton, recording ? styles.recordingActive : null]}
          onPress={recording ? stopRecording : startRecording}
        >
          <Text style={styles.recordButtonText}>
            {recording ? 'STOP 🛑' : 'RECORD 🎙️'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 30,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordButton: {
    backgroundColor: 'white',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  recordingActive: {
    backgroundColor: '#ffcccc',
    borderColor: 'red',
    borderWidth: 2,
  },
  recordButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  }
});