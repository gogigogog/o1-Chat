const express = require('express');
const app = express();
const http = require('http').Server(app);
const path = require('path');
const io = require('socket.io')(http);
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

// Подключение к MongoDB
mongoose.connect('mongodb://localhost/chatapp', { useNewUrlParser: true, useUnifiedTopology: true });

// Схемы и модели
const messageSchema = new mongoose.Schema({
    senderId: String,
    message: String,
    timestamp: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
    userId: String,
    messageBalance: { type: Number, default: 0 }
});

const Message = mongoose.model('Message', messageSchema);
const User = mongoose.model('User', userSchema);

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

// Маршруты
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Подключение сокетов
io.on('connection', (socket) => {
    console.log('Пользователь подключился: ' + socket.id);

    socket.on('get balance', (userId) => {
        User.findOne({ userId: userId }, (err, user) => {
            if (err) console.error(err);
            if (user) {
                socket.emit('balance', user.messageBalance);
            } else {
                const newUser = new User({ userId: userId, messageBalance: 0 });
                newUser.save((err) => {
                    if (err) console.error(err);
                    socket.emit('balance', 0);
                });
            }
        });
    });

    socket.on('chat message', (data) => {
        const { userId, message } = data;
        User.findOne({ userId: userId }, (err, user) => {
            if (err) console.error(err);

            if (user && user.messageBalance > 0) {
                const messageDoc = new Message({
                    senderId: userId,
                    message: message
                });
                messageDoc.save((err) => {
                    if (err) console.error(err);
                });

                io.emit('chat message', {
                    sender: userId,
                    message: message
                });

                user.messageBalance -= 1;
                user.save((err) => {
                    if (err) console.error(err);
                    socket.emit('message balance', user.messageBalance);
                });
            } else {
                socket.emit('need to replenish');
            }
        });
    });

    socket.on('disconnect', () => {
        console.log('Пользователь отключился: ' + socket.id);
    });
});

// Очистка старых сообщений
setInterval(() => {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    Message.deleteMany({ timestamp: { $lt: oneWeekAgo } }, (err) => {
        if (err) console.error(err);
    });

    Message.countDocuments({}, (err, count) => {
        if (err) console.error(err);
        if (count > 200) {
            Message.find().sort({ timestamp: 1 }).limit(count - 200).exec((err, messages) => {
                if (err) console.error(err);
                const idsToDelete = messages.map((msg) => msg._id);
                Message.deleteMany({ _id: { $in: idsToDelete } }, (err) => {
                    if (err) console.error(err);
                });
            });
        }
    });
}, 60 * 60 * 1000);

// Запуск сервера
http.listen(3000, () => {
    console.log('Сервер запущен на порту 3000');
});
