import React, { useMemo } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import MapView, { Marker, Region, Heatmap, PROVIDER_GOOGLE, Callout } from 'react-native-maps';
import { RecordingEntry } from '../types';

export type VisualizationMode = 'markers' | 'heatmap' | 'both';

interface MapComponentProps {
    region: Region;
    recordings: RecordingEntry[];
    onMarkerPress?: (recording: RecordingEntry) => void;
    visualizationMode?: VisualizationMode;
}

const DARK_MAP_STYLE = [
    {
        "elementType": "geometry",
        "stylers": [{ "color": "#242f3e" }]
    },
    {
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#746855" }]
    },
    {
        "elementType": "labels.text.stroke",
        "stylers": [{ "color": "#242f3e" }]
    },
    {
        "featureType": "administrative.locality",
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#d59563" }]
    },
    {
        "featureType": "poi",
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#d59563" }]
    },
    {
        "featureType": "poi.park",
        "elementType": "geometry",
        "stylers": [{ "color": "#263c3f" }]
    },
    {
        "featureType": "poi.park",
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#6b9a76" }]
    },
    {
        "featureType": "road",
        "elementType": "geometry",
        "stylers": [{ "color": "#38414e" }]
    },
    {
        "featureType": "road",
        "elementType": "geometry.stroke",
        "stylers": [{ "color": "#212a37" }]
    },
    {
        "featureType": "road",
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#9ca5b3" }]
    },
    {
        "featureType": "road.highway",
        "elementType": "geometry",
        "stylers": [{ "color": "#746855" }]
    },
    {
        "featureType": "road.highway",
        "elementType": "geometry.stroke",
        "stylers": [{ "color": "#1f2835" }]
    },
    {
        "featureType": "road.highway",
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#f3d19c" }]
    },
    {
        "featureType": "transit",
        "elementType": "geometry",
        "stylers": [{ "color": "#2f3948" }]
    },
    {
        "featureType": "transit.station",
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#d59563" }]
    },
    {
        "featureType": "water",
        "elementType": "geometry",
        "stylers": [{ "color": "#17263c" }]
    },
    {
        "featureType": "water",
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#515c6d" }]
    },
    {
        "featureType": "water",
        "elementType": "labels.text.stroke",
        "stylers": [{ "color": "#17263c" }]
    }
];

export const MapComponent: React.FC<MapComponentProps> = ({
    region,
    recordings,
    onMarkerPress,
    visualizationMode = 'markers'
}) => {
    const getMarkerColor = (avgDecibels?: number): string => {
        if (!avgDecibels) return 'gray';
        if (avgDecibels < 60) return 'green';
        if (avgDecibels < 70) return 'orange';
        return 'red';
    };

    const heatmapPoints = useMemo(() => {
        return recordings
            .filter(r => r.averageDecibels !== undefined && r.averageDecibels !== null)
            .map(r => ({
                latitude: r.latitude,
                longitude: r.longitude,
                weight: r.averageDecibels || 0
            }));
    }, [recordings]);

    return (
        <MapView
            style={styles.map}
            initialRegion={region}
            showsUserLocation={true}
            provider={PROVIDER_GOOGLE}
            customMapStyle={DARK_MAP_STYLE}
        >
            {(visualizationMode === 'markers' || visualizationMode === 'both') && recordings.map((rec) => (
                <Marker
                    key={rec.id}
                    coordinate={{ latitude: rec.latitude, longitude: rec.longitude }}
                    pinColor={getMarkerColor(rec.averageDecibels)}
                    onCalloutPress={() => onMarkerPress?.(rec)}
                >
                    <Callout tooltip>
                        <View style={styles.calloutContainer}>
                            <Text style={styles.calloutTitle}>Recording #{rec.id}</Text>
                            <Text style={styles.calloutText}>
                                {rec.averageDecibels ? `${rec.averageDecibels.toFixed(1)} dB` : 'No data'}
                            </Text>
                            <Text style={styles.calloutDate}>
                                {new Date(rec.timestamp).toLocaleTimeString()}
                            </Text>
                        </View>
                    </Callout>
                </Marker>
            ))}

            {(visualizationMode === 'heatmap' || visualizationMode === 'both') && heatmapPoints.length > 0 && (
                <Heatmap
                    points={heatmapPoints}
                    radius={50}
                    opacity={0.7}
                    gradient={{
                        colors: ['#00FF00', '#FFFF00', '#FF0000'],
                        startPoints: [0.2, 0.5, 0.8],
                        colorMapSize: 256
                    }}
                />
            )}
        </MapView>
    );
};

const styles = StyleSheet.create({
    map: {
        width: '100%',
        height: '100%',
    },
    calloutContainer: {
        backgroundColor: 'white',
        borderRadius: 6,
        padding: 10,
        width: 140,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    calloutTitle: {
        fontWeight: 'bold',
        fontSize: 14,
        marginBottom: 4,
    },
    calloutText: {
        fontSize: 12,
        color: '#333',
    },
    calloutDate: {
        fontSize: 10,
        color: '#666',
        marginTop: 2,
    }
});
