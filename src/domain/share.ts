import { calculateLeg, isLegComplete } from './fare';
import { formatMoney } from './money';
import type { Leg } from '../types';

export const buildShareText = (legs: Leg[]): string => {
  const results = legs.map(calculateLeg);
  const complete = results.every(isLegComplete);
  if (!complete) throw new Error('请先完善每一程票价');

  const lines = ['学生票优惠估算单', '——————————'];
  let adultTotal = 0;
  let studentTotal = 0;
  let savedTotal = 0;

  results.forEach((result, index) => {
    const leg = legs[index];
    const route = leg.origin.trim() && leg.destination.trim()
      ? `${leg.origin.trim()} → ${leg.destination.trim()}`
      : '手动计价行程';
    const train = leg.trainNo.trim().toUpperCase();
    const date = leg.travelDate || '未填日期';
    const suffix = result.status === 'estimated' ? '（75% 暂估）' : '';

    lines.push(
      `第 ${index + 1} 程｜${route}`,
      `${train || '未填车次'} · ${date} · ${result.seat.shortLabel}`,
      `成人价：${formatMoney(result.adultCents ?? 0)}`,
      `学生价：${formatMoney(result.studentCents ?? 0)}${suffix}`,
      `本程节省：${formatMoney(result.savedCents ?? 0)}`,
      `计算：${result.formula}`,
      '——————————',
    );

    adultTotal += result.adultCents ?? 0;
    studentTotal += result.studentCents ?? 0;
    savedTotal += result.savedCents ?? 0;
  });

  lines.push(
    `成人票合计：${formatMoney(adultTotal)}`,
    `学生票合计：${formatMoney(studentTotal)}`,
    `合计节省：${formatMoney(savedTotal)}`,
    '',
    '说明：本结果由学生票优惠计算器在本地估算，实际票价以 12306 为准。',
  );
  return lines.join('\n');
};
