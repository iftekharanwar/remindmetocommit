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
const notificationLogPath = path.join(__dirname, 'notification-log.json');

function loadNotificationLog() {
    if (fs.existsSync(notificationLogPath)) {
        return JSON.parse(fs.readFileSync(notificationLogPath, 'utf8'));
    }
    return { lastCelebrationDate: null, lastReminderDate: null };
}

function saveNotificationLog(log) {
    fs.writeFileSync(notificationLogPath, JSON.stringify(log, null, 2));
}

function alreadyCelebratedToday(log) {
    const today = new Date().toISOString().split('T')[0];
    return log.lastCelebrationDate === today;
}

function alreadyRemindedToday(log) {
    const today = new Date().toISOString().split('T')[0];
    return log.lastReminderDate === today;
}

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

async function sendTelegramNotification(message) {
    try {
        await bot.sendMessage(TELEGRAM_CHAT_ID, message, { parse_mode: 'Markdown' });
        console.log('Notification sent successfully!');
        return true;
    } catch (error) {
        console.error('Error sending Telegram message:', error.message);
        return false;
    }
}

function getTimeOfDay() {
    const hour = new Date().getUTCHours();

    if (hour >= 3 && hour < 8) return 'morning';

    if (hour >= 8 && hour < 13) return 'afternoon';

    return 'evening';
}

async function main() {
    console.log('Checking for today\'s commit...');

    const notificationLog = loadNotificationLog();
    const hasCommitted = await checkTodayCommit();
    const timeOfDay = getTimeOfDay();
    const today = new Date().toISOString().split('T')[0];

    if (hasCommitted) {

        if (alreadyCelebratedToday(notificationLog)) {
            console.log('✅ Already celebrated today\'s commit. Skipping notification.');
            return;
        }

        let message;

        if (timeOfDay === 'morning') {
            message = '🎉 *Amazing!* You already committed today!\n\nStarting the day strong! Keep up the excellent work. 🔥';
        } else if (timeOfDay === 'afternoon') {
            message = '🔥 *Great job!* Commit detected!\n\nYour streak is safe! Keep building awesome things. 💪';
        } else {
            message = '✅ *Streak maintained!* You committed today!\n\nWell done! See you tomorrow for another productive day. 🚀';
        }

        const sent = await sendTelegramNotification(message);

        if (sent) {
            notificationLog.lastCelebrationDate = today;
            saveNotificationLog(notificationLog);
            console.log('✅ Celebration message sent and logged!');
        }

    } else {

        if (timeOfDay === 'morning') {
            const message = '☀️ *Good morning!*\n\nFriendly reminder: Don\'t forget to commit something today! Even small progress counts. 💚';
            await sendTelegramNotification(message);
            console.log('Morning reminder sent.');

        } else if (timeOfDay === 'afternoon') {
            const message = '⏰ *Afternoon check-in*\n\nHey! You haven\'t committed yet today. No pressure, but your streak is waiting! 👀';
            await sendTelegramNotification(message);
            console.log('Afternoon reminder sent.');

        } else {

            if (alreadyRemindedToday(notificationLog)) {
                console.log('❌ Already sent project idea today. Skipping.');
                return;
            }

            console.log('❌ No commit found for today. Generating project idea...');
            const project = await generateProjectIdea(GITHUB_USERNAME, GITHUB_TOKEN);

            const message = `🚨 *Evening Reminder: Commit Today!* 🚨\n\nYou haven't committed yet today. Here's an AI-generated project idea:\n\n*${project.title}*\n${project.description}\n\n*Tech Stack:* ${project.techStack}\n*Difficulty:* ${project.difficulty}\n\nLet's keep that streak alive! 💪`;

            const sent = await sendTelegramNotification(message);

            if (sent) {
                notificationLog.lastReminderDate = today;
                saveNotificationLog(notificationLog);
                console.log('Evening project idea sent and logged.');
            }
        }
    }
}

main();
