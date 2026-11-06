<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ 'update:open': [value: boolean] }>();
const dialog = ref<HTMLDialogElement | null>(null);

watch(
  () => props.open,
  (open) => {
    if (open && !dialog.value?.open) dialog.value?.showModal();
    if (!open && dialog.value?.open) dialog.value.close();
  },
);

const close = () => emit('update:open', false);
</script>

<template>
  <dialog ref="dialog" class="rule-dialog" @close="close" @click.self="close">
    <article class="rule-dialog__paper">
      <header class="dialog-header">
        <div>
          <p class="section-kicker">RULEBOOK / 规则手册</p>
          <h2>学生优惠票怎么算？</h2>
        </div>
        <button class="icon-button" type="button" aria-label="关闭规则说明" @click="close">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
        </button>
      </header>

      <div class="rule-dialog__body">
        <section class="rule-section">
          <span class="rule-section__number">01</span>
          <div>
            <h3>普速硬座 / 无座</h3>
            <p>按硬座客票和相应附加票公布票价的 50% 计算。本工具使用成人公布价 × 50% 的便捷口径。</p>
            <code>学生价 = 成人公布价 × 50%</code>
          </div>
        </section>

        <section class="rule-section">
          <span class="rule-section__number">02</span>
          <div>
            <h3>普速硬卧</h3>
            <p>硬卧部分收取全价，同时享受硬座部分半价优惠。有空调时，空调票按相应规则计算。</p>
            <code>学生价 ≈ 硬卧总价 − 同程硬座价 × 50%</code>
          </div>
        </section>

        <section class="rule-section">
          <span class="rule-section__number">03</span>
          <div>
            <h3>动车组适用席别</h3>
            <p>包含二等座、二等包座、多功能座、一等座和动车组卧铺。</p>
            <code>执行价 ≥ 公布价 40%：max(执行价 × 75%，公布价 × 40%)</code>
            <code>执行价 ＜ 公布价 40%：学生价 = 执行价</code>
          </div>
        </section>

        <aside class="rule-notice">
          <strong>为什么建议填写公布价？</strong>
          <p>只填执行价时，本工具只能按 75% 暂估，无法检查“公布价 40%”下限。补充公布价后才会使用完整公式。</p>
        </aside>

        <section class="qualification-notes">
          <h3>购票前，也别忘了</h3>
          <ul>
            <li>每学年为 10 月 1 日至次年 9 月 30 日，可购买四次单程学生优惠票。</li>
            <li>乘车前应完成学生优惠资质核验，优惠区间应与学生证记载一致。</li>
            <li>本工具不核验资格、不查询余票，也不保存学生证件信息。</li>
          </ul>
        </section>
      </div>

      <footer class="rule-dialog__footer">
        <p>票价尾数及实际结算以 12306 为准。</p>
        <a href="https://kyfw.12306.cn/otn/gonggao/student.html" target="_blank" rel="noreferrer">
          查看 12306 官方说明 <span aria-hidden="true">↗</span>
        </a>
      </footer>
    </article>
  </dialog>
</template>
