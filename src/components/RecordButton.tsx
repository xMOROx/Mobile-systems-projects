import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

interface RecordButtonProps {
    isRecording: boolean;
    onPress: () => void;
    disabled?: boolean;
}

export const RecordButton: React.FC<RecordButtonProps> = ({ isRecording, onPress, disabled }) => {
    return (
        <TouchableOpacity
            style={[
                styles.recordButton,
                isRecording ? styles.recordingActive : null,
                disabled ? styles.disabled : null,
            ]}
            onPress={onPress}
            disabled={disabled}
        >
            <Text style={styles.recordButtonText}>
                {isRecording ? 'STOP 🛑' : 'RECORD 🎙️'}
            </Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    recordButton: {
        backgroundColor: 'white',
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 30,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    recordingActive: {
        backgroundColor: '#ffcccc',
        borderColor: 'red',
        borderWidth: 2,
    },
    disabled: {
        opacity: 0.5,
    },
    recordButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
});
