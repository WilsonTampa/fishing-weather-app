# Product Requirements Document (PRD)
## Fishing & Boating Weather App

**Version:** 1.0
**Date:** January 20, 2026
**Status:** Draft

---

## 1. Executive Summary

### 1.1 Product Overview
A responsive web application designed for fishermen and boaters to quickly access critical weather and tide information for US coastal waters. Users select a location on an interactive map and view hourly wind conditions and tide predictions for planning their outings. The app is accessible from any mobile or desktop browser without requiring installation.

### 1.2 Target Audience
- Recreational fishermen
- Recreational boaters
- Coastal water sports enthusiasts
- Anyone planning water-based activities in US coastal areas

### 1.3 Product Goals
- Provide quick, easy access to wind and tide data
- Eliminate need to check multiple sources
- Mobile-first responsive web app accessible from any browser
- Simple, intuitive interface for use in field conditions
- Free to use with no account required
- Publishable as a public website

---

## 2. Product Scope

### 2.1 In Scope (MVP)
- Interactive map for location selection
- Save selected location (persists until user changes it)
- 7-day forecast view with day selector
- Hourly wind speed and direction visualization
- Hourly temperature display for selected day
- Tide chart with high/low tide predictions
- Current weather conditions display
- Fully responsive design (mobile, tablet, desktop)
- Browser-accessible (no installation required)
- US coastal waters coverage
- SEO optimization for web discovery

### 2.2 Out of Scope (Future Releases)
- User accounts and authentication
- Multiple saved favorite locations
- Weather alerts and notifications
- Social features or community
- Fishing conditions/recommendations
- Marine forecasts beyond wind/tides
- PWA offline installation capability
- Premium features or monetization

### 2.3 Geographic Coverage
- US coastal waters (Atlantic, Pacific, Gulf of Mexico)
- Major US lakes with tide stations
- Based on NOAA tide station availability

---

## 3. User Stories

### 3.1 Primary User Stories

**As a fisherman, I want to:**
- Select my fishing spot on a map so I can see conditions for that specific location
- Have my location saved so I don't need to select it every time I visit
- View hourly wind forecasts so I can plan when to go out
- See hourly temperatures so I can dress appropriately and know comfort levels
- See tide predictions so I can time my fishing with optimal tide conditions
- Check multiple days ahead so I can plan my week
- Access the app quickly on my phone while at the dock

**As a boater, I want to:**
- Check wind conditions before departing so I can ensure safe conditions
- View tide information so I can navigate shallow areas safely
- See wind direction so I can plan my route
- Check hourly temperature to plan for weather changes throughout the day
- Compare conditions across multiple days to pick the best day

### 3.2 User Scenarios

**Scenario 1: First Time Planning a Fishing Trip**
1. User opens app on phone for the first time
2. Taps location on map near their favorite fishing spot
3. Location is automatically saved
4. Views today's wind, temperature, and tide forecast
5. Checks hourly temperatures to plan what to wear
6. Swipes through next 3 days to find best conditions
7. Closes browser

**Scenario 2: Morning Dock Check (Returning User)**
1. User opens website on phone while at marina
2. App automatically loads their previously saved location
3. Checks current wind speed, temperature, and tide level for their saved spot
4. Reviews hourly forecast to see if conditions will improve or worsen
5. Decides whether to depart based on conditions

**Scenario 3: Changing Location**
1. User taps the location pin icon
2. Returns to map view
3. Selects a new location
4. New location replaces the previous saved location

---

## 4. Functional Requirements

### 4.1 Map View (Landing Screen)

**FR-1.1: Display Interactive Map**
- Show interactive map of US coastal areas
- Support pan and zoom gestures
- Default view: Saved location (if exists) or US coast overview
- Map should load within 2 seconds

**FR-1.2: Location Selection**
- User can tap/click anywhere on map to select location
- Display marker at selected location
- Show loading indicator while fetching data
- Store coordinates (latitude/longitude) for API calls
- Automatically save selected location to browser localStorage

**FR-1.3: Current Location**
- Provide "Current Location" button
- Request geolocation permission when clicked
- Center map and select user's current location
- Save current location to localStorage when selected
- Handle permission denied gracefully

**FR-1.5: Saved Location Persistence**
- Store selected location in browser localStorage
- Load saved location on app startup
- If saved location exists, skip map view and load forecast directly
- Location persists across browser sessions
- Only one location saved at a time (new selection overwrites previous)

**FR-1.4: Tide Station Indicators**
- Display nearest NOAA tide stations as map markers
- Show station name on hover/tap
- Allow direct selection of tide station

### 4.2 Forecast View (Main Screen)

**FR-2.1: Header**
- Display screen title (changeable: "Wind", "Tides", "Weather")
- Show selected location name/coordinates
- Include menu/settings icon (future use)
- Include location pin icon to return to map

**FR-2.2: Day Selector**
- Horizontal scrollable day picker
- Display 7 days (today + 6 future days)
- Show date number and day name
- Highlight currently selected day
- Default to "Today" on initial load

**FR-2.3: Location Display**
- Show location name or "Lat, Lon" format
- Include pin icon indicating location
- Tappable to return to map view and change location
- Visual indicator that this is the saved location

### 4.3 Wind Visualization

**FR-3.1: Wind Chart**
- Display hourly wind speed as line chart
- Show 24 hours for selected day
- X-axis: Time (hourly intervals, 12-hour or 24-hour format)
- Y-axis: Speed (mph or knots, user preference)
- Wind direction arrows overlaid on data points

**FR-3.2: Wind Data Points**
- Each hour shows wind speed value
- Direction indicator (arrow pointing wind direction)
- Interactive tooltips on hover/tap
- Tooltip shows: time, speed, direction (degrees/cardinal)

**FR-3.3: Wind Speed Toggle**
- Toggle between "Wind speed" and "Wind gusts"
- Display current selection
- Smooth transition between views

**FR-3.4: Current Wind Conditions**
- Display current wind speed prominently
- Show current wind direction
- Visual wind direction indicator

### 4.4 Temperature Visualization

**FR-4.1: Temperature Display**
- Display hourly temperature for 24 hours of selected day
- Show temperature values clearly for each hour
- Format: Degrees Fahrenheit (°F) with Celsius option
- Clean, readable layout integrated with wind/tide data

**FR-4.2: Temperature Chart/Graph**
- Line chart or bar chart showing temperature trend throughout day
- X-axis: Time (hourly intervals, matching wind chart)
- Y-axis: Temperature (°F or °C)
- Color-coded for visual clarity (warm/cool colors)

**FR-4.3: Temperature Data Points**
- Interactive tooltips on hover/tap reveal hourly values
- Tooltip shows: time, temperature, feels-like temperature (optional)
- High/low temperature markers visible on the curve
- No separate hourly temperature row (data accessible via chart interaction)

**FR-4.4: Current Temperature**
- Display current temperature prominently
- Show high/low for selected day
- Visual indicator if temperature is rising or falling

### 4.5 Tide Visualization

**FR-5.1: Tide Curve Chart**
- Display tide height as smooth curve
- Show 24 hours for selected day
- X-axis: Time (4-hour interval labels)
- Y-axis: Height (feet)
- Curve color: Blue (#4A90E2 or similar)

**FR-5.2: Tide Markers**
- Mark high tide peaks on curve
- Mark low tide troughs on curve
- Interactive point showing current tide level
- Current time indicator line

**FR-5.3: Current Tide Display**
- Display current tide height prominently in section header
- Show rising/falling indicator (↑ or ↓)
- Format: "Current: 0.94 ft ↓ Falling"
- All additional tide details (high/low times, heights) accessible via chart tooltips

**FR-5.4: Interactive Tide Details** (Removed separate tide table and statistics)
- Tooltip on hover/tap reveals exact tide height and time for any point
- High/low tide times and heights visible by tapping peaks/troughs on curve
- No separate "Next low tide" countdown or tide table
- Simplified presentation focuses on the curve visualization

### 4.6 Current Conditions

**FR-6.1: Weather Card**
- Display current temperature (°F)
- Show weather icon/moon phase
- High/low temperature for the day
- Precipitation amount
- Air pressure (hPa or inHg)
- Humidity percentage
- UV Index with level indicator

**FR-6.2: Visual Weather Indicators**
- Icon showing current conditions (sun, clouds, rain, etc.)
- Color-coded UV index (green=low, yellow=moderate, etc.)
- Pressure trend indicator (rising/falling arrow)

### 4.7 Data Loading & Error Handling

**FR-7.1: Loading States**
- Show loading spinner while fetching data
- Display skeleton screens for charts
- Indicate "Loading forecast..." message

**FR-7.2: Error Handling**
- Display friendly error messages for API failures
- "No tide station nearby" message with distance to nearest
- "Unable to load forecast" with retry button
- Network error detection and messaging

**FR-7.3: Data Refresh**
- Pull-to-refresh gesture support (mobile)
- Automatic refresh when day selection changes
- Cache data to minimize API calls
- Display last updated timestamp

---

## 5. Non-Functional Requirements

### 5.1 Performance
- Initial page load: < 3 seconds
- Map interaction: < 100ms response time
- Chart rendering: < 1 second
- API response time: < 2 seconds
- Smooth animations at 60fps

### 5.2 Compatibility
- **Browsers:** Chrome 90+, Safari 14+, Firefox 88+, Edge 90+
- **Devices:** iOS 14+, Android 8+
- **Screen sizes:** 320px - 2560px width
- **Orientation:** Portrait and landscape

### 5.3 Accessibility
- WCAG 2.1 AA compliance
- Touch targets minimum 44x44px
- Keyboard navigation support
- Screen reader compatible
- Sufficient color contrast (4.5:1 for text)

### 5.4 Web Optimization
- Fast loading on 3G/4G mobile connections
- Responsive images and assets
- Lazy loading for non-critical resources
- Browser caching for repeated visits
- Shareable URLs with location/date parameters

### 5.5 Data Accuracy
- Weather data updated every 1 hour minimum
- Tide predictions accurate to NOAA standards
- Display data source and update time
- Handle timezone conversions correctly

### 5.6 Security
- HTTPS only
- No sensitive user data collection
- API keys secured server-side (if needed)
- CORS properly configured

---

## 6. Technical Requirements

### 6.1 Technology Stack
- **Framework:** React 18+ with TypeScript
- **Styling:** Tailwind CSS or styled-components
- **Map:** Leaflet.js or Mapbox GL JS
- **Charts:** Recharts or Chart.js
- **State:** React Context or Zustand
- **Build:** Vite or Create React App
- **Hosting:** Vercel, Netlify, or similar

### 6.2 APIs & Data Sources

**Wind & Weather Data:**
- Primary: NOAA National Weather Service API (free)
- Alternative: Open-Meteo API (free, no key required)
- Fallback: OpenWeatherMap (free tier)

**Tide Data:**
- Primary: NOAA CO-OPS API (free)
- Endpoint: Tide predictions for specific stations
- Coverage: US coastal stations

### 6.3 Data Structure

**Location Object:**
```typescript
{
  latitude: number;
  longitude: number;
  name?: string;
  tideStationId?: string;
  tideStationDistance?: number; // km or miles
}
```

**Wind Data:**
```typescript
{
  timestamp: string; // ISO 8601
  speed: number; // mph or knots
  gusts: number;
  direction: number; // degrees (0-360)
  directionCardinal: string; // N, NE, E, etc.
}
```

**Temperature Data:**
```typescript
{
  timestamp: string; // ISO 8601
  temperature: number; // degrees F or C
  feelsLike?: number; // optional feels-like temperature
  high?: number; // daily high
  low?: number; // daily low
}
```

**Tide Data:**
```typescript
{
  timestamp: string;
  height: number; // feet
  type: 'H' | 'L'; // High or Low
}
```

### 6.4 Data Persistence & Caching Strategy
- Store selected location in localStorage (persists indefinitely)
- Cache API responses for 1 hour (in-memory or localStorage)
- Use localStorage for user preferences (units, theme, etc.)
- Browser HTTP caching for static assets
- Cache map tiles where possible
- URL parameters to enable direct deep linking and sharing
- Clear cache on location change to fetch fresh data

---

## 7. User Interface Design

### 7.1 Design System

**Color Palette:**
- Primary: Deep blue (#0A4B7D or similar)
- Secondary: Light blue (#4A90E2)
- Background: Dark (#0D1117) for dark theme
- Surface: Dark gray (#161B22)
- Text: White (#FFFFFF) and light gray (#8B949E)
- Accent: Blue (#58A6FF)

**Typography:**
- Heading: Sans-serif, bold, 24-32px
- Body: Sans-serif, regular, 14-16px
- Data: Monospace for numbers (optional)

**Icons:**
- Weather icons (sun, clouds, rain, wind)
- Directional arrows (wind, tide)
- Navigation icons (map, location, menu)
- Use icon library (Heroicons, Feather, etc.)

### 7.2 Layout

**Mobile (< 768px):**
- Single column layout
- Full-width charts stacked vertically
- Order: Wind → Temperature → Tides
- Sticky header with day selector
- Clean spacing between sections
- Bottom navigation (optional)

**Tablet/Desktop (≥ 768px):**
- Split view: Map and forecast side-by-side (optional)
- Two or three column grid for charts
- Wind and Temperature side-by-side
- Tide chart full-width below
- Larger charts with more detail
- Persistent day selector

**Integrated Display:**
- All three data types (wind, temperature, tide) visible without scrolling on desktop
- Consistent time axis across all charts for easy correlation
- Unified color scheme and styling
- Clear visual hierarchy

### 7.3 Interactions
- Smooth scroll for day selector
- Touch-friendly tap targets
- Swipe gestures for day navigation
- Pinch-to-zoom on map
- Haptic feedback on selection (mobile)

### 7.4 Dark Theme
- Default to dark theme (matching reference screenshots)
- High contrast for outdoor visibility
- Blue accent colors for data visualization
- Subtle gradients and shadows

---

## 8. Development Phases

### Phase 1: Core Setup (Week 1)
- Initialize React + TypeScript project
- Set up routing and basic structure
- Implement map view with Leaflet
- Basic location selection functionality
- Implement localStorage for location persistence

### Phase 2: API Integration (Week 2)
- Connect to NOAA weather API
- Connect to NOAA tide API
- Create data fetching hooks
- Implement error handling and caching

### Phase 3: Data Visualization (Week 2-3)
- Build wind speed chart component
- Add wind direction indicators
- Build temperature chart component
- Build tide curve chart component
- Implement interactive tooltips
- Integrate all three visualizations with consistent time axis

### Phase 4: UI/UX (Week 3-4)
- Implement day selector
- Create current conditions display
- Add loading states and skeletons
- Polish interactions and animations

### Phase 5: Testing & SEO (Week 4)
- Cross-browser testing (Chrome, Safari, Firefox, Edge)
- Mobile device testing (iOS, Android)
- Responsive design testing (various screen sizes)
- Add meta tags for SEO and social sharing
- Performance optimization and lighthouse testing

### Phase 6: Deployment (Week 4)
- Set up hosting (Vercel/Netlify/GitHub Pages)
- Configure custom domain (if applicable)
- Set up analytics (Google Analytics or similar, optional)
- Submit to search engines
- Launch and monitor

---

## 9. Success Metrics

### 9.1 User Engagement
- Daily active users (DAU)
- Session duration (target: 2-5 minutes)
- Number of location selections per session
- Day selector usage (how far ahead users check)

### 9.2 Technical Performance
- Page load time < 3 seconds (90th percentile)
- API success rate > 99%
- JavaScript error rate < 0.5%
- Lighthouse performance score > 90
- Mobile usability score > 95

### 9.3 User Satisfaction
- User feedback/support requests
- Return user rate (target: 40% weekly)
- Social shares and bookmarks
- Organic search traffic growth

---

## 10. Risks & Mitigation

### 10.1 API Limitations
**Risk:** Free APIs may have rate limits or downtime
**Mitigation:** Implement multiple API fallbacks, aggressive caching, and rate limit monitoring

### 10.2 Data Accuracy
**Risk:** Tide predictions may not be available for all locations
**Mitigation:** Show nearest station distance, allow user to search for stations, clear messaging when data unavailable

### 10.3 Browser Compatibility
**Risk:** Some modern web features may not work on older browsers
**Mitigation:** Polyfills where needed, graceful degradation, test on target browsers, display compatibility warnings if needed

### 10.4 User Adoption
**Risk:** Users may prefer existing apps
**Mitigation:** Focus on simplicity and speed, no account required, clear value proposition

---

## 11. Future Enhancements (Post-MVP)

### 11.1 Phase 2 Features
- Multiple saved favorite locations (localStorage-based, no account needed)
- Location search by name/zip code
- Share forecast link with others
- Sunrise/sunset times
- Moon phase indicator
- PWA installation capability (optional)
- Clear/delete saved location option

### 11.2 Phase 3 Features
- Fishing conditions score
- Solunar tables
- Wave height and period
- Water temperature
- Barometric pressure trends
- Share forecast with friends

### 11.3 Phase 4 Features
- Historical weather data and trends
- Trip planning tools
- Community reports and conditions
- User accounts (optional)
- Weather alerts and push notifications
- Premium features (detailed forecasts, extended range)

---

## 12. Open Questions

1. Should we support unit preferences (mph/knots, feet/meters, °F/°C)?
2. Do we need a tutorial/onboarding flow for first-time users?
3. Should we implement analytics from day one?
4. What's the branding/website name and domain?
5. Do we need a privacy policy (even with no user data collection)?
6. Should we support multiple languages (Spanish for coastal areas)?
7. Is there a preferred tide station if multiple are nearby?
8. Should URLs include location/date parameters for easy sharing?
9. Do we want social media meta tags (Open Graph, Twitter Cards)?

---

## 13. Dependencies

### 13.1 External Services
- NOAA API availability and uptime
- Map tile providers (OpenStreetMap, Mapbox)
- Hosting platform (Vercel/Netlify)

### 13.2 Technical Dependencies
- React ecosystem stability
- Modern browser API support (Geolocation, Fetch, etc.)
- Chart library compatibility
- Map library licensing and usage limits

---

## 14. Appendix

### 14.1 API Endpoints

**NOAA Tides:**
- Predictions: `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter`
- Stations: `https://api.tidesandcurrents.noaa.gov/mdapi/prod/webapi/stations.json`

**NOAA Weather:**
- Points: `https://api.weather.gov/points/{lat},{lon}`
- Forecast: `https://api.weather.gov/gridpoints/{office}/{gridX},{gridY}/forecast/hourly`

**Open-Meteo (Alternative):**
- Forecast: `https://api.open-meteo.com/v1/forecast`

### 14.2 Reference Screenshots
- Screenshot 1: Tides view showing tide curve, day selector, and tide table
- Screenshot 2: Weather view showing wind speed chart with direction indicators

**Design Integration Notes:**
- The selected day view must cleanly display three primary data types:
  1. **Wind**: Current speed/direction + hourly chart with visual direction arrows
  2. **Temperature**: Current temp + high/low + hourly trend chart (no separate hourly row)
  3. **Tide**: Current height + rising/falling + curve chart (no separate table)
- **Simplified Approach**: Each section shows "Current: [value]" at top, then chart only
- All detailed hourly data accessible via interactive tooltips on charts
- Layout minimizes scrolling while maintaining readability (~180px saved on mobile)
- Time axis synchronized across all three visualizations
- Mobile view stacks vertically; desktop view uses grid layout
- Consistent spacing, typography, and color coding throughout
- Focus on at-a-glance current conditions with on-demand detail access

### 14.3 Glossary
- **Responsive Web App:** Web application that adapts to different screen sizes and devices
- **NOAA:** National Oceanic and Atmospheric Administration
- **CO-OPS:** Center for Operational Oceanographic Products and Services
- **Tidal Current:** Speed of water movement due to tides
- **Cardinal Direction:** N, NE, E, SE, S, SW, W, NW
- **SEO:** Search Engine Optimization - techniques to improve visibility in search results
- **PWA:** Progressive Web App (future enhancement option)

---

**Document Control**
- **Author:** Product Team
- **Reviewers:** [To be assigned]
- **Approved By:** [To be approved]
- **Next Review Date:** [After initial review]
