require('dotenv').config();
const axios = require('axios');
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
const { generateProjectIdea } = require('./ai-service');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_USERNAME = process.env.GITHUB_USERNAME;

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN);

async function checkTodayCommit() {
    try {
        const today = new Date().toISOString().split('T')[0];

        const response = await axios.get(
            `https://api.github.com/search/commits?q=author:${GITHUB_USERNAME}+committer-date:${today}`,
            {
                headers: {
                    'Authorization': `token ${GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.cloak-preview'
                }
            }
        );

        return response.data.total_count > 0;
    } catch (error) {
        console.error('Error checking GitHub commits:', error.message);
        return false;
    }
}

function getRandomProjectIdea() {
    const projectsPath = path.join(__dirname, 'project-ideas.json');
    const projects = JSON.parse(fs.readFileSync(projectsPath, 'utf8'));

    const randomIndex = Math.floor(Math.random() * projects.ideas.length);
    return projects.ideas[randomIndex];
}

async function sendTelegramNotification(message) {
    try {
        await bot.sendMessage(TELEGRAM_CHAT_ID, message, { parse_mode: 'Markdown' });
        console.log('Notification sent successfully!');
    } catch (error) {
        console.error('Error sending Telegram message:', error.message);
    }
}

async function main() {
    console.log('Checking for today\'s commit...');

    const hasCommitted = await checkTodayCommit();

    if (hasCommitted) {
        console.log('✅ You already committed today! Keep the streak going!');
        await sendTelegramNotification('✅ Great job! You already committed today. Streak maintained! 🔥');
    } else {
        console.log('❌ No commit found for today.');
        console.log('Generating AI-powered project idea...');
        const project = await generateProjectIdea(GITHUB_USERNAME, GITHUB_TOKEN);

        const message = `🚨 *Reminder: Commit Today!* 🚨\n\nYou haven't committed yet today. Here's an AI-generated project idea tailored for you:\n\n*${project.title}*\n${project.description}\n\n*Tech Stack:* ${project.techStack}\n*Difficulty:* ${project.difficulty}\n\nLet's keep that streak alive! 💪`;

        await sendTelegramNotification(message);
    }
}

main();
