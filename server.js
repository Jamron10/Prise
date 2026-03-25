const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const { Telegraf } = require('telegraf');

// --- КОНФИГУРАЦИЯ ---
const BOT_TOKEN = '7962893528:AAF5ikJWt5k6_CP2ugwVimqpUaybPB3hhO8';
const MONGO_URI = 'mongodb+srv://prize:narek5551@cluster0.ucx8kac.mongodb.net/?appName=Cluster0';
// ВАЖНО ДЛЯ RENDER: всегда использовать process.env.PORT
const PORT = process.env.PORT || 3000;

// Инициализация
const app = express();
const bot = new Telegraf(BOT_TOKEN);
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// --- РАЗДАЧА ФРОНТЕНДА ---
// Эта строка автоматически раздаст index.html, main.js, styles.css и папку locales
app.use(express.static(__dirname));

// --- СХЕМА MONGODB ---
const userSchema = new mongoose.Schema({
  telegramId: { type: String, required: true, unique: true },
  name: { type: String, default: 'Игрок' },
  spins: { type: Number, default: 3 },      
  friends: { type: Number, default: 0 },    
  inventory: { type: Map, of: Number, default: {} }, 
  activeSkin: { type: String, default: 'normal' },
  tasks: { type: Map, of: Boolean, default: {} },
  referredBy: { type: String, default: null }, 
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
    const startPayload = ctx.payload; 

    let user = await User.findOne({ telegramId: tgId });

    if (!user) {
      user = new User({ telegramId: tgId, name });

      if (startPayload && startPayload !== tgId) {
        const referrer = await User.findOne({ telegramId: startPayload });
        if (referrer) {
          user.referredBy = startPayload;
          referrer.friends += 1;
          referrer.spins += 1;
          await referrer.save();
          
          ctx.reply('🎉 Вы успешно зарегистрировались по приглашению друга!');
        }
      }
      await user.save();
    }

    ctx.reply('Привет! Жми на кнопку ниже, чтобы крутить Колесо Подарков 🎁', {
      reply_markup: {
        inline_keyboard: [[
          { text: "Играть!", web_app: { url: "https://prise-11.onrender.com" } }
        ]]
      }
    });

  } catch (err) {
    console.error('Ошибка в боте:', err);
  }
});

bot.launch();

// --- API ДЛЯ ФРОНТЕНДА ---

app.get('/api/state/:tgId', async (req, res) => {
  try {
    let user = await User.findOne({ telegramId: req.params.tgId });
    if (!user) {
      user = await User.create({ telegramId: req.params.tgId });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

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

app.post('/api/spin', async (req, res) => {
  try {
    const { telegramId } = req.body;
    const user = await User.findOne({ telegramId });

    if (!user || user.spins <= 0) {
      return res.status(400).json({ error: 'Недостаточно билетов' });
    }

    user.spins -= 1;

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

    const currentAmount = user.inventory.get(winningPrizeId) || 0;
    user.inventory.set(winningPrizeId, currentAmount + 1);
    
    await user.save();

    res.json({ success: true, prizeId: winningPrizeId, spinsLeft: user.spins });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

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
