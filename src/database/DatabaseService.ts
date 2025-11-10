import * as SQLite from 'expo-sqlite';
import { RecordingEntry } from '../types';

class DatabaseService {
    private db: SQLite.SQLiteDatabase;

    constructor() {
        this.db = SQLite.openDatabaseSync('soundmap.db');
        this.initDatabase();
    }

    private initDatabase() {
        this.db.withTransactionSync(() => {

            this.db.execSync(`
        CREATE TABLE IF NOT EXISTS recordings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          uri TEXT NOT NULL,
          latitude REAL NOT NULL,
          longitude REAL NOT NULL,
          timestamp INTEGER NOT NULL,
          duration REAL,
          averageDecibels REAL,
          peakDecibels REAL
        );
      `);
        });
    }

    getAllRecordings(): RecordingEntry[] {
        try {
            return this.db.getAllSync<RecordingEntry>('SELECT * FROM recordings ORDER BY timestamp DESC');
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
        return this.db.withTransactionSync(() => {
            const result = this.db.runSync(
                `INSERT INTO recordings (uri, latitude, longitude, timestamp, duration, averageDecibels, peakDecibels) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [uri, latitude, longitude, Date.now(), duration || null, averageDecibels || null, peakDecibels || null]
            );
            return result.lastInsertRowId;
        });
    }

    deleteRecording(id: number): void {
        this.db.withTransactionSync(() => {
            this.db.runSync('DELETE FROM recordings WHERE id = ?', [id]);
        });
    }

    getRecordingsByLocation(latitude: number, longitude: number, radius: number = 0.01): RecordingEntry[] {
        try {
            return this.db.getAllSync<RecordingEntry>(
                `SELECT * FROM recordings 
         WHERE latitude BETWEEN ? AND ? 
         AND longitude BETWEEN ? AND ?`,
                [latitude - radius, latitude + radius, longitude - radius, longitude + radius]
            );
        } catch (error) {
            console.error('Error fetching recordings by location:', error);
            return [];
        }
    }
}

export default new DatabaseService();
