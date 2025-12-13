export interface RecordingEntry {
    id: number;
    uri: string;
    latitude: number;
    longitude: number;
    timestamp: number;
    duration?: number;
    averageDecibels?: number;
    peakDecibels?: number;
}

export interface AudioAnalysis {
    duration: number;
    averageDecibels: number;
    peakDecibels: number;
}

export interface LocationCoords {
    latitude: number;
    longitude: number;
}
