import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface LiveAnalysisPanelProps {
    level: number | null;
    minLevel: number | null;
    maxLevel: number | null;
    visible: boolean;
}

export const LiveAnalysisPanel: React.FC<LiveAnalysisPanelProps> = ({ level, minLevel, maxLevel, visible }) => {
    if (!visible) return null;

    const displayLevel = level !== null ? level.toFixed(1) : '—';
    const displayMin = minLevel !== null ? minLevel.toFixed(1) : '—';
    const displayMax = maxLevel !== null ? maxLevel.toFixed(1) : '—';

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['rgba(30, 30, 40, 0.95)', 'rgba(20, 20, 30, 0.98)']}
                style={styles.gradientBackground}
            >
                <View style={styles.header}>
                    <Text style={styles.title}>Live Audio Analysis</Text>
                </View>

                <View style={styles.row}>
                    <View style={styles.metricCard}>
                        <Text style={styles.metricLabel}>Current</Text>
                        <Text style={styles.metricValue}>{displayLevel} dB</Text>
                    </View>
                    <View style={styles.metricCard}>
                        <Text style={styles.metricLabel}>Min</Text>
                        <Text style={styles.metricValue}>{displayMin} dB</Text>
                    </View>
                    <View style={styles.metricCard}>
                        <Text style={styles.metricLabel}>Max</Text>
                        <Text style={styles.metricValue}>{displayMax} dB</Text>
                    </View>
                </View>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 120,
        left: 0,
        right: 0,
        paddingHorizontal: 10,
    },
    gradientBackground: {
        borderRadius: 20,
        paddingVertical: 15,
        paddingHorizontal: 20,
    },
    title: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    metricCard: {
        flex: 1,
        marginHorizontal: 4,
        padding: 10,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    metricLabel: {
        color: '#ccc',
        fontSize: 12,
        marginBottom: 4,
    },
    metricValue: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
});

export default LiveAnalysisPanel;
