import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ControlButtonsProps {
  showLegend: boolean;
  showTimeline: boolean;
  onToggleLegend: () => void;
  onToggleTimeline: () => void;
  onRecenter: () => void;
}

export const ControlButtons: React.FC<ControlButtonsProps> = ({
  showLegend,
  showTimeline,
  onToggleLegend,
  onToggleTimeline,
  onRecenter,
}) => {
  return (
    <View style={styles.rightControls}>
      <TouchableOpacity
        style={[styles.controlButton, showLegend && styles.controlButtonActive]}
        onPress={onToggleLegend}
      >
        <Ionicons name="color-palette" size={24} color={showLegend ? '#4A90D9' : '#333'} />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.controlButton, showTimeline && styles.controlButtonActive]}
        onPress={onToggleTimeline}
      >
        <Ionicons name="time" size={24} color={showTimeline ? '#4A90D9' : '#333'} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.controlButton} onPress={onRecenter}>
        <Ionicons name="locate" size={24} color="#333" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
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
});
