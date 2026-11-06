<script setup lang="ts">
import { computed } from 'vue';
import { isLegComplete } from '../domain/fare';
import { formatMoney } from '../domain/money';
import type { Leg, LegCalculation } from '../types';

const props = defineProps<{ legs: Leg[]; results: LegCalculation[] }>();
const emit = defineEmits<{ copy: []; print: [] }>();

const validItems = computed(() =>
  props.results
    .map((result, index) => ({ result, leg: props.legs[index], index }))
    .filter((item) => isLegComplete(item.result)),
);
const allComplete = computed(() => props.results.length > 0 && props.results.every(isLegComplete));
const hasEstimated = computed(() => props.results.some((result) => result.status === 'estimated'));
const totals = computed(() => validItems.value.reduce(
  (sum, { result }) => ({
    adult: sum.adult + (result.adultCents ?? 0),
    student: sum.student + (result.studentCents ?? 0),
    saved: sum.saved + (result.savedCents ?? 0),
  }),
  { adult: 0, student: 0, saved: 0 },
));

const routeLabel = (leg: Leg): string => {
  if (leg.origin.trim() && leg.destination.trim()) return `${leg.origin.trim()} → ${leg.destination.trim()}`;
  return '手动计价行程';
};

defineExpose({ totals, allComplete, validItems, hasEstimated });
</script>

<template>
  <aside id="fare-summary" class="summary-card" aria-label="学生票优惠结算单">
    <div class="summary-card__topline">
      <span>02 / 优惠结算单</span>
      <span class="summary-card__local"><i aria-hidden="true"></i> 本地实时计算</span>
    </div>

    <div class="summary-card__heading">
      <div>
        <p>STUDENT FARE</p>
        <h2>我的行程单</h2>
      </div>
      <span class="summary-card__count">{{ validItems.length }} / {{ legs.length }} 程</span>
    </div>

    <div v-if="validItems.length === 0" class="summary-empty">
      <div class="summary-empty__ticket" aria-hidden="true">
        <svg viewBox="0 0 48 48"><path d="M9 12h30v9a4 4 0 0 0 0 8v7H9v-7a4 4 0 0 0 0-8v-9Z" /><path d="M29 12v24M15 18h7M15 24h5" /></svg>
      </div>
      <h3>等待第一程票价</h3>
      <p>选择席别并填写成人票价，优惠金额会自动出现在这里。</p>
    </div>

    <template v-else>
      <div class="summary-totals">
        <div class="summary-totals__primary">
          <span>学生{{ hasEstimated ? '暂估' : '预估' }}总计</span>
          <strong>{{ formatMoney(totals.student) }}</strong>
          <small>成人票合计 {{ formatMoney(totals.adult) }}</small>
        </div>
        <div class="summary-totals__saving">
          <span>合计节省</span>
          <strong>{{ formatMoney(totals.saved) }}</strong>
        </div>
      </div>

      <div v-if="!allComplete" class="summary-warning" role="status">
        还有 {{ legs.length - validItems.length }} 程待完善，当前合计仅包含已计价的行程。
      </div>
      <div v-else-if="hasEstimated" class="summary-warning summary-warning--estimate" role="status">
        含未填写公布价的暂估行程，补充后可校验 40% 下限。
      </div>

      <div class="summary-itinerary">
        <article v-for="item in validItems" :key="item.leg.id" class="summary-leg">
          <div class="summary-leg__marker"><span>{{ item.index + 1 }}</span><i /></div>
          <div class="summary-leg__body">
            <div class="summary-leg__route">
              <div>
                <strong>{{ routeLabel(item.leg) }}</strong>
                <small>{{ item.leg.trainNo.trim().toUpperCase() || '未填车次' }} · {{ item.result.seat.shortLabel }}</small>
              </div>
              <b>{{ formatMoney(item.result.studentCents ?? 0) }}</b>
            </div>
            <details>
              <summary>票价明细</summary>
              <p>成人价 {{ formatMoney(item.result.adultCents ?? 0) }} · 节省 {{ formatMoney(item.result.savedCents ?? 0) }}</p>
              <p>{{ item.result.formula }}</p>
              <small>{{ item.result.note }}</small>
            </details>
          </div>
        </article>
      </div>
    </template>

    <div class="summary-card__actions">
      <button type="button" class="button button--primary" :disabled="!allComplete" @click="emit('copy')">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 8h11v12H8zM5 16H4V4h11v1" /></svg>
        复制结算单
      </button>
      <button type="button" class="button button--secondary" :disabled="!allComplete" @click="emit('print')">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 9V4h10v5M7 17H4v-7h16v7h-3M7 14h10v6H7z" /></svg>
        打印 / 存 PDF
      </button>
    </div>

    <p class="summary-card__disclaimer">估算结果仅供出行参考，票价尾数及实际结算请以 12306 为准。</p>
    <div class="ticket-perforation" aria-hidden="true"></div>
    <div class="summary-card__stub">
      <span>NO ACCOUNT</span><span>NO API</span><span>LOCAL ONLY</span>
    </div>
  </aside>
</template>
