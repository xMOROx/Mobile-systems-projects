import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, StatusBar } from 'react-native';
import { Region } from 'react-native-maps';
import * as Location from 'expo-location';

import LocationService from './src/services/LocationService';
import { MapComponent } from './src/components/MapComponent';
import { RecordButton } from './src/components/RecordButton';
import { NoiseLegend } from './src/components/NoiseLegend';
import { TimelineSlider } from './src/components/TimelineSlider';
import LiveAnalysisPanel from './src/components/LiveAnalysisPanel';
import { SelectionCard } from './src/components/SelectionCard';
import { Notification } from './src/components/Notification';
import { ControlButtons } from './src/components/ControlButtons';
import { RecordingEntry } from './src/types';
import { useNotification, useMapSelection, useRecording } from './src/hooks';

export default function App() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [region, setRegion] = useState<Region | undefined>(undefined);
  const [timeRange, setTimeRange] = useState<{ start: number; end: number }>({ start: 0, end: Date.now() });
  const [showTimeline, setShowTimeline] = useState(false);
  const [showLegend, setShowLegend] = useState(false);

  const { notification, showNotification } = useNotification();
  const {
    selectedRecordings,
    activeDetailRecording,
    handleMarkerPress,
    setActiveDetailRecording,
    closeSelection,
  } = useMapSelection();

  const {
    isRecording,
    recordingStats,
    handleRecordPress,
    loadRecordings,
    recordingsList,
  } = useRecording(
    location,
    (message) => showNotification('success', message),
    (message) => showNotification('error', message)
  );

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

  const onMarkerPress = useCallback((recording: RecordingEntry) => {
    handleMarkerPress(recording, region, filteredRecordings);
  }, [region, filteredRecordings, handleMarkerPress]);

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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <MapComponent
        region={region}
        recordings={filteredRecordings}
        onMarkerPress={onMarkerPress}
        onRegionChangeComplete={handleRegionChangeComplete}
      />

      <NoiseLegend visible={showLegend} />

      <ControlButtons
        showLegend={showLegend}
        showTimeline={showTimeline}
        onToggleLegend={() => setShowLegend(!showLegend)}
        onToggleTimeline={() => setShowTimeline(!showTimeline)}
        onRecenter={recenterMap}
      />

      {isRecording ? (
        <LiveAnalysisPanel
          level={recordingStats.liveLevel}
          minLevel={recordingStats.liveMin}
          maxLevel={recordingStats.liveMax}
          duration={recordingStats.duration}
          averageLevel={recordingStats.averageLevel}
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
        <SelectionCard
          selectedRecordings={selectedRecordings}
          activeDetailRecording={activeDetailRecording}
          onSelectRecording={setActiveDetailRecording}
          onBack={() => setActiveDetailRecording(null)}
          onClose={closeSelection}
        />
      )}

      {notification && (
        <Notification type={notification.type} message={notification.message} />
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
  bottomControls: {
    position: 'absolute',
    bottom: 40,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
