export const CREATE_TABLE_RECORDINGS = `
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
`;

export const SELECT_ALL_RECORDINGS = 'SELECT * FROM recordings ORDER BY timestamp DESC';

export const INSERT_RECORDING = `
  INSERT INTO recordings (uri, latitude, longitude, timestamp, duration, averageDecibels, peakDecibels) 
  VALUES (?, ?, ?, ?, ?, ?, ?)
`;

export const DELETE_RECORDING = 'DELETE FROM recordings WHERE id = ?';

export const SELECT_RECORDINGS_BY_LOCATION = `
  SELECT * FROM recordings 
  WHERE latitude BETWEEN ? AND ? 
  AND longitude BETWEEN ? AND ?
`;
