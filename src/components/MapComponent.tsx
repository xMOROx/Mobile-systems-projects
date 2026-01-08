import React, { useMemo, useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import MapView, { Region, PROVIDER_GOOGLE, Marker, Circle } from 'react-native-maps';
import Supercluster from 'supercluster';
import { RecordingEntry } from '../types';
import { getNoiseColor } from './NoiseLegend';

const HEATMAP_OPACITY = '80';

interface MapComponentProps {
    region: Region;
    recordings: RecordingEntry[];
    onMarkerPress: (recording: RecordingEntry) => void;
    onRegionChangeComplete?: (region: Region) => void;
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
    onRegionChangeComplete
}) => {
    const mapRef = useRef<MapView>(null);
    const [clusters, setClusters] = useState<any[]>([]);

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
        if (onRegionChangeComplete) {
            onRegionChangeComplete(newRegion);
        }
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

                const noiseColor = getNoiseColor(properties.averageDecibels);
                const circleRadius = Math.max(60, properties.averageDecibels * 2);

                return (
                    <React.Fragment key={`point-${properties.id}`}>
                        <Circle
                            center={coordinate}
                            radius={circleRadius}
                            fillColor={`${noiseColor}${HEATMAP_OPACITY}`}
                            strokeColor="transparent"
                            strokeWidth={0}
                            zIndex={1}
                        />
                        <Marker
                            coordinate={coordinate}
                            anchor={{ x: 0.5, y: 0.5 }}
                            onPress={() => {
                                const recording = recordings.find(r => r.id === properties.id);
                                if (recording) {
                                    onMarkerPress(recording);
                                }
                            }}
                            zIndex={2}
                        >
                            <View style={styles.hitBox}>
                                <View style={[styles.centerDot, { backgroundColor: noiseColor }]} />
                            </View>
                        </Marker>
                    </React.Fragment>
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
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(74, 144, 217, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#fff',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
    },
    clusterText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    hitBox: {
        width: 56,
        height: 56,
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
    },
    centerDot: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 3,
        borderColor: 'white',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
    }
});
