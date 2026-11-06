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
    const result = calculateLeg(makeLeg({ adultPrice: '553', publishedPrice: '700' }));
    expect(result.studentCents).toBe(41475);
    expect(result.status).toBe('complete');
  });

  it('动车公布价 40% 更高时执行最低价限制', () => {
    const result = calculateLeg(makeLeg({ adultPrice: '300', publishedPrice: '700' }));
    expect(result.studentCents).toBe(28000);
  });

  it('动车执行价低于公布价 40% 时直接按执行价', () => {
    const result = calculateLeg(makeLeg({ adultPrice: '200', publishedPrice: '700' }));
    expect(result.studentCents).toBe(20000);
    expect(result.savedCents).toBe(0);
  });

  it('动车执行价等于公布价 40% 时走最低票价分支', () => {
    const result = calculateLeg(makeLeg({ adultPrice: '280', publishedPrice: '700' }));
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
    const result = calculateLeg(makeLeg({ adultPrice: '700', publishedPrice: '600' }));
    expect(result.status).toBe('invalid');
    expect(result.errors.publishedPrice).toBeTruthy();
  });

  it('拒绝超过两位小数的票价', () => {
    const result = calculateLeg(makeLeg({ adultPrice: '10.123' }));
    expect(result.status).toBe('invalid');
    expect(result.errors.adultPrice).toBeTruthy();
  });
});
