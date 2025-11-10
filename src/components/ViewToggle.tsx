import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export type ViewMode = 'markers' | 'heatmap' | 'both';

interface ViewToggleProps {
    currentMode: ViewMode;
    onModeChange: (mode: ViewMode) => void;
}

export const ViewToggle: React.FC<ViewToggleProps> = ({ currentMode, onModeChange }) => {
    const modes: { mode: ViewMode; label: string; icon: string }[] = [
        { mode: 'markers', label: 'Markers', icon: '📍' },
        { mode: 'heatmap', label: 'Heatmap', icon: '🔥' },
        { mode: 'both', label: 'Both', icon: '🗺️' },
    ];

    return (
        <View style={styles.container}>
            {modes.map((item) => (
                <TouchableOpacity
                    key={item.mode}
                    style={[
                        styles.button,
                        currentMode === item.mode && styles.buttonActive,
                    ]}
                    onPress={() => onModeChange(item.mode)}
                >
                    <Text style={styles.icon}>{item.icon}</Text>
                    <Text
                        style={[
                            styles.label,
                            currentMode === item.mode && styles.labelActive,
                        ]}
                    >
                        {item.label}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 60,
        left: 10,
        backgroundColor: 'white',
        borderRadius: 10,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        flexDirection: 'column',
        overflow: 'hidden',
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    buttonActive: {
        backgroundColor: '#e3f2fd',
    },
    icon: {
        fontSize: 18,
        marginRight: 8,
    },
    label: {
        fontSize: 13,
        color: '#666',
        fontWeight: '500',
    },
    labelActive: {
        color: '#1976d2',
        fontWeight: '700',
    },
});
