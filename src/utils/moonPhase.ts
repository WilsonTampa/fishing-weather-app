/**
 * Moon phase calculation utilities
 * Based on astronomical algorithms for calculating lunar phases
 */

export interface MoonPhaseData {
  phase: number; // 0-1, where 0/1 = new moon, 0.5 = full moon
  phaseName: string; // "New Moon", "Waxing Crescent", etc.
  illumination: number; // 0-100, percentage of moon illuminated
  emoji: string; // Moon phase emoji
}

/**
 * Calculate the moon phase for a given date
 * Uses the astronomical algorithm based on Julian dates
 */
export function calculateMoonPhase(date: Date): MoonPhaseData {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // JavaScript months are 0-indexed
  const day = date.getDate();

  // More accurate Julian date calculation
  let y = year;
  let m = month;
  if (m <= 2) {
    y -= 1;
    m += 12;
  }

  const a = Math.floor(y / 100);
  const b = 2 - a + Math.floor(a / 4);

  const jd = Math.floor(365.25 * (y + 4716)) +
             Math.floor(30.6001 * (m + 1)) +
             day + b - 1524.5;

  // Known new moon reference: January 6, 2000 12:00 UTC
  const knownNewMoon = 2451550.1;
  const daysSinceNew = jd - knownNewMoon;

  // Moon's synodic period (new moon to new moon) is 29.53058867 days
  const synodicMonth = 29.53058867;

  // Calculate phase (0-1)
  let phase = (daysSinceNew % synodicMonth) / synodicMonth;

  // Normalize to 0-1 range
  if (phase < 0) phase += 1;

  // Calculate illumination percentage
  const illumination = (1 - Math.cos(phase * 2 * Math.PI)) / 2 * 100;

  // Determine phase name and emoji
  const { phaseName, emoji } = getMoonPhaseName(phase);

  return {
    phase,
    phaseName,
    illumination: Math.round(illumination),
    emoji
  };
}

/**
 * Get the name and emoji for a moon phase value
 * Moon phase emojis for Northern Hemisphere perspective:
 * 🌑 New Moon (0%)
 * 🌒 Waxing Crescent (right side lit)
 * 🌓 First Quarter (right half lit)
 * 🌔 Waxing Gibbous (mostly lit, left dark)
 * 🌕 Full Moon (100%)
 * 🌖 Waning Gibbous (mostly lit, right dark)
 * 🌗 Last Quarter (left half lit)
 * 🌘 Waning Crescent (left side lit)
 */
function getMoonPhaseName(phase: number): { phaseName: string; emoji: string } {
  // Phase value: 0 = New Moon, 0.25 = First Quarter, 0.5 = Full, 0.75 = Last Quarter
  if (phase < 0.0625 || phase >= 0.9375) {
    // New Moon ±3 days
    return { phaseName: 'New Moon', emoji: '🌑' };
  } else if (phase < 0.1875) {
    // Waxing Crescent (0-25%)
    return { phaseName: 'Waxing Crescent', emoji: '🌒' };
  } else if (phase < 0.3125) {
    // First Quarter (around 50%, right half)
    return { phaseName: 'First Quarter', emoji: '🌓' };
  } else if (phase < 0.4375) {
    // Waxing Gibbous (50-100%)
    return { phaseName: 'Waxing Gibbous', emoji: '🌔' };
  } else if (phase < 0.5625) {
    // Full Moon ±3 days
    return { phaseName: 'Full Moon', emoji: '🌕' };
  } else if (phase < 0.6875) {
    // Waning Gibbous (100-50%)
    return { phaseName: 'Waning Gibbous', emoji: '🌖' };
  } else if (phase < 0.8125) {
    // Last Quarter (around 50%, left half)
    return { phaseName: 'Last Quarter', emoji: '🌗' };
  } else {
    // Waning Crescent (25-0%)
    return { phaseName: 'Waning Crescent', emoji: '🌘' };
  }
}

/**
 * Get moon phase for multiple dates
 */
export function getMoonPhasesForDates(dates: Date[]): MoonPhaseData[] {
  return dates.map(date => calculateMoonPhase(date));
}

/**
 * Check if a date is near a full moon (within 1 day)
 */
export function isNearFullMoon(date: Date): boolean {
  const moonPhase = calculateMoonPhase(date);
  // Full moon is at phase 0.5, check if within ~0.033 (1 day out of 29.5 day cycle)
  return Math.abs(moonPhase.phase - 0.5) < 0.033;
}

/**
 * Check if a date is near a new moon (within 1 day)
 */
export function isNearNewMoon(date: Date): boolean {
  const moonPhase = calculateMoonPhase(date);
  // New moon is at phase 0 or 1, check if within ~0.033
  return moonPhase.phase < 0.033 || moonPhase.phase > 0.967;
}
