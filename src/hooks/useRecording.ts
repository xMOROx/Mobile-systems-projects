import { useState, useRef, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import * as Location from 'expo-location';
import AudioService from '../services/AudioService';
import DatabaseService from '../database/DatabaseService';
import { RecordingEntry } from '../types';
import { convertMeteringToDecibels } from '../utils';

interface RecordingStats {
  liveLevel: number | null;
  liveMin: number | null;
  liveMax: number | null;
  duration: number;
  averageLevel: number | null;
}

interface UseRecordingReturn {
  isRecording: boolean;
  recordingStats: RecordingStats;
  handleRecordPress: () => Promise<void>;
  loadRecordings: () => void;
  recordingsList: RecordingEntry[];
}

/**
 * Custom hook for managing audio recording state and operations.
 */
export const useRecording = (
  location: Location.LocationObject | null,
  onSuccess: (message: string) => void,
  onError: (message: string) => void
): UseRecordingReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingsList, setRecordingsList] = useState<RecordingEntry[]>([]);
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

  useEffect(() => {
    return () => {
      statusUnsubscribe.current?.();
    };
  }, []);

  const loadRecordings = useCallback(() => {
    const recordings = DatabaseService.getAllRecordings();
    setRecordingsList(recordings);
  }, []);

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
      statusUnsubscribe.current = AudioService.addStatusListener((status) => {
        const meteringRaw =
          typeof (status as any).metering === 'number' ? (status as any).metering : null;
        const levelDb = convertMeteringToDecibels(meteringRaw);
        if (levelDb !== null) {
          setLiveLevel(levelDb);
          setLiveMin((prev) => (prev === null ? levelDb : Math.min(prev, levelDb)));
          setLiveMax((prev) => {
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
      onError('Failed to start recording. Check microphone permissions.');
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

        console.log('Recording saved:', recordingId, {
          duration: analysis.duration,
          avg: finalAverageDb,
          peak: finalPeakDb,
        });
        onSuccess(
          `Recording saved • ${analysis.duration.toFixed(1)}s • Avg: ${finalAverageDb.toFixed(1)} dB`
        );
        loadRecordings();
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
      onError('Failed to save recording');
    }
  };

  const handleRecordPress = useCallback(async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  }, [isRecording, location]);

  return {
    isRecording,
    recordingStats: {
      liveLevel,
      liveMin,
      liveMax,
      duration: recordingDuration,
      averageLevel: recordingAverageLevelDb,
    },
    handleRecordPress,
    loadRecordings,
    recordingsList,
  };
};
