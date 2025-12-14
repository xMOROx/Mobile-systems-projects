import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
import LiveAnalysisPanel from './src/components/LiveAnalysisPanel';
import { RecordingEntry } from './src/types';

// Time window for filtering recordings (±5 minutes from selected timestamp)
const TIME_WINDOW_MS = 5 * 60 * 1000;

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
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const notificationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [liveLevel, setLiveLevel] = useState<number | null>(null);
  const [liveMin, setLiveMin] = useState<number | null>(null);
  const [liveMax, setLiveMax] = useState<number | null>(null);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [recordingAverageLevelDb, setRecordingAverageLevelDb] = useState<number | null>(null);
  const statusUnsubscribe = useRef<(() => void) | null>(null);
  const recordingStartTimeRef = useRef<number | null>(null);
  const levelSumRef = useRef<number>(0);
  const levelCountRef = useRef<number>(0);

  // Filter recordings based on selected timestamp (show recordings within ±5 minutes)
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

  useEffect(() => {
    return () => {
      statusUnsubscribe.current?.();
      notificationTimeoutRef.current && clearTimeout(notificationTimeoutRef.current);
    };
  }, []);

  const showNotification = (type: 'success' | 'error', message: string) => {
    notificationTimeoutRef.current && clearTimeout(notificationTimeoutRef.current);
    setNotification({ type, message });
    notificationTimeoutRef.current = setTimeout(() => {
      setNotification(null);
    }, 3500);
  };

  const convertMetering = useCallback((metering: number | null) => {
    if (metering === null || Number.isNaN(metering)) return null;
    const normalized = Math.round(metering * 10) / 10;
    const C = 90 // Constant to convert from dBFS to real dB SPL, but its value should be different for every microphone.
    return normalized + C
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

      recordingStartTimeRef.current = Date.now();
      levelSumRef.current = 0;
      levelCountRef.current = 0;
      await AudioService.startRecording();
      setLiveLevel(null);
      setLiveMin(null);
      setLiveMax(null);
      setRecordingDuration(0);
      setRecordingAverageLevelDb(null);
      statusUnsubscribe.current?.();
      statusUnsubscribe.current = AudioService.addStatusListener(status => {
        const meteringRaw = typeof (status as any).metering === 'number' ? (status as any).metering : null;
        const levelDb = convertMetering(meteringRaw);
        if (levelDb !== null) {
          setLiveLevel(levelDb);
          setLiveMin(prev => (prev === null ? levelDb : Math.min(prev, levelDb)));
          setLiveMax(prev => (prev === null ? levelDb : Math.max(prev, levelDb)));
          levelSumRef.current += levelDb;
          levelCountRef.current += 1;
          setRecordingAverageLevelDb(levelSumRef.current / levelCountRef.current);
        }
        if (recordingStartTimeRef.current) {
          const elapsed = (Date.now() - recordingStartTimeRef.current) / 1000;
          setRecordingDuration(elapsed);
        }
      });
      setIsRecording(true);
      console.log('Recording started');
    } catch (error) {
      console.error('Failed to start recording:', error);
      showNotification('error', 'Failed to start recording. Check microphone permissions.');
    }
  };

  const stopRecording = async () => {
    try {
      statusUnsubscribe.current?.();
      statusUnsubscribe.current = null;
      recordingStartTimeRef.current = null;
      levelSumRef.current = 0;
      levelCountRef.current = 0;
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
        showNotification('success', `Recording saved • ${analysis.duration.toFixed(1)}s • Avg: ${analysis.averageDecibels} dB`);
        loadRecordings();
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
      showNotification('error', 'Failed to save recording');
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

      {/* Show live analysis while recording, otherwise show timeline slider */}
      {isRecording ? (
        <LiveAnalysisPanel
          level={liveLevel}
          minLevel={liveMin}
          maxLevel={liveMax}
          duration={recordingDuration}
          averageLevel={recordingAverageLevelDb}
          visible
        />
      ) : (
        <TimelineSlider
          onTimeChange={handleTimeChange}
          recordingCount={recordingsList.length}
          filteredCount={filteredRecordings.length}
          visible={showTimeline}
        />
      )}

      {/* Notification Toast */}
      {notification && (
        <View style={[styles.notification, styles[`notification_${notification.type}`]]}>
          <Text style={styles.notificationText}>{notification.message}</Text>
        </View>
      )}

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
  notification: {
    position: 'absolute',
    bottom: 4,
    left: 20,
    right: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notification_success: {
    backgroundColor: '#34C759',
  },
  notification_error: {
    backgroundColor: '#FF3B30',
  },
  notificationText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});