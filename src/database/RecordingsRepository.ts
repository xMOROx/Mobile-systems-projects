import { Repository } from './Repository';
import { RecordingEntry } from '../types';
import { SQL_QUERIES } from './schema';

export class RecordingsRepository extends Repository {
    findAll(): RecordingEntry[] {
        try {
            return this.runQuery<RecordingEntry>(SQL_QUERIES.SELECT_ALL_RECORDINGS);
        } catch (error) {
            console.error('Error fetching all recordings:', error);
            return [];
        }
    }

    findById(id: number): RecordingEntry | null {
        try {
            return this.runSingleQuery<RecordingEntry>(
                SQL_QUERIES.SELECT_RECORDING_BY_ID,
                [id]
            );
        } catch (error) {
            console.error('Error fetching recording by id:', error);
            return null;
        }
    }

    findByLocation(
        latitude: number,
        longitude: number,
        radius: number = 0.01
    ): RecordingEntry[] {
        try {
            return this.runQuery<RecordingEntry>(
                SQL_QUERIES.SELECT_RECORDINGS_BY_LOCATION,
                [latitude - radius, latitude + radius, longitude - radius, longitude + radius]
            );
        } catch (error) {
            console.error('Error fetching recordings by location:', error);
            return [];
        }
    }

    create(
        uri: string,
        latitude: number,
        longitude: number,
        duration?: number,
        averageDecibels?: number,
        peakDecibels?: number
    ): number {
        return this.executeInTransaction(() => {
            const result = this.executeStatement(SQL_QUERIES.INSERT_RECORDING, [
                uri,
                latitude,
                longitude,
                Date.now(),
                duration ?? null,
                averageDecibels ?? null,
                peakDecibels ?? null,
            ]);
            return result.lastInsertRowId;
        });
    }

    updateAnalysis(
        id: number,
        duration: number,
        averageDecibels: number,
        peakDecibels: number
    ): void {
        this.executeInTransaction(() => {
            this.executeStatement(SQL_QUERIES.UPDATE_RECORDING_ANALYSIS, [
                duration,
                averageDecibels,
                peakDecibels,
                id,
            ]);
        });
    }

    delete(id: number): void {
        this.executeInTransaction(() => {
            this.executeStatement(SQL_QUERIES.DELETE_RECORDING, [id]);
        });
    }

    deleteAll(): void {
        this.executeInTransaction(() => {
            this.executeStatement(SQL_QUERIES.DELETE_ALL_RECORDINGS);
        });
    }

    count(): number {
        const result = this.runSingleQuery<{ count: number }>(SQL_QUERIES.COUNT_RECORDINGS);
        return result?.count ?? 0;
    }
}
