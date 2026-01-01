import React, { useMemo, useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import MapView, { Region, PROVIDER_GOOGLE, Marker, Circle } from 'react-native-maps';
import Supercluster from 'supercluster';
import { RecordingEntry } from '../types';
import { getNoiseColor } from './NoiseLegend';

// Hex opacity value (50%) to allow visual overlap/blending like a heatmap
const HEATMAP_OPACITY = '80';

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
    const mapRef = useRef<MapView>(null);
    const [clusters, setClusters] = useState<any[]>([]);
    const [currentZoomDelta, setCurrentZoomDelta] = useState<number>(0.01);

    const supercluster = useMemo(() => {
        const index = new Supercluster({
            radius: 60,
            maxZoom: 15,
        });

        const points = recordings
            .filter(r => r.averageDecibels !== undefined && r.averageDecibels !== null)
            .map(r => ({
                type: 'Feature' as const,
                properties: {
                    cluster: false,
                    id: r.id,
                    averageDecibels: r.averageDecibels
                },
                geometry: {
                    type: 'Point' as const,
                    coordinates: [r.longitude, r.latitude]
                }
            }));

        index.load(points);
        return index;
    }, [recordings]);

    const updateClusters = (currentRegion: Region) => {
        if (!supercluster || !currentRegion) return;

        const { longitude, latitude, longitudeDelta, latitudeDelta } = currentRegion;
        setCurrentZoomDelta(latitudeDelta);

        const zoom = Math.round(Math.log2(360 / longitudeDelta));

        const bbox: [number, number, number, number] = [
            longitude - longitudeDelta / 2,
            latitude - latitudeDelta / 2,
            longitude + longitudeDelta / 2,
            latitude + latitudeDelta / 2
        ];

        try {
            const newClusters = supercluster.getClusters(bbox, zoom);
            setClusters(newClusters);
        } catch (e) {
            console.error('Error updating clusters:', e);
        }
    };

    useEffect(() => {
        if (region) {
            updateClusters(region);
        }
    }, [supercluster]);

    const handleRegionChangeComplete = (newRegion: Region) => {
        updateClusters(newRegion);
    };

    return (
        <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={region}
            showsUserLocation={true}
            provider={PROVIDER_GOOGLE}
            customMapStyle={DARK_MAP_STYLE}
            onRegionChangeComplete={handleRegionChangeComplete}
        >
            {clusters.map((item) => {
                const geometry = item.geometry;
                const properties = item.properties;
                const coordinate = {
                    latitude: geometry.coordinates[1],
                    longitude: geometry.coordinates[0],
                };

                if (properties.cluster) {
                    return (
                        <Marker
                            key={`cluster-${item.id}`}
                            coordinate={coordinate}
                            onPress={() => {
                                const expansionZoom = supercluster.getClusterExpansionZoom(item.id);
                                mapRef.current?.animateCamera({
                                    center: coordinate,
                                    zoom: expansionZoom,
                                });
                            }}
                        >
                            <View style={styles.clusterContainer}>
                                <Text style={styles.clusterText}>{properties.point_count}</Text>
                            </View>
                        </Marker>
                    );
                }

                // For individual points, we render a Circle to achieve the "heatmap" aesthetic
                // We use dynamic radius based on zoom (latitudeDelta) so they stay visible as dots
                const dynamicRadius = Math.max(20, 2500 * currentZoomDelta);
                const noiseColor = getNoiseColor(properties.averageDecibels);

                return (
                    <Circle
                        key={`pin-${properties.id}`}
                        center={coordinate}
                        radius={dynamicRadius}
                        fillColor={`${noiseColor}${HEATMAP_OPACITY}`}
                        strokeColor={noiseColor}
                        strokeWidth={1}
                        // @ts-ignore
                        onPress={() => {
                            const recording = recordings.find(r => r.id === properties.id);
                            if (recording) {
                                onMarkerPress(recording);
                            }
                        }}
                        tappable={true}
                    />
                );
            })}
        </MapView>
    );
};

const styles = StyleSheet.create({
    map: {
        width: '100%',
        height: '100%',
    },
    clusterContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(74, 144, 217, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    clusterText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
});
