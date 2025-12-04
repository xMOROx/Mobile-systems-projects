import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { StyleSheet, View, Text, LayoutChangeEvent, ScrollView, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { RecordingEntry } from '../types';

interface TimelineSliderProps {
    recordings: RecordingEntry[];
    selectedTimestamp: number | null;
    onTimestampChange: (timestamp: number | null) => void;
    visible?: boolean;
}

// Constants for timeline
const TICK_INTERVAL_MINUTES = 5; // Tick every 5 minutes
const MINUTE_WIDTH = 12; // Width per minute in pixels
const TICK_HEIGHT = 15;
const SMALL_TICK_HEIGHT = 8;

// Format time for display (H:MM format)
const formatTimeLabel = (date: Date): string => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
};

export const TimelineSlider: React.FC<TimelineSliderProps> = ({
    recordings,
    selectedTimestamp,
    onTimestampChange,
    visible = true,
}) => {
    const [containerWidth, setContainerWidth] = useState(0);
    const scrollViewRef = useRef<ScrollView>(null);
    const isInitialized = useRef(false);
    
    // Calculate time range - default to 1 hour centered on current time
    const { startTime, endTime, totalMinutes, tickMarks } = useMemo(() => {
        const now = new Date();
        
        // Round down to nearest 5 minutes for start
        const startDate = new Date(now);
        startDate.setMinutes(Math.floor(now.getMinutes() / 5) * 5 - 60, 0, 0); // 1 hour before
        
        // End time is 1 hour after start (2 hours total range)
        const endDate = new Date(startDate);
        endDate.setMinutes(startDate.getMinutes() + 120);
        
        const start = startDate.getTime();
        const end = endDate.getTime();
        const minutes = (end - start) / (60 * 1000);
        
        // Generate tick marks
        const ticks: { time: Date; position: number; isMain: boolean }[] = [];
        const currentDate = new Date(startDate);
        let position = 0;
        
        while (currentDate.getTime() <= end) {
            const isMain = currentDate.getMinutes() % TICK_INTERVAL_MINUTES === 0;
            ticks.push({
                time: new Date(currentDate),
                position: position,
                isMain: isMain,
            });
            currentDate.setMinutes(currentDate.getMinutes() + 1);
            position += MINUTE_WIDTH;
        }
        
        return {
            startTime: start,
            endTime: end,
            totalMinutes: minutes,
            tickMarks: ticks,
        };
    }, []);

    // Total width of the timeline
    const timelineWidth = totalMinutes * MINUTE_WIDTH;

    // Convert timestamp to position
    const timestampToPosition = useCallback((timestamp: number): number => {
        const minutes = (timestamp - startTime) / (60 * 1000);
        return minutes * MINUTE_WIDTH;
    }, [startTime]);

    // Convert position to timestamp
    const positionToTimestamp = useCallback((position: number): number => {
        const minutes = position / MINUTE_WIDTH;
        return startTime + (minutes * 60 * 1000);
    }, [startTime]);

    // Initialize to current time on first render with valid containerWidth
    useEffect(() => {
        if (containerWidth > 0 && !isInitialized.current) {
            isInitialized.current = true;
            const now = Date.now();
            onTimestampChange(now);
            
            // Scroll to center the current time
            const position = timestampToPosition(now);
            const scrollX = Math.max(0, position - containerWidth / 2);
            scrollViewRef.current?.scrollTo({ x: scrollX, animated: false });
        }
    }, [containerWidth, onTimestampChange, timestampToPosition]);

    const handleContainerLayout = (event: LayoutChangeEvent) => {
        setContainerWidth(event.nativeEvent.layout.width);
    };

    // Handle scroll end to update timestamp
    const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const scrollX = event.nativeEvent.contentOffset.x;
        const centerPosition = scrollX + containerWidth / 2;
        const timestamp = positionToTimestamp(centerPosition);
        const clampedTimestamp = Math.max(startTime, Math.min(endTime, timestamp));
        onTimestampChange(clampedTimestamp);
    };

    if (!visible) return null;

    // Current selected time display
    const selectedDate = selectedTimestamp ? new Date(selectedTimestamp) : new Date();
    const displayTime = formatTimeLabel(selectedDate);

    return (
        <View style={styles.container}>
            {/* Current time display */}
            <View style={styles.currentTimeContainer}>
                <Text style={styles.currentTimeText}>{displayTime}</Text>
            </View>

            {/* Timeline with scroll */}
            <View style={styles.timelineContainer} onLayout={handleContainerLayout}>
                {/* Center indicator line */}
                <View style={styles.centerIndicator} />
                
                <ScrollView
                    ref={scrollViewRef}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    onMomentumScrollEnd={handleScrollEnd}
                    onScrollEndDrag={handleScrollEnd}
                    contentContainerStyle={{ width: timelineWidth }}
                    decelerationRate="fast"
                    snapToInterval={MINUTE_WIDTH}
                >
                    <View style={styles.ticksContainer}>
                        {/* Main horizontal line */}
                        <View style={styles.mainLine} />
                        
                        {/* Tick marks and labels */}
                        {tickMarks.filter(tick => tick.isMain).map((tick, index) => (
                            <View 
                                key={index} 
                                style={[styles.tickContainer, { left: tick.position }]}
                            >
                                <View style={styles.tickMark} />
                                <Text style={styles.tickLabel}>
                                    {formatTimeLabel(tick.time)}
                                </Text>
                            </View>
                        ))}
                        
                        {/* Small tick marks (every minute) */}
                        {tickMarks.filter(tick => !tick.isMain).map((tick, index) => (
                            <View 
                                key={`small-${index}`} 
                                style={[styles.smallTickMark, { left: tick.position }]}
                            />
                        ))}
                    </View>
                </ScrollView>
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
        bottom: 120,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        paddingVertical: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 5,
    },
    currentTimeContainer: {
        alignItems: 'center',
        marginBottom: 8,
    },
    currentTimeText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    timelineContainer: {
        height: 60,
        position: 'relative',
    },
    centerIndicator: {
        position: 'absolute',
        left: '50%',
        top: 0,
        bottom: 0,
        width: 2,
        backgroundColor: '#FF0000',
        zIndex: 10,
    },
    ticksContainer: {
        flex: 1,
        position: 'relative',
    },
    mainLine: {
        position: 'absolute',
        top: 20,
        left: 0,
        right: 0,
        height: 2,
        backgroundColor: '#000',
    },
    tickContainer: {
        position: 'absolute',
        top: 0,
        alignItems: 'center',
        width: 50,
        marginLeft: -25,
    },
    tickMark: {
        width: 2,
        height: TICK_HEIGHT,
        backgroundColor: '#000',
        marginTop: 5,
    },
    tickLabel: {
        fontSize: 10,
        color: '#000',
        marginTop: 4,
    },
    smallTickMark: {
        position: 'absolute',
        top: 12,
        width: 1,
        height: SMALL_TICK_HEIGHT,
        backgroundColor: '#000',
    },
});
