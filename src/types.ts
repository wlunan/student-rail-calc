export type TrainGroup = 'regular' | 'high-speed';

export interface SeatOption {
  id: string;
  label: string;
  shortLabel: string;
  group: TrainGroup;
  description: string;
}

export interface Leg {
  id: string;
  trainNo: string;
  origin: string;
  destination: string;
  travelDate: string;
  seatId: string;
  adultPrice: string;
  publishedPrice: string;
  hardSeatPrice: string;
}

export type MoneyField = 'adultPrice' | 'publishedPrice' | 'hardSeatPrice';
export type CalculationStatus = 'incomplete' | 'invalid' | 'estimated' | 'complete';

export interface LegCalculation {
  legId: string;
  status: CalculationStatus;
  seat: SeatOption;
  adultCents: number | null;
  studentCents: number | null;
  savedCents: number | null;
  errors: Partial<Record<MoneyField, string>>;
  missingFields: MoneyField[];
  formula: string;
  note: string;
}
