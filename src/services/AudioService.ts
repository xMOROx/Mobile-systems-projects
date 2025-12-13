import { Audio } from 'expo-av';
import { AudioAnalysis } from '../types';

type RecordingStatus = Audio.RecordingStatus;

class AudioService {
    private recording: Audio.Recording | null = null;
    private statusListeners: Array<(status: RecordingStatus) => void> = [];

    async requestPermissions(): Promise<boolean> {
        const { status } = await Audio.requestPermissionsAsync();
        return status === 'granted';
    }

    async startRecording(): Promise<Audio.Recording> {
        const hasPermission = await this.requestPermissions();
        if (!hasPermission) {
            throw new Error('Audio permission denied');
        }

        await Audio.setAudioModeAsync({
            allowsRecordingIOS: true,
            playsInSilentModeIOS: true,
        });

        const recordingOptions: Audio.RecordingOptions = {
            ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
            isMeteringEnabled: true,
        };

        const { recording } = await Audio.Recording.createAsync(recordingOptions);

        recording.setProgressUpdateInterval(250);
        recording.setOnRecordingStatusUpdate(this.handleStatusUpdate);

        this.recording = recording;
        return recording;
    }

    async stopRecording(): Promise<{ uri: string; analysis: AudioAnalysis }> {
        if (!this.recording) {
            throw new Error('No active recording');
        }

        await this.recording.stopAndUnloadAsync();
        const uri = this.recording.getURI();
        const status = await this.recording.getStatusAsync();

        this.recording.setOnRecordingStatusUpdate(undefined);
        this.recording = null;
        this.statusListeners = [];

        if (!uri) {
            throw new Error('Recording URI is null');
        }

        const analysis = await this.analyzeRecording(uri, status);

        return { uri, analysis };
    }
    //TODO: use a real audio analysis library to get decibel levels
    private async analyzeRecording(uri: string, status: any): Promise<AudioAnalysis> {
        const duration = status.durationMillis ? status.durationMillis / 1000 : 0;

        const averageDecibels = Math.random() * 30 + 50;
        const peakDecibels = averageDecibels + Math.random() * 20;

        return {
            duration,
            averageDecibels: Math.round(averageDecibels * 10) / 10,
            peakDecibels: Math.round(peakDecibels * 10) / 10,
        };
    }

    async playRecording(uri: string): Promise<Audio.Sound> {
        const { sound } = await Audio.Sound.createAsync({ uri });
        await sound.playAsync();
        return sound;
    }

    isRecording(): boolean {
        return this.recording !== null;
    }

    addStatusListener(listener: (status: RecordingStatus) => void): () => void {
        this.statusListeners.push(listener);
        return () => {
            this.statusListeners = this.statusListeners.filter(cb => cb !== listener);
        };
    }

    private handleStatusUpdate = (status: RecordingStatus) => {
        if (!status.isRecording) {
            return;
        }
        this.statusListeners.forEach(listener => listener(status));
    };
}

export default new AudioService();
