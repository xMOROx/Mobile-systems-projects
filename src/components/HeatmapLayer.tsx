import React from 'react';
import { Circle } from 'react-native-maps';
import { RecordingEntry } from '../types';

interface HeatmapLayerProps {
    recordings: RecordingEntry[];
    visible: boolean;
}

export const HeatmapLayer: React.FC<HeatmapLayerProps> = ({ recordings, visible }) => {
    if (!visible) return null;

    const getHeatmapColor = (avgDecibels?: number): string => {
        if (!avgDecibels) return 'rgba(128, 128, 128, 0.3)';

        if (avgDecibels < 50) return 'rgba(0, 255, 0, 0.4)';
        if (avgDecibels < 60) return 'rgba(128, 255, 0, 0.5)';
        if (avgDecibels < 70) return 'rgba(255, 255, 0, 0.6)';
        if (avgDecibels < 80) return 'rgba(255, 128, 0, 0.7)';
        return 'rgba(255, 0, 0, 0.8)';
    };

    const getRadius = (avgDecibels?: number): number => {
        if (!avgDecibels) return 50;
        return Math.min(50 + (avgDecibels - 40) * 2, 200);
    };

    return (
        <>
            {recordings.map((rec) => (
                <Circle
                    key={`heatmap-${rec.id}`}
                    center={{
                        latitude: rec.latitude,
                        longitude: rec.longitude,
                    }}
                    radius={getRadius(rec.averageDecibels)}
                    fillColor={getHeatmapColor(rec.averageDecibels)}
                    strokeColor="transparent"
                    strokeWidth={0}
                />
            ))}
        </>
    );
};
