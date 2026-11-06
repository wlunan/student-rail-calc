<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import LegCard from './components/LegCard.vue';
import FareSummary from './components/FareSummary.vue';
import RuleDialog from './components/RuleDialog.vue';
import { calculateLeg, isLegComplete } from './domain/fare';
import { createEmptyLeg } from './domain/seats';
import { buildShareText } from './domain/share';
import { formatMoney } from './domain/money';
import { clearDraft, hasLegContent, loadDraft, saveDraft } from './services/draft';
import { copyText } from './services/clipboard';
import type { Leg } from './types';

const initialDraft = loadDraft();
const legs = ref<Leg[]>(initialDraft.legs);
const draftRestored = ref(initialDraft.restored);
const draftStatus = ref<'saved' | 'saving' | 'unavailable'>('saved');
const rulesOpen = ref(false);
const resetDialog = ref<HTMLDialogElement | null>(null);
const toast = ref('');
let toastTimer: ReturnType<typeof setTimeout> | undefined;
let saveTimer: ReturnType<typeof setTimeout> | undefined;

const results = computed(() => legs.value.map(calculateLeg));
const validResults = computed(() => results.value.filter(isLegComplete));
const allComplete = computed(() => results.value.length > 0 && results.value.every(isLegComplete));
const totalStudent = computed(() => validResults.value.reduce((sum, result) => sum + (result.studentCents ?? 0), 0));
const hasContent = computed(() => legs.value.some(hasLegContent));

const showToast = (message: string) => {
  toast.value = message;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.value = ''; }, 2400);
};

watch(
  legs,
  (value) => {
    draftStatus.value = 'saving';
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      draftStatus.value = saveDraft(value) ? 'saved' : 'unavailable';
    }, 350);
  },
  { deep: true },
);

onBeforeUnmount(() => {
  clearTimeout(saveTimer);
  clearTimeout(toastTimer);
});

const updateLeg = (index: number, leg: Leg) => {
  legs.value[index] = leg;
};

const scrollToLeg = async (id: string) => {
  await nextTick();
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
};

const addLeg = () => {
  const leg = createEmptyLeg();
  legs.value.push(leg);
  void scrollToLeg(leg.id);
};

const duplicateLeg = (index: number) => {
  const copy = { ...legs.value[index], id: createEmptyLeg().id };
  legs.value.splice(index + 1, 0, copy);
  void scrollToLeg(copy.id);
};

const removeLeg = (index: number) => {
  if (legs.value.length === 1) return;
  legs.value.splice(index, 1);
  showToast('已移除该行程');
};

const requestReset = () => {
  if (!hasContent.value) return;
  resetDialog.value?.showModal();
};

const resetAll = () => {
  clearTimeout(saveTimer);
  clearDraft();
  legs.value = [createEmptyLeg()];
  draftRestored.value = false;
  draftStatus.value = 'saved';
  resetDialog.value?.close();
  showToast('已清空全部行程');
};

const copySummary = async () => {
  try {
    await copyText(buildShareText(legs.value));
    showToast('结算单已复制，可以粘贴到备忘录');
  } catch {
    showToast('复制失败，请检查浏览器剪贴板权限');
  }
};

const printSummary = () => {
  if (!allComplete.value) return;
  document.querySelectorAll<HTMLDetailsElement>('.summary-leg details').forEach((details) => {
    details.open = true;
  });
  window.print();
};

const scrollToSummary = () => {
  document.getElementById('fare-summary')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};
</script>

<template>
  <div class="app-shell">
    <header class="site-header">
      <a class="brand" href="#" aria-label="学生票优惠计算器首页">
        <span class="brand__mark" aria-hidden="true">
          <svg viewBox="0 0 40 40"><path d="M11 29V11a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v18M8 32l4-4h16l4 4M14 16h12M15 23h.01M25 23h.01M16 32v3M24 32v3" /></svg>
        </span>
        <span><strong>学生票</strong><small>优惠计算器</small></span>
      </a>
      <nav class="site-nav" aria-label="页面工具">
        <span class="local-badge"><i aria-hidden="true"></i> 无需登录 · 本地计算</span>
        <button type="button" class="nav-button" @click="rulesOpen = true">
          计算规则
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7" /></svg>
        </button>
      </nav>
    </header>

    <main>
      <section class="hero">
        <div class="hero__copy">
          <p class="hero__eyebrow"><span>STUDENT RAIL FARE</span><i />手动计价版</p>
          <h1>每一程优惠，<br /><em>都算得明白。</em></h1>
          <p class="hero__description">填写车次席别与成人票价，即时算清学生优惠。支持普速、动车与多程出行，数据只留在你的浏览器里。</p>
          <div class="hero__notes">
            <span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6" /></svg>修正低折扣票价规则</span>
            <span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6" /></svg>不查询、不追踪、不上传</span>
          </div>
        </div>
        <div class="hero__fare-board" aria-label="核心优惠规则">
          <div class="fare-board__header"><span>优惠速览</span><small>FARE INDEX</small></div>
          <div class="fare-board__row"><span>普速硬座 / 无座</span><strong>50<small>%</small></strong></div>
          <div class="fare-board__row"><span>动车组适用席别</span><strong>75<small>%</small><i>基准</i></strong></div>
          <div class="fare-board__footer"><span>公布价 40% 下限规则已纳入</span><svg viewBox="0 0 50 20" aria-hidden="true"><path d="M1 10h45m-7-7 7 7-7 7" /></svg></div>
        </div>
      </section>

      <div class="workspace-heading">
        <div>
          <p class="section-kicker">YOUR JOURNEY / 行程计价</p>
          <h2>从一张车票开始</h2>
        </div>
        <div class="workspace-tools">
          <span class="draft-status" :class="`draft-status--${draftStatus}`">
            <i aria-hidden="true"></i>
            {{ draftStatus === 'saving' ? '正在保存草稿' : draftStatus === 'saved' ? '草稿已存于本机' : '浏览器未允许保存草稿' }}
          </span>
          <button type="button" class="reset-button" :disabled="!hasContent" @click="requestReset">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M8 7l1 13h6l1-13M11 11v5M14 11v5" /></svg>
            清空重算
          </button>
        </div>
      </div>

      <div v-if="draftRestored" class="draft-banner" role="status">
        <div>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8v5l3 2M4 12a8 8 0 1 0 2-5M4 4v4h4" /></svg>
          <p><strong>已恢复上次未完成的行程</strong><span>继续填写即可，所有结果会实时更新。</span></p>
        </div>
        <button type="button" aria-label="关闭草稿恢复提示" @click="draftRestored = false">知道了</button>
      </div>

      <div class="workspace">
        <section class="journey-panel" aria-label="行程输入">
          <div class="journey-panel__caption">
            <span>01 / 行程与票价</span>
            <small>共 {{ legs.length }} 程</small>
          </div>

          <TransitionGroup name="leg-list" tag="div" class="legs-list">
            <div v-for="(leg, index) in legs" :id="leg.id" :key="leg.id" class="leg-anchor">
              <LegCard
                :leg="leg"
                :index="index"
                :result="results[index]"
                :can-remove="legs.length > 1"
                @update="updateLeg(index, $event)"
                @remove="removeLeg(index)"
                @duplicate="duplicateLeg(index)"
              />
            </div>
          </TransitionGroup>

          <button type="button" class="add-leg-button" @click="addLeg">
            <span aria-hidden="true">+</span>
            <span><strong>添加一程</strong><small>适用于中转、往返或分段购票</small></span>
          </button>
        </section>

        <FareSummary :legs="legs" :results="results" @copy="copySummary" @print="printSummary" />
      </div>

      <section class="field-guide" aria-labelledby="guide-title">
        <div class="field-guide__intro">
          <p class="section-kicker">BEFORE YOU CALCULATE</p>
          <h2 id="guide-title">两个价格，别填反了</h2>
          <p>动车折扣票能不能算准，关键在于分清“执行价”和“公布价”。</p>
        </div>
        <article class="guide-card guide-card--blue">
          <span class="guide-card__number">A</span>
          <h3>执行价</h3>
          <p>你当天购买成人票时，12306 实际展示的全价金额，可能已经包含折扣。</p>
          <div><span>例如</span><strong>¥ 553.00</strong></div>
        </article>
        <article class="guide-card guide-card--sand">
          <span class="guide-card__number">B</span>
          <h3>公布价</h3>
          <p>该车次同区间、同席别的公布票价。填写后才能校验学生票 40% 下限。</p>
          <div><span>例如</span><strong>¥ 700.00</strong></div>
        </article>
        <button type="button" class="guide-link" @click="rulesOpen = true">
          查看完整规则与购票提醒
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-5-5 5 5-5 5" /></svg>
        </button>
      </section>
    </main>

    <footer class="site-footer">
      <div class="brand brand--footer">
        <span class="brand__mark" aria-hidden="true"><svg viewBox="0 0 40 40"><path d="M11 29V11a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v18M8 32l4-4h16l4 4M14 16h12M15 23h.01M25 23h.01" /></svg></span>
        <span><strong>学生票优惠计算器</strong><small>把复杂规则，变成清楚的一程。</small></span>
      </div>
      <div class="site-footer__links">
        <button type="button" @click="rulesOpen = true">计算规则</button>
        <a href="https://kyfw.12306.cn/otn/gonggao/student.html" target="_blank" rel="noreferrer">12306 官方说明 ↗</a>
        <a href="https://link3.cc/lunan" target="_blank" rel="noreferrer">作者信息 ↗</a>
      </div>
      <p>非铁路官方产品 · 不提供票务交易 · 结果仅供参考</p>
    </footer>

    <div v-if="validResults.length" class="mobile-summary-bar">
      <button type="button" @click="scrollToSummary">
        <span><small>{{ validResults.length }} 程学生预估</small><strong>{{ formatMoney(totalStudent) }}</strong></span>
        <span>查看结算单 <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7" /></svg></span>
      </button>
    </div>

    <RuleDialog v-model:open="rulesOpen" />

    <dialog ref="resetDialog" class="confirm-dialog" @click.self="resetDialog?.close()">
      <div class="confirm-dialog__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3M8 7l1 13h6l1-13" /></svg>
      </div>
      <h2>清空全部行程？</h2>
      <p>当前填写的 {{ legs.length }} 程行程和本地草稿都会被清除，此操作无法撤销。</p>
      <div>
        <button type="button" class="button button--secondary" @click="resetDialog?.close()">继续编辑</button>
        <button type="button" class="button button--danger" @click="resetAll">确认清空</button>
      </div>
    </dialog>

    <Transition name="toast">
      <div v-if="toast" class="toast" role="status">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6" /></svg>
        {{ toast }}
      </div>
    </Transition>
  </div>
</template>
