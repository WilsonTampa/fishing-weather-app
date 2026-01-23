# Solunar Component Mockup

## Design Concept

A clean, marine-focused component showing:
1. **Solunar Periods** - Major/minor feeding times with visual timeline
2. **Sun Times** - Sunrise, sunset, solar noon
3. **Moon Times** - Moonrise, moonset, phase info

---

## Visual Layout (Mobile & Desktop Responsive)

```
╔══════════════════════════════════════════════════════════════════════╗
║  🌓 SOLUNAR FISHING FORECAST                                         ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                       ║
║  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ║
║  12AM    3AM     6AM     9AM    12PM    3PM     6PM     9PM    12AM  ║
║    └─────┴───█───┴───────┴───█───┴──────┴───█───┴──────┴───█───┘    ║
║          │  MAJOR  │        MINOR      │  MAJOR  │        MINOR      ║
║        6:15-     11:30-              6:45-    12:00-                 ║
║        8:15AM    12:30PM             8:45PM   1:00AM                 ║
║                                                                       ║
║  ══════════════════════════════════════════════════════════════════  ║
║                                                                       ║
║  ☀️ SUN                          🌙 MOON                             ║
║  ┌──────────────────────────┐   ┌──────────────────────────────┐    ║
║  │ Sunrise      7:21 AM     │   │ Moonrise      10:13 AM       │    ║
║  │ Solar Noon   12:42 PM    │   │ Moonset       10:57 PM       │    ║
║  │ Sunset       6:03 PM     │   │ Phase         Waxing Crescent│    ║
║  │ Day Length   10h 42m     │   │ Illumination  24%            │    ║
║  └──────────────────────────┘   └──────────────────────────────┘    ║
║                                                                       ║
║  📊 FISHING ACTIVITY: ████████░░ 82% - EXCELLENT                     ║
║                                                                       ║
╚══════════════════════════════════════════════════════════════════════╝
```

---

## Component Structure

### Header
- Title: "🌓 SOLUNAR FISHING FORECAST"
- Subtle background similar to other chart components

### Solunar Timeline (Main Feature)
- **24-hour timeline** with hour markers
- **Major Periods** (2 hours): Darker, wider bars - Moon overhead/underfoot
- **Minor Periods** (1 hour): Lighter, thinner bars - Moonrise/moonset
- **Time labels** under each period
- **Mobile**: Scrollable horizontally if needed
- **Desktop**: Full width timeline

### Sun & Moon Info Cards (Side by Side)
Two equal-width cards:

**☀️ Sun Card:**
- Sunrise time
- Solar noon
- Sunset time
- Day length (calculated)

**🌙 Moon Card:**
- Moonrise time
- Moonset time
- Phase name (from existing calculation)
- Illumination % (from existing calculation)

### Activity Score Bar
- Overall fishing activity rating (0-100%)
- Color-coded:
  - 0-30%: Poor (gray)
  - 31-60%: Fair (yellow)
  - 61-85%: Good (orange)
  - 86-100%: Excellent (green)
- Text label: "POOR", "FAIR", "GOOD", "EXCELLENT"

---

## Color Scheme (Dark Theme)

```css
--color-solunar-major: #FFA500      /* Orange - major periods */
--color-solunar-minor: #FFD700      /* Gold - minor periods */
--color-solunar-timeline: #30363D   /* Border color */
--color-sun: #FFD700                /* Gold sun */
--color-moon: #A8B2D1               /* Soft blue moon */
--color-activity-excellent: #10B981 /* Green */
--color-activity-good: #F59E0B      /* Orange */
--color-activity-fair: #EAB308      /* Yellow */
--color-activity-poor: #6B7280      /* Gray */
```

---

## Responsive Breakpoints

### Desktop (>768px)
```
┌────────────────────────────────────────────────┐
│          SOLUNAR FISHING FORECAST              │
├────────────────────────────────────────────────┤
│     [Full 24-hour timeline with periods]      │
├─────────────────────┬──────────────────────────┤
│   ☀️ SUN CARD      │   🌙 MOON CARD          │
│   - Sunrise         │   - Moonrise             │
│   - Solar noon      │   - Moonset              │
│   - Sunset          │   - Phase                │
│   - Day length      │   - Illumination         │
└─────────────────────┴──────────────────────────┘
│     [Activity Bar: 82% EXCELLENT]             │
└────────────────────────────────────────────────┘
```

### Mobile (<768px)
```
┌──────────────────────────┐
│   SOLUNAR FORECAST       │
├──────────────────────────┤
│ [Timeline - scroll →]    │
├──────────────────────────┤
│   ☀️ SUN                │
│   Sunrise    7:21 AM     │
│   Sunset     6:03 PM     │
│   Solar Noon 12:42 PM    │
│   Day Length 10h 42m     │
├──────────────────────────┤
│   🌙 MOON                │
│   Moonrise   10:13 AM    │
│   Moonset    10:57 PM    │
│   Phase      Waxing      │
│   Illum.     24%         │
├──────────────────────────┤
│   Activity: EXCELLENT    │
│   ████████░░ 82%         │
└──────────────────────────┘
```

---

## Solunar Period Calculation

**Major Periods (2 hours each):**
- Moon overhead (lunar transit)
- Moon underfoot (opposite side of Earth)

**Minor Periods (1 hour each):**
- Moonrise
- Moonset

**Best Fishing Times:**
1. Major periods (highest activity)
2. Minor periods (moderate activity)
3. Overlapping with sunrise/sunset (even better)

---

## Data Requirements

**From SunCalc Library:**
```typescript
import SunCalc from 'suncalc';

const times = SunCalc.getTimes(date, lat, lng);
// times.sunrise, times.sunset, times.solarNoon

const moonTimes = SunCalc.getMoonTimes(date, lat, lng);
// moonTimes.rise, moonTimes.set

const moonPos = SunCalc.getMoonPosition(date, lat, lng);
// moonPos.altitude (for calculating overhead/underfoot)
```

**From Existing moonPhase.ts:**
```typescript
const moonPhase = calculateMoonPhase(date);
// moonPhase.phaseName, moonPhase.illumination
```

---

## Implementation Notes

1. **Timeline**: SVG or canvas for smooth rendering
2. **Period bars**: Positioned based on time of day (0-24 hours)
3. **Activity score**: Calculated based on:
   - Number of periods in daylight hours
   - Moon phase (new/full moon = higher)
   - Overlap of periods with sunrise/sunset
4. **Responsive**: Flex layout for cards, horizontal scroll for timeline on mobile

---

## Example Component Code Structure

```typescript
interface SolunarData {
  sunrise: Date;
  sunset: Date;
  solarNoon: Date;
  moonrise: Date | null;
  moonset: Date | null;
  moonPhase: string;
  moonIllumination: number;
  majorPeriods: { start: Date; end: Date }[];
  minorPeriods: { start: Date; end: Date }[];
  activityScore: number;
}

function SolunarChart({ data, selectedDay }: SolunarChartProps) {
  // Render timeline with periods
  // Render sun/moon cards
  // Render activity bar
}
```

---

## Why This Design?

1. **Timeline is focal point** - Anglers want to know WHEN to fish
2. **Visual periods** - Easy to see at a glance without reading times
3. **Sun/moon cards** - Supporting info for planning trip timing
4. **Activity score** - Quick "go/no-go" decision
5. **Marine aesthetic** - Matches existing wind/tide/weather charts
6. **Responsive** - Works on phone (at the dock) and desktop (planning)

