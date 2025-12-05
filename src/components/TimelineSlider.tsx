import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// 5 minute intervals for a week = 7 * 24 * 12 = 2016 intervals
const MINUTES_PER_INTERVAL = 5;
const INTERVALS_PER_HOUR = 60 / MINUTES_PER_INTERVAL;
const INTERVALS_PER_DAY = 24 * INTERVALS_PER_HOUR;
const MAX_DAYS = 7;
const MAX_INTERVALS = MAX_DAYS * INTERVALS_PER_DAY; // 2016

export interface TimelineSliderProps {
    onTimeChange: (startTime: number, endTime: number) => void;
    recordingCount: number;
    filteredCount: number;
    visible: boolean;
}

export const TimelineSlider: React.FC<TimelineSliderProps> = ({
    onTimeChange,
    recordingCount,
    filteredCount,
    visible,
}) => {
    // 0 = now (all data), MAX_INTERVALS = 7 days ago
    const [sliderValue, setSliderValue] = useState(0);
    const [windowSize, setWindowSize] = useState(INTERVALS_PER_HOUR); // 1 hour window by default

    const { startTime, endTime, displayText, dateText } = useMemo(() => {
        const now = Date.now();

        if (sliderValue === 0) {
            return {
                startTime: 0,
                endTime: now,
                displayText: 'All Time',
                dateText: 'Showing all recordings',
            };
        }

        // Calculate the center point of the time window
        const intervalsAgo = sliderValue;
        const centerTime = now - (intervalsAgo * MINUTES_PER_INTERVAL * 60 * 1000);
        const halfWindow = (windowSize * MINUTES_PER_INTERVAL * 60 * 1000) / 2;

        const start = centerTime - halfWindow;
        const end = Math.min(centerTime + halfWindow, now);

        const startDate = new Date(start);
        const endDate = new Date(end);

        const formatTime = (date: Date) => {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        };

        const formatDate = (date: Date) => {
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            if (date.toDateString() === today.toDateString()) {
                return 'Today';
            } else if (date.toDateString() === yesterday.toDateString()) {
                return 'Yesterday';
            } else {
                return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
            }
        };

        const isSameDay = startDate.toDateString() === endDate.toDateString();

        return {
            startTime: start,
            endTime: end,
            displayText: `${formatTime(startDate)} - ${formatTime(endDate)}`,
            dateText: isSameDay
                ? formatDate(startDate)
                : `${formatDate(startDate)} - ${formatDate(endDate)}`,
        };
    }, [sliderValue, windowSize]);

    const handleSliderChange = (value: number) => {
        setSliderValue(value);
    };

    const handleSliderComplete = (value: number) => {
        setSliderValue(value);
        onTimeChange(startTime, endTime);
    };

    React.useEffect(() => {
        onTimeChange(startTime, endTime);
    }, [startTime, endTime]);

    if (!visible) return null;

    const daysAgo = Math.floor(sliderValue / INTERVALS_PER_DAY);
    const hoursAgo = Math.floor((sliderValue % INTERVALS_PER_DAY) / INTERVALS_PER_HOUR);

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['rgba(30, 30, 40, 0.95)', 'rgba(20, 20, 30, 0.98)']}
                style={styles.gradientBackground}
            >
                {/* Header with time info */}
                <View style={styles.header}>
                    <View style={styles.timeInfo}>
                        <Ionicons name="time-outline" size={18} color="#4A90D9" />
                        <Text style={styles.dateText}>{dateText}</Text>
                    </View>
                    <View style={styles.recordingInfo}>
                        <Ionicons name="disc-outline" size={14} color="#8E8E93" />
                        <Text style={styles.countText}>
                            {filteredCount} / {recordingCount}
                        </Text>
                    </View>
                </View>

                {/* Time display */}
                <View style={styles.timeDisplay}>
                    <Text style={styles.timeText}>{displayText}</Text>
                    {sliderValue > 0 && (
                        <Text style={styles.agoText}>
                            {daysAgo > 0 ? `${daysAgo}d ` : ''}{hoursAgo > 0 ? `${hoursAgo}h ago` : daysAgo > 0 ? 'ago' : 'Just now'}
                        </Text>
                    )}
                </View>

                {/* Slider */}
                <View style={styles.sliderContainer}>
                    <View style={styles.sliderLabels}>
                        <Text style={styles.sliderLabel}>Now</Text>
                        <Text style={styles.sliderLabel}>7 days ago</Text>
                    </View>
                    <Slider
                        style={styles.slider}
                        minimumValue={0}
                        maximumValue={MAX_INTERVALS}
                        step={1}
                        value={sliderValue}
                        onValueChange={handleSliderChange}
                        onSlidingComplete={handleSliderComplete}
                        minimumTrackTintColor="#4A90D9"
                        maximumTrackTintColor="rgba(255, 255, 255, 0.3)"
                        thumbTintColor="#FFFFFF"
                    />

                    {/* Day markers */}
                    <View style={styles.dayMarkers}>
                        {[0, 1, 2, 3, 4, 5, 6, 7].map((day) => (
                            <View key={day} style={styles.dayMarker}>
                                <View style={styles.markerTick} />
                                <Text style={styles.markerText}>{day === 0 ? 'Now' : `-${day}d`}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Window size selector */}
                <View style={styles.windowSelector}>
                    <Text style={styles.windowLabel}>Time window:</Text>
                    <View style={styles.windowButtons}>
                        {[
                            { label: '5m', value: 1 },
                            { label: '30m', value: 6 },
                            { label: '1h', value: INTERVALS_PER_HOUR },
                            { label: '6h', value: INTERVALS_PER_HOUR * 6 },
                            { label: '24h', value: INTERVALS_PER_DAY },
                        ].map((option) => (
                            <Text
                                key={option.label}
                                style={[
                                    styles.windowButton,
                                    windowSize === option.value && styles.windowButtonActive,
                                ]}
                                onPress={() => setWindowSize(option.value)}
                            >
                                {option.label}
                            </Text>
                        ))}
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
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    timeInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    dateText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    recordingInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    countText: {
        color: '#8E8E93',
        fontSize: 12,
    },
    timeDisplay: {
        alignItems: 'center',
        marginBottom: 10,
    },
    timeText: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: '700',
        letterSpacing: 1,
    },
    agoText: {
        color: '#4A90D9',
        fontSize: 12,
        marginTop: 2,
    },
    sliderContainer: {
        marginBottom: 10,
    },
    sliderLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 5,
        marginBottom: 5,
    },
    sliderLabel: {
        color: '#8E8E93',
        fontSize: 10,
        textTransform: 'uppercase',
    },
    slider: {
        width: '100%',
        height: 40,
    },
    dayMarkers: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
        marginTop: -5,
    },
    dayMarker: {
        alignItems: 'center',
    },
    markerTick: {
        width: 1,
        height: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    markerText: {
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: 8,
        marginTop: 2,
    },
    windowSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 5,
    },
    windowLabel: {
        color: '#8E8E93',
        fontSize: 12,
    },
    windowButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    windowButton: {
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: 12,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        overflow: 'hidden',
    },
    windowButtonActive: {
        color: '#FFFFFF',
        backgroundColor: '#4A90D9',
    },
});

// Legacy exports for backward compatibility
export type TimeRange = 'all' | '1h' | '6h' | '24h' | '7d';
export const getTimeRangeStart = (range: TimeRange): number => {
    const now = Date.now();
    switch (range) {
        case '1h': return now - 60 * 60 * 1000;
        case '6h': return now - 6 * 60 * 60 * 1000;
        case '24h': return now - 24 * 60 * 60 * 1000;
        case '7d': return now - 7 * 24 * 60 * 60 * 1000;
        default: return 0;
    }
};
