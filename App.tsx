import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, Alert, TouchableOpacity, StatusBar, ScrollView } from 'react-native';
import { Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

import DatabaseService from './src/database/DatabaseService';
import LocationService from './src/services/LocationService';
import AudioService from './src/services/AudioService';
import { MapComponent } from './src/components/MapComponent';
import { RecordButton } from './src/components/RecordButton';
import { NoiseLegend, getNoiseColor } from './src/components/NoiseLegend';
import { TimelineSlider } from './src/components/TimelineSlider';
import LiveAnalysisPanel from './src/components/LiveAnalysisPanel';
import { RecordingEntry } from './src/types';

const CLICK_OVERLAP_FACTOR = 3500;

export default function App() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingsList, setRecordingsList] = useState<RecordingEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [region, setRegion] = useState<Region | undefined>(undefined);
  const [timeRange, setTimeRange] = useState<{ start: number; end: number }>({ start: 0, end: Date.now() });
  const [showTimeline, setShowTimeline] = useState(true);
  const [showLegend, setShowLegend] = useState(true);
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
  const liveMaxRef = useRef<number>(0);

  const [selectedRecordings, setSelectedRecordings] = useState<RecordingEntry[]>([]);
  const [activeDetailRecording, setActiveDetailRecording] = useState<RecordingEntry | null>(null);

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
    const C = 90
    const level = normalized + C;
    return level > 0 ? level : 0;
  }, []);

  const initializeApp = async () => {
    try {
      loadRecordings();

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
      liveMaxRef.current = 0;
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
          setLiveMax(prev => {
              const newVal = prev === null ? levelDb : Math.max(prev, levelDb);
              liveMaxRef.current = newVal;
              return newVal;
          });
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

      const count = levelCountRef.current || 1;
      const finalAverageDb = levelSumRef.current / count;
      const finalPeakDb = liveMaxRef.current || 0;

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
          finalAverageDb,
          finalPeakDb
        );

        console.log('Recording saved:', recordingId, { duration: analysis.duration, avg: finalAverageDb, peak: finalPeakDb });
        showNotification('success', `Recording saved • ${analysis.duration.toFixed(1)}s • Avg: ${finalAverageDb.toFixed(1)} dB`);
        loadRecordings();
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
      showNotification('error', 'Failed to save recording');
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3;
    const phi1 = lat1 * Math.PI / 180;
    const phi2 = lat2 * Math.PI / 180;
    const deltaPhi = (lat2 - lat1) * Math.PI / 180;
    const deltaLambda = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) *
      Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const handleMarkerPress = (recording: RecordingEntry) => {
    if (!region) {
        setSelectedRecordings([recording]);
        setActiveDetailRecording(recording);
        return;
    }

    const visualRadius = CLICK_OVERLAP_FACTOR * region.latitudeDelta;

    const nearbyRecordings = filteredRecordings.filter(r => {
        const dist = calculateDistance(recording.latitude, recording.longitude, r.latitude, r.longitude);
        return dist <= visualRadius;
    });

    nearbyRecordings.sort((a, b) => b.timestamp - a.timestamp);

    setSelectedRecordings(nearbyRecordings);

    if (nearbyRecordings.length === 1) {
        setActiveDetailRecording(nearbyRecordings[0]);
    } else {
        setActiveDetailRecording(null);
    }
  };

  const closeSelection = () => {
    setSelectedRecordings([]);
    setActiveDetailRecording(null);
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

  const handleRegionChangeComplete = (newRegion: Region) => {
      setRegion(newRegion);
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

  const shouldShowSelection = selectedRecordings.length > 0 && !isRecording;
  const showList = selectedRecordings.length > 1 && !activeDetailRecording;
  const showDetail = !!activeDetailRecording;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <MapComponent
        region={region}
        recordings={filteredRecordings}
        onMarkerPress={handleMarkerPress}
        onRegionChangeComplete={handleRegionChangeComplete}
      />

      <NoiseLegend visible={showLegend} />

      <View style={styles.rightControls}>
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

      {shouldShowSelection && (
        <View style={styles.selectionCard}>
          {showList && (
            <>
              <View style={styles.selectionHeader}>
                <Text style={styles.selectionTitle}>{selectedRecordings.length} Recordings Nearby</Text>
                <TouchableOpacity onPress={closeSelection}>
                  <Ionicons name="close-circle" size={24} color="#ccc" />
                </TouchableOpacity>
              </View>
              <Text style={styles.selectionSubtitle}>Select one to view details</Text>
              <View style={{ maxHeight: 200 }}>
                <ScrollView>
                    {selectedRecordings.map((rec) => (
                        <TouchableOpacity
                            key={rec.id}
                            style={styles.listItem}
                            onPress={() => setActiveDetailRecording(rec)}
                        >
                            <View style={[styles.dot, { backgroundColor: getNoiseColor(rec.averageDecibels || 0) }]} />
                            <View style={styles.listItemContent}>
                                <Text style={styles.listItemTime}>{new Date(rec.timestamp).toLocaleTimeString()}</Text>
                                <Text style={styles.listItemDb}>{rec.averageDecibels?.toFixed(1)} dB</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#666" />
                        </TouchableOpacity>
                    ))}
                </ScrollView>
              </View>
            </>
          )}

          {showDetail && activeDetailRecording && (
            <>
              <View style={styles.selectionHeader}>
                <View style={styles.headerLeft}>
                   {selectedRecordings.length > 1 && (
                       <TouchableOpacity onPress={() => setActiveDetailRecording(null)} style={styles.backButton}>
                           <Ionicons name="arrow-back" size={20} color="#fff" />
                       </TouchableOpacity>
                   )}
                   <Text style={styles.selectionTitle}>Recording Details</Text>
                </View>
                <TouchableOpacity onPress={closeSelection}>
                  <Ionicons name="close-circle" size={24} color="#ccc" />
                </TouchableOpacity>
              </View>
              <Text style={styles.selectionText}>Time: {new Date(activeDetailRecording.timestamp).toLocaleString()}</Text>
              <View style={styles.selectionStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Avg dB</Text>
                  <Text style={styles.statValue}>{activeDetailRecording.averageDecibels?.toFixed(1) || '--'}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Peak dB</Text>
                  <Text style={styles.statValue}>{activeDetailRecording.peakDecibels?.toFixed(1) || '--'}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Duration</Text>
                  <Text style={styles.statValue}>{activeDetailRecording.duration?.toFixed(1) || '--'}s</Text>
                </View>
              </View>
            </>
          )}
        </View>
      )}

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
  selectionCard: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(30, 30, 40, 0.95)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  selectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 10,
  },
  selectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  selectionSubtitle: {
    color: '#aaa',
    fontSize: 12,
    marginBottom: 10,
  },
  selectionText: {
    color: '#aaa',
    fontSize: 12,
    marginBottom: 12,
  },
  selectionStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    color: '#888',
    fontSize: 11,
    marginBottom: 4,
  },
  statValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  listItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  listItemContent: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginHorizontal: 10,
  },
  listItemTime: {
      color: '#fff',
      fontSize: 14,
  },
  listItemDb: {
      color: '#ccc',
      fontSize: 14,
      fontWeight: 'bold',
  },
  dot: {
      width: 12,
      height: 12,
      borderRadius: 6,
  }
});
