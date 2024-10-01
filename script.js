const socket = io();

let userId = localStorage.getItem('userId');

const loginContainer = document.getElementById('login-container');
const balanceContainer = document.getElementById('balance-container');
const chatContainer = document.getElementById('chat-container');

const userIdInput = document.getElementById('user-id-input');
const loginButton = document.getElementById('login-button');

const messageBalanceSpan = document.getElementById('message-balance');
const replenishButton = document.getElementById('replenish-button');

const inputMessage = document.getElementById('input-message');
const sendButton = document.getElementById('send-button');
const messagesDiv = document.getElementById('messages');
const charCount = document.getElementById('char-count');

if (userId) {
    showBalance();
} else {
    loginContainer.style.display = 'block';
}

loginButton.addEventListener('click', () => {
    userId = userIdInput.value.trim();
    if (userId) {
        localStorage.setItem('userId', userId);
        loginContainer.style.display = 'none';
        showBalance();
    }
});

function showBalance() {
    socket.emit('get balance', userId);
    balanceContainer.style.display = 'block';
}

replenishButton.addEventListener('click', () => {
    alert('Пожалуйста, используйте Telegram-бота для пополнения баланса.');
});

socket.on('balance', (balance) => {
    messageBalanceSpan.textContent = balance;
    if (balance > 0) {
        balanceContainer.style.display = 'none';
        chatContainer.style.display = 'flex';
    }
});

inputMessage.addEventListener('input', () => {
    const remaining = 40 - inputMessage.value.length;
    charCount.textContent = remaining;
});

sendButton.addEventListener('click', () => {
    const message = inputMessage.value.trim();
    if (message.length > 0 && message.length <= 40) {
        socket.emit('chat message', { userId, message });
        inputMessage.value = '';
        charCount.textContent = '40';
    }
});

socket.on('chat message', (data) => {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    if (data.sender === userId) {
        messageElement.classList.add('my-message');
    } else {
        messageElement.classList.add('their-message');
    }
    messageElement.textContent = data.message;
    messagesDiv.appendChild(messageElement);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
});

socket.on('message balance', (balance) => {
    messageBalanceSpan.textContent = balance;
});

socket.on('need to replenish', () => {
    alert('Необходимо пополнить баланс сообщений.');
    chatContainer.style.display = 'none';
    balanceContainer.style.display = 'block';
});
