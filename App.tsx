import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, Alert, Platform } from 'react-native';
import { Region } from 'react-native-maps';
import * as Location from 'expo-location';

import DatabaseService from './src/database/DatabaseService';
import LocationService from './src/services/LocationService';
import AudioService from './src/services/AudioService';
import { MapComponent } from './src/components/MapComponent';
import { RecordButton } from './src/components/RecordButton';
import { ViewToggle, ViewMode } from './src/components/ViewToggle';
import { MapLegend } from './src/components/MapLegend';
import { StatsPanel } from './src/components/StatsPanel';
import { RecordingEntry } from './src/types';

export default function App() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingsList, setRecordingsList] = useState<RecordingEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('both');

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      console.log('Initializing app...');

      // Test database
      try {
        loadRecordings();
        console.log('Database initialized successfully');
      } catch (dbError) {
        console.error('Database error:', dbError);
        setErrorMsg('Database initialization failed');
      }

      // Test location
      try {
        const currentLocation = await LocationService.getCurrentLocation();
        if (currentLocation) {
          setLocation(currentLocation);
          console.log('Location obtained:', currentLocation.coords);
        } else {
          setErrorMsg('Could not fetch location. Please check GPS and permissions.');
        }
      } catch (locError) {
        console.error('Location error:', locError);
        setErrorMsg('Location service failed');
      }
    } catch (error) {
      console.error('Error initializing app:', error);
      setErrorMsg(`Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRecordings = () => {
    try {
      const recordings = DatabaseService.getAllRecordings();
      console.log(`Loaded ${recordings.length} recordings`);
      setRecordingsList(recordings);
    } catch (error) {
      console.error('Error loading recordings:', error);
    }
  };

  const handleRecordPress = async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  const startRecording = async () => {
    try {
      if (!location) {
        Alert.alert('Wait for location', 'Please wait until your location is determined.');
        return;
      }

      console.log('Starting recording...');
      await AudioService.startRecording();
      setIsRecording(true);
      console.log('Recording started successfully');
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', `Failed to start recording: ${error}`);
    }
  };

  const stopRecording = async () => {
    try {
      console.log('Stopping recording...');
      const { uri, analysis } = await AudioService.stopRecording();
      setIsRecording(false);

      if (location) {
        const recordingId = DatabaseService.saveRecording(
          uri,
          location.coords.latitude,
          location.coords.longitude,
          analysis.duration,
          analysis.averageDecibels,
          analysis.peakDecibels
        );

        console.log('Recording saved with ID:', recordingId, analysis);

        Alert.alert(
          'Recording Saved',
          `Duration: ${analysis.duration.toFixed(1)}s\nAvg: ${analysis.averageDecibels} dB\nPeak: ${analysis.peakDecibels} dB`
        );

        loadRecordings();
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Error', `Failed to save recording: ${error}`);
      setIsRecording(false);
    }
  };

  const handleMarkerPress = (recording: RecordingEntry) => {
    Alert.alert(
      `Recording #${recording.id}`,
      `Time: ${new Date(recording.timestamp).toLocaleString()}\n` +
      `Duration: ${recording.duration?.toFixed(1) || 'N/A'}s\n` +
      `Average: ${recording.averageDecibels?.toFixed(1) || 'N/A'} dB\n` +
      `Peak: ${recording.peakDecibels?.toFixed(1) || 'N/A'} dB`,
      [{ text: 'OK' }]
    );
  };

  if (isLoading || !location) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={styles.loadingText}>
            {errorMsg || 'Loading...'}
          </Text>
          {errorMsg && (
            <Text style={styles.errorDetails}>
              Check console for details
            </Text>
          )}
        </View>
      </View>
    );
  }

  const region: Region = {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  return (
    <View style={styles.container}>
      <MapComponent
        region={region}
        recordings={recordingsList}
        viewMode={viewMode}
        onMarkerPress={handleMarkerPress}
      />

      <ViewToggle currentMode={viewMode} onModeChange={setViewMode} />
      <MapLegend visible={viewMode === 'heatmap' || viewMode === 'both'} />
      <StatsPanel recordings={recordingsList} />

      <View style={styles.controlsContainer}>
        <RecordButton
          isRecording={isRecording}
          onPress={handleRecordPress}
          disabled={!location}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    textAlign: 'center',
  },
  errorDetails: {
    marginTop: 10,
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 30,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});