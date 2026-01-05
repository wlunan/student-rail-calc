document.addEventListener('DOMContentLoaded', () => {
  const legsContainer = document.getElementById('legs-container');
  const addLegBtn = document.getElementById('add-leg-btn');
  const quickAddBtn = document.getElementById('quick-add');
  const calculateBtn = document.getElementById('calculate-btn');
  const resetBtn = document.getElementById('reset-btn');
  const quickResetBtn = document.getElementById('quick-reset');
  const copyResultBtn = document.getElementById('copy-result-btn');
  const breakdownEl = document.getElementById('breakdown');
  const totalOriginalEl = document.getElementById('total-original');
  const totalStudentEl = document.getElementById('total-student');
  const totalSavedEl = document.getElementById('total-saved');

  const seatOptions = [
    { id: 'regular-hard', label: '普速 无座 / 硬座', trainType: 'regular', seatType: 'hard', requiresHardSeat: false },
    { id: 'regular-sleeper', label: '普速 硬卧', trainType: 'regular', seatType: 'sleeper', requiresHardSeat: true },
    { id: 'hs-second', label: '动车 二等座', trainType: 'high-speed', seatType: 'second', requiresHardSeat: false },
    { id: 'hs-first', label: '动车 一等座', trainType: 'high-speed', seatType: 'first', requiresHardSeat: false },
    { id: 'hs-multi', label: '动车 多功能座', trainType: 'high-speed', seatType: 'multi', requiresHardSeat: false },
    { id: 'hs-sleeper', label: '动车 动车组卧铺', trainType: 'high-speed', seatType: 'sleeper', requiresHardSeat: false }
  ];

  const seatMap = new Map(seatOptions.map((item) => [item.id, item]));

  const formatCurrency = (value) => `￥${value.toFixed(2)}`;

  const buildSelectOptions = () =>
    seatOptions
      .map((item) => `<option value="${item.id}">${item.label}</option>`)
      .join('');

  const createLegElement = () => {
    const leg = document.createElement('div');
    leg.className = 'leg';

    leg.innerHTML = `
      <div class="leg__header">
        <p class="leg__title">行程</p>
        <button type="button" class="remove-btn">移除</button>
      </div>
      <div class="leg__body">
        <div>
          <label class="label" style="display:flex;align-items:center;gap:6px;">
            需要填写车次 / 起终点
            <input type="checkbox" class="field-detail-toggle" />
          </label>
        </div>
        <div class="detail-fields hidden">
          <div>
            <p class="label">车次号（可选）</p>
            <input type="text" class="field-train" placeholder="如 G123 / K45" />
          </div>
          <div>
            <p class="label">起点</p>
            <input type="text" class="field-origin" placeholder="如 北京" />
          </div>
          <div>
            <p class="label">终点</p>
            <input type="text" class="field-destination" placeholder="如 上海" />
          </div>
        </div>
        <div>
          <p class="label">坐席</p>
          <select class="field-seat">${buildSelectOptions()}</select>
        </div>
        <div>
          <p class="label">票价（元）</p>
          <input type="number" min="0" step="0.01" class="field-price" placeholder="普速填公布价 / 动车填执行价" />
          <p class="helper">普速填公布成人价；动车填当日执行价（折后价）。</p>
        </div>
        <div class="hs-extra hidden">
          <p class="label">动车公布价折扣（可选，默认1）</p>
          <input type="number" min="0.01" max="1" step="0.01" class="field-discount" placeholder="如0.8表示8折" />
          <p class="helper">不填默认公布价=执行价。执行价 = 公布价 × 折扣；学生票 = max(执行价×0.75, 公布价×0.4)。</p>
        </div>
        <div class="hard-seat-extra hidden">
          <p class="label">同程硬座成人价（元）</p>
          <input type="number" min="0" step="0.01" class="field-hard-seat" placeholder="卧铺需填" />
          <p class="helper">普速卧铺学生票 = 卧铺成人价 - 硬座价 × 0.5</p>
        </div>
      </div>
    `;

    const seatSelect = leg.querySelector('.field-seat');
    const hardSeatWrapper = leg.querySelector('.hard-seat-extra');
    const detailToggle = leg.querySelector('.field-detail-toggle');
    const detailFields = leg.querySelector('.detail-fields');
    const hsExtra = leg.querySelector('.hs-extra');

    seatSelect.addEventListener('change', () => {
      const current = seatMap.get(seatSelect.value);
      if (current && current.requiresHardSeat) {
        hardSeatWrapper.classList.remove('hidden');
      } else {
        hardSeatWrapper.classList.add('hidden');
      }

      if (current && current.trainType === 'high-speed') {
        hsExtra.classList.remove('hidden');
      } else {
        hsExtra.classList.add('hidden');
      }
    });

    detailToggle.addEventListener('change', () => {
      if (detailToggle.checked) {
        detailFields.classList.remove('hidden');
      } else {
        detailFields.classList.add('hidden');
      }
    });

    const removeBtn = leg.querySelector('.remove-btn');
    removeBtn.addEventListener('click', () => {
      leg.remove();
      if (!legsContainer.children.length) {
        addLeg();
      }
      updateLegTitles();
    });

    return leg;
  };

  const updateLegTitles = () => {
    const legs = Array.from(legsContainer.children);
    legs.forEach((leg, index) => {
      const title = leg.querySelector('.leg__title');
      if (title) title.textContent = `第 ${index + 1} 程`;
      const removeBtn = leg.querySelector('.remove-btn');
      if (removeBtn) removeBtn.disabled = legs.length === 1;
    });
  };

  const clearInputsError = () => {
    const inputs = legsContainer.querySelectorAll('input, select');
    inputs.forEach((el) => el.classList.remove('error'));
  };

  const resetResults = () => {
    totalOriginalEl.textContent = '￥0.00';
    totalStudentEl.textContent = '￥0.00';
    totalSavedEl.textContent = '￥0.00';
    breakdownEl.classList.add('empty');
    breakdownEl.innerHTML = '请先填写行程并点击“计算优惠”。';
  };

  const addLeg = () => {
    const leg = createLegElement();
    legsContainer.appendChild(leg);
    updateLegTitles();
  };

  const resetAll = () => {
    legsContainer.innerHTML = '';
    addLeg();
    resetResults();
  };

  const calculate = () => {
    clearInputsError();
    const legElements = Array.from(legsContainer.children);
    if (!legElements.length) {
      addLeg();
      return;
    }

    let totalOriginal = 0;
    let totalStudent = 0;
    const breakdownItems = [];
    const breakdownTextParts = [];

    for (let i = 0; i < legElements.length; i += 1) {
      const leg = legElements[i];
      const seatId = leg.querySelector('.field-seat').value;
      const seat = seatMap.get(seatId);
      const priceInput = leg.querySelector('.field-price');
      const originInput = leg.querySelector('.field-origin');
      const destinationInput = leg.querySelector('.field-destination');
      const trainInput = leg.querySelector('.field-train');
      const detailToggle = leg.querySelector('.field-detail-toggle');
      const hardSeatInput = leg.querySelector('.field-hard-seat');
      const discountInput = leg.querySelector('.field-discount');

      const adultPrice = Number(priceInput.value);
      const origin = originInput.value.trim();
      const destination = destinationInput.value.trim();
      const trainNo = trainInput.value.trim();
      const needDetail = detailToggle.checked;

      if (needDetail) {
        if (!origin) {
          originInput.classList.add('error');
          breakdownEl.classList.add('empty');
          breakdownEl.textContent = `第 ${i + 1} 程：请填写起点。`;
          return;
        }

        if (!destination) {
          destinationInput.classList.add('error');
          breakdownEl.classList.add('empty');
          breakdownEl.textContent = `第 ${i + 1} 程：请填写终点。`;
          return;
        }
      }

      if (!Number.isFinite(adultPrice) || adultPrice <= 0) {
        priceInput.classList.add('error');
        breakdownEl.classList.add('empty');
        breakdownEl.textContent = `第 ${i + 1} 程：请填写有效的成人票价。`;
        return;
      }

      let studentPrice = 0;
      let detail = '';

      if (seat.trainType === 'regular' && seat.seatType === 'hard') {
        studentPrice = adultPrice * 0.5;
        detail = `普速硬座/无座：${formatCurrency(adultPrice)} × 0.5 = ${formatCurrency(studentPrice)}`;
      } else if (seat.trainType === 'regular' && seat.seatType === 'sleeper') {
        const hardSeatPrice = Number(hardSeatInput?.value);
        if (!Number.isFinite(hardSeatPrice) || hardSeatPrice <= 0) {
          hardSeatInput.classList.add('error');
          breakdownEl.classList.add('empty');
          breakdownEl.textContent = `第 ${i + 1} 程：普速卧铺需填写同程硬座成人价。`;
          return;
        }
        studentPrice = adultPrice - hardSeatPrice * 0.5;
        detail = `普速卧铺：${formatCurrency(adultPrice)} - ${formatCurrency(hardSeatPrice)} × 0.5 = ${formatCurrency(studentPrice)}`;
      } else if (seat.trainType === 'high-speed') {
        const discount = discountInput?.value ? Number(discountInput.value) : 1;
        if (!Number.isFinite(discount) || discount <= 0 || discount > 1) {
          discountInput.classList.add('error');
          breakdownEl.classList.add('empty');
          breakdownEl.textContent = `第 ${i + 1} 程：动车折扣须在 0-1 之间（如 0.75）。`;
          return;
        }
        const publishedPrice = adultPrice / discount;
        const seventyFive = adultPrice * 0.75; // 执行价 × 75%
        const fortyPublished = publishedPrice * 0.4; // 公布价 × 40%
        studentPrice = Math.max(seventyFive, fortyPublished);
        detail = `动车：执行价75% = ${formatCurrency(seventyFive)}，公布价4折 = ${formatCurrency(fortyPublished)}，取较高值 ${formatCurrency(studentPrice)}`;
      }

      totalOriginal += adultPrice;
      totalStudent += studentPrice;

      const badgeClass = seat.trainType === 'regular' ? 'badge badge--regular' : 'badge badge--highspeed';

      const routeLabel = needDetail ? `${origin || '起点'} → ${destination || '终点'}` : '快捷计算';
      const trainLabel = needDetail && trainNo ? ` · 车次 ${trainNo}` : '';
      const discountLabel = seat.trainType === 'high-speed' && discountInput?.value ? ` · 折扣 ${discountInput.value}` : '';

      breakdownItems.push(`
        <div class="breakdown-item">
          <p class="breakdown-item__title">第 ${i + 1} 程：${routeLabel}${trainLabel}${discountLabel}</p>
          <p class="breakdown-item__meta">座位：${seat.label} · 成人价 ${formatCurrency(adultPrice)} · 学生价 ${formatCurrency(studentPrice)}</p>
          <p class="breakdown-item__meta">${detail}</p>
          <span class="${badgeClass}">${seat.trainType === 'regular' ? '普速' : '动车'}</span>
        </div>
      `);

      breakdownTextParts.push(
        `第${i + 1}程 ${routeLabel}${trainLabel ? ` ${trainLabel.replace(' · ', ' ')}` : ''}${discountLabel ? ` ${discountLabel.replace(' · ', ' ')}` : ''}\n` +
          `座位：${seat.label} 成人价 ${adultPrice.toFixed(2)} 学生价 ${studentPrice.toFixed(2)}\n` +
          `${detail}\n`
      );
    }

    const saved = Math.max(totalOriginal - totalStudent, 0);

    totalOriginalEl.textContent = formatCurrency(totalOriginal);
    totalStudentEl.textContent = formatCurrency(totalStudent);
    totalSavedEl.textContent = formatCurrency(saved);

    breakdownEl.classList.remove('empty');
    breakdownEl.innerHTML = breakdownItems.join('');

    copyResultBtn.dataset.clipboard = [
      `原价总计：${totalOriginal.toFixed(2)} 元`,
      `学生票总计：${totalStudent.toFixed(2)} 元`,
      `合计节省：${saved.toFixed(2)} 元`,
      '---',
      ...breakdownTextParts
    ].join('\n');
  };

  addLegBtn.addEventListener('click', addLeg);
  quickAddBtn.addEventListener('click', addLeg);
  calculateBtn.addEventListener('click', calculate);
  resetBtn.addEventListener('click', resetAll);
  quickResetBtn.addEventListener('click', resetAll);
  copyResultBtn.addEventListener('click', () => {
    const text = copyResultBtn.dataset.clipboard || '';
    if (!text.trim()) {
      copyResultBtn.textContent = '无可复制';
      setTimeout(() => {
        copyResultBtn.textContent = '复制结果';
      }, 1200);
      return;
    }
    navigator.clipboard
      .writeText(text)
      .then(() => {
        copyResultBtn.textContent = '已复制';
        setTimeout(() => {
          copyResultBtn.textContent = '复制结果';
        }, 1200);
      })
      .catch(() => {
        copyResultBtn.textContent = '复制失败';
        setTimeout(() => {
          copyResultBtn.textContent = '复制结果';
        }, 1200);
      });
  });

  resetAll();
});
