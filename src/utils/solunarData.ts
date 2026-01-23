import SunCalc from 'suncalc';
import { calculateMoonPhase } from './moonPhase';

export interface SolunarPeriod {
  start: Date;
  end: Date;
}

export interface SolunarData {
  sunrise: Date;
  sunset: Date;
  solarNoon: Date;
  moonrise: Date | null;
  moonset: Date | null;
  moonPhase: string;
  moonIllumination: number;
  majorPeriods: SolunarPeriod[];
  minorPeriods: SolunarPeriod[];
  activityScore: number;
  dayLength: string;
}

/**
 * Calculate solunar data for fishing forecast
 * Based on John Alden Knight's Solunar Theory (1926)
 */
export function getSolunarData(date: Date, lat: number, lng: number): SolunarData {
  // Get sun times
  const sunTimes = SunCalc.getTimes(date, lat, lng);
  const sunrise = sunTimes.sunrise;
  const sunset = sunTimes.sunset;
  const solarNoon = sunTimes.solarNoon;

  // Calculate day length
  const dayLengthMs = sunset.getTime() - sunrise.getTime();
  const hours = Math.floor(dayLengthMs / (1000 * 60 * 60));
  const minutes = Math.floor((dayLengthMs % (1000 * 60 * 60)) / (1000 * 60));
  const dayLength = `${hours}h ${minutes}m`;

  // Get moon times
  const moonTimes = SunCalc.getMoonTimes(date, lat, lng);
  const moonrise = moonTimes.rise || null;
  const moonset = moonTimes.set || null;

  // Get moon illumination
  const moonIllum = SunCalc.getMoonIllumination(date);
  const moonPhaseData = calculateMoonPhase(date);

  // Calculate major and minor periods
  const { majorPeriods, minorPeriods } = calculateSolunarPeriods(
    date,
    lat,
    lng,
    moonrise,
    moonset
  );

  // Calculate activity score (0-100)
  const activityScore = calculateActivityScore(
    majorPeriods,
    minorPeriods,
    moonIllum.fraction,
    sunrise,
    sunset
  );

  return {
    sunrise,
    sunset,
    solarNoon,
    moonrise,
    moonset,
    moonPhase: moonPhaseData.phaseName,
    moonIllumination: Math.round(moonIllum.fraction * 100),
    majorPeriods,
    minorPeriods,
    activityScore,
    dayLength
  };
}

/**
 * Calculate solunar feeding periods
 * Major periods: Moon overhead (transit) and underfoot (opposite side)
 * Minor periods: Moonrise and moonset
 */
function calculateSolunarPeriods(
  date: Date,
  lat: number,
  lng: number,
  moonrise: Date | null,
  moonset: Date | null
): { majorPeriods: SolunarPeriod[]; minorPeriods: SolunarPeriod[] } {
  const majorPeriods: SolunarPeriod[] = [];
  const minorPeriods: SolunarPeriod[] = [];

  // Find moon transit (overhead) - when moon crosses the meridian
  const moonTransit = findMoonTransit(date, lat, lng);

  if (moonTransit) {
    // Major period 1: Moon overhead (transit) - 2 hours centered on transit
    const major1Start = new Date(moonTransit.getTime() - 60 * 60 * 1000);
    const major1End = new Date(moonTransit.getTime() + 60 * 60 * 1000);
    majorPeriods.push({ start: major1Start, end: major1End });

    // Major period 2: Moon underfoot (12 hours opposite) - 2 hours centered
    const moonUnderfoot = new Date(moonTransit.getTime() + 12 * 60 * 60 * 1000);
    const major2Start = new Date(moonUnderfoot.getTime() - 60 * 60 * 1000);
    const major2End = new Date(moonUnderfoot.getTime() + 60 * 60 * 1000);
    majorPeriods.push({ start: major2Start, end: major2End });
  }

  // Minor period 1: Moonrise - 1 hour centered on moonrise
  if (moonrise) {
    const minor1Start = new Date(moonrise.getTime() - 30 * 60 * 1000);
    const minor1End = new Date(moonrise.getTime() + 30 * 60 * 1000);
    minorPeriods.push({ start: minor1Start, end: minor1End });
  }

  // Minor period 2: Moonset - 1 hour centered on moonset
  if (moonset) {
    const minor2Start = new Date(moonset.getTime() - 30 * 60 * 1000);
    const minor2End = new Date(moonset.getTime() + 30 * 60 * 1000);
    minorPeriods.push({ start: minor2Start, end: minor2End });
  }

  return { majorPeriods, minorPeriods };
}

/**
 * Find the time when the moon crosses the meridian (highest point in sky)
 * This is the lunar transit time - when moon is "overhead"
 */
function findMoonTransit(date: Date, lat: number, lng: number): Date | null {
  // Start at midnight of the given date
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  let maxAltitude = -Infinity;
  let transitTime: Date | null = null;

  // Check every 15 minutes throughout the day to find peak altitude
  for (let minutes = 0; minutes < 24 * 60; minutes += 15) {
    const checkTime = new Date(startOfDay.getTime() + minutes * 60 * 1000);
    const moonPos = SunCalc.getMoonPosition(checkTime, lat, lng);

    if (moonPos.altitude > maxAltitude) {
      maxAltitude = moonPos.altitude;
      transitTime = checkTime;
    }
  }

  return transitTime;
}

/**
 * Calculate fishing activity score based on solunar factors
 * Returns 0-100 score
 */
function calculateActivityScore(
  majorPeriods: SolunarPeriod[],
  minorPeriods: SolunarPeriod[],
  moonIllumination: number,
  sunrise: Date,
  sunset: Date
): number {
  let score = 50; // Base score

  // Moon phase bonus: New and full moons increase activity
  // Best: 0% (new) or 100% (full), Worst: 50% (quarters)
  const moonPhaseFactor = Math.abs(moonIllumination - 0.5) * 2; // 0 at quarters, 1 at new/full
  score += moonPhaseFactor * 20; // +0 to +20 points

  // Major periods during daylight hours (best fishing)
  let daylightMajorPeriods = 0;
  for (const period of majorPeriods) {
    if (period.start <= sunset && period.end >= sunrise) {
      daylightMajorPeriods++;
      score += 10; // +10 points per major period in daylight
    }
  }

  // Minor periods during daylight hours
  let daylightMinorPeriods = 0;
  for (const period of minorPeriods) {
    if (period.start <= sunset && period.end >= sunrise) {
      daylightMinorPeriods++;
      score += 5; // +5 points per minor period in daylight
    }
  }

  // Overlap bonus: Periods coinciding with sunrise/sunset are exceptional
  const sunriseTime = sunrise.getTime();
  const sunsetTime = sunset.getTime();

  for (const period of [...majorPeriods, ...minorPeriods]) {
    const periodStart = period.start.getTime();
    const periodEnd = period.end.getTime();

    // Check if period overlaps with sunrise or sunset (within 30 minutes)
    const sunriseOverlap =
      (periodStart <= sunriseTime && periodEnd >= sunriseTime - 30 * 60 * 1000) ||
      (periodStart <= sunriseTime + 30 * 60 * 1000 && periodEnd >= sunriseTime);

    const sunsetOverlap =
      (periodStart <= sunsetTime && periodEnd >= sunsetTime - 30 * 60 * 1000) ||
      (periodStart <= sunsetTime + 30 * 60 * 1000 && periodEnd >= sunsetTime);

    if (sunriseOverlap || sunsetOverlap) {
      score += 10; // Bonus for dawn/dusk overlap
    }
  }

  // Clamp score to 0-100 range
  return Math.min(100, Math.max(0, Math.round(score)));
}
