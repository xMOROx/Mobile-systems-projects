import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Use 15-minute intervals for better precision on mobile (672 intervals for 7 days)
const MINUTES_PER_INTERVAL = 15;
const INTERVALS_PER_HOUR = 60 / MINUTES_PER_INTERVAL;
const INTERVALS_PER_DAY = 24 * INTERVALS_PER_HOUR;
const MAX_DAYS = 7;
const MAX_INTERVALS = MAX_DAYS * INTERVALS_PER_DAY; // 672

// Tolerance for matching slider value to quick select buttons (in intervals)
// This allows slight variations in slider position to still highlight the correct button
const QUICK_SELECT_MATCH_TOLERANCE = 2;

// Minimum touch target size for accessibility (44px is recommended minimum)
const MIN_TOUCH_TARGET_HEIGHT = 44;

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
    
    // Use refs to store stable values and prevent infinite loops
    const onTimeChangeRef = useRef(onTimeChange);
    const lastNotifiedRef = useRef<{ start: number; end: number } | null>(null);
    
    // Update ref when callback changes
    useEffect(() => {
        onTimeChangeRef.current = onTimeChange;
    }, [onTimeChange]);

    // Calculate time range based on slider value
    const calculateTimeRange = useCallback(() => {
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

    const { startTime, endTime, displayText, dateText } = calculateTimeRange();

    // Notify parent of time changes, but avoid infinite loops
    const notifyTimeChange = useCallback((start: number, end: number) => {
        // Only notify if values actually changed
        if (
            lastNotifiedRef.current?.start !== start ||
            lastNotifiedRef.current?.end !== end
        ) {
            lastNotifiedRef.current = { start, end };
            onTimeChangeRef.current(start, end);
        }
    }, []);

    const handleSliderChange = useCallback((value: number) => {
        setSliderValue(value);
    }, []);

    const handleSliderComplete = useCallback((value: number) => {
        setSliderValue(value);
        // Calculate and notify immediately on completion
        const now = Date.now();
        if (value === 0) {
            notifyTimeChange(0, now);
        } else {
            const intervalsAgo = value;
            const centerTime = now - (intervalsAgo * MINUTES_PER_INTERVAL * 60 * 1000);
            const halfWindow = (windowSize * MINUTES_PER_INTERVAL * 60 * 1000) / 2;
            const start = centerTime - halfWindow;
            const end = Math.min(centerTime + halfWindow, now);
            notifyTimeChange(start, end);
        }
    }, [windowSize, notifyTimeChange]);

    // Quick select handlers for common time ranges
    const selectTimeRange = useCallback((hoursAgo: number) => {
        if (hoursAgo === 0) {
            setSliderValue(0);
            notifyTimeChange(0, Date.now());
        } else {
            // Calculate slider value for the time ago
            const intervals = Math.round((hoursAgo * 60) / MINUTES_PER_INTERVAL);
            setSliderValue(Math.min(intervals, MAX_INTERVALS));
            
            const now = Date.now();
            const centerTime = now - (intervals * MINUTES_PER_INTERVAL * 60 * 1000);
            const halfWindow = (windowSize * MINUTES_PER_INTERVAL * 60 * 1000) / 2;
            const start = centerTime - halfWindow;
            const end = Math.min(centerTime + halfWindow, now);
            notifyTimeChange(start, end);
        }
    }, [windowSize, notifyTimeChange]);

    const handleWindowSizeChange = useCallback((newSize: number) => {
        setWindowSize(newSize);
        // Recalculate with new window size
        const now = Date.now();
        if (sliderValue === 0) {
            notifyTimeChange(0, now);
        } else {
            const intervalsAgo = sliderValue;
            const centerTime = now - (intervalsAgo * MINUTES_PER_INTERVAL * 60 * 1000);
            const halfWindow = (newSize * MINUTES_PER_INTERVAL * 60 * 1000) / 2;
            const start = centerTime - halfWindow;
            const end = Math.min(centerTime + halfWindow, now);
            notifyTimeChange(start, end);
        }
    }, [sliderValue, notifyTimeChange]);

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

                {/* Quick select buttons */}
                <View style={styles.quickSelectContainer}>
                    <Text style={styles.quickSelectLabel}>Quick select:</Text>
                    <View style={styles.quickSelectButtons}>
                        {[
                            { label: 'All', hours: 0 },
                            { label: '1h', hours: 1 },
                            { label: '6h', hours: 6 },
                            { label: '12h', hours: 12 },
                            { label: '24h', hours: 24 },
                            { label: '3d', hours: 72 },
                            { label: '7d', hours: 168 },
                        ].map((option) => {
                            const isActive = option.hours === 0 
                                ? sliderValue === 0 
                                : Math.abs(sliderValue - Math.round((option.hours * 60) / MINUTES_PER_INTERVAL)) < QUICK_SELECT_MATCH_TOLERANCE;
                            return (
                                <TouchableOpacity
                                    key={option.label}
                                    style={[
                                        styles.quickSelectButton,
                                        isActive && styles.quickSelectButtonActive,
                                    ]}
                                    onPress={() => selectTimeRange(option.hours)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[
                                        styles.quickSelectButtonText,
                                        isActive && styles.quickSelectButtonTextActive,
                                    ]}>
                                        {option.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* Slider with improved touch area */}
                <View style={styles.sliderContainer}>
                    <View style={styles.sliderLabels}>
                        <Text style={styles.sliderLabel}>Now</Text>
                        <Text style={styles.sliderLabel}>7 days ago</Text>
                    </View>
                    <View style={styles.sliderWrapper}>
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
                    </View>

                    {/* Day markers - simplified */}
                    <View style={styles.dayMarkers}>
                        {[0, 1, 2, 3, 4, 5, 6, 7].map((day) => (
                            <TouchableOpacity 
                                key={day} 
                                style={styles.dayMarker}
                                onPress={() => selectTimeRange(day * 24)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.markerTick} />
                                <Text style={styles.markerText}>{day === 0 ? 'Now' : `-${day}d`}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Window size selector */}
                <View style={styles.windowSelector}>
                    <Text style={styles.windowLabel}>Time window:</Text>
                    <View style={styles.windowButtons}>
                        {[
                            // Each value represents intervals (1 interval = 15 minutes)
                            { label: '15m', value: 1 },           // 1 × 15min = 15 min window
                            { label: '1h', value: INTERVALS_PER_HOUR },  // 4 × 15min = 1 hour
                            { label: '3h', value: INTERVALS_PER_HOUR * 3 }, // 12 × 15min = 3 hours
                            { label: '6h', value: INTERVALS_PER_HOUR * 6 }, // 24 × 15min = 6 hours
                            { label: '24h', value: INTERVALS_PER_DAY },     // 96 × 15min = 24 hours
                        ].map((option) => (
                            <TouchableOpacity
                                key={option.label}
                                style={[
                                    styles.windowButton,
                                    windowSize === option.value && styles.windowButtonActive,
                                ]}
                                onPress={() => handleWindowSizeChange(option.value)}
                                activeOpacity={0.7}
                            >
                                <Text style={[
                                    styles.windowButtonText,
                                    windowSize === option.value && styles.windowButtonTextActive,
                                ]}>
                                    {option.label}
                                </Text>
                            </TouchableOpacity>
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
        paddingHorizontal: 16,
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
        fontSize: 22,
        fontWeight: '700',
        letterSpacing: 1,
    },
    agoText: {
        color: '#4A90D9',
        fontSize: 12,
        marginTop: 2,
    },
    // Quick select buttons
    quickSelectContainer: {
        marginBottom: 12,
    },
    quickSelectLabel: {
        color: '#8E8E93',
        fontSize: 11,
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    quickSelectButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 6,
    },
    quickSelectButton: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 4,
        borderRadius: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: MIN_TOUCH_TARGET_HEIGHT,
    },
    quickSelectButtonActive: {
        backgroundColor: '#4A90D9',
    },
    quickSelectButtonText: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: 13,
        fontWeight: '600',
    },
    quickSelectButtonTextActive: {
        color: '#FFFFFF',
    },
    // Slider
    sliderContainer: {
        marginBottom: 10,
    },
    sliderLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 5,
        marginBottom: 0,
    },
    sliderLabel: {
        color: '#8E8E93',
        fontSize: 10,
        textTransform: 'uppercase',
    },
    sliderWrapper: {
        paddingVertical: 8,
    },
    slider: {
        width: '100%',
        height: 50,
    },
    dayMarkers: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 6,
        marginTop: -8,
    },
    dayMarker: {
        alignItems: 'center',
        paddingVertical: 4,
        paddingHorizontal: 2,
    },
    markerTick: {
        width: 2,
        height: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
        borderRadius: 1,
    },
    markerText: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: 9,
        marginTop: 3,
        fontWeight: '500',
    },
    // Window size selector
    windowSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    windowLabel: {
        color: '#8E8E93',
        fontSize: 11,
        textTransform: 'uppercase',
    },
    windowButtons: {
        flexDirection: 'row',
        gap: 6,
    },
    windowButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        minWidth: MIN_TOUCH_TARGET_HEIGHT,
        minHeight: MIN_TOUCH_TARGET_HEIGHT,
        alignItems: 'center',
        justifyContent: 'center',
    },
    windowButtonActive: {
        backgroundColor: '#4A90D9',
    },
    windowButtonText: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: 12,
        fontWeight: '600',
    },
    windowButtonTextActive: {
        color: '#FFFFFF',
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
