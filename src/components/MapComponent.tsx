import React, { useMemo, useState } from 'react';
import { StyleSheet } from 'react-native';
import MapView, { Region, PROVIDER_GOOGLE, Circle } from 'react-native-maps';
import { RecordingEntry } from '../types';
import { getNoiseColor } from './NoiseLegend';

// Hex opacity value (50%) to allow visual overlap
const ZONE_FILL_OPACITY = '80'; // 50%

interface MapComponentProps {
    region: Region;
    recordings: RecordingEntry[];
    onMarkerPress: (recording: RecordingEntry) => void;
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
    onMarkerPress
}) => {
    // Default zoom level (latitudeDelta) is 0.01 in App.tsx.
    // Smaller delta = zoomed in. Larger delta = zoomed out.
    const [currentZoomDelta, setCurrentZoomDelta] = useState<number>(0.01);

    const handleRegionChangeComplete = (newRegion: Region) => {
        setCurrentZoomDelta(newRegion.latitudeDelta);
    };

    // Create noise zones with proper colors and dynamic radius
    const noiseCircles = useMemo(() => {
        // Base radius formula:
        // We want the circles to remain visible (roughly same pixel size) or scalable.
        // User asked for "dynamic scaling depending on zoom".
        // If we use a fixed meter radius, they shrink when zooming out.
        // To make them "heatmap-like points" that are visible, we scale the meter radius with the zoom delta.
        // 3000 is an empirical multiplier to get a decent size "dot" effect.
        const dynamicRadius = Math.max(5, 3000 * currentZoomDelta);

        return recordings
            .filter(r => r.averageDecibels !== undefined && r.averageDecibels !== null)
            .map(r => ({
                ...r,
                color: getNoiseColor(r.averageDecibels!),
                radius: dynamicRadius
            }));
    }, [recordings, currentZoomDelta]);

    return (
        <MapView
            style={styles.map}
            initialRegion={region}
            showsUserLocation={true}
            provider={PROVIDER_GOOGLE}
            customMapStyle={DARK_MAP_STYLE}
            onRegionChangeComplete={handleRegionChangeComplete}
        >
            {/* Colored circles acting as scalable points */}
            {noiseCircles.map((circle) => (
                <Circle
                    key={`circle-${circle.id}`}
                    center={{ latitude: circle.latitude, longitude: circle.longitude }}
                    radius={circle.radius}
                    fillColor={`${circle.color}${ZONE_FILL_OPACITY}`}
                    strokeColor={circle.color}
                    strokeWidth={1}
                    // @ts-ignore: onPress is available in recent react-native-maps versions
                    onPress={() => onMarkerPress(circle)}
                    tappable={true}
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
