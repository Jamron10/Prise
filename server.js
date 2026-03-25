// ==========================================
// ВНИМАНИЕ: ЭТОТ ФАЙЛ НЕ ЗАПУСКАЕТСЯ ЗДЕСЬ В ПЛЕЕРЕ!
// Это бэкенд на Node.js. Вы должны скопировать этот код,
// разместить его на своем сервере (VPS, Render, Heroku и т.д.)
// и запустить через Node.js.
// ==========================================
// Инструкция по запуску на вашем компьютере/сервере:
// 1. Установите Node.js
// 2. В папке с проектом выполните: npm init -y
// 3. Выполните: npm install express mongoose cors telegraf
// 4. Замените BOT_TOKEN и MONGO_URI на свои
// 5. Запустите: node server.js
// ==========================================

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { Telegraf } = require('telegraf');

// --- КОНФИГУРАЦИЯ ---
const BOT_TOKEN = 'ВАШ_ТОКЕН_ОТ_БОTFATHER';
const MONGO_URI = 'mongodb+srv://prize:narek5551@cluster0.ucx8kac.mongodb.net/?appName=Cluster0'; // Ваша ссылка на MongoDB
const PORT = process.env.PORT || 3000;

// Инициализация
const app = express();
const bot = new Telegraf(BOT_TOKEN);

app.use(cors());
app.use(express.json());

// --- СХЕМА MONGODB ---
const userSchema = new mongoose.Schema({
  telegramId: { type: String, required: true, unique: true },
  name: { type: String, default: 'Игрок' },
  spins: { type: Number, default: 3 },      // Стартовые билеты
  friends: { type: Number, default: 0 },    // Приглашенные друзья
  inventory: { type: Map, of: Number, default: {} }, // Призы
  activeSkin: { type: String, default: 'normal' },
  tasks: { type: Map, of: Boolean, default: {} },
  referredBy: { type: String, default: null }, // Кто пригласил
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Подключение к БД
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Подключено к MongoDB'))
  .catch(err => console.error('❌ Ошибка MongoDB:', err));

// --- ЛОГИКА ТЕЛЕГРАМ БОТА (startapp) ---
bot.start(async (ctx) => {
  try {
    const tgId = ctx.from.id.toString();
    const name = ctx.from.first_name || 'Игрок';
    const startPayload = ctx.payload; // Параметр из ссылки (например, ID друга)

    let user = await User.findOne({ telegramId: tgId });

    if (!user) {
      // Новый пользователь
      user = new User({ telegramId: tgId, name });

      // Если есть реферал и это не сам пользователь
      if (startPayload && startPayload !== tgId) {
        const referrer = await User.findOne({ telegramId: startPayload });
        if (referrer) {
          user.referredBy = startPayload;
          // Даем награду пригласившему: +1 билет, +1 друг
          referrer.friends += 1;
          referrer.spins += 1;
          await referrer.save();
          
          ctx.reply('🎉 Вы успешно зарегистрировались по приглашению друга!');
        }
      }
      await user.save();
    }

    // Отправляем кнопку для запуска Mini App
    ctx.reply('Привет! Жми на кнопку ниже, чтобы крутить Колесо Подарков 🎁', {
      reply_markup: {
        inline_keyboard: [[
          { text: "Играть!", web_app: { url: "ССЫЛКА_НА_ВАШ_РАЗМЕЩЕННЫЙ_ФРОНТЕНД" } }
        ]]
      }
    });

  } catch (err) {
    console.error('Ошибка в боте:', err);
  }
});

// Запускаем бота
bot.launch();

// --- API ДЛЯ ФРОНТЕНДА ---

// 1. Получить состояние пользователя
app.get('/api/state/:tgId', async (req, res) => {
  try {
    let user = await User.findOne({ telegramId: req.params.tgId });
    if (!user) {
      // Если по какой-то причине юзера нет (не нажимал /start), создаем базового
      user = await User.create({ telegramId: req.params.tgId });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// 2. Синхронизировать инвентарь/скины/задания
app.post('/api/sync', async (req, res) => {
  try {
    const { telegramId, activeSkin, tasks } = req.body;
    await User.findOneAndUpdate(
      { telegramId },
      { $set: { activeSkin, tasks } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// 3. Крутить колесо (логика призов на бэкенде для безопасности)
app.post('/api/spin', async (req, res) => {
  try {
    const { telegramId } = req.body;
    const user = await User.findOne({ telegramId });

    if (!user || user.spins <= 0) {
      return res.status(400).json({ error: 'Недостаточно билетов' });
    }

    // Списываем билет
    user.spins -= 1;

    // Шансы выпадения (копия из фронтенда)
    const PRIZES = [
      { id: 'heart_ribbon', weight: 100 },
      { id: 'teddy', weight: 80 },
      { id: 'gift', weight: 100 },
      { id: 'rose', weight: 90 },
      { id: 'cake', weight: 80 },
      { id: 'bouquet', weight: 70 },
      { id: 'rocket', weight: 30 },
      { id: 'champagne', weight: 50 },
      { id: 'trophy', weight: 20 },
      { id: 'ring', weight: 10 },
      { id: 'diamond', weight: 5 }
    ];

    const totalWeight = PRIZES.reduce((sum, p) => sum + p.weight, 0);
    let random = Math.random() * totalWeight;
    let winningPrizeId = PRIZES[0].id;
    
    for (let p of PRIZES) {
      if (random < p.weight) {
        winningPrizeId = p.id;
        break;
      }
      random -= p.weight;
    }

    // Добавляем приз в инвентарь
    const currentAmount = user.inventory.get(winningPrizeId) || 0;
    user.inventory.set(winningPrizeId, currentAmount + 1);
    
    await user.save();

    // Возвращаем ID выигранного приза фронтенду
    res.json({ success: true, prizeId: winningPrizeId, spinsLeft: user.spins });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// 4. Выполнить задание
app.post('/api/task', async (req, res) => {
  try {
    const { telegramId, taskId, reward } = req.body;
    const user = await User.findOne({ telegramId });
    
    if (user.tasks && user.tasks.get(taskId)) {
      return res.status(400).json({ error: 'Задание уже выполнено' });
    }

    user.spins += reward;
    user.tasks.set(taskId, true);
    await user.save();

    res.json({ success: true, spinsTotal: user.spins });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.listen(PORT, () => console.log(`🚀 Сервер запущен на порту ${PORT}`));
