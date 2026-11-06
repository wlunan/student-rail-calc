<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { getSeat, SEAT_OPTIONS } from '../domain/seats';
import { formatMoney } from '../domain/money';
import type { Leg, LegCalculation, MoneyField } from '../types';

const props = defineProps<{
  leg: Leg;
  index: number;
  result: LegCalculation;
  canRemove: boolean;
}>();

const emit = defineEmits<{
  update: [leg: Leg];
  remove: [];
  duplicate: [];
}>();

const detailsOpen = ref(Boolean(props.leg.trainNo || props.leg.origin || props.leg.destination || props.leg.travelDate));
const touched = reactive<Record<MoneyField, boolean>>({
  adultPrice: false,
  publishedPrice: false,
  hardSeatPrice: false,
});

const seat = computed(() => getSeat(props.leg.seatId));
const adultLabel = computed(() => (seat.value.group === 'high-speed' ? '成人执行价' : '成人公布价'));
const statusLabel = computed(() => ({
  complete: '已计算',
  estimated: '暂估',
  incomplete: '待完善',
  invalid: '请核对',
}[props.result.status]));

const updateField = (field: keyof Leg, event: Event) => {
  const value = (event.target as HTMLInputElement | HTMLSelectElement).value;
  emit('update', { ...props.leg, [field]: value });
};

const fieldError = (field: MoneyField): string => {
  if (props.result.errors[field]) return props.result.errors[field] ?? '';
  if (touched[field] && props.result.missingFields.includes(field)) {
    return field === 'hardSeatPrice' ? '硬卧需要填写同程硬座价' : '请填写此项票价';
  }
  return '';
};

const moneyInput = (field: MoneyField): Record<string, unknown> => ({
  id: `${props.leg.id}-${field}`,
  value: props.leg[field],
  inputmode: 'decimal',
  autocomplete: 'off',
  placeholder: '0.00',
  'aria-invalid': Boolean(fieldError(field)),
  'aria-describedby': `${props.leg.id}-${field}-message`,
  onInput: (event: Event) => updateField(field, event),
  onBlur: () => { touched[field] = true; },
});
</script>

<template>
  <article class="leg-card" :class="`leg-card--${result.status}`">
    <div class="leg-card__rail" aria-hidden="true"><span>{{ String(index + 1).padStart(2, '0') }}</span></div>
    <div class="leg-card__content">
      <header class="leg-card__header">
        <div class="leg-card__heading">
          <span class="leg-index">第 {{ index + 1 }} 程</span>
          <span class="status-chip" :class="`status-chip--${result.status}`">{{ statusLabel }}</span>
        </div>
        <div class="leg-card__actions">
          <button type="button" class="text-button" @click="emit('duplicate')">复制此程</button>
          <button
            type="button"
            class="text-button text-button--danger"
            :disabled="!canRemove"
            :title="canRemove ? '移除此程' : '至少保留一程'"
            @click="emit('remove')"
          >移除</button>
        </div>
      </header>

      <button
        type="button"
        class="details-toggle"
        :aria-expanded="detailsOpen"
        :aria-controls="`${leg.id}-details`"
        @click="detailsOpen = !detailsOpen"
      >
        <span class="details-toggle__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="M5 12h14M12 5v14" /></svg>
        </span>
        <span>{{ detailsOpen ? '收起车次与站点' : '添加车次、站点与日期' }}<small>可选</small></span>
        <svg class="details-toggle__chevron" :class="{ 'is-open': detailsOpen }" viewBox="0 0 24 24" aria-hidden="true"><path d="m8 10 4 4 4-4" /></svg>
      </button>

      <div v-if="detailsOpen" :id="`${leg.id}-details`" class="route-fields">
        <div class="field field--station">
          <label :for="`${leg.id}-origin`">出发站</label>
          <input :id="`${leg.id}-origin`" :value="leg.origin" maxlength="30" placeholder="例如：北京南" @input="updateField('origin', $event)" />
        </div>
        <div class="route-arrow" aria-hidden="true">
          <svg viewBox="0 0 32 16"><path d="M1 8h28m-5-5 5 5-5 5" /></svg>
        </div>
        <div class="field field--station">
          <label :for="`${leg.id}-destination`">到达站</label>
          <input :id="`${leg.id}-destination`" :value="leg.destination" maxlength="30" placeholder="例如：上海虹桥" @input="updateField('destination', $event)" />
        </div>
        <div class="field">
          <label :for="`${leg.id}-train`">车次</label>
          <input :id="`${leg.id}-train`" :value="leg.trainNo" maxlength="12" placeholder="如 G123" @input="updateField('trainNo', $event)" />
        </div>
        <div class="field">
          <label :for="`${leg.id}-date`">乘车日期</label>
          <input :id="`${leg.id}-date`" :value="leg.travelDate" type="date" @input="updateField('travelDate', $event)" />
        </div>
      </div>

      <div class="fare-fields">
        <div class="field field--seat">
          <label :for="`${leg.id}-seat`">列车与席别</label>
          <div class="select-wrap">
            <select :id="`${leg.id}-seat`" :value="leg.seatId" @change="updateField('seatId', $event)">
              <option v-for="option in SEAT_OPTIONS" :key="option.id" :value="option.id">{{ option.label }}</option>
            </select>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 10 4 4 4-4" /></svg>
          </div>
          <p class="field-helper">{{ seat.description }}</p>
        </div>

        <div class="field field--money">
          <label :for="`${leg.id}-adultPrice`">{{ adultLabel }} <span>必填</span></label>
          <div class="money-input" :class="{ 'has-error': fieldError('adultPrice') }">
            <span aria-hidden="true">¥</span>
            <input v-bind="moneyInput('adultPrice')" />
          </div>
          <p :id="`${leg.id}-adultPrice-message`" class="field-message" :class="{ 'is-error': fieldError('adultPrice') }">
            {{ fieldError('adultPrice') || (seat.group === 'high-speed' ? '12306 当前实际全价执行票价' : '该席别的成人公布票价') }}
          </p>
        </div>

        <div v-if="seat.group === 'high-speed'" class="field field--money">
          <label :for="`${leg.id}-publishedPrice`">成人公布价 <span>选填</span></label>
          <div class="money-input" :class="{ 'has-error': fieldError('publishedPrice') }">
            <span aria-hidden="true">¥</span>
            <input v-bind="moneyInput('publishedPrice')" />
          </div>
          <p :id="`${leg.id}-publishedPrice-message`" class="field-message" :class="{ 'is-error': fieldError('publishedPrice') }">
            {{ fieldError('publishedPrice') || '填写后可校验 40% 最低票价规则' }}
          </p>
        </div>

        <div v-if="seat.id === 'regular-sleeper'" class="field field--money">
          <label :for="`${leg.id}-hardSeatPrice`">同程硬座成人价 <span>必填</span></label>
          <div class="money-input" :class="{ 'has-error': fieldError('hardSeatPrice') }">
            <span aria-hidden="true">¥</span>
            <input v-bind="moneyInput('hardSeatPrice')" />
          </div>
          <p :id="`${leg.id}-hardSeatPrice-message`" class="field-message" :class="{ 'is-error': fieldError('hardSeatPrice') }">
            {{ fieldError('hardSeatPrice') || '用于扣除硬座部分的半价优惠' }}
          </p>
        </div>
      </div>

      <div class="leg-result" :class="{ 'leg-result--empty': result.studentCents === null }" aria-live="polite">
        <template v-if="result.studentCents !== null">
          <div>
            <span>学生{{ result.status === 'estimated' ? '暂估价' : '预估价' }}</span>
            <strong>{{ formatMoney(result.studentCents) }}</strong>
          </div>
          <p>本程节省 <b>{{ formatMoney(result.savedCents ?? 0) }}</b></p>
          <details class="formula-details">
            <summary>查看计算过程</summary>
            <p>{{ result.formula }}</p>
            <small>{{ result.note }}</small>
          </details>
        </template>
        <template v-else>
          <span class="leg-result__placeholder">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 17V7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10M7 20h10M8 9h8M8 13h5" /></svg>
            填写票价后，这里会即时生成学生价明细
          </span>
        </template>
      </div>
    </div>
  </article>
</template>
