require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

console.log('Bot is running! Send a message to @buildwithanwarbot on Telegram...\n');

bot.on('message', (msg) => {
    console.log('=================================');
    console.log('Message received!');
    console.log('Your Chat ID is:', msg.chat.id);
    console.log('Your Username:', msg.from.username || 'Not set');
    console.log('Your First Name:', msg.from.first_name);
    console.log('=================================');
    console.log('\nUpdate your .env file with:');
    console.log(`TELEGRAM_CHAT_ID=${msg.chat.id}`);
    console.log('\nPress Ctrl+C to stop this script.');
});
