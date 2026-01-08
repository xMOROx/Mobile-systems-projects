/**
 * Audio utility functions for metering and decibel calculations.
 */

/**
 * Converts raw metering value to decibels.
 * @param metering - Raw metering value from audio recording
 * @returns Decibel level or null if input is invalid
 */
export const convertMeteringToDecibels = (metering: number | null): number | null => {
  if (metering === null || Number.isNaN(metering)) return null;
  const normalized = Math.round(metering * 10) / 10;
  const C = 90; // Calibration constant
  const level = normalized + C;
  return level > 0 ? level : 0;
};
