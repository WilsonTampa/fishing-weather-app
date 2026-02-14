export type CardId =
  | 'wind'
  | 'waves'
  | 'tide'
  | 'temperature'
  | 'weather'
  | 'sunmoon'
  | 'feeding'
  | 'barometric'
  // Legacy ID — kept for migration of saved layouts
  | 'sunmoonfeeding';

export interface CardConfig {
  id: CardId;
  title: string;
  collapsed: boolean;
}

export interface DashboardLayout {
  cards: CardConfig[];
}

export const DEFAULT_LAYOUT: DashboardLayout = {
  cards: [
    { id: 'wind', title: 'Marine Wind Conditions', collapsed: false },
    { id: 'tide', title: 'Tide Predictions', collapsed: false },
    { id: 'temperature', title: 'Temperature', collapsed: false },
    { id: 'waves', title: 'Wave Conditions', collapsed: false },
    { id: 'weather', title: 'Weather Conditions', collapsed: false },
    { id: 'barometric', title: 'Barometric Pressure', collapsed: false },
    { id: 'sunmoon', title: 'Sun & Moon', collapsed: false },
    { id: 'feeding', title: 'Major & Minor Feeding Times', collapsed: false },
  ],
};
