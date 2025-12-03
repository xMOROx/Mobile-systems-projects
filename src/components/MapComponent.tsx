import React, { useMemo } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import MapView, { Marker, Region, Heatmap, PROVIDER_GOOGLE, Callout, Circle } from 'react-native-maps';
import { RecordingEntry } from '../types';
import { getNoiseColor, NOISE_LEVELS } from './NoiseLegend';

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
        return getNoiseColor(avgDecibels);
    };

    // Create noise zones with proper colors for heatmap visualization
    const noiseZones = useMemo(() => {
        return recordings
            .filter(r => r.averageDecibels !== undefined && r.averageDecibels !== null)
            .map(r => ({
                ...r,
                color: getNoiseColor(r.averageDecibels!),
                // Radius in meters - larger for louder sounds to show impact area
                radius: Math.max(30, Math.min(150, (r.averageDecibels! - 40) * 3)),
            }));
    }, [recordings]);

    const heatmapPoints = useMemo(() => {
        return recordings
            .filter(r => r.averageDecibels !== undefined && r.averageDecibels !== null)
            .map(r => ({
                latitude: r.latitude,
                longitude: r.longitude,
                // Normalize weight to 0-1 range based on dB levels (30-90 dB range)
                weight: Math.min(1, Math.max(0, (r.averageDecibels! - 30) / 60))
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
                    radius={40}
                    opacity={0.7}
                    gradient={{
                        // Colors matching the noise map reference: green -> yellow -> orange -> red -> purple
                        colors: ['#00CC00', '#66FF00', '#CCFF00', '#FFFF00', '#FFCC00', '#FF6600', '#FF0000', '#CC00CC'],
                        startPoints: [0.1, 0.2, 0.3, 0.4, 0.5, 0.65, 0.8, 0.95],
                        colorMapSize: 256
                    }}
                />
            )}

            {/* Add colored circles for noise zones visualization */}
            {(visualizationMode === 'heatmap' || visualizationMode === 'both') && noiseZones.map((zone) => (
                <Circle
                    key={`zone-${zone.id}`}
                    center={{ latitude: zone.latitude, longitude: zone.longitude }}
                    radius={zone.radius}
                    fillColor={`${zone.color}40`}
                    strokeColor={zone.color}
                    strokeWidth={2}
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
