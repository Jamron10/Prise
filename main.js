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

let TASKS_DATA = [
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

const MOCK_LEADERBOARD = [
  { name: 'Artem K.', friends: 156, avatar: 'A', bg: 'from-blue-500 to-cyan-500' },
  { name: 'Max (Premium)', friends: 89, avatar: 'M', bg: 'from-fuchsia-500 to-pink-500' },
  { name: 'Elena V.', friends: 42, avatar: 'E', bg: 'from-emerald-500 to-teal-500' },
  { name: 'Dmitry', friends: 28, avatar: 'D', bg: 'from-orange-500 to-red-500' },
  { name: 'Alex', friends: 15, avatar: 'A', bg: 'from-indigo-500 to-purple-500' }
];

const MOCK_WITHDRAWALS = [
  { id: 'req_101', userId: '1004', userName: 'Dmitry', prizeId: 'gift', status: 'pending', date: new Date().toISOString() },
  { id: 'req_102', userId: '1002', userName: 'Maria K.', prizeId: 'teddy', status: 'approved', date: new Date(Date.now() - 86400000).toISOString() }
];

// ==========================================
// НАСТРОЙКИ СЕРВЕРА
const USE_BACKEND = false; 
const API_URL = 'http://localhost:3000/api'; 
// ==========================================

let currentUserId = 'player' + Math.floor(Math.random() * 10000);

let state = {
  spins: 3,
  totalSpins: 0,
  createdAt: new Date().toISOString(),
  inventory: {},
  tasks: {},
  friends: 0,
  activeSkin: 'normal',
  hasUsedReferral: false
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
    initAdmin(); 
    updateUI();

    document.getElementById('btn-spin')?.addEventListener('click', spinWheel);
    document.getElementById('btn-invite-main')?.addEventListener('click', inviteFriend);
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
        currentUserId = user.id;
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

      const startParam = tg.initDataUnsafe?.start_param;
      if (startParam && !state.hasUsedReferral) {
        state.hasUsedReferral = true;
        saveState();
        setTimeout(() => {
          const t = window.miniappI18n ? window.miniappI18n.t.bind(window.miniappI18n) : (k => k);
          showAlert('🤝', t('app.refWelcomeTitle') || 'Добро пожаловать!', t('app.refWelcomeText') || 'Вы зашли по приглашению друга. Удачи!');
        }, 1000);
      }
    }
  } catch (err) {
    console.error('initTelegram error:', err);
  }
}

async function loadState() {
  try {
    if (USE_BACKEND) {
      const res = await fetch(`${API_URL}/state/${currentUserId}`);
      if (res.ok) {
        const data = await res.json();
        state.spins = data.spins !== undefined ? data.spins : state.spins;
        state.friends = data.friends !== undefined ? data.friends : state.friends;
        state.activeSkin = data.activeSkin || state.activeSkin;
        state.inventory = data.inventory || {};
        state.tasks = data.tasks || {};
      }
    } else {
      if (typeof miniappsAI !== 'undefined' && miniappsAI.storage) {
        const stored = await miniappsAI.storage.getItem('giftWheelState');
        if (stored) {
          const parsed = JSON.parse(stored);
          state = { ...state, ...parsed };
          if (!state.createdAt) state.createdAt = new Date().toISOString();
        }
        const storedTasks = await miniappsAI.storage.getItem('giftWheelTasks');
        if (storedTasks) TASKS_DATA = JSON.parse(storedTasks);
      }
    }
  } catch (e) {
    console.error('Failed to load state', e);
  }
}

async function saveState() {
  try {
    if (USE_BACKEND) {
      await fetch(`${API_URL}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramId: currentUserId, activeSkin: state.activeSkin, tasks: state.tasks })
      });
    } else {
      if (typeof miniappsAI !== 'undefined' && miniappsAI.storage) {
        await miniappsAI.storage.setItem('giftWheelState', JSON.stringify(state));
      }
    }
  } catch (e) {
    console.error('Failed to save state', e);
  }
}
async function saveTasks() {
  try {
    if (!USE_BACKEND && typeof miniappsAI !== 'undefined' && miniappsAI.storage) {
      await miniappsAI.storage.setItem('giftWheelTasks', JSON.stringify(TASKS_DATA));
    }
  } catch (e) {
    console.error('Failed to save tasks', e);
  }
}

function initWheel() {
  const wheelContent = document.getElementById('wheel-content');
  if (!wheelContent) return;
  wheelContent.innerHTML = '';
  
  const numSlices = PRIZES.length;
  const sliceAngle = 360 / numSlices;
  
  PRIZES.forEach((p, i) => {
    const lineContainer = document.createElement('div');
    lineContainer.className = 'absolute top-0 left-1/2 w-[2px] h-[50%] origin-bottom z-10 pointer-events-none';
    lineContainer.style.marginLeft = '-1px';
    lineContainer.style.transform = `rotate(${(i * sliceAngle) + (sliceAngle / 2)}deg)`;
    
    const line = document.createElement('div');
    line.className = 'w-full h-full bg-white/10 shadow-[0_0_2px_rgba(0,0,0,0.5)]';
    
    const peg = document.createElement('div');
    peg.className = 'absolute top-[3px] left-1/2 -translate-x-1/2 w-[6px] h-[6px] rounded-full bg-indigo-200 shadow-[0_0_5px_rgba(199,210,254,0.8)] z-40';
    
    lineContainer.appendChild(line);
    lineContainer.appendChild(peg);
    wheelContent.appendChild(lineContainer);

    const el = document.createElement('div');
    el.className = 'absolute top-0 left-1/2 w-[50px] h-[50%] origin-bottom flex justify-center pt-[14px] z-20';
    el.style.marginLeft = '-25px';
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
  const indicator = document.getElementById('nav-indicator');

  buttons.forEach((btn, index) => {
    btn.addEventListener('click', () => {
      try {
        const targetId = btn.getAttribute('data-target');
        
        document.querySelectorAll('.tab-view').forEach(v => {
          v.classList.add('hidden');
          v.classList.remove('active');
        });
        
        const targetEl = document.getElementById(targetId);
        if (targetEl) {
          targetEl.classList.remove('hidden');
          targetEl.classList.add('active');
        }
        
        buttons.forEach(b => {
          b.classList.remove('text-indigo-400', 'scale-110', '-translate-y-1');
          b.classList.add('text-slate-500');
        });
        btn.classList.remove('text-slate-500');
        btn.classList.add('text-indigo-400', 'scale-110', '-translate-y-1');
        
        if (indicator) {
          indicator.style.transform = `translateX(${index * 100}%)`;
        }

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
  document.getElementById('btn-user-profile')?.addEventListener('click', showProfile);

  document.getElementById('btn-settings')?.addEventListener('click', () => {
    renderSkins();
    openModal('modal-settings');
  });

  document.getElementById('btn-open-faq')?.addEventListener('click', () => {
    closeAllModals();
    setTimeout(() => {
      openModal('modal-faq');
    }, 350);
  });

  document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', () => {
      closeAllModals();
    });
  });

  const copyIdBtn = document.getElementById('profile-id-btn');
  if (copyIdBtn && !copyIdBtn.dataset.bound) {
    copyIdBtn.dataset.bound = 'true';
    copyIdBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(currentUserId).then(() => {
        const icon = document.getElementById('profile-id-icon');
        if (!icon) return;
        const oldHtml = icon.innerHTML;
        icon.innerHTML = '✅';
        copyIdBtn.classList.add('text-emerald-400', 'border-emerald-500/50', 'bg-emerald-500/10');
        copyIdBtn.classList.remove('text-indigo-300', 'border-indigo-500/30', 'bg-indigo-950/60');
        
        if (window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }
        
        setTimeout(() => {
          icon.innerHTML = oldHtml;
          copyIdBtn.classList.remove('text-emerald-400', 'border-emerald-500/50', 'bg-emerald-500/10');
          copyIdBtn.classList.add('text-indigo-300', 'border-indigo-500/30', 'bg-indigo-950/60');
        }, 2000);
      }).catch(err => console.error('Copy failed', err));
    });
  }
}

function showProfile() {
  try {
    const t = window.miniappI18n ? window.miniappI18n.t.bind(window.miniappI18n) : (k => k);
    
    document.getElementById('profile-avatar').innerHTML = document.getElementById('user-avatar').innerHTML;
    document.getElementById('profile-name').textContent = document.getElementById('user-name').textContent;
    document.getElementById('profile-id-text').textContent = currentUserId;
    
    document.getElementById('profile-balance').textContent = state.spins;
    document.getElementById('profile-friends').textContent = state.friends;
    document.getElementById('profile-total-spins').textContent = state.totalSpins || 0;
    
    const d = new Date(state.createdAt || Date.now());
    document.getElementById('profile-reg-date').textContent = d.toLocaleDateString();
    
    const userReqs = MOCK_WITHDRAWALS.filter(r => r.userId === currentUserId);
    document.getElementById('profile-req-total').textContent = userReqs.length;
    document.getElementById('profile-req-approved').textContent = userReqs.filter(r => r.status === 'approved').length;
    document.getElementById('profile-req-rejected').textContent = userReqs.filter(r => r.status === 'rejected').length;
    
    openModal('modal-profile');
  } catch(e) { console.error('showProfile error:', e); }
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

    const friendsCountBig = document.getElementById('friends-count-big');
    if (friendsCountBig) {
      friendsCountBig.textContent = state.friends;
    }

    renderTasks();
    renderPrizes();
    renderInventory();
    renderLeaderboard();
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

async function spinWheel() {
  try {
    if (state.spins <= 0 || isSpinning) return;
    
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    }

    isSpinning = true;
    
    state.spins--;
    state.totalSpins = (state.totalSpins || 0) + 1;
    const spinBtn = document.getElementById('btn-spin');
    if (spinBtn) spinBtn.classList.remove('animate-pulse-glow');
    updateUI();
    
    let targetPrize;
    let winningIndex;

    if (USE_BACKEND) {
      try {
        const res = await fetch(`${API_URL}/spin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ telegramId: currentUserId })
        });
        const data = await res.json();
        
        if (data.success) {
          winningIndex = PRIZES.findIndex(p => p.id === data.prizeId);
          targetPrize = PRIZES[winningIndex];
          state.spins = data.spinsLeft; 
        } else {
          throw new Error(data.error || 'Spin failed');
        }
      } catch (err) {
        console.error(err);
        isSpinning = false;
        state.spins++; 
        updateUI();
        return;
      }
    } else {
      winningIndex = getWeightedRandomPrizeIndex();
      targetPrize = PRIZES[winningIndex];
      saveState();
    }

    const numSlices = PRIZES.length;
    const sliceAngle = 360 / numSlices;

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
        
        if (USE_BACKEND) {
          state.inventory[targetPrize.id] = (state.inventory[targetPrize.id] || 0) + 1;
        } else {
          state.inventory[targetPrize.id] = (state.inventory[targetPrize.id] || 0) + 1;
          saveState();
        }
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

  setTimeout(async () => {
    if (USE_BACKEND) {
      try {
        const res = await fetch(`${API_URL}/task`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ telegramId: currentUserId, taskId: task.id, reward: task.reward })
        });
        const data = await res.json();
        if (data.success) {
          state.tasks[task.id] = true;
          state.spins = data.spinsTotal;
        }
      } catch (err) {
        console.error(err);
        return;
      }
    } else {
      state.tasks[task.id] = true;
      state.spins += task.reward;
      saveState();
    }
    
    updateUI();
    
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    }
    
    showAlert('🎟️', t('app.btnDone'), `+${task.reward} спин(ов)`);
  }, 1000);
}

function renderLeaderboard() {
  const container = document.getElementById('leaderboard-list');
  if (!container) return;
  container.innerHTML = '';
  
  let list = [...MOCK_LEADERBOARD];
  const currentUserName = document.getElementById('user-name')?.textContent || 'Player 1';
  
  if (state.friends > 0) {
     const existingIdx = list.findIndex(u => u.isMe);
     if (existingIdx > -1) list.splice(existingIdx, 1);
     list.push({ name: currentUserName, friends: state.friends, avatar: currentUserName.charAt(0), isMe: true, bg: 'from-indigo-500 to-purple-600' });
  }
  
  list.sort((a, b) => b.friends - a.friends);
  list = list.slice(0, 6);

  list.forEach((u, idx) => {
    const isTop1 = idx === 0;
    const isTop2 = idx === 1;
    const isTop3 = idx === 2;
    
    let rankClass = 'bg-slate-800/80 border-slate-700/50 text-slate-400 shadow-sm';
    let rankText = `#${idx + 1}`;
    let borderGlow = 'border-white/5 bg-slate-900/60 hover:bg-slate-800/80';
    let nameColor = 'text-white';
    let shineHtml = '';

    if (isTop1) { 
        rankClass = 'bg-gradient-to-br from-yellow-300 to-yellow-600 text-yellow-950 text-xl shadow-[0_0_15px_rgba(250,204,21,0.5)] border-none'; 
        rankText = '👑'; 
        borderGlow = 'border-yellow-500/40 bg-gradient-to-r from-yellow-500/10 via-slate-900 to-slate-900 hover:from-yellow-500/20';
        nameColor = 'text-yellow-400';
        shineHtml = '<div class="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-2xl pointer-events-none"></div>';
    }
    else if (isTop2) { 
        rankClass = 'bg-gradient-to-br from-slate-300 to-slate-500 text-slate-900 text-lg shadow-[0_0_15px_rgba(148,163,184,0.4)] border-none'; 
        rankText = '🥈'; 
        borderGlow = 'border-slate-400/40 bg-gradient-to-r from-slate-400/10 via-slate-900 to-slate-900 hover:from-slate-400/20';
        nameColor = 'text-slate-200';
    }
    else if (isTop3) { 
        rankClass = 'bg-gradient-to-br from-amber-500 to-amber-700 text-amber-950 text-lg shadow-[0_0_15px_rgba(217,119,6,0.4)] border-none'; 
        rankText = '🥉'; 
        borderGlow = 'border-amber-600/40 bg-gradient-to-r from-amber-600/10 via-slate-900 to-slate-900 hover:from-amber-600/20';
        nameColor = 'text-amber-500';
    }

    const delay = idx * 0.08;

    const div = document.createElement('div');
    div.className = `flex items-center justify-between p-3.5 rounded-[20px] border ${borderGlow} ${u.isMe ? 'ring-1 ring-indigo-500 shadow-[inset_0_0_20px_rgba(99,102,241,0.15)]' : ''} transition-all duration-300 hover:scale-[1.02] relative overflow-hidden animate-fade-in-up backdrop-blur-sm`;
    div.style.animationDelay = `${delay}s`;
    div.style.animationFillMode = 'both';
    
    div.innerHTML = `
      ${shineHtml}
      <div class="flex items-center gap-4 relative z-10">
        <div class="w-10 h-10 rounded-[12px] flex items-center justify-center font-black ${rankClass} shrink-0">${rankText}</div>
        <div class="relative">
          <div class="w-12 h-12 rounded-full bg-gradient-to-br ${u.bg || 'from-slate-600 to-slate-800'} flex items-center justify-center text-white font-black text-lg border-2 border-slate-900 shadow-lg">${u.avatar}</div>
          ${u.isMe ? '<div class="absolute -bottom-1 -right-1 w-5 h-5 bg-indigo-500 rounded-full border-2 border-slate-900 flex items-center justify-center text-[10px]">⭐</div>' : ''}
        </div>
        <div class="font-black text-[15px] leading-tight ${nameColor} tracking-tight">${u.name} ${u.isMe ? '<span class="text-[9px] ml-1.5 bg-indigo-500/30 text-indigo-200 border border-indigo-500/50 px-1.5 py-0.5 rounded-md uppercase tracking-widest align-middle">Вы</span>' : ''}</div>
      </div>
      <div class="flex items-center gap-1.5 bg-slate-950/60 px-3 py-2 rounded-[12px] border border-white/5 shadow-inner relative z-10 group-hover:bg-slate-900 transition-colors">
        <span class="text-[16px] drop-shadow-sm">🤝</span>
        <span class="text-white font-black text-[15px]">${u.friends}</span>
      </div>
    `;
    container.appendChild(div);
  });
}

function renderTasks() {
  const container = document.getElementById('tasks-list');
  if (!container) return;
  container.innerHTML = '';
  const t = window.miniappI18n ? window.miniappI18n.t.bind(window.miniappI18n) : (k => k);

  TASKS_DATA.forEach((task, idx) => {
    const isDone = state.tasks[task.id];
    
    const div = document.createElement('div');
    div.className = 'flex items-center justify-between p-4 mb-3 rounded-[20px] transition-all cursor-pointer border relative overflow-hidden active:scale-[0.98] group animate-fade-in-up';
    div.style.animationDelay = `${idx * 0.05}s`;
    div.style.animationFillMode = 'both';
    
    if (!isDone) {
      div.classList.add('bg-white/5', 'hover:bg-white/10', 'border-white/10', 'shadow-[0_4px_15px_rgba(0,0,0,0.1)]');
    } else {
      div.classList.add('bg-slate-800/40', 'border-slate-700/50', 'opacity-60');
    }

    const shine = document.createElement('div');
    shine.className = 'absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none';
    div.appendChild(shine);
    
    const left = document.createElement('div');
    left.className = 'flex items-center gap-4 relative z-10';
    
    const icon = document.createElement('div');
    icon.className = 'w-11 h-11 flex items-center justify-center rounded-full text-2xl bg-slate-800/80 border border-slate-700/50 shrink-0 shadow-sm group-hover:scale-110 transition-transform';
    icon.innerHTML = task.icon;

    const textCol = document.createElement('div');
    textCol.className = 'flex flex-col justify-center';

    const title = document.createElement('div');
    title.className = 'text-[15px] font-semibold tracking-tight text-white mb-0.5 leading-tight';
    title.textContent = task.title || t(`app.${task.id}`) || task.id;

    const reward = document.createElement('div');
    reward.className = 'flex items-center gap-1.5 text-[13px] font-medium text-slate-400 leading-none';
    reward.innerHTML = '<span class="text-[14px]">🎟️</span> <span>+' + task.reward + '</span>';

    textCol.appendChild(title);
    textCol.appendChild(reward);

    left.appendChild(icon);
    left.appendChild(textCol);

    const right = document.createElement('div');
    right.className = 'relative z-10';
    if (isDone) {
      right.className += ' w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 shrink-0 mr-1';
      right.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>';
    } else {
      right.className += ' w-7 h-7 rounded-full bg-slate-700/80 flex items-center justify-center text-slate-400 shrink-0 group-hover:bg-slate-600 transition-colors mr-1 group-hover:text-white';
      right.innerHTML = '<svg class="w-4 h-4 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"></path></svg>';
    }

    div.appendChild(left);
    div.appendChild(right);
    
    if (!isDone) {
      div.onclick = () => {
      if (task.url) {
        try {
          if (window.Telegram?.WebApp?.openTelegramLink && task.url.includes('t.me')) {
            window.Telegram.WebApp.openTelegramLink(task.url);
          } else if (window.Telegram?.WebApp?.openLink) {
            window.Telegram.WebApp.openLink(task.url);
          } else {
            window.open(task.url, '_blank');
          }
        } catch(e) { window.open(task.url, '_blank'); }
      }
      simulateTask(task);
    };

    }

    container.appendChild(div);
  });
}

function renderPrizes() {
  const container = document.getElementById('prizes-grid');
  if (!container || container.children.length > 0) return;
  const t = window.miniappI18n ? window.miniappI18n.t.bind(window.miniappI18n) : (k => k);

  PRIZES.forEach((p, idx) => {
    const div = document.createElement('div');
    div.className = 'bg-gradient-to-b from-[#242434] to-[#14141e] border border-white/5 rounded-[18px] p-3 flex flex-col justify-between aspect-[3/4] relative overflow-hidden group hover:from-[#2a2a3e] hover:to-[#1a1a26] transition-all shadow-lg animate-fade-in-up';
    div.style.animationDelay = `${idx * 0.05}s`;
    div.style.animationFillMode = 'both';
    
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
    div.className = 'bg-gradient-to-b from-[#2a2c4e] to-[#14141e] border border-indigo-500/30 rounded-[18px] p-3 flex flex-col justify-between aspect-[3/4] relative overflow-hidden group hover:from-[#353863] transition-all shadow-[0_4px_15px_rgba(0,0,0,0.3)] cursor-pointer animate-fade-in-up';
    div.style.animationDelay = `${index * 0.05}s`;
    div.style.animationFillMode = 'both';
    
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
      const allTasksCompleted = TASKS_DATA.every(task => state.tasks[task.id]);
      const tasksNeeded = TASKS_DATA.filter(task => !state.tasks[task.id]).length;
      const friendsNeeded = Math.max(0, 5 - state.friends);

      if (allTasksCompleted && state.friends >= 5) {
        const title = t('app.withdrawConfirmTitle') || 'Подтверждение вывода';
        const msgTpl = t('app.withdrawConfirmText') || 'Вы действительно хотите запросить вывод приза {prize}? Он будет временно списан из инвентаря.';
        const prizeName = '<b>' + (t(`prizes.${p.id}`) || p.id) + '</b>';
        const msg = msgTpl.replace('{prize}', prizeName);
        
        showConfirm(`<img src="${p.img}" class="w-24 h-24 object-contain inline-block drop-shadow-[0_15px_30px_rgba(0,0,0,0.6)] animate-float-3d">`, title, msg, () => {
          state.inventory[key]--;
          if (state.inventory[key] <= 0) delete state.inventory[key];
          saveState();
          updateUI();
          
          MOCK_WITHDRAWALS.unshift({
            id: 'req_' + Date.now(),
            userId: currentUserId,
            userName: document.getElementById('user-name')?.textContent || 'Игрок',
            prizeId: p.id,
            status: 'pending',
            date: new Date().toISOString()
          });

          setTimeout(() => {
            showAlert('✅', t('app.withdrawSuccessTitle') || 'Заявка отправлена', t('app.withdrawSuccessText') || 'Ваша заявка передана администратору. Ожидайте сообщения!');
          }, 400);
        });
      } else {
        const title = t('app.withdrawLockedTitle') || '🔒 Приз заблокирован';
        let msg = (t('app.withdrawReqText') || 'Для получения приза необходимо выполнить все задания и пригласить минимум 5 друзей.') + '<br><br>';
        
        const tasksStr = t('app.withdrawReqTasks') || '📝 Осталось заданий:';
        const friendsStr = t('app.withdrawReqFriends') || '🤝 Осталось пригласить:';
        
        if (tasksNeeded > 0) {
          msg += `<div class="flex justify-between items-center bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50 mb-2 shadow-inner"><span class="text-slate-300 text-[13px] font-medium">${tasksStr}</span> <span class="text-white font-black bg-slate-900 px-3 py-1 rounded-[10px] border border-slate-600 shadow-sm">${tasksNeeded}</span></div>`;
        }
        if (friendsNeeded > 0) {
          msg += `<div class="flex justify-between items-center bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50 shadow-inner"><span class="text-slate-300 text-[13px] font-medium">${friendsStr}</span> <span class="text-white font-black bg-slate-900 px-3 py-1 rounded-[10px] border border-slate-600 shadow-sm">${friendsNeeded}</span></div>`;
        }
        
        showAlert('🔒', title, msg);
      }
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

  SKINS.forEach((skin, idx) => {
    const isLocked = state.friends < skin.req;
    const isActive = state.activeSkin === skin.id;

    const div = document.createElement('div');
    div.className = `p-3 rounded-xl border flex justify-between items-center transition-all ${isActive ? 'bg-indigo-500/20 border-indigo-400' : 'bg-slate-800/50 border-slate-700'} animate-fade-in-up`;
    div.style.animationDelay = `${idx * 0.05}s`;
    div.style.animationFillMode = 'both';
    
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
      btn.className = 'px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-lg transition active:scale-95';
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

function inviteFriend() {
  try {
    const t = window.miniappI18n ? window.miniappI18n.t.bind(window.miniappI18n) : (k => k);
    
    const botUrl = `https://t.me/GiftWheel_bot/app?startapp=${currentUserId}`;
    const text = t('app.shareText') || 'Вращай Колесо подарков и выигрывай крутые призы! 🎁';
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(botUrl)}&text=${encodeURIComponent(text)}`;

    if (window.Telegram?.WebApp?.openTelegramLink) {
      window.Telegram.WebApp.openTelegramLink(shareUrl);
    } else {
      window.open(shareUrl, '_blank');
    }

    setTimeout(() => {
      if (!USE_BACKEND) {
        state.friends++;
        state.spins++; 
        saveState();
        updateUI();
        renderSkins();
        
        if (window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }
        showAlert('🎟️', t('app.bonusTitle') || 'Бонус!', t('app.bonusText') || '+1 билет и +1 друг (симуляция приглашения)');
      } else {
        showAlert('📨', 'Ссылка отправлена!', 'Когда друг зайдет по вашей ссылке, вы получите +1 билет!');
      }
    }, 2000);
  } catch (err) {
    console.error('inviteFriend error:', err);
  }
}

function openModal(id) {
  try {
    const el = document.getElementById(id);
    const content = document.getElementById(id + '-content');
    if (!el || !content) return;
    
    el.classList.remove('hidden');
    void el.offsetWidth; 
    
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

function showConfirm(emojiOrImg, title, text, onConfirm) {
  try {
    const el = document.getElementById('modal-confirm');
    const content = document.getElementById('modal-confirm-content');
    const emojiEl = document.getElementById('confirm-emoji');
    const titleEl = document.getElementById('confirm-title');
    const textEl = document.getElementById('confirm-text');
    const btnConfirm = document.getElementById('btn-confirm-action');
    
    if (emojiEl) {
      if (emojiOrImg.includes('<img')) {
        emojiEl.innerHTML = emojiOrImg;
        emojiEl.className = 'flex justify-center mb-4 drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]';
      } else {
        emojiEl.textContent = emojiOrImg;
        emojiEl.className = 'text-6xl mb-4 animate-bounce drop-shadow-lg text-center flex justify-center';
      }
    }
    if (titleEl) titleEl.textContent = title;
    if (textEl) textEl.innerHTML = text; // Allow HTML
    
    if (btnConfirm) {
      btnConfirm.onclick = () => {
        closeAllModals();
        if (onConfirm) onConfirm();
      };
    }
    
    openModal('modal-confirm');
  } catch (err) {
    console.error('showConfirm error:', err);
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
    if (textEl) {
      textEl.innerHTML = text; // Allow safe HTML like <br>
    }
    
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

  setTimeout(() => {
    flash.classList.add('flash-overlay');
    
    if (window.Telegram?.WebApp?.HapticFeedback) {
       window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    }

    setTimeout(() => {
      emojiEl.innerHTML = `<img src="${imgSrc}" class="w-40 h-40 object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.8)] tg-spring-in tg-floating" alt="${emojiAlt}" onerror="this.onerror=null; this.outerHTML='<div class=\\'text-[120px] drop-shadow-[0_20px_40px_rgba(0,0,0,0.6)] tg-spring-in tg-floating\\'>${emojiAlt}</div>';">`;
      
      rays.classList.add('opacity-100');
      glow.classList.add('opacity-100');
      
      document.getElementById('reveal-title').textContent = title;
      document.getElementById('reveal-text').textContent = text;
      
      if (typeof confetti === 'function') {
        const colors = ['#ffffff', '#818cf8', '#c084fc', '#f472b6', '#eab308'];
        const myCanvas = document.createElement('canvas');
        myCanvas.style.position = 'fixed';
        myCanvas.style.inset = '0';
        myCanvas.style.width = '100vw';
        myCanvas.style.height = '100vh';
        myCanvas.style.pointerEvents = 'none';
        myCanvas.style.zIndex = '9999';
        document.body.appendChild(myCanvas);
        
        const myConfetti = confetti.create(myCanvas, { resize: true, useWorker: false });
        myConfetti({
          particleCount: 150,
          spread: 120,
          origin: { y: 0.6 },
          colors: colors
        }).then(() => myCanvas.remove());
      }
      
      info.classList.remove('opacity-0', 'translate-y-8');
      info.classList.add('opacity-100', 'translate-y-0');
      
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

// ==========================================
// ADMIN PANEL MOCK LOGIC
// ==========================================

const MOCK_USERS = [
  { id: '1001', name: 'Алексей С.', spins: 12, friends: 5, banned: false, inventory: { 'gift': 2, 'teddy': 1 } },
  { id: '1002', name: 'Maria K.', spins: 0, friends: 1, banned: true, inventory: {} },
  { id: '1003', name: 'Иван (Premium)', spins: 45, friends: 12, banned: false, inventory: { 'diamond': 1, 'rocket': 3 } },
  { id: '1004', name: 'Dmitry', spins: 3, friends: 0, banned: false, inventory: { 'rose': 5, 'heart_ribbon': 2 } },
  { id: '1005', name: 'Elena', spins: 1, friends: 2, banned: false, inventory: {} }
];

let editingAdminUser = null;

function initAdmin() {
  const btnOpen = document.getElementById('btn-open-admin');
  const btnClose = document.getElementById('btn-close-admin');
  const panel = document.getElementById('admin-panel');

  if (btnOpen) {
    btnOpen.addEventListener('click', () => {
      closeAllModals(); 
      panel.classList.remove('hidden');
      setTimeout(() => panel.classList.remove('translate-y-full'), 10);
      renderAdminDash(); 
    });
  }

  if (btnClose) {
    btnClose.addEventListener('click', () => {
      panel.classList.add('translate-y-full');
      setTimeout(() => panel.classList.add('hidden'), 400); 
    });
  }

  const tabs = document.querySelectorAll('.admin-tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => {
        t.classList.remove('text-indigo-400', 'scale-110', '-translate-y-1');
        t.classList.add('text-slate-500');
      });
      
      tab.classList.remove('text-slate-500');
      tab.classList.add('text-indigo-400', 'scale-110', '-translate-y-1');

      document.querySelectorAll('.admin-view').forEach(v => {
        v.classList.add('hidden');
        v.classList.remove('active');
      });
      
      const targetId = tab.getAttribute('data-target');
      const targetView = document.getElementById(targetId);
      if (targetView) {
        targetView.classList.remove('hidden');
        targetView.classList.add('active');
      }

      if (targetId === 'admin-dash') renderAdminDash();
      if (targetId === 'admin-manage') renderAdminManage();
      if (targetId === 'admin-users') renderAdminUsers();
      if (targetId === 'admin-task-manage') renderAdminTasks();
      if (targetId === 'admin-withdrawals') renderAdminWithdrawals();
    });
  });

  const searchInput = document.getElementById('admin-user-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase().trim();
      const filtered = MOCK_USERS.filter(u => 
        u.name.toLowerCase().includes(term) || u.id.includes(term)
      );
      renderAdminUsers(filtered);
    });
  }

  const btnAddTask = document.getElementById('btn-add-task');
  if (btnAddTask && !btnAddTask.dataset.bound) {
    btnAddTask.dataset.bound = 'true';
    btnAddTask.addEventListener('click', async () => {
      const icon = document.getElementById('new-task-icon').value.trim() || '📋';
      const reward = parseInt(document.getElementById('new-task-reward').value) || 1;
      const title = document.getElementById('new-task-title').value.trim();
      const url = document.getElementById('new-task-url').value.trim();
      
      if (!title) return showAlert('⚠️', 'Ошибка', 'Введите название задания!');
      
      TASKS_DATA.push({ id: 'custom_' + Date.now(), reward, icon, title, url });
      await saveTasks();
      renderAdminTasks();
      renderTasks();
      
      document.getElementById('new-task-icon').value = '';
      document.getElementById('new-task-reward').value = '';
      document.getElementById('new-task-title').value = '';
      document.getElementById('new-task-url').value = '';
      
      const t = window.miniappI18n ? window.miniappI18n.t.bind(window.miniappI18n) : (k => k);
      showAlert('✅', t('admin.success') || 'Успешно!', 'Задание добавлено.');
    });
  }

  const btnSend = document.getElementById('btn-send-broadcast');
  if (btnSend) {
    btnSend.addEventListener('click', () => {
      const text = document.getElementById('broadcast-text').value;
      const btnText = document.getElementById('broadcast-btn-text').value;
      const btnUrl = document.getElementById('broadcast-btn-url').value;
      
      if (!text.trim()) {
        showAlert('⚠️', 'Ошибка', 'Введите текст рассылки!');
        return;
      }
      
      const t = window.miniappI18n ? window.miniappI18n.t.bind(window.miniappI18n) : (k => k);
      
      let previewHtml = `<div class="text-left bg-slate-800/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-600 text-sm mb-4 max-h-48 overflow-y-auto text-slate-200 shadow-inner">${text.replace(/\n/g, '<br>')}</div>`;
      if (btnText && btnUrl) {
         previewHtml += `<div class="w-full py-3 bg-[#2ea6ff] rounded-[14px] text-white font-bold text-center text-sm shadow-[0_4px_15px_rgba(46,166,255,0.4)] transition hover:bg-[#1c9ced] cursor-pointer">${btnText}</div>`;
      }
      
      showAlert('📢', t('admin.success') || 'Успешно!', previewHtml);
      
      document.getElementById('broadcast-text').value = '';
      document.getElementById('broadcast-btn-text').value = '';
      document.getElementById('broadcast-btn-url').value = '';
    });
  }

  const btnSaveManage = document.getElementById('btn-save-manage');
  if (btnSaveManage && !btnSaveManage.dataset.bound) {
    btnSaveManage.dataset.bound = 'true';
    btnSaveManage.addEventListener('click', () => {
      const t = window.miniappI18n ? window.miniappI18n.t.bind(window.miniappI18n) : (k => k);
      PRIZES.forEach((p, idx) => {
        const input = document.getElementById(`prize-weight-${idx}`);
        if (input) {
          const val = parseInt(input.value);
          if (!isNaN(val) && val >= 0) p.weight = val;
        }
      });
      initWheel();
      showAlert('✅', t('admin.success') || 'Успешно!', 'Веса призов обновлены. Шансы пересчитаны!');
    });
  }
}

function renderAdminDash() {
  const elSpins = document.getElementById('admin-stat-spins');
  if (elSpins) {
    elSpins.textContent = (45120 + Math.floor(Math.random() * 10)).toLocaleString();
  }
}

function renderAdminManage() {
  const container = document.getElementById('admin-manage-list');
  if (!container) return;
  container.innerHTML = '';
  
  const t = window.miniappI18n ? window.miniappI18n.t.bind(window.miniappI18n) : (k => k);

  PRIZES.forEach((p, idx) => {
    const div = document.createElement('div');
    div.className = 'flex items-center justify-between p-3.5 bg-slate-900/40 backdrop-blur-sm rounded-2xl border border-slate-700/50 mb-0 transition hover:bg-slate-800/60 shadow-sm group animate-fade-in-up';
    div.style.animationDelay = `${idx * 0.05}s`;
    div.style.animationFillMode = 'both';
    
    div.innerHTML = `
      <div class="flex items-center gap-3.5">
        <div class="w-12 h-12 rounded-[14px] bg-slate-950 flex justify-center items-center shadow-inner border border-white/5 relative overflow-hidden group-hover:scale-105 transition-transform">
          <div class="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
          <img src="${p.img}" class="w-7 h-7 object-contain drop-shadow-md relative z-10" alt="${p.emoji}" onerror="this.outerHTML='<span class=\\'text-xl\\'>${p.emoji}</span>'">
        </div>
        <div>
          <div class="font-bold text-white text-[14px] mb-0.5">${t('prizes.' + p.id) || p.id}</div>
          <div class="text-[11px] text-indigo-300/80 font-medium">Шанс: <span class="text-indigo-200">${p.weight}</span></div>
        </div>
      </div>
      <div class="flex flex-col items-end gap-1.5">
        <span class="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Изменить</span>
        <input type="number" id="prize-weight-${idx}" value="${p.weight}" class="w-16 bg-slate-950 border border-slate-600 rounded-[10px] px-2 py-1.5 text-white font-bold text-[14px] text-center focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 focus:outline-none transition shadow-inner">
      </div>
    `;
    container.appendChild(div);
  });
}

function renderAdminUsers(users = MOCK_USERS) {
  const container = document.getElementById('admin-users-list');
  if (!container) return;
  container.innerHTML = '';
  const t = window.miniappI18n ? window.miniappI18n.t.bind(window.miniappI18n) : (k => k);

  if (users.length === 0) {
    container.innerHTML = '<div class="text-center py-10 text-slate-500 font-medium">Пользователи не найдены</div>';
    return;
  }

  users.forEach((u, index) => {
    const isTop3 = index < 3 && !u.banned && users === MOCK_USERS;
    const div = document.createElement('div');
    div.className = `p-4 rounded-[20px] border flex justify-between items-center transition-all ${u.banned ? 'bg-red-950/20 border-red-900/30 grayscale opacity-70' : 'bg-slate-900/60 backdrop-blur-sm border-slate-700/50 hover:bg-slate-800/80 shadow-sm'} animate-fade-in-up`;
    div.style.animationDelay = `${index * 0.05}s`;
    div.style.animationFillMode = 'both';
    
    let badge = '';
    if (isTop3 && index === 0) badge = '🥇';
    else if (isTop3 && index === 1) badge = '🥈';
    else if (isTop3 && index === 2) badge = '🥉';

    const statusHtml = u.banned ? `<span class="text-[9px] bg-red-500/20 border border-red-500/50 text-red-300 px-2 py-0.5 rounded-full font-bold ml-2 uppercase tracking-wider shadow-inner" data-i18n="admin.statusBanned">${t('admin.statusBanned') || 'ЗАБАНЕН'}</span>` : '';

    div.innerHTML = `
      <div class="flex items-center gap-3.5">
        <div class="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg relative shadow-inner border border-white/10 shrink-0">
          ${u.name.charAt(0)}
          ${badge ? `<div class="absolute -top-2 -right-2 text-xl drop-shadow-md">${badge}</div>` : ''}
          ${u.banned ? `<div class="absolute inset-0 bg-red-900/90 rounded-full flex items-center justify-center text-sm border border-red-500">⛔</div>` : ''}
        </div>
        <div>
          <div class="font-bold text-white text-[15px] flex items-center mb-1">${u.name} ${statusHtml}</div>
          <div class="text-[10px] text-slate-400 font-medium font-mono bg-slate-950/50 px-1.5 py-0.5 rounded-md inline-block">ID: ${u.id}</div>
          <div class="text-[12px] font-bold text-indigo-300 mt-1.5 flex gap-3">
            <span class="flex items-center gap-1 bg-indigo-950/50 px-2 py-0.5 rounded-md border border-indigo-500/20">🎟️ <span>${u.spins}</span></span>
            <span class="flex items-center gap-1 text-purple-300 bg-purple-950/50 px-2 py-0.5 rounded-md border border-purple-500/20">🤝 <span>${u.friends}</span></span>
          </div>
        </div>
      </div>
      <button class="w-11 h-11 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl text-[18px] font-bold transition-all active:scale-90 shadow-sm border border-slate-600/50 flex justify-center items-center admin-btn-manage shrink-0" data-i18n-title="admin.btnManage">
        ⚙️
      </button>
    `;

    div.querySelector('.admin-btn-manage').onclick = () => {
      openAdminUserModal(u);
    };

    container.appendChild(div);
  });
}

function openAdminUserModal(user) {
  editingAdminUser = JSON.parse(JSON.stringify(user)); 
  const t = window.miniappI18n ? window.miniappI18n.t.bind(window.miniappI18n) : (k => k);
  
  document.getElementById('admin-user-name').textContent = user.name + ` (ID: ${user.id})`;
  document.getElementById('admin-edit-spins').value = user.spins;
  
  const btnBan = document.getElementById('admin-btn-ban');
  const updateBanUI = () => {
    if (editingAdminUser.banned) {
      btnBan.textContent = t('admin.unbanUser') || 'Разбанить';
      btnBan.className = 'w-full py-2.5 bg-emerald-900/50 text-emerald-400 font-bold rounded-xl border border-emerald-500/30 transition hover:bg-emerald-800/50';
    } else {
      btnBan.textContent = t('admin.banUser') || 'Забанить';
      btnBan.className = 'w-full py-2.5 bg-red-900/50 text-red-400 font-bold rounded-xl border border-red-500/30 transition hover:bg-red-800/50';
    }
  };
  updateBanUI();
  
  btnBan.onclick = () => {
    editingAdminUser.banned = !editingAdminUser.banned;
    updateBanUI();
  };

  const invContainer = document.getElementById('admin-edit-inventory');
  invContainer.innerHTML = '';
  
  PRIZES.forEach(p => {
    const count = editingAdminUser.inventory[p.id] || 0;
    const row = document.createElement('div');
    row.className = 'flex justify-between items-center bg-slate-900/50 p-2.5 rounded-xl border border-slate-700/50 transition hover:bg-slate-800/50';
    
    row.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-[10px] bg-slate-950 flex items-center justify-center border border-white/5 shadow-inner">
          <img src="${p.img}" class="w-6 h-6 object-contain drop-shadow-sm" alt="${p.emoji}" onerror="this.outerHTML='<span class=\\'text-sm\\'>${p.emoji}</span>'">
        </div>
        <span class="text-[14px] text-white font-semibold">${t('prizes.' + p.id) || p.id}</span>
      </div>
      <div class="flex items-center gap-2 bg-slate-950/50 p-1 rounded-xl border border-slate-700/50 shadow-inner">
        <button class="btn-minus w-8 h-8 bg-slate-800 hover:bg-slate-700 rounded-[8px] flex items-center justify-center text-slate-300 hover:text-white active:scale-90 transition shadow-sm font-black text-lg">-</button>
        <span class="inv-val text-[15px] text-white w-6 text-center font-black">${count}</span>
        <button class="btn-plus w-8 h-8 bg-indigo-600 hover:bg-indigo-500 rounded-[8px] flex items-center justify-center text-white active:scale-90 transition shadow-sm font-black text-lg">+</button>
      </div>
    `;
    
    const btnMinus = row.querySelector('.btn-minus');
    const btnPlus = row.querySelector('.btn-plus');
    const valSpan = row.querySelector('.inv-val');
    
    btnMinus.onclick = () => {
      let current = editingAdminUser.inventory[p.id] || 0;
      if (current > 0) {
        current--;
        editingAdminUser.inventory[p.id] = current;
        valSpan.textContent = current;
      }
    };
    
    btnPlus.onclick = () => {
      let current = editingAdminUser.inventory[p.id] || 0;
      current++;
      editingAdminUser.inventory[p.id] = current;
      valSpan.textContent = current;
    };
    
    invContainer.appendChild(row);
  });

  document.getElementById('admin-btn-save-user').onclick = () => {
    const targetIdx = MOCK_USERS.findIndex(u => u.id === editingAdminUser.id);
    if (targetIdx !== -1) {
      editingAdminUser.spins = parseInt(document.getElementById('admin-edit-spins').value) || 0;
      MOCK_USERS[targetIdx] = editingAdminUser;
      
      if (editingAdminUser.id === '1001') {
        state.spins = editingAdminUser.spins;
        state.inventory = { ...editingAdminUser.inventory };
        updateUI();
      }
      
      renderAdminUsers();
      closeAllModals();
      showAlert('✅', t('admin.success') || 'Успешно!', 'Данные пользователя сохранены.');
    }
  };

  openModal('modal-admin-user');
}

function renderAdminTasks() {
  const container = document.getElementById('admin-tasks-list');
  if (!container) return;
  container.innerHTML = '';
  
  const t = window.miniappI18n ? window.miniappI18n.t.bind(window.miniappI18n) : (k => k);

  if (TASKS_DATA.length === 0) {
    container.innerHTML = '<div class="text-center py-6 text-slate-500 font-medium">Нет заданий</div>';
    return;
  }

  TASKS_DATA.forEach((task, idx) => {
    const titleText = task.title || t('app.' + task.id) || task.id;
    const div = document.createElement('div');
    div.className = 'flex items-center justify-between p-3.5 bg-slate-900/40 backdrop-blur-sm rounded-2xl border border-slate-700/50 transition hover:bg-slate-800/60 shadow-sm animate-fade-in-up';
    div.style.animationDelay = `${idx * 0.05}s`;
    div.style.animationFillMode = 'both';
    
    div.innerHTML = `
      <div class="flex items-center gap-3 w-full pr-3 min-w-0">
        <div class="w-10 h-10 rounded-xl bg-slate-800 flex justify-center items-center text-xl shrink-0 border border-slate-600/50 shadow-inner">
          ${task.icon}
        </div>
        <div class="min-w-0 flex-1">
          <div class="font-bold text-white text-[14px] leading-tight truncate">${titleText}</div>
          <div class="text-[11px] text-indigo-300/80 font-medium mt-0.5 flex items-center gap-2">
             <span>Награда: <span class="text-indigo-200 font-bold">${task.reward} 🎟️</span></span>
             ${task.url ? `<span class="text-emerald-400">🔗 Ссылка</span>` : ''}
          </div>
        </div>
      </div>
      <button class="w-9 h-9 bg-red-900/40 hover:bg-red-800/60 text-red-400 rounded-xl flex justify-center items-center transition shrink-0 btn-del-task shadow-sm active:scale-95" title="${t('admin.btnDelete') || 'Удалить'}">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
      </button>
    `;
    
    div.querySelector('.btn-del-task').onclick = async () => {
      TASKS_DATA.splice(idx, 1);
      await saveTasks();
      renderAdminTasks();
      renderTasks();
    };
    
    container.appendChild(div);
  });
}

function renderAdminWithdrawals() {
  const container = document.getElementById('admin-withdrawals-list');
  if (!container) return;
  container.innerHTML = '';
  const t = window.miniappI18n ? window.miniappI18n.t.bind(window.miniappI18n) : (k => k);

  if (MOCK_WITHDRAWALS.length === 0) {
    container.innerHTML = `<div class="text-center py-10 text-slate-500 font-medium">${t('admin.emptyWithdrawals') || 'Нет заявок'}</div>`;
    return;
  }

  MOCK_WITHDRAWALS.forEach((req, idx) => {
    const p = PRIZES.find(x => x.id === req.prizeId);
    const prizeName = p ? (t('prizes.' + p.id) || p.id) : req.prizeId;
    const dateStr = new Date(req.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });

    const div = document.createElement('div');
    div.className = 'bg-slate-900/60 backdrop-blur-sm p-4 rounded-2xl border border-slate-700/50 shadow-sm transition-all mb-3 animate-fade-in-up';
    div.style.animationDelay = `${idx * 0.05}s`;
    div.style.animationFillMode = 'both';

    let statusHtml = '';
    if (req.status === 'pending') {
      statusHtml = `<span class="px-2 py-1 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-lg text-[10px] font-bold uppercase tracking-wider">${t('admin.statusPending') || 'Ожидает'}</span>`;
    } else if (req.status === 'approved') {
      statusHtml = `<span class="px-2 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-[10px] font-bold uppercase tracking-wider">${t('admin.statusApproved') || 'Выдано'}</span>`;
    } else if (req.status === 'rejected') {
      statusHtml = `<span class="px-2 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-[10px] font-bold uppercase tracking-wider">${t('admin.statusRejected') || 'Отклонено'}</span>`;
    }

    div.innerHTML = `
      <div class="flex justify-between items-start">
        <div class="flex gap-3">
          <div class="w-11 h-11 rounded-xl bg-slate-950 flex justify-center items-center shadow-inner border border-white/5 shrink-0">
            <img src="${p ? p.img : ''}" class="w-7 h-7 object-contain drop-shadow-sm" alt="prize" onerror="this.outerHTML='<span class=\\'text-lg\\'>🎁</span>'">
          </div>
          <div>
            <div class="text-white font-bold text-[15px] leading-tight flex items-center gap-2">${req.userName} ${statusHtml}</div>
            <div class="text-slate-400 text-[11px] font-mono mt-1">ID: ${req.userId}</div>
            <div class="text-indigo-300 text-[13px] font-medium mt-1.5 flex items-center gap-1.5">
               <span>🎁</span> <span>Приз:</span> <span class="text-white font-bold">${prizeName}</span>
            </div>
          </div>
        </div>
        <div class="text-slate-500 text-[10px] whitespace-nowrap">${dateStr}</div>
      </div>
    `;

    if (req.status === 'pending') {
      const actions = document.createElement('div');
      actions.className = 'flex gap-2 mt-4 pt-4 border-t border-slate-700/50';
      actions.innerHTML = `
        <button class="btn-reject flex-1 py-2.5 bg-red-900/30 hover:bg-red-900/50 border border-red-500/30 text-red-400 rounded-xl text-[13px] font-bold transition active:scale-95">${t('admin.btnReject') || 'Отклонить'}</button>
        <button class="btn-approve flex-1 py-2.5 bg-emerald-600/80 hover:bg-emerald-500 border border-emerald-500/50 text-white rounded-xl text-[13px] font-bold transition active:scale-95">${t('admin.btnApprove') || 'Выдать'}</button>
      `;

      actions.querySelector('.btn-approve').onclick = () => {
        req.status = 'approved';
        renderAdminWithdrawals();
      };

      actions.querySelector('.btn-reject').onclick = () => {
        req.status = 'rejected';
        if (req.userId === currentUserId) {
          state.inventory[req.prizeId] = (state.inventory[req.prizeId] || 0) + 1;
          saveState();
          updateUI();
          renderInventory();
        }
        renderAdminWithdrawals();
      };

      div.appendChild(actions);
    }

    container.appendChild(div);
  });
}
