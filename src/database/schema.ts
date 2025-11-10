export const TABLES = {
    RECORDINGS: 'recordings',
} as const;

export const SQL_QUERIES = {
    CREATE_RECORDINGS_TABLE: `
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
  `,

    SELECT_ALL_RECORDINGS: `
    SELECT * FROM recordings 
    ORDER BY timestamp DESC
  `,

    INSERT_RECORDING: `
    INSERT INTO recordings (uri, latitude, longitude, timestamp, duration, averageDecibels, peakDecibels) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `,

    DELETE_RECORDING: `
    DELETE FROM recordings 
    WHERE id = ?
  `,

    SELECT_RECORDINGS_BY_LOCATION: `
    SELECT * FROM recordings 
    WHERE latitude BETWEEN ? AND ? 
    AND longitude BETWEEN ? AND ?
  `,

    SELECT_RECORDING_BY_ID: `
    SELECT * FROM recordings 
    WHERE id = ?
  `,

    UPDATE_RECORDING_ANALYSIS: `
    UPDATE recordings 
    SET duration = ?, averageDecibels = ?, peakDecibels = ? 
    WHERE id = ?
  `,

    COUNT_RECORDINGS: `
    SELECT COUNT(*) as count FROM recordings
  `,

    DELETE_ALL_RECORDINGS: `
    DELETE FROM recordings
  `,
} as const;
