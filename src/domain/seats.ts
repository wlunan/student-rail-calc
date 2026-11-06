import type { Leg, SeatOption } from '../types';

export const SEAT_OPTIONS: SeatOption[] = [
  {
    id: 'regular-hard',
    label: '普速 · 硬座 / 无座',
    shortLabel: '硬座 / 无座',
    group: 'regular',
    description: '按成人公布票价的 50% 计算',
  },
  {
    id: 'regular-sleeper',
    label: '普速 · 硬卧',
    shortLabel: '硬卧',
    group: 'regular',
    description: '硬卧总价减去同程硬座票价的 50%',
  },
  {
    id: 'hs-second',
    label: '动车 · 二等座',
    shortLabel: '二等座',
    group: 'high-speed',
    description: '按执行价 75% 与公布价 40% 规则计算',
  },
  {
    id: 'hs-second-package',
    label: '动车 · 二等包座',
    shortLabel: '二等包座',
    group: 'high-speed',
    description: '按执行价 75% 与公布价 40% 规则计算',
  },
  {
    id: 'hs-first',
    label: '动车 · 一等座',
    shortLabel: '一等座',
    group: 'high-speed',
    description: '按执行价 75% 与公布价 40% 规则计算',
  },
  {
    id: 'hs-multi',
    label: '动车 · 多功能座',
    shortLabel: '多功能座',
    group: 'high-speed',
    description: '按执行价 75% 与公布价 40% 规则计算',
  },
  {
    id: 'hs-sleeper',
    label: '动车 · 动车组卧铺',
    shortLabel: '动车组卧铺',
    group: 'high-speed',
    description: '按执行价 75% 与公布价 40% 规则计算',
  },
];

export const getSeat = (seatId: string): SeatOption =>
  SEAT_OPTIONS.find((seat) => seat.id === seatId) ?? SEAT_OPTIONS[0];

export const createEmptyLeg = (): Leg => ({
  id: globalThis.crypto?.randomUUID?.() ?? `leg-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  trainNo: '',
  origin: '',
  destination: '',
  travelDate: '',
  seatId: 'hs-second',
  adultPrice: '',
  publishedPrice: '',
  hardSeatPrice: '',
});
