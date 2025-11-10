import * as SQLite from 'expo-sqlite';

export class Repository {
    protected db: SQLite.SQLiteDatabase;

    constructor(database: SQLite.SQLiteDatabase) {
        this.db = database;
    }

    protected runQuery<T = any>(query: string, params: any[] = []): T[] {
        try {
            return this.db.getAllSync<T>(query, params);
        } catch (error) {
            console.error('Error executing query:', query, error);
            throw error;
        }
    }

    protected runSingleQuery<T = any>(query: string, params: any[] = []): T | null {
        try {
            const results = this.db.getAllSync<T>(query, params);
            return results.length > 0 ? results[0] : null;
        } catch (error) {
            console.error('Error executing single query:', query, error);
            throw error;
        }
    }

    protected executeStatement(query: string, params: any[] = []): SQLite.RunResult {
        try {
            return this.db.runSync(query, params);
        } catch (error) {
            console.error('Error executing statement:', query, error);
            throw error;
        }
    }

    protected executeInTransaction<T>(callback: () => T): T {
        return this.db.withTransactionSync(callback);
    }

    protected executeSchema(query: string): void {
        try {
            this.db.execSync(query);
        } catch (error) {
            console.error('Error executing schema:', query, error);
            throw error;
        }
    }
}
