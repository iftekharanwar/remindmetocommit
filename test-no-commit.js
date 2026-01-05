require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);

function getRandomProjectIdea() {
    const projectsPath = path.join(__dirname, 'project-ideas.json');
    const projects = JSON.parse(fs.readFileSync(projectsPath, 'utf8'));
    const randomIndex = Math.floor(Math.random() * projects.ideas.length);
    return projects.ideas[randomIndex];
}

async function sendTelegramNotification(message) {
    try {
        await bot.sendMessage(process.env.TELEGRAM_CHAT_ID, message, { parse_mode: 'Markdown' });
        console.log('Notification sent successfully!');
    } catch (error) {
        console.error('Error sending Telegram message:', error.message);
    }
}

// Simulate no commit scenario
const project = getRandomProjectIdea();
const message = `🚨 *Reminder: Commit Today!* 🚨\n\nYou haven't committed yet today. Here's a project idea:\n\n*${project.title}*\n${project.description}\n\n*Tech Stack:* ${project.techStack}\n*Difficulty:* ${project.difficulty}\n\nLet's keep that streak alive! 💪`;

console.log('Sending "no commit" reminder...\n');
sendTelegramNotification(message);
