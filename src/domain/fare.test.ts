import { describe, expect, it } from 'vitest';
import { calculateLeg } from './fare';
import { createEmptyLeg } from './seats';

const makeLeg = (overrides: Partial<ReturnType<typeof createEmptyLeg>> = {}) => ({
  ...createEmptyLeg(),
  ...overrides,
});

describe('学生票计算规则', () => {
  it('普速硬座按 50% 计算', () => {
    const result = calculateLeg(makeLeg({ seatId: 'regular-hard', adultPrice: '100' }));
    expect(result.studentCents).toBe(5000);
    expect(result.status).toBe('complete');
  });

  it('金额以分为单位进行舍入', () => {
    const result = calculateLeg(makeLeg({ seatId: 'regular-hard', adultPrice: '100.55' }));
    expect(result.studentCents).toBe(5028);
  });

  it('普速硬卧扣除同程硬座半价', () => {
    const result = calculateLeg(
      makeLeg({ seatId: 'regular-sleeper', adultPrice: '300', hardSeatPrice: '200' }),
    );
    expect(result.studentCents).toBe(20000);
    expect(result.savedCents).toBe(10000);
  });

  it('硬卧缺少硬座价时信息不完整', () => {
    const result = calculateLeg(makeLeg({ seatId: 'regular-sleeper', adultPrice: '300' }));
    expect(result.status).toBe('incomplete');
    expect(result.missingFields).toContain('hardSeatPrice');
  });

  it('硬卧拒绝不合理的硬座价格', () => {
    const result = calculateLeg(
      makeLeg({ seatId: 'regular-sleeper', adultPrice: '300', hardSeatPrice: '300' }),
    );
    expect(result.status).toBe('invalid');
    expect(result.studentCents).toBeNull();
  });

  it('动车执行价 75% 高于公布价 40% 时取 75%', () => {
    const result = calculateLeg(makeLeg({ adultPrice: '553', publishedPrice: '700', publishedPriceMode: 'manual' }));
    expect(result.studentCents).toBe(41475);
    expect(result.status).toBe('complete');
  });

  it('动车公布价 40% 更高时执行最低价限制', () => {
    const result = calculateLeg(makeLeg({ adultPrice: '300', publishedPrice: '700', publishedPriceMode: 'manual' }));
    expect(result.studentCents).toBe(28000);
  });

  it('动车执行价低于公布价 40% 时直接按执行价', () => {
    const result = calculateLeg(makeLeg({ adultPrice: '200', publishedPrice: '700', publishedPriceMode: 'manual' }));
    expect(result.studentCents).toBe(20000);
    expect(result.savedCents).toBe(0);
  });

  it('动车执行价等于公布价 40% 时走最低票价分支', () => {
    const result = calculateLeg(makeLeg({ adultPrice: '280', publishedPrice: '700', publishedPriceMode: 'manual' }));
    expect(result.studentCents).toBe(28000);
    expect(result.formula).toContain('max');
  });

  it('缺少公布价时给出明确标记的 75% 暂估', () => {
    const result = calculateLeg(makeLeg({ adultPrice: '553' }));
    expect(result.studentCents).toBe(41475);
    expect(result.status).toBe('estimated');
    expect(result.note).toContain('尚未校验');
  });

  it('公布价低于执行价时要求核对', () => {
    const result = calculateLeg(makeLeg({ adultPrice: '700', publishedPrice: '600', publishedPriceMode: 'manual' }));
    expect(result.status).toBe('invalid');
    expect(result.errors.publishedPrice).toBeTruthy();
  });

  it('拒绝超过两位小数的票价', () => {
    const result = calculateLeg(makeLeg({ adultPrice: '10.123' }));
    expect(result.status).toBe('invalid');
    expect(result.errors.adultPrice).toBeTruthy();
  });

  it('按 7.9 折自动反推 553 元对应的公布价 700 元', () => {
    const result = calculateLeg(makeLeg({ adultPrice: '553', discount: '7.9' }));
    expect(result.publishedCents).toBe(70000);
    expect(result.studentCents).toBe(41475);
    expect(result.status).toBe('complete');
    expect(result.publishedPriceEstimated).toBe(true);
    expect(result.formula).toContain('0.79');
  });

  it('按页面低折扣反推后仍正确应用执行价分支', () => {
    const result = calculateLeg(makeLeg({ adultPrice: '200', discount: '2.8' }));
    expect(result.publishedCents).toBe(71429);
    expect(result.studentCents).toBe(20000);
    expect(result.savedCents).toBe(0);
  });

  it.each(['0', '10.1', 'abc'])('拒绝无效页面折扣 %s', (discount) => {
    const result = calculateLeg(makeLeg({ adultPrice: '553', discount }));
    expect(result.status).toBe('invalid');
    expect(result.errors.discount).toBeTruthy();
    expect(result.studentCents).toBeNull();
  });

  it('直接填写公布价时不受此前折扣值影响', () => {
    const result = calculateLeg(makeLeg({
      adultPrice: '553',
      discount: '5',
      publishedPrice: '700',
      publishedPriceMode: 'manual',
    }));
    expect(result.publishedCents).toBe(70000);
    expect(result.studentCents).toBe(41475);
    expect(result.publishedPriceEstimated).toBe(false);
  });
});
