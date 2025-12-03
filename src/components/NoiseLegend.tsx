import React from 'react';
import { StyleSheet, View, Text } from 'react-native';

// Noise level ranges based on standard noise mapping (dB(A))
export const NOISE_LEVELS = [
    { min: 0, max: 45, color: '#00CC00', label: '<45' },      // Dark green - very quiet
    { min: 45, max: 50, color: '#66FF00', label: '45-50' },   // Light green - quiet
    { min: 50, max: 55, color: '#CCFF00', label: '50-55' },   // Yellow-green
    { min: 55, max: 60, color: '#FFFF00', label: '55-60' },   // Yellow
    { min: 60, max: 65, color: '#FFCC00', label: '60-65' },   // Orange
    { min: 65, max: 70, color: '#FF6600', label: '65-70' },   // Dark orange
    { min: 70, max: 75, color: '#FF0000', label: '70-75' },   // Red
    { min: 75, max: 200, color: '#CC00CC', label: '>75' },    // Purple/magenta - very loud
];

export const getNoiseColor = (decibels: number): string => {
    for (const level of NOISE_LEVELS) {
        if (decibels >= level.min && decibels < level.max) {
            return level.color;
        }
    }
    return NOISE_LEVELS[NOISE_LEVELS.length - 1].color;
};

interface NoiseLegendProps {
    visible?: boolean;
}

export const NoiseLegend: React.FC<NoiseLegendProps> = ({ visible = true }) => {
    if (!visible) return null;

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Lden dB(A)</Text>
            {NOISE_LEVELS.map((level, index) => (
                <View key={index} style={styles.legendItem}>
                    <View style={[styles.colorBox, { backgroundColor: level.color }]} />
                    <Text style={styles.label}>{level.label}</Text>
                </View>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 120,
        right: 15,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 8,
        padding: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    title: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 6,
        color: '#333',
        textAlign: 'center',
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 2,
    },
    colorBox: {
        width: 20,
        height: 14,
        marginRight: 6,
        borderWidth: 0.5,
        borderColor: '#ccc',
    },
    label: {
        fontSize: 11,
        color: '#333',
    },
});
