import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface LegendItem {
    color: string;
    label: string;
    range: string;
}

const legendItems: LegendItem[] = [
    { color: '#00FF00', label: 'Very Quiet', range: '< 50 dB' },
    { color: '#80FF00', label: 'Quiet', range: '50-60 dB' },
    { color: '#FFFF00', label: 'Moderate', range: '60-70 dB' },
    { color: '#FF8000', label: 'Loud', range: '70-80 dB' },
    { color: '#FF0000', label: 'Very Loud', range: '> 80 dB' },
];

export const MapLegend: React.FC<{ visible: boolean }> = ({ visible }) => {
    if (!visible) return null;

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Sound Intensity</Text>
            {legendItems.map((item, index) => (
                <View key={index} style={styles.item}>
                    <View style={[styles.colorBox, { backgroundColor: item.color }]} />
                    <View style={styles.textContainer}>
                        <Text style={styles.label}>{item.label}</Text>
                        <Text style={styles.range}>{item.range}</Text>
                    </View>
                </View>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 60,
        right: 10,
        backgroundColor: 'white',
        padding: 12,
        borderRadius: 10,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    title: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#333',
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 3,
    },
    colorBox: {
        width: 20,
        height: 20,
        borderRadius: 4,
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    textContainer: {
        flex: 1,
    },
    label: {
        fontSize: 11,
        fontWeight: '600',
        color: '#333',
    },
    range: {
        fontSize: 9,
        color: '#666',
    },
});
