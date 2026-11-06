import { createEmptyLeg, getSeat } from '../domain/seats';
import type { Leg } from '../types';

const STORAGE_KEY = 'student-rail-calc:draft:v2';
const textFields: Array<keyof Omit<Leg, 'id' | 'seatId'>> = [
  'trainNo',
  'origin',
  'destination',
  'travelDate',
  'adultPrice',
  'publishedPrice',
  'hardSeatPrice',
];

export interface Draft {
  legs: Leg[];
  restored: boolean;
}

export const hasLegContent = (leg: Leg): boolean =>
  Boolean(
    leg.trainNo.trim() ||
      leg.origin.trim() ||
      leg.destination.trim() ||
      leg.travelDate ||
      leg.adultPrice.trim() ||
      leg.publishedPrice.trim() ||
      leg.hardSeatPrice.trim(),
  );

export const loadDraft = (): Draft => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { legs: [createEmptyLeg()], restored: false };

    const parsed = JSON.parse(raw) as { legs?: unknown };
    if (!Array.isArray(parsed.legs) || parsed.legs.length === 0) {
      return { legs: [createEmptyLeg()], restored: false };
    }

    const legs = parsed.legs.slice(0, 20).map((candidate) => {
      const empty = createEmptyLeg();
      if (!candidate || typeof candidate !== 'object') return empty;
      const value = candidate as Record<string, unknown>;
      const leg: Leg = {
        ...empty,
        id: typeof value.id === 'string' ? value.id : empty.id,
        seatId: typeof value.seatId === 'string' ? getSeat(value.seatId).id : empty.seatId,
      };

      for (const field of textFields) {
        leg[field] = typeof value[field] === 'string' ? String(value[field]).slice(0, 80) : '';
      }
      return leg;
    });

    return { legs, restored: legs.some(hasLegContent) };
  } catch {
    return { legs: [createEmptyLeg()], restored: false };
  }
};

export const saveDraft = (legs: Leg[]): boolean => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ legs }));
    return true;
  } catch {
    return false;
  }
};

export const clearDraft = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage can be unavailable in private browsing; the in-memory reset still works.
  }
};
