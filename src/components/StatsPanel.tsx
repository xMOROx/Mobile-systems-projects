import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RecordingEntry } from '../types';

interface StatsPanelProps {
    recordings: RecordingEntry[];
}

export const StatsPanel: React.FC<StatsPanelProps> = ({ recordings }) => {
    const validRecordings = recordings.filter(r => r.averageDecibels);

    if (validRecordings.length === 0) {
        return null;
    }

    const avgDecibels = validRecordings.reduce((sum, r) => sum + (r.averageDecibels || 0), 0) / validRecordings.length;
    const maxDecibels = Math.max(...validRecordings.map(r => r.averageDecibels || 0));
    const minDecibels = Math.min(...validRecordings.map(r => r.averageDecibels || 0));

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Statistics</Text>
            <View style={styles.statsRow}>
                <StatItem label="Total" value={recordings.length.toString()} />
                <StatItem label="Avg" value={`${avgDecibels.toFixed(1)} dB`} />
            </View>
            <View style={styles.statsRow}>
                <StatItem label="Min" value={`${minDecibels.toFixed(1)} dB`} />
                <StatItem label="Max" value={`${maxDecibels.toFixed(1)} dB`} />
            </View>
        </View>
    );
};

const StatItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <View style={styles.statItem}>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={styles.statValue}>{value}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 100,
        left: 10,
        backgroundColor: 'white',
        padding: 12,
        borderRadius: 10,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        minWidth: 140,
    },
    title: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#333',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 2,
    },
    statItem: {
        flex: 1,
        marginHorizontal: 2,
    },
    statLabel: {
        fontSize: 10,
        color: '#666',
        marginBottom: 2,
    },
    statValue: {
        fontSize: 13,
        fontWeight: '700',
        color: '#333',
    },
});
