const PRIZES = [
  { id: 'heart_ribbon', emoji: '💝', img: 'https://em-content.zobj.net/source/apple/391/heart-with-ribbon_1f49d.png', weight: 100, value: 500 },
  { id: 'teddy', emoji: '🧸', img: 'https://em-content.zobj.net/source/apple/391/teddy-bear_1f9f8.png', weight: 80, value: 1500 },
  { id: 'gift', emoji: '🎁', img: 'https://em-content.zobj.net/source/apple/391/wrapped-gift_1f381.png', weight: 100, value: 1000 },
  { id: 'rose', emoji: '🌹', img: 'https://em-content.zobj.net/source/apple/391/rose_1f339.png', weight: 90, value: 800 },
  { id: 'cake', emoji: '🎂', img: 'https://em-content.zobj.net/source/apple/391/birthday-cake_1f382.png', weight: 80, value: 2000 },
  { id: 'bouquet', emoji: '💐', img: 'https://em-content.zobj.net/source/apple/391/bouquet_1f490.png', weight: 70, value: 2500 },
  { id: 'rocket', emoji: '🚀', img: 'https://em-content.zobj.net/source/apple/391/rocket_1f680.png', weight: 30, value: 15000 },
  { id: 'champagne', emoji: '🍾', img: 'https://em-content.zobj.net/source/apple/391/bottle-with-popping-cork_1f37e.png', weight: 50, value: 5000 },
  { id: 'trophy', emoji: '🏆', img: 'https://em-content.zobj.net/source/apple/391/trophy_1f3c6.png', weight: 20, value: 25000 },
  { id: 'ring', emoji: '💍', img: 'https://em-content.zobj.net/source/apple/391/ring_1f48d.png', weight: 10, value: 50000 },
  { id: 'diamond', emoji: '💎', img: 'https://em-content.zobj.net/source/apple/391/gem-stone_1f48e.png', weight: 5, value: 100000 }
];

const TASKS_DATA = [
  { id: 'task_bot', reward: 1, type: 'bot', icon: '🤖' },
  { id: 'task_channel1', reward: 1, type: 'channel', icon: '📢' },
  { id: 'task_channel2', reward: 1, type: 'channel', icon: '📢' },
  { id: 'task_invite5', reward: 5, type: 'social', icon: '👥' },
  { id: 'task_invite10', reward: 10, type: 'social', icon: '💎' }
];

const SKINS = [
  { id: 'normal', req: 0, classes: 'border-[#1e1b4b] shadow-[0_0_40px_rgba(99,102,241,0.3)] bg-slate-900', bgColors: ['#3730a3', '#282566'] },
  { id: 'gold', req: 1, classes: 'border-yellow-700 shadow-[0_0_40px_rgba(250,204,21,0.4)] bg-yellow-900', bgColors: ['#ca8a04', '#854d0e'] },
  { id: 'fire', req: 3, classes: 'border-red-800 shadow-[0_0_40px_rgba(239,68,68,0.4)] bg-red-900', bgColors: ['#dc2626', '#991b1b'] },
  { id: 'glass', req: 5, classes: 'border-cyan-600/50 shadow-[0_0_40px_rgba(34,211,238,0.3)] bg-slate-900', bgColors: ['rgba(6,182,212,0.2)', 'rgba(8,145,178,0.4)'] }
];

let state = {
  spins: 3,
  inventory: {},
  tasks: {},
  friends: 0,
  activeSkin: 'normal'
};

let isSpinning = false;
let currentRotation = 0;

document.addEventListener('DOMContentLoaded', async () => {
  try {
    initTelegram();
    await loadState();
    initWheel();
    initNav();
    initModals();
    updateUI();

    document.getElementById('btn-spin')?.addEventListener('click', spinWheel);
    document.getElementById('btn-invite')?.addEventListener('click', simulateInvite);
    
    // Premium Reveal Close Button
    document.getElementById('btn-claim-prize')?.addEventListener('click', closeRevealModal);
  } catch (err) {
    console.error('Initialization error:', err);
  }
});

function initTelegram() {
  try {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      const user = tg.initDataUnsafe?.user;
      if (user) {
        const nameEl = document.getElementById('user-name');
        const avatarEl = document.getElementById('user-avatar');
        
        if (nameEl) {
          nameEl.removeAttribute('data-i18n');
          nameEl.textContent = user.first_name + (user.last_name ? ' ' + user.last_name : '');
        }
        
        if (avatarEl) {
          avatarEl.innerHTML = `<span class="text-lg font-bold text-white">${user.first_name.charAt(0).toUpperCase()}</span>`;
        }
      }
    }
  } catch (err) {
    console.error('initTelegram error:', err);
  }
}

async function loadState() {
  try {
    if (typeof miniappsAI !== 'undefined' && miniappsAI.storage) {
      const stored = await miniappsAI.storage.getItem('giftWheelState');
      if (stored) {
        state = { ...state, ...JSON.parse(stored) };
      }
    }
  } catch (e) {
    console.error('Failed to load state', e);
  }
}

async function saveState() {
  try {
    if (typeof miniappsAI !== 'undefined' && miniappsAI.storage) {
      await miniappsAI.storage.setItem('giftWheelState', JSON.stringify(state));
    }
  } catch (e) {
    console.error('Failed to save state', e);
  }
}

function initWheel() {
  const wheelContent = document.getElementById('wheel-content');
  if (!wheelContent) return;
  wheelContent.innerHTML = '';
  
  const numSlices = PRIZES.length;
  const sliceAngle = 360 / numSlices;
  
  PRIZES.forEach((p, i) => {
    // Sector Divider (Physical Border)
    const lineContainer = document.createElement('div');
    lineContainer.className = 'absolute top-0 left-1/2 w-[2px] h-[50%] origin-bottom z-10 pointer-events-none';
    lineContainer.style.marginLeft = '-1px'; // Правильное центрирование
    lineContainer.style.transform = `rotate(${(i * sliceAngle) + (sliceAngle / 2)}deg)`;
    
    // The line itself
    const line = document.createElement('div');
    line.className = 'w-full h-full bg-white/10 shadow-[0_0_2px_rgba(0,0,0,0.5)]';
    
    // Outer peg (dots on the edge)
    const peg = document.createElement('div');
    peg.className = 'absolute top-[3px] left-1/2 -translate-x-1/2 w-[6px] h-[6px] rounded-full bg-indigo-200 shadow-[0_0_5px_rgba(199,210,254,0.8)] z-40';
    
    lineContainer.appendChild(line);
    lineContainer.appendChild(peg);
    wheelContent.appendChild(lineContainer);

    // Prize Content
    const el = document.createElement('div');
    el.className = 'absolute top-0 left-1/2 w-[50px] h-[50%] origin-bottom flex justify-center pt-[14px] z-20';
    el.style.marginLeft = '-25px'; // Правильное центрирование
    el.style.transform = `rotate(${i * sliceAngle}deg)`;

    const img = document.createElement('img');
    img.src = p.img;
    img.className = 'w-[36px] h-[36px] object-contain drop-shadow-[0_4px_6px_rgba(0,0,0,0.6)]';
    img.alt = p.emoji;
    img.onerror = () => { img.outerHTML = `<div class="text-[28px] drop-shadow-md">${p.emoji}</div>`; };
    
    el.appendChild(img);
    wheelContent.appendChild(el);
  });
  
  applySkin(state.activeSkin);
}

function applySkin(skinId) {
  const skin = SKINS.find(s => s.id === skinId) || SKINS[0];
  const wrapper = document.getElementById('wheel-wrapper');
  const wheel = document.getElementById('wheel');
  
  if (wrapper) {
    wrapper.className = `w-full h-full rounded-full shadow-[inset_0_15px_30px_rgba(0,0,0,0.9)] relative overflow-hidden border-[6px] transition-colors duration-500 ${skin.classes}`;
  }
  
  if (wheel) {
    const numSlices = PRIZES.length;
    const sliceAngle = 360 / numSlices;
    
    let gradient = '';
    for (let i = 0; i < numSlices; i++) {
       let color = skin.bgColors[i % skin.bgColors.length];
       if (i === numSlices - 1 && numSlices % 2 !== 0) {
         if (skin.id === 'normal') color = '#2e2b70';
         else if (skin.id === 'gold') color = '#a16207';
         else if (skin.id === 'fire') color = '#7f1d1d';
         else if (skin.id === 'glass') color = 'rgba(6,182,212,0.3)';
       }
       gradient += `${color} ${i * sliceAngle}deg ${(i + 1) * sliceAngle}deg${i < numSlices - 1 ? ', ' : ''}`;
    }
    wheel.style.background = `conic-gradient(from -${sliceAngle / 2}deg, ${gradient})`;
  }
}

function initNav() {
  const buttons = document.querySelectorAll('.nav-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      try {
        const targetId = btn.getAttribute('data-target');
        
        // Hide all
        document.querySelectorAll('.tab-view').forEach(v => {
          v.classList.add('hidden');
          v.classList.remove('active');
        });
        
        // Show target
        const targetEl = document.getElementById(targetId);
        if (targetEl) {
          targetEl.classList.remove('hidden');
          targetEl.classList.add('active');
        }
        
        // Update buttons
        buttons.forEach(b => {
          b.classList.remove('text-indigo-400');
          b.classList.add('text-slate-500');
        });
        btn.classList.remove('text-slate-500');
        btn.classList.add('text-indigo-400');
        
        if (window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.selectionChanged();
        }
      } catch (err) {
        console.error('Nav click error:', err);
      }
    });
  });
}

function initModals() {
  document.getElementById('btn-settings')?.addEventListener('click', () => {
    renderSkins();
    openModal('modal-settings');
  });

  document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', () => {
      closeAllModals();
    });
  });
}

function updateUI() {
  try {
    const t = window.miniappI18n ? window.miniappI18n.t.bind(window.miniappI18n) : (k => k);
    
    const spinBtn = document.getElementById('btn-spin');
    const ticketBalance = document.getElementById('ticket-balance');
    
    if (ticketBalance) {
      ticketBalance.textContent = state.spins;
    }

    if (spinBtn) {
      if (state.spins > 0) {
        spinBtn.disabled = false;
        spinBtn.classList.add('animate-pulse-glow');
      } else {
        spinBtn.disabled = true;
        spinBtn.classList.remove('animate-pulse-glow');
      }
    }

    const refText = document.getElementById('referrals-text');
    if (refText) {
      refText.textContent = t('app.referrals', { count: state.friends });
    }

    renderTasks();
    renderPrizes();
    renderInventory();
  } catch (err) {
    console.error('updateUI error:', err);
  }
}

function getWeightedRandomPrizeIndex() {
  const totalWeight = PRIZES.reduce((sum, p) => sum + p.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (let i = 0; i < PRIZES.length; i++) {
    if (random < PRIZES[i].weight) {
      return i;
    }
    random -= PRIZES[i].weight;
  }
  return 0;
}

function spinWheel() {
  try {
    if (state.spins <= 0 || isSpinning) return;
    
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    }

    isSpinning = true;
    state.spins--;
    const spinBtn = document.getElementById('btn-spin');
    if (spinBtn) spinBtn.classList.remove('animate-pulse-glow');
    updateUI();
    
    const numSlices = PRIZES.length;
    const sliceAngle = 360 / numSlices;
    
    const winningIndex = getWeightedRandomPrizeIndex();
    const targetPrize = PRIZES[winningIndex];

    const randomOffset = (Math.random() * (sliceAngle * 0.6)) - (sliceAngle * 0.3);
    const baseRot = 360 - (winningIndex * sliceAngle) + randomOffset;
    const currentFullSpins = Math.floor(currentRotation / 360);
    const targetRotation = (currentFullSpins + 6) * 360 + baseRot;
    
    currentRotation = targetRotation;
    const wheelEl = document.getElementById('wheel');
    if (wheelEl) {
      wheelEl.style.transform = `rotate(${currentRotation}deg)`;
    }

    setTimeout(() => {
      try {
        isSpinning = false;
        
        state.inventory[targetPrize.id] = (state.inventory[targetPrize.id] || 0) + 1;
        saveState();
        updateUI();
        
        const t = window.miniappI18n ? window.miniappI18n.t.bind(window.miniappI18n) : (k => k);
        
        showPremiumReveal(targetPrize.img, targetPrize.emoji, 'Ура!', t('app.wonMessage', { prize: t(`prizes.${targetPrize.id}`) }));
      } catch (err) {
        console.error('spinWheel timeout error:', err);
        isSpinning = false;
      }
    }, 4000);
  } catch (err) {
    console.error('spinWheel error:', err);
    isSpinning = false;
  }
}

function simulateTask(task) {
  if (state.tasks[task.id]) return;
  
  if (window.Telegram?.WebApp?.HapticFeedback) {
    window.Telegram.WebApp.HapticFeedback.selectionChanged();
  }

  const t = window.miniappI18n ? window.miniappI18n.t.bind(window.miniappI18n) : (k => k);

  setTimeout(() => {
    state.tasks[task.id] = true;
    state.spins += task.reward;
    saveState();
    updateUI();
    
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    }
    
    showAlert('🎟️', t('app.btnDone'), `+${task.reward} спин(ов)`);
  }, 1000);
}

function renderTasks() {
  const container = document.getElementById('tasks-list');
  if (!container) return;
  container.innerHTML = '';
  const t = window.miniappI18n ? window.miniappI18n.t.bind(window.miniappI18n) : (k => k);

  TASKS_DATA.forEach(task => {
    const isDone = state.tasks[task.id];
    
    const div = document.createElement('div');
    div.className = 'flex items-center justify-between py-3.5 hover:bg-white/5 rounded-2xl transition-colors cursor-pointer px-2 -mx-2';
    if (!isDone) div.classList.add('group');
    else div.classList.add('opacity-75');
    
    const left = document.createElement('div');
    left.className = 'flex items-center gap-4';
    
    const icon = document.createElement('div');
    icon.className = 'w-11 h-11 flex items-center justify-center rounded-full text-2xl bg-slate-800/80 border border-slate-700/50 shrink-0 shadow-sm';
    icon.innerHTML = task.icon;

    const textCol = document.createElement('div');
    textCol.className = 'flex flex-col justify-center';

    const title = document.createElement('div');
    title.className = 'text-[15px] font-semibold tracking-tight text-white mb-0.5 leading-tight';
    title.textContent = t(`app.${task.id}`);

    const reward = document.createElement('div');
    reward.className = 'flex items-center gap-1.5 text-[13px] font-medium text-slate-400 leading-none';
    reward.innerHTML = '<span class="text-[14px]">🎟️</span> <span>+' + task.reward + '</span>';

    textCol.appendChild(title);
    textCol.appendChild(reward);

    left.appendChild(icon);
    left.appendChild(textCol);

    const right = document.createElement('div');
    if (isDone) {
      right.className = 'w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 shrink-0 mr-1';
      right.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>';
    } else {
      right.className = 'w-7 h-7 rounded-full bg-slate-700/80 flex items-center justify-center text-slate-400 shrink-0 group-hover:bg-slate-600 transition-colors mr-1 group-hover:text-white';
      right.innerHTML = '<svg class="w-4 h-4 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"></path></svg>';
    }

    div.appendChild(left);
    div.appendChild(right);
    
    if (!isDone) {
      div.onclick = () => simulateTask(task);
    }

    container.appendChild(div);
  });
}

function renderPrizes() {
  const container = document.getElementById('prizes-grid');
  if (!container || container.children.length > 0) return;
  const t = window.miniappI18n ? window.miniappI18n.t.bind(window.miniappI18n) : (k => k);

  PRIZES.forEach(p => {
    const div = document.createElement('div');
    div.className = 'bg-gradient-to-b from-[#242434] to-[#14141e] border border-white/5 rounded-[18px] p-3 flex flex-col justify-between aspect-[3/4] relative overflow-hidden group hover:from-[#2a2a3e] hover:to-[#1a1a26] transition-all shadow-lg';
    
    const glow = document.createElement('div');
    glow.className = 'absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none';
    
    const emojiWrapper = document.createElement('div');
    emojiWrapper.className = 'w-full flex-1 flex items-center justify-center relative z-10 -mt-1';
    
    const hoverWrap = document.createElement('div');
    hoverWrap.className = 'transform group-hover:scale-110 group-hover:-translate-y-1 transition-all duration-300';

    const animWrap = document.createElement('div');
    animWrap.className = Math.random() > 0.5 ? 'animate-float-3d-alt' : 'animate-float-3d';
    animWrap.style.animationDelay = `${(Math.random() * -5).toFixed(2)}s`;

    const img = document.createElement('img');
    img.src = p.img;
    img.alt = p.emoji;
    img.className = 'w-14 h-14 object-contain drop-shadow-[0_6px_12px_rgba(0,0,0,0.6)]';
    img.onerror = () => { img.outerHTML = `<div class="text-4xl drop-shadow-lg">${p.emoji}</div>`; };
    
    animWrap.appendChild(img);
    hoverWrap.appendChild(animWrap);
    emojiWrapper.appendChild(hoverWrap);
    
    const infoWrap = document.createElement('div');
    infoWrap.className = 'w-full flex flex-col items-center justify-center relative z-10 mt-2 mb-1';

    const name = document.createElement('div');
    name.className = 'text-[13px] font-bold text-white w-full whitespace-nowrap overflow-hidden text-ellipsis leading-none text-center drop-shadow-sm';
    name.textContent = t(`prizes.${p.id}`);

    infoWrap.appendChild(name);

    div.appendChild(glow);
    div.appendChild(emojiWrapper);
    div.appendChild(infoWrap);
    container.appendChild(div);
  });
}

function renderInventory() {
  const container = document.getElementById('inventory-grid');
  const emptyView = document.getElementById('empty-inv');
  if (!container || !emptyView) return;
  
  container.innerHTML = '';
  const t = window.miniappI18n ? window.miniappI18n.t.bind(window.miniappI18n) : (k => k);

  const invKeys = Object.keys(state.inventory).filter(k => state.inventory[k] > 0 && PRIZES.some(p => p.id === k));
  
  if (invKeys.length === 0) {
    container.classList.add('hidden');
    emptyView.classList.remove('hidden');
    emptyView.classList.add('flex');
    return;
  }
  
  container.classList.remove('hidden');
  emptyView.classList.add('hidden');
  emptyView.classList.remove('flex');

  invKeys.forEach((key, index) => {
    const count = state.inventory[key];
    const p = PRIZES.find(x => x.id === key);
    if (!p) return;

    const div = document.createElement('div');
    div.className = 'bg-gradient-to-b from-[#2a2c4e] to-[#14141e] border border-indigo-500/30 rounded-[18px] p-3 flex flex-col justify-between aspect-[3/4] relative overflow-hidden group hover:from-[#353863] transition-all shadow-[0_4px_15px_rgba(0,0,0,0.3)] cursor-pointer';
    
    const badge = document.createElement('div');
    badge.className = 'absolute top-2 right-2 min-w-[22px] h-[22px] px-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-[8px] flex items-center justify-center text-[10px] font-black text-white shadow-md border border-white/10 z-20';
    badge.textContent = count > 99 ? '99+' : count;

    const emojiWrapper = document.createElement('div');
    emojiWrapper.className = 'w-full flex-1 flex items-center justify-center relative z-10 -mt-1';

    const hoverWrap = document.createElement('div');
    hoverWrap.className = 'transform group-hover:scale-110 group-hover:-translate-y-1 transition-all duration-300';

    const animWrap = document.createElement('div');
    animWrap.className = Math.random() > 0.5 ? 'animate-float-3d-alt' : 'animate-float-3d';
    animWrap.style.animationDelay = `${(Math.random() * -5).toFixed(2)}s`;

    const img = document.createElement('img');
    img.src = p.img;
    img.alt = p.emoji;
    img.className = 'w-14 h-14 object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)]';
    img.onerror = () => { img.outerHTML = `<div class="text-[40px] drop-shadow-xl">${p.emoji}</div>`; };
    
    animWrap.appendChild(img);
    hoverWrap.appendChild(animWrap);
    emojiWrapper.appendChild(hoverWrap);

    const infoWrap = document.createElement('div');
    infoWrap.className = 'w-full flex flex-col items-center justify-center relative z-10 mt-2 mb-1';

    const name = document.createElement('div');
    name.className = 'text-[13px] font-bold text-white w-full whitespace-nowrap overflow-hidden text-ellipsis leading-none text-center drop-shadow-sm';
    name.textContent = t(`prizes.${p.id}`);

    infoWrap.appendChild(name);
    
    div.appendChild(badge);
    div.appendChild(emojiWrapper);
    div.appendChild(infoWrap);
    
    div.onclick = () => {
      showAlert(`<img src="${p.img}" class="w-20 h-20 object-contain inline-block drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]">`, t('app.prizeActionTitle'), t('app.prizeActionText'));
    };

    container.appendChild(div);
  });
}

function renderSkins() {
  const container = document.getElementById('skins-list');
  if (!container) return;
  container.innerHTML = '';
  const t = window.miniappI18n ? window.miniappI18n.t.bind(window.miniappI18n) : (k => k);

  const skinNames = {
    normal: t('app.skinNormal'),
    gold: t('app.skinGold'),
    fire: t('app.skinFire'),
    glass: t('app.skinGlass')
  };

  SKINS.forEach(skin => {
    const isLocked = state.friends < skin.req;
    const isActive = state.activeSkin === skin.id;

    const div = document.createElement('div');
    div.className = `p-3 rounded-xl border flex justify-between items-center transition-all ${isActive ? 'bg-indigo-500/20 border-indigo-400' : 'bg-slate-800/50 border-slate-700'}`;
    
    const left = document.createElement('div');
    const title = document.createElement('div');
    title.className = `font-bold ${isLocked ? 'text-slate-500' : 'text-slate-200'}`;
    title.textContent = skinNames[skin.id] || skin.id;
    
    const req = document.createElement('div');
    req.className = 'text-[10px] text-slate-400 uppercase mt-1';
    req.textContent = isLocked ? t('app.reqReferrals', { count: skin.req }) : '';
    
    left.appendChild(title);
    if (isLocked) left.appendChild(req);

    const btn = document.createElement('button');
    if (isLocked) {
      btn.className = 'p-2 text-slate-500 text-xl';
      btn.innerHTML = '🔒';
    } else if (isActive) {
      btn.className = 'px-3 py-1 bg-indigo-500 text-white text-xs font-bold rounded-lg pointer-events-none';
      btn.textContent = 'Активен';
    } else {
      btn.className = 'px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-lg transition';
      btn.textContent = 'Выбрать';
      btn.onclick = () => {
        state.activeSkin = skin.id;
        applySkin(skin.id);
        saveState();
        renderSkins();
      };
    }

    div.appendChild(left);
    div.appendChild(btn);
    container.appendChild(div);
  });
}

function simulateInvite() {
  try {
    state.friends++;
    saveState();
    updateUI();
    renderSkins();
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    }
  } catch (err) {
    console.error('simulateInvite error:', err);
  }
}

function openModal(id) {
  try {
    const el = document.getElementById(id);
    const content = document.getElementById(id + '-content');
    if (!el || !content) return;
    
    el.classList.remove('hidden');
    void el.offsetWidth; // Reflow
    
    el.classList.remove('opacity-0');
    content.classList.remove('scale-95');
    content.classList.add('scale-100');
  } catch (err) {
    console.error('openModal error:', err);
  }
}

function closeAllModals() {
  try {
    document.querySelectorAll('.modal-overlay').forEach(el => {
      const content = el.querySelector('div');
      if (!content) return;
      
      el.classList.add('opacity-0');
      content.classList.remove('scale-100');
      content.classList.add('scale-95');
      
      setTimeout(() => {
        el.classList.add('hidden');
      }, 300);
    });
  } catch (err) {
    console.error('closeAllModals error:', err);
  }
}

function showAlert(emojiOrImg, title, text) {
  try {
    const emojiEl = document.getElementById('alert-emoji');
    const titleEl = document.getElementById('alert-title');
    const textEl = document.getElementById('alert-text');
    
    if (emojiEl) {
      if (emojiOrImg.includes('<img')) {
        emojiEl.innerHTML = emojiOrImg;
        emojiEl.className = 'flex justify-center mb-4 animate-bounce drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]';
      } else {
        emojiEl.textContent = emojiOrImg;
        emojiEl.className = 'text-6xl mb-4 animate-bounce drop-shadow-lg text-center';
      }
    }
    if (titleEl) titleEl.textContent = title;
    if (textEl) textEl.textContent = text;
    
    openModal('modal-alert');
  } catch (err) {
    console.error('showAlert error:', err);
  }
}

function showPremiumReveal(imgSrc, emojiAlt, title, text) {
  const modal = document.getElementById('modal-reveal');
  const content = document.getElementById('reveal-content');
  const emojiEl = document.getElementById('reveal-emoji');
  const rays = document.getElementById('reveal-rays');
  const glow = document.getElementById('reveal-glow');
  const info = document.getElementById('reveal-info');
  const flash = document.getElementById('reveal-flash');
  
  if (!modal || !emojiEl) return;

  modal.classList.remove('hidden');
  void modal.offsetWidth;
  
  modal.classList.remove('opacity-0', 'pointer-events-none');
  content.classList.remove('scale-90');
  content.classList.add('scale-100');
  
  // Phase 1: Gift box
  emojiEl.innerHTML = `<img src="https://em-content.zobj.net/source/apple/391/wrapped-gift_1f381.png" class="w-32 h-32 object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.8)] tg-shaking" alt="🎁">`;
  emojiEl.className = 'flex justify-center items-center';
  
  rays.classList.remove('opacity-100');
  glow.classList.remove('opacity-100');
  info.classList.remove('opacity-100', 'translate-y-0');
  info.classList.add('opacity-0', 'translate-y-8');
  flash.classList.remove('flash-overlay');
  
  if (window.Telegram?.WebApp?.HapticFeedback) {
     window.Telegram.WebApp.HapticFeedback.impactOccurred('heavy');
  }

  // Phase 2: Open
  setTimeout(() => {
    flash.classList.add('flash-overlay');
    
    if (window.Telegram?.WebApp?.HapticFeedback) {
       window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    }

    setTimeout(() => {
      // Swapped out the tg-shaking/brightness filter because it looks bad on Apple Emojis
      emojiEl.innerHTML = `<img src="${imgSrc}" class="w-40 h-40 object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.8)] tg-spring-in tg-floating" alt="${emojiAlt}" onerror="this.onerror=null; this.outerHTML='<div class=\\'text-[120px] drop-shadow-[0_20px_40px_rgba(0,0,0,0.6)] tg-spring-in tg-floating\\'>${emojiAlt}</div>';">`;
      
      rays.classList.add('opacity-100');
      glow.classList.add('opacity-100');
      
      document.getElementById('reveal-title').textContent = title;
      document.getElementById('reveal-text').textContent = text;
      
      info.classList.remove('opacity-0', 'translate-y-8');
      info.classList.add('opacity-100', 'translate-y-0');
      
      if (typeof confetti === 'function') {
        const colors = ['#ffffff', '#818cf8', '#c084fc', '#f472b6', '#eab308'];
        confetti({
          particleCount: 150,
          spread: 120,
          origin: { y: 0.6 },
          colors: colors,
          zIndex: 1000
        });
      }
    }, 250);
    
  }, 1200);
}

function closeRevealModal() {
  const modal = document.getElementById('modal-reveal');
  const content = document.getElementById('reveal-content');
  if (!modal) return;
  
  modal.classList.add('opacity-0', 'pointer-events-none');
  content.classList.remove('scale-100');
  content.classList.add('scale-90');
  
  setTimeout(() => {
    modal.classList.add('hidden');
  }, 500);
}
