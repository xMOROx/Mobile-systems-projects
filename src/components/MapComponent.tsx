import React from 'react';
import { StyleSheet } from 'react-native';
import MapView, { Marker, Region, PROVIDER_GOOGLE } from 'react-native-maps';
import { RecordingEntry } from '../types';
import { HeatmapLayer } from './HeatmapLayer';
import { ViewMode } from './ViewToggle';

interface MapComponentProps {
    region: Region;
    recordings: RecordingEntry[];
    viewMode: ViewMode;
    onMarkerPress?: (recording: RecordingEntry) => void;
}

export const MapComponent: React.FC<MapComponentProps> = ({
    region,
    recordings,
    viewMode,
    onMarkerPress
}) => {
    const getMarkerColor = (avgDecibels?: number): string => {
        if (!avgDecibels) return 'gray';
        if (avgDecibels < 60) return 'green';
        if (avgDecibels < 70) return 'orange';
        return 'red';
    };

    const showMarkers = viewMode === 'markers' || viewMode === 'both';
    const showHeatmap = viewMode === 'heatmap' || viewMode === 'both';

    return (
        <MapView
            style={styles.map}
            initialRegion={region}
            showsUserLocation={true}
            provider={PROVIDER_GOOGLE}
        >
            <HeatmapLayer recordings={recordings} visible={showHeatmap} />

            {showMarkers && recordings.map((rec) => (
                <Marker
                    key={rec.id}
                    coordinate={{ latitude: rec.latitude, longitude: rec.longitude }}
                    title={`Recording #${rec.id}`}
                    description={`${rec.averageDecibels ? `${rec.averageDecibels} dB avg` : 'No analysis'}\n${new Date(rec.timestamp).toLocaleString()}`}
                    pinColor={getMarkerColor(rec.averageDecibels)}
                    onPress={() => onMarkerPress?.(rec)}
                />
            ))}
        </MapView>
    );
};

const styles = StyleSheet.create({
    map: {
        width: '100%',
        height: '100%',
    },
});
