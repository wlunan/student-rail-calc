import type { Leg, LegCalculation, MoneyField } from '../types';
import { formatMoney, parseMoneyToCents, percentageOf } from './money';
import { getSeat } from './seats';

export const calculateLeg = (leg: Leg): LegCalculation => {
  const seat = getSeat(leg.seatId);
  const errors: LegCalculation['errors'] = {};
  const missingFields: MoneyField[] = [];
  const adultCents = leg.adultPrice.trim() ? parseMoneyToCents(leg.adultPrice) : null;

  if (!leg.adultPrice.trim()) {
    missingFields.push('adultPrice');
  } else if (adultCents === null) {
    errors.adultPrice = '请输入大于 0、最多两位小数的金额';
  }

  let publishedCents: number | null = null;
  let publishedPriceEstimated = false;
  let studentCents: number | null = null;
  let formula = '';
  let note = '';

  if (seat.id === 'regular-sleeper') {
    const hardSeatCents = leg.hardSeatPrice.trim() ? parseMoneyToCents(leg.hardSeatPrice) : null;
    if (!leg.hardSeatPrice.trim()) {
      missingFields.push('hardSeatPrice');
    } else if (hardSeatCents === null) {
      errors.hardSeatPrice = '请输入有效的同程硬座成人价';
    }

    if (adultCents !== null && hardSeatCents !== null) {
      if (hardSeatCents >= adultCents) {
        errors.hardSeatPrice = '同程硬座价应低于硬卧总价，请核对';
      } else {
        const discount = percentageOf(hardSeatCents, 50);
        studentCents = adultCents - discount;
        formula = `${formatMoney(adultCents)} − ${formatMoney(hardSeatCents)} × 50% = ${formatMoney(studentCents)}`;
        note = '按硬卧总价减同程硬座半价优惠的便捷口径估算';
      }
    }
  } else if (seat.group === 'regular') {
    if (adultCents !== null) {
      studentCents = percentageOf(adultCents, 50);
      formula = `${formatMoney(adultCents)} × 50% = ${formatMoney(studentCents)}`;
      note = '普速硬座 / 无座按成人公布票价 50% 估算';
    }
  } else if (adultCents !== null) {
    const seventyFive = percentageOf(adultCents, 75);
    let derivation = '';

    if (leg.publishedPriceMode === 'discount' && leg.discount.trim()) {
      const discount = Number(leg.discount.trim());
      if (!Number.isFinite(discount) || discount <= 0 || discount > 10) {
        errors.discount = '请输入 0–10 之间的页面折扣，例如 7.9';
      } else {
        publishedCents = Math.round((adultCents * 10) / discount);
        publishedPriceEstimated = true;
        const rate = Number((discount / 10).toFixed(4));
        derivation = `公布价 ≈ ${formatMoney(adultCents)} ÷ ${rate} = ${formatMoney(publishedCents)}；`;
      }
    } else if (leg.publishedPriceMode === 'manual' && leg.publishedPrice.trim()) {
      const manualPublishedCents = parseMoneyToCents(leg.publishedPrice);
      if (manualPublishedCents === null) {
        errors.publishedPrice = '请输入有效的公布票价';
      } else if (manualPublishedCents < adultCents) {
        errors.publishedPrice = '公布价通常不应低于实际成人票价，请核对';
      } else {
        publishedCents = manualPublishedCents;
      }
    }

    if (publishedCents === null) {
      if (!errors.discount && !errors.publishedPrice) {
        studentCents = seventyFive;
        formula = `${formatMoney(adultCents)} × 75% = ${formatMoney(studentCents)}`;
        note = '未填写页面折扣或公布价，暂估结果尚未校验公布价 40% 下限';
      }
    } else {
      const fortyPublished = percentageOf(publishedCents, 40);
      const estimateNote = publishedPriceEstimated ? '公布价由页面折扣反推，可能受票价舍入影响；' : '';

      if (adultCents * 100 < publishedCents * 40) {
        studentCents = adultCents;
        formula = `${derivation}实际票价 ${formatMoney(adultCents)} 低于公布价 40%（${formatMoney(fortyPublished)}），按实际票价计算`;
        note = `${estimateNote}低折扣车票：学生优惠票按全价执行票价计算`;
      } else {
        studentCents = Math.max(seventyFive, fortyPublished);
        formula = `${derivation}max(实际票价 × 75% = ${formatMoney(seventyFive)}，公布价 × 40% = ${formatMoney(fortyPublished)}) = ${formatMoney(studentCents)}`;
        note = `${estimateNote}已按执行价 75% 与公布价 40% 的完整规则计算`;
      }
    }
  }

  const hasErrors = Object.keys(errors).length > 0;
  const status = hasErrors
    ? 'invalid'
    : studentCents === null
      ? 'incomplete'
      : seat.group === 'high-speed' && publishedCents === null
        ? 'estimated'
        : 'complete';

  return {
    legId: leg.id,
    status,
    seat,
    adultCents,
    publishedCents,
    publishedPriceEstimated,
    studentCents,
    savedCents: adultCents !== null && studentCents !== null ? adultCents - studentCents : null,
    errors,
    missingFields,
    formula,
    note,
  };
};

export const isLegComplete = (result: LegCalculation): boolean =>
  result.status === 'complete' || result.status === 'estimated';
