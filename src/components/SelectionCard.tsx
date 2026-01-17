import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RecordingEntry } from '../types';
import { getNoiseColor } from './NoiseLegend';

interface SelectionCardProps {
  selectedRecordings: RecordingEntry[];
  activeDetailRecording: RecordingEntry | null;
  onSelectRecording: (recording: RecordingEntry) => void;
  onBack: () => void;
  onClose: () => void;
}

export const SelectionCard: React.FC<SelectionCardProps> = ({
  selectedRecordings,
  activeDetailRecording,
  onSelectRecording,
  onBack,
  onClose,
}) => {
  const showList = selectedRecordings.length > 1 && !activeDetailRecording;
  const showDetail = !!activeDetailRecording;

  const overallAverageDb = selectedRecordings.length > 0
    ? selectedRecordings.reduce((sum, rec) => sum + (rec.averageDecibels || 0), 0) / selectedRecordings.length
    : 0;

  const standardDeviation = selectedRecordings.length > 0
    ? Math.sqrt(
      selectedRecordings.reduce(
        (sum, rec) => sum + Math.pow((rec.averageDecibels || 0) - overallAverageDb, 2),
        0
      ) / selectedRecordings.length
    )
    : 0;

  return (
    <View style={styles.selectionCard}>
      {showList && (
        <>
          <View style={styles.selectionHeader}>
            <Text style={styles.selectionTitle}>
              {selectedRecordings.length} Recordings Nearby
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={24} color="#ccc" />
            </TouchableOpacity>
          </View>
          <Text style={styles.selectionSubtitle}>Select one to view details</Text>
          <View style={[{ maxHeight: 200 }, styles.listContainer]}>
            <ScrollView>
              {selectedRecordings.map((rec) => (
                <TouchableOpacity
                  key={rec.id}
                  style={styles.listItem}
                  onPress={() => onSelectRecording(rec)}
                >
                  <View
                    style={[styles.dot, { backgroundColor: getNoiseColor(rec.averageDecibels || 0) }]}
                  />
                  <View style={styles.listItemContent}>
                    <Text style={styles.listItemTime}>
                      {new Date(rec.timestamp).toLocaleTimeString()}
                    </Text>
                    <Text style={styles.listItemDb}>{rec.averageDecibels?.toFixed(1)} dB</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#666" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={[styles.selectionStats, styles.aggregateStats]}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Overall Avg dB</Text>
              <Text style={styles.statValue}>{overallAverageDb.toFixed(1)}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Deviation ± dB</Text>
              <Text style={styles.statValue}>{standardDeviation.toFixed(1)}</Text>
            </View>
          </View>
        </>
      )}

      {showDetail && activeDetailRecording && (
        <>
          <View style={styles.selectionHeader}>
            <View style={styles.headerLeft}>
              {selectedRecordings.length > 1 && (
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                  <Ionicons name="arrow-back" size={20} color="#fff" />
                </TouchableOpacity>
              )}
              <Text style={styles.selectionTitle}>Recording Details</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={24} color="#ccc" />
            </TouchableOpacity>
          </View>
          <Text style={styles.selectionText}>
            Time: {new Date(activeDetailRecording.timestamp).toLocaleString()}
          </Text>
          <View style={styles.selectionStats}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Avg dB</Text>
              <Text style={styles.statValue}>
                {activeDetailRecording.averageDecibels?.toFixed(1) || '--'}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Peak dB</Text>
              <Text style={styles.statValue}>
                {activeDetailRecording.peakDecibels?.toFixed(1) || '--'}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Duration</Text>
              <Text style={styles.statValue}>
                {activeDetailRecording.duration?.toFixed(1) || '--'}s
              </Text>
            </View>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
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
  },
  listContainer: {
    marginBottom: 8,
  },
  aggregateStats: {
    marginTop: 8,
    borderTopWidth: 1.2,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 12,
  },
});
