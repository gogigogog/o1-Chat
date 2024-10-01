const TelegramBot = require('node-telegram-bot-api');
const mongoose = require('mongoose');

// Токен вашего Telegram-бота
const token = 'ВАШ_ТОКЕН_ТЕЛЕГРАМ_БОТА';

// Создание бота
const bot = new TelegramBot(token, { polling: true });

// Подключение к MongoDB
mongoose.connect('mongodb://localhost/chatapp', { useNewUrlParser: true, useUnifiedTopology: true });

// Схема пользователя
const userSchema = new mongoose.Schema({
    telegramId: String,
    userId: String,
    messageBalance: { type: Number, default: 0 }
});

const User = mongoose.model('User', userSchema);

// Обработка команды '/start'
bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, 'Добро пожаловать! Отправьте ваш User ID для привязки аккаунта.');
});

// Обработка User ID
bot.on('message', (msg) => {
    if (msg.text.startsWith('/')) return;

    const telegramId = msg.from.id;
    const userId = msg.text.trim();

    User.findOne({ telegramId: telegramId }, (err, user) => {
        if (err) console.error(err);
        if (!user) {
            const newUser = new User({
                telegramId: telegramId,
                userId: userId
            });
            newUser.save((err) => {
                if (err) console.error(err);
                bot.sendMessage(msg.chat.id, 'Аккаунт привязан! Теперь вы можете отправлять звезды для пополнения баланса.');
            });
        } else {
            user.userId = userId;
            user.save((err) => {
                if (err) console.error(err);
                bot.sendMessage(msg.chat.id, 'Аккаунт обновлен.');
            });
        }
    });
});

// Симуляция получения звезд
bot.onText(/\/stars (\d+)/, (msg, match) => {
    const stars = parseInt(match[1]);
    const telegramId = msg.from.id;

    User.findOne({ telegramId: telegramId }, (err, user) => {
        if (err) console.error(err);
        if (user) {
            const messagesToAdd = Math.floor(stars / 50);
            user.messageBalance += messagesToAdd;
            user.save((err) => {
                if (err) console.error(err);
                bot.sendMessage(msg.chat.id, `Вы получили ${messagesToAdd} сообщений. Ваш новый баланс: ${user.messageBalance}.`);
            });
        } else {
            bot.sendMessage(msg.chat.id, 'Пожалуйста, сначала привяжите ваш аккаунт, отправив ваш User ID.');
        }
    });
});
