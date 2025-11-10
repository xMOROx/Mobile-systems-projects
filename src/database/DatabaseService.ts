import * as SQLite from 'expo-sqlite';
import { RecordingEntry } from '../types';
import { RecordingsRepository } from './RecordingsRepository';
import { SQL_QUERIES } from './schema';

class DatabaseService {
    private db: SQLite.SQLiteDatabase;
    private recordingsRepo: RecordingsRepository;

    constructor() {
        this.db = SQLite.openDatabaseSync('soundmap.db');
        this.recordingsRepo = new RecordingsRepository(this.db);
        this.initDatabase();
    }

    private initDatabase() {
        this.db.withTransactionSync(() => {
            this.db.execSync(SQL_QUERIES.CREATE_RECORDINGS_TABLE);
        });
    }

    getAllRecordings(): RecordingEntry[] {
        return this.recordingsRepo.findAll();
    }

    getRecordingById(id: number): RecordingEntry | null {
        return this.recordingsRepo.findById(id);
    }

    getRecordingsByLocation(
        latitude: number,
        longitude: number,
        radius?: number
    ): RecordingEntry[] {
        return this.recordingsRepo.findByLocation(latitude, longitude, radius);
    }

    saveRecording(
        uri: string,
        latitude: number,
        longitude: number,
        duration?: number,
        averageDecibels?: number,
        peakDecibels?: number
    ): number {
        return this.recordingsRepo.create(
            uri,
            latitude,
            longitude,
            duration,
            averageDecibels,
            peakDecibels
        );
    }

    updateRecordingAnalysis(
        id: number,
        duration: number,
        averageDecibels: number,
        peakDecibels: number
    ): void {
        this.recordingsRepo.updateAnalysis(id, duration, averageDecibels, peakDecibels);
    }

    deleteRecording(id: number): void {
        this.recordingsRepo.delete(id);
    }

    deleteAllRecordings(): void {
        this.recordingsRepo.deleteAll();
    }

    getRecordingsCount(): number {
        return this.recordingsRepo.count();
    }

    closeDatabase(): void {
        this.db.closeSync();
    }

    resetDatabase(): void {
        this.db.withTransactionSync(() => {
            this.recordingsRepo.deleteAll();
        });
    }
}

export default new DatabaseService();
