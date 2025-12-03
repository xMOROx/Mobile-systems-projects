import React, { useState, useMemo } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type TimeRange = 'hour' | 'day' | 'week' | 'month' | 'all';

interface TimelineSliderProps {
    selectedRange: TimeRange;
    onRangeChange: (range: TimeRange) => void;
    recordingCount: number;
    filteredCount: number;
    visible?: boolean;
}

const TIME_RANGES: { key: TimeRange; label: string; icon: string }[] = [
    { key: 'hour', label: '1H', icon: 'time-outline' },
    { key: 'day', label: '24H', icon: 'today-outline' },
    { key: 'week', label: '7D', icon: 'calendar-outline' },
    { key: 'month', label: '30D', icon: 'calendar-clear-outline' },
    { key: 'all', label: 'All', icon: 'infinite-outline' },
];

export const getTimeRangeStart = (range: TimeRange): number => {
    const now = Date.now();
    switch (range) {
        case 'hour':
            return now - 60 * 60 * 1000;
        case 'day':
            return now - 24 * 60 * 60 * 1000;
        case 'week':
            return now - 7 * 24 * 60 * 60 * 1000;
        case 'month':
            return now - 30 * 24 * 60 * 60 * 1000;
        case 'all':
        default:
            return 0;
    }
};

export const TimelineSlider: React.FC<TimelineSliderProps> = ({
    selectedRange,
    onRangeChange,
    recordingCount,
    filteredCount,
    visible = true,
}) => {
    if (!visible) return null;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Ionicons name="time" size={16} color="#333" />
                <Text style={styles.headerText}>Historical Data</Text>
                <Text style={styles.countText}>
                    {filteredCount}/{recordingCount}
                </Text>
            </View>
            <View style={styles.rangeContainer}>
                {TIME_RANGES.map((range) => (
                    <TouchableOpacity
                        key={range.key}
                        style={[
                            styles.rangeButton,
                            selectedRange === range.key && styles.rangeButtonActive,
                        ]}
                        onPress={() => onRangeChange(range.key)}
                    >
                        <Text
                            style={[
                                styles.rangeText,
                                selectedRange === range.key && styles.rangeTextActive,
                            ]}
                        >
                            {range.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
            <View style={styles.timeInfo}>
                <Text style={styles.timeInfoText}>
                    {selectedRange === 'all'
                        ? 'Showing all recordings'
                        : `Last ${TIME_RANGES.find((r) => r.key === selectedRange)?.label}`}
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 60,
        left: 15,
        right: 80,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 12,
        padding: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    headerText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginLeft: 6,
        flex: 1,
    },
    countText: {
        fontSize: 12,
        color: '#666',
    },
    rangeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    rangeButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: '#f0f0f0',
        flex: 1,
        marginHorizontal: 2,
        alignItems: 'center',
    },
    rangeButtonActive: {
        backgroundColor: '#4A90D9',
    },
    rangeText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#666',
    },
    rangeTextActive: {
        color: '#fff',
    },
    timeInfo: {
        marginTop: 8,
        alignItems: 'center',
    },
    timeInfoText: {
        fontSize: 11,
        color: '#888',
    },
});
