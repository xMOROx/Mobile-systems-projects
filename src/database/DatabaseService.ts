import * as SQLite from 'expo-sqlite';
import { RecordingEntry } from '../types';
import {
    CREATE_TABLE_RECORDINGS,
    SELECT_ALL_RECORDINGS,
    INSERT_RECORDING,
    DELETE_RECORDING,
    SELECT_RECORDINGS_BY_LOCATION
} from './queries';

class DatabaseService {
    private db: SQLite.SQLiteDatabase;

    constructor() {
        this.db = SQLite.openDatabaseSync('soundmap.db');
        this.initDatabase();
    }

    private initDatabase() {
        this.db.withTransactionSync(() => {
            this.db.execSync(CREATE_TABLE_RECORDINGS);
        });
    }

    getAllRecordings(): RecordingEntry[] {
        try {
            return this.db.getAllSync<RecordingEntry>(SELECT_ALL_RECORDINGS);
        } catch (error) {
            console.error('Error fetching recordings:', error);
            return [];
        }
    }

    saveRecording(
        uri: string,
        latitude: number,
        longitude: number,
        duration?: number,
        averageDecibels?: number,
        peakDecibels?: number
    ): number {
        let insertId = 0;
        this.db.withTransactionSync(() => {
            const result = this.db.runSync(
                INSERT_RECORDING,
                [uri, latitude, longitude, Date.now(), duration || null, averageDecibels || null, peakDecibels || null]
            );
            insertId = result.lastInsertRowId;
        });
        return insertId;
    }

    deleteRecording(id: number): void {
        this.db.withTransactionSync(() => {
            this.db.runSync(DELETE_RECORDING, [id]);
        });
    }

    getRecordingsByLocation(latitude: number, longitude: number, radius: number = 0.01): RecordingEntry[] {
        try {
            return this.db.getAllSync<RecordingEntry>(
                SELECT_RECORDINGS_BY_LOCATION,
                [latitude - radius, latitude + radius, longitude - radius, longitude + radius]
            );
        } catch (error) {
            console.error('Error fetching recordings by location:', error);
            return [];
        }
    }
}

export default new DatabaseService();
