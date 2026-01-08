import { useState, useCallback } from 'react';
import { Region } from 'react-native-maps';
import { RecordingEntry } from '../types';
import { calculateDistance } from '../utils';

const CLICK_OVERLAP_FACTOR = 3500;

interface UseMapSelectionReturn {
  selectedRecordings: RecordingEntry[];
  activeDetailRecording: RecordingEntry | null;
  handleMarkerPress: (recording: RecordingEntry, region: Region | undefined, filteredRecordings: RecordingEntry[]) => void;
  setActiveDetailRecording: (recording: RecordingEntry | null) => void;
  closeSelection: () => void;
}

/**
 * Custom hook for managing map marker selection state.
 */
export const useMapSelection = (): UseMapSelectionReturn => {
  const [selectedRecordings, setSelectedRecordings] = useState<RecordingEntry[]>([]);
  const [activeDetailRecording, setActiveDetailRecording] = useState<RecordingEntry | null>(null);

  const handleMarkerPress = useCallback(
    (recording: RecordingEntry, region: Region | undefined, filteredRecordings: RecordingEntry[]) => {
      if (!region) {
        setSelectedRecordings([recording]);
        setActiveDetailRecording(recording);
        return;
      }

      const visualRadius = CLICK_OVERLAP_FACTOR * region.latitudeDelta;

      const nearbyRecordings = filteredRecordings.filter((r) => {
        const dist = calculateDistance(
          recording.latitude,
          recording.longitude,
          r.latitude,
          r.longitude
        );
        return dist <= visualRadius;
      });

      nearbyRecordings.sort((a, b) => b.timestamp - a.timestamp);

      setSelectedRecordings(nearbyRecordings);

      if (nearbyRecordings.length === 1) {
        setActiveDetailRecording(nearbyRecordings[0]);
      } else {
        setActiveDetailRecording(null);
      }
    },
    []
  );

  const closeSelection = useCallback(() => {
    setSelectedRecordings([]);
    setActiveDetailRecording(null);
  }, []);

  return {
    selectedRecordings,
    activeDetailRecording,
    handleMarkerPress,
    setActiveDetailRecording,
    closeSelection,
  };
};
