import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, Alert, TouchableOpacity, StatusBar } from 'react-native';
import { Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

import DatabaseService from './src/database/DatabaseService';
import LocationService from './src/services/LocationService';
import AudioService from './src/services/AudioService';
import { MapComponent, VisualizationMode } from './src/components/MapComponent';
import { RecordButton } from './src/components/RecordButton';
import { NoiseLegend } from './src/components/NoiseLegend';
import { TimelineSlider } from './src/components/TimelineSlider';
import { RecordingEntry } from './src/types';

export default function App() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingsList, setRecordingsList] = useState<RecordingEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [visualizationMode, setVisualizationMode] = useState<VisualizationMode>('heatmap');
  const [region, setRegion] = useState<Region | undefined>(undefined);
  const [timeRange, setTimeRange] = useState<{ start: number; end: number }>({ start: 0, end: Date.now() });
  const [showLegend, setShowLegend] = useState(true);
  const [showTimeline, setShowTimeline] = useState(true);

  // Filter recordings based on selected time range
  const filteredRecordings = useMemo(() => {
    if (timeRange.start === 0) {
      return recordingsList;
    }
    return recordingsList.filter(r =>
      r.timestamp >= timeRange.start && r.timestamp <= timeRange.end
    );
  }, [recordingsList, timeRange]);

  const handleTimeChange = useCallback((startTime: number, endTime: number) => {
    setTimeRange({ start: startTime, end: endTime });
  }, []);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Załaduj nagrania z bazy
      loadRecordings();

      // Pobierz lokalizację
      const currentLocation = await LocationService.getCurrentLocation();
      if (currentLocation) {
        setLocation(currentLocation);
        setRegion({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      } else {
        setErrorMsg('Could not fetch location. Please check GPS and permissions.');
      }
    } catch (error) {
      console.error('Error initializing app:', error);
      setErrorMsg('Error initializing application');
    } finally {
      setIsLoading(false);
    }
  };

  const loadRecordings = () => {
    const recordings = DatabaseService.getAllRecordings();
    setRecordingsList(recordings);
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

      await AudioService.startRecording();
      setIsRecording(true);
      console.log('Recording started');
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording. Please check microphone permissions.');
    }
  };

  const stopRecording = async () => {
    try {
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

        console.log('Recording saved:', recordingId, analysis);

        Alert.alert(
          'Recording Saved',
          `Duration: ${analysis.duration.toFixed(1)}s\nAvg: ${analysis.averageDecibels} dB\nPeak: ${analysis.peakDecibels} dB`
        );

        loadRecordings();
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Error', 'Failed to save recording');
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

  const toggleVisualizationMode = () => {
    setVisualizationMode(current => {
      if (current === 'markers') return 'heatmap';
      if (current === 'heatmap') return 'both';
      return 'markers';
    });
  };

  const recenterMap = async () => {
    const currentLocation = await LocationService.getCurrentLocation();
    if (currentLocation) {
      setLocation(currentLocation);
      setRegion({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  };

  if (isLoading || !region) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={{ marginTop: 10 }}>{errorMsg || 'Loading...'}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <MapComponent
        region={region}
        recordings={filteredRecordings}
        onMarkerPress={handleMarkerPress}
        visualizationMode={visualizationMode}
      />

      {/* Noise level legend */}
      <NoiseLegend visible={showLegend && (visualizationMode === 'heatmap' || visualizationMode === 'both')} />

      <View style={styles.rightControls}>
        <TouchableOpacity style={styles.controlButton} onPress={toggleVisualizationMode}>
          <Ionicons
            name={visualizationMode === 'heatmap' ? "flame" : visualizationMode === 'both' ? "layers" : "location"}
            size={24}
            color="#333"
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, showLegend && styles.controlButtonActive]}
          onPress={() => setShowLegend(!showLegend)}
        >
          <Ionicons name="color-palette" size={24} color={showLegend ? "#4A90D9" : "#333"} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, showTimeline && styles.controlButtonActive]}
          onPress={() => setShowTimeline(!showTimeline)}
        >
          <Ionicons name="time" size={24} color={showTimeline ? "#4A90D9" : "#333"} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton} onPress={recenterMap}>
          <Ionicons name="locate" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Timeline slider for historical data */}
      <TimelineSlider
        onTimeChange={handleTimeChange}
        recordingCount={recordingsList.length}
        filteredCount={filteredRecordings.length}
        visible={showTimeline}
      />

      <View style={styles.bottomControls}>
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
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  rightControls: {
    position: 'absolute',
    top: 60,
    right: 20,
    gap: 15,
  },
  controlButton: {
    backgroundColor: 'white',
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  controlButtonActive: {
    borderWidth: 2,
    borderColor: '#4A90D9',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 40,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});