import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, PanResponder, Animated, GestureResponderEvent, LayoutChangeEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RecordingEntry } from '../types';

interface TimelineSliderProps {
    recordings: RecordingEntry[];
    selectedTimestamp: number | null;
    onTimestampChange: (timestamp: number | null) => void;
    visible?: boolean;
}

// Format timestamp to readable time
const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Format timestamp to readable date and time
const formatDateTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    
    if (isToday) {
        return `Today ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + 
           ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const TimelineSlider: React.FC<TimelineSliderProps> = ({
    recordings,
    selectedTimestamp,
    onTimestampChange,
    visible = true,
}) => {
    const [sliderWidth, setSliderWidth] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const sliderPosition = useRef(new Animated.Value(0)).current;
    
    // Calculate time bounds from recordings
    const { minTime, maxTime, timeRange } = useMemo(() => {
        if (recordings.length === 0) {
            const now = Date.now();
            return { minTime: now - 3600000, maxTime: now, timeRange: 3600000 }; // Default 1 hour
        }
        
        const timestamps = recordings.map(r => r.timestamp);
        const min = Math.min(...timestamps);
        const max = Math.max(...timestamps);
        // Add some padding (5 minutes on each side)
        const padding = 5 * 60 * 1000;
        return { 
            minTime: min - padding, 
            maxTime: max + padding, 
            timeRange: (max - min) + (padding * 2) 
        };
    }, [recordings]);

    // Convert position to timestamp
    const positionToTimestamp = useCallback((position: number): number => {
        if (sliderWidth === 0) return minTime;
        const ratio = Math.max(0, Math.min(1, position / sliderWidth));
        return minTime + (ratio * timeRange);
    }, [sliderWidth, minTime, timeRange]);

    // Convert timestamp to position
    const timestampToPosition = useCallback((timestamp: number): number => {
        if (timeRange === 0) return 0;
        const ratio = (timestamp - minTime) / timeRange;
        return Math.max(0, Math.min(sliderWidth, ratio * sliderWidth));
    }, [sliderWidth, minTime, timeRange]);

    // Update slider position when selectedTimestamp changes externally
    useEffect(() => {
        if (selectedTimestamp !== null && !isDragging) {
            const position = timestampToPosition(selectedTimestamp);
            sliderPosition.setValue(position);
        }
    }, [selectedTimestamp, timestampToPosition, isDragging]);

    // Pan responder for dragging - uses locationX which is relative to the slider container
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: (evt: GestureResponderEvent) => {
                setIsDragging(true);
                const touchX = evt.nativeEvent.locationX;
                sliderPosition.setValue(Math.max(0, Math.min(touchX, sliderWidth || 200)));
                const timestamp = positionToTimestamp(touchX);
                onTimestampChange(timestamp);
            },
            onPanResponderMove: (evt: GestureResponderEvent) => {
                // Use locationX which is relative to the slider container
                const touchX = evt.nativeEvent.locationX;
                const newPosition = Math.max(0, Math.min(sliderWidth || 200, touchX));
                sliderPosition.setValue(newPosition);
                const timestamp = positionToTimestamp(newPosition);
                onTimestampChange(timestamp);
            },
            onPanResponderRelease: () => {
                setIsDragging(false);
            },
        })
    ).current;

    // Calculate marker positions for recordings
    const recordingMarkers = useMemo(() => {
        return recordings.map(recording => ({
            id: recording.id,
            position: timestampToPosition(recording.timestamp),
            decibels: recording.averageDecibels,
        }));
    }, [recordings, timestampToPosition]);

    const handleLayout = (event: LayoutChangeEvent) => {
        setSliderWidth(event.nativeEvent.layout.width);
    };

    const handleShowAll = () => {
        onTimestampChange(null);
    };

    const handleShowLatest = () => {
        if (recordings.length > 0) {
            const latestTimestamp = Math.max(...recordings.map(r => r.timestamp));
            onTimestampChange(latestTimestamp);
        }
    };

    if (!visible) return null;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Ionicons name="time" size={16} color="#333" />
                <Text style={styles.headerText}>Timeline</Text>
                <View style={styles.headerButtons}>
                    <TouchableOpacity 
                        style={[styles.headerButton, selectedTimestamp === null && styles.headerButtonActive]}
                        onPress={handleShowAll}
                    >
                        <Text style={[styles.headerButtonText, selectedTimestamp === null && styles.headerButtonTextActive]}>
                            All
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={styles.headerButton}
                        onPress={handleShowLatest}
                    >
                        <Text style={styles.headerButtonText}>Latest</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Time labels */}
            <View style={styles.timeLabels}>
                <Text style={styles.timeLabel}>{formatTime(minTime)}</Text>
                <Text style={styles.timeLabel}>{formatTime(maxTime)}</Text>
            </View>

            {/* Slider track */}
            <View 
                style={styles.sliderContainer} 
                onLayout={handleLayout}
                {...panResponder.panHandlers}
            >
                <View style={styles.sliderTrack}>
                    {/* Recording markers */}
                    {recordingMarkers.map(marker => (
                        <View
                            key={marker.id}
                            style={[
                                styles.recordingMarker,
                                { left: marker.position - 3 },
                                (marker.decibels !== null && marker.decibels !== undefined && marker.decibels > 70) ? styles.recordingMarkerLoud : undefined,
                            ]}
                        />
                    ))}
                </View>
                
                {/* Draggable thumb */}
                {selectedTimestamp !== null && (
                    <Animated.View 
                        style={[
                            styles.sliderThumb,
                            { transform: [{ translateX: sliderPosition }] }
                        ]}
                    >
                        <View style={styles.thumbInner} />
                    </Animated.View>
                )}
            </View>

            {/* Current time display */}
            <View style={styles.timeInfo}>
                <Text style={styles.timeInfoText}>
                    {selectedTimestamp !== null
                        ? formatDateTime(selectedTimestamp)
                        : `Showing all ${recordings.length} recordings`}
                </Text>
            </View>
        </View>
    );
};

// Legacy exports for backwards compatibility
export type TimeRange = 'hour' | 'day' | 'week' | 'month' | 'all';

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
    headerButtons: {
        flexDirection: 'row',
        gap: 6,
    },
    headerButton: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        backgroundColor: '#f0f0f0',
    },
    headerButtonActive: {
        backgroundColor: '#4A90D9',
    },
    headerButtonText: {
        fontSize: 11,
        fontWeight: '500',
        color: '#666',
    },
    headerButtonTextActive: {
        color: '#fff',
    },
    timeLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    timeLabel: {
        fontSize: 10,
        color: '#888',
    },
    sliderContainer: {
        height: 40,
        justifyContent: 'center',
    },
    sliderTrack: {
        height: 6,
        backgroundColor: '#e0e0e0',
        borderRadius: 3,
        position: 'relative',
    },
    recordingMarker: {
        position: 'absolute',
        width: 6,
        height: 12,
        backgroundColor: '#4A90D9',
        borderRadius: 2,
        top: -3,
    },
    recordingMarkerLoud: {
        backgroundColor: '#FF6B6B',
    },
    sliderThumb: {
        position: 'absolute',
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#4A90D9',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: -12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 4,
    },
    thumbInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#fff',
    },
    timeInfo: {
        marginTop: 8,
        alignItems: 'center',
    },
    timeInfoText: {
        fontSize: 12,
        color: '#333',
        fontWeight: '500',
    },
});
