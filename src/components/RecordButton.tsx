import React, { useEffect, useRef } from 'react';
import { StyleSheet, TouchableOpacity, View, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface RecordButtonProps {
    isRecording: boolean;
    onPress: () => void;
    disabled?: boolean;
}

export const RecordButton: React.FC<RecordButtonProps> = ({ isRecording, onPress, disabled }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        let animation: Animated.CompositeAnimation;
        if (isRecording) {
            animation = Animated.loop(
                Animated.sequence([
                    Animated.timing(scaleAnim, {
                        toValue: 1.2,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(scaleAnim, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                ])
            );
            animation.start();
        } else {
            scaleAnim.setValue(1);
        }

        return () => {
            if (animation) animation.stop();
        };
    }, [isRecording]);

    return (
        <View style={styles.container}>
            {isRecording && (
                <Animated.View
                    style={[
                        styles.pulseRing,
                        {
                            transform: [{ scale: scaleAnim }],
                        },
                    ]}
                />
            )}
            <TouchableOpacity
                style={[
                    styles.recordButton,
                    isRecording ? styles.recordingActive : styles.recordingInactive,
                    disabled ? styles.disabled : null,
                ]}
                onPress={onPress}
                disabled={disabled}
                activeOpacity={0.8}
            >
                <Ionicons
                    name={isRecording ? "stop" : "mic"}
                    size={32}
                    color={isRecording ? "white" : "white"}
                />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 100,
        height: 100,
    },
    recordButton: {
        width: 70,
        height: 70,
        borderRadius: 35,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        zIndex: 2,
    },
    recordingInactive: {
        backgroundColor: '#FF4444',
    },
    recordingActive: {
        backgroundColor: '#CC0000',
    },
    disabled: {
        backgroundColor: '#CCCCCC',
        elevation: 0,
    },
    pulseRing: {
        position: 'absolute',
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: 'rgba(255, 0, 0, 0.3)',
        zIndex: 1,
    },
});
