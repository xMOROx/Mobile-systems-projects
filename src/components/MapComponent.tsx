import React from 'react';
import { StyleSheet } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { RecordingEntry } from '../types';

interface MapComponentProps {
    region: Region;
    recordings: RecordingEntry[];
    onMarkerPress?: (recording: RecordingEntry) => void;
}

export const MapComponent: React.FC<MapComponentProps> = ({ region, recordings, onMarkerPress }) => {
    const getMarkerColor = (avgDecibels?: number): string => {
        if (!avgDecibels) return 'gray';
        if (avgDecibels < 60) return 'green';
        if (avgDecibels < 70) return 'orange';
        return 'red';
    };

    return (
        <MapView style={styles.map} initialRegion={region} showsUserLocation={true}>
            {recordings.map((rec) => (
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
