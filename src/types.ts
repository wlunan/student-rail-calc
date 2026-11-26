export type TrainGroup = 'regular' | 'high-speed';

export interface SeatOption {
  id: string;
  label: string;
  shortLabel: string;
  group: TrainGroup;
  description: string;
}

export type PublishedPriceMode = 'discount' | 'manual';

export interface Leg {
  id: string;
  trainNo: string;
  origin: string;
  destination: string;
  travelDate: string;
  seatId: string;
  adultPrice: string;
  discount: string;
  publishedPrice: string;
  publishedPriceMode: PublishedPriceMode;
  hardSeatPrice: string;
}

export type MoneyField = 'adultPrice' | 'publishedPrice' | 'hardSeatPrice';
export type FareField = MoneyField | 'discount';
export type CalculationStatus = 'incomplete' | 'invalid' | 'estimated' | 'complete';

export interface LegCalculation {
  legId: string;
  status: CalculationStatus;
  seat: SeatOption;
  adultCents: number | null;
  publishedCents: number | null;
  publishedPriceEstimated: boolean;
  studentCents: number | null;
  savedCents: number | null;
  errors: Partial<Record<FareField, string>>;
  missingFields: FareField[];
  formula: string;
  note: string;
}
