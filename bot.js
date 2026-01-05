require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const { generateProjectIdea, getUserGitHubProfile } = require('./ai-service');
const { getChatResponse, clearHistory } = require('./chat-service');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_USERNAME = process.env.GITHUB_USERNAME;

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

const statsFile = path.join(__dirname, 'stats.json');
const settingsFile = path.join(__dirname, 'user-settings.json');

function loadStats() {
    if (fs.existsSync(statsFile)) {
        return JSON.parse(fs.readFileSync(statsFile, 'utf8'));
    }
    return {
        totalDaysTracked: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastCommitDate: null,
        totalCommits: 0,
        suggestionsRequested: 0
    };
}

function saveStats(stats) {
    fs.writeFileSync(statsFile, JSON.stringify(stats, null, 2));
}

function loadSettings() {
    if (fs.existsSync(settingsFile)) {
        return JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
    }
    return { users: {} };
}

function saveSettings(settings) {
    fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2));
}

function getUserTimezone(userId) {
    const settings = loadSettings();
    return settings.users[userId]?.timezone || 'Asia/Kolkata'; // Default to IST
}

function setUserTimezone(userId, timezone) {
    const settings = loadSettings();
    if (!settings.users[userId]) {
        settings.users[userId] = {};
    }
    settings.users[userId].timezone = timezone;
    saveSettings(settings);
}

function convertToUserTime(utcHour, utcMinute, timezone) {
    try {
        const date = new Date();
        date.setUTCHours(utcHour, utcMinute, 0, 0);

        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: timezone,
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });

        return formatter.format(date);
    } catch (error) {
        return `${utcHour}:${utcMinute.toString().padStart(2, '0')} UTC`;
    }
}

async function getGitHubStreak() {
    try {
        const response = await axios.get(
            `https://api.github.com/users/${GITHUB_USERNAME}/events/public?per_page=100`,
            {
                headers: { 'Authorization': `token ${GITHUB_TOKEN}` }
            }
        );

        const commitDates = new Set();
        response.data.forEach(event => {
            if (event.type === 'PushEvent') {
                const date = event.created_at.split('T')[0];
                commitDates.add(date);
            }
        });

        const sortedDates = Array.from(commitDates).sort().reverse();
        let currentStreak = 0;
        const today = new Date().toISOString().split('T')[0];

        for (let i = 0; i < sortedDates.length; i++) {
            const expectedDate = new Date();
            expectedDate.setDate(expectedDate.getDate() - i);
            const expected = expectedDate.toISOString().split('T')[0];

            if (sortedDates[i] === expected || (i === 0 && sortedDates[i] === today)) {
                currentStreak++;
            } else {
                break;
            }
        }

        return currentStreak;
    } catch (error) {
        console.error('Error calculating streak:', error.message);
        return 0;
    }
}

// Command: /start
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const userTz = getUserTimezone(chatId);

    const time1 = convertToUserTime(4, 30, userTz);
    const time2 = convertToUserTime(9, 30, userTz);
    const time3 = convertToUserTime(14, 30, userTz);

    const welcomeMessage = `👋 Welcome to *GitHub Commit Reminder Bot*!\n\n` +
        `I'll help you maintain your GitHub streak by:\n` +
        `✅ Checking if you've committed today\n` +
        `🤖 Suggesting AI-generated project ideas\n` +
        `💬 Answering your coding questions\n` +
        `📊 Tracking your commit statistics\n\n` +
        `*Available Commands:*\n` +
        `/suggest - Get a new project idea\n` +
        `/stats - View your GitHub stats\n` +
        `/timezone - Set your timezone\n` +
        `/about - How this bot works\n` +
        `/clear - Clear chat history\n` +
        `/help - Show help message\n\n` +
        `*Reminder Schedule (3x daily):*\n` +
        `🌅 Morning: ${time1}\n` +
        `☀️ Afternoon: ${time2}\n` +
        `🌙 Evening: ${time3}\n\n` +
        `You can also just chat with me naturally about coding!`;

    bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
});

// Command: /help
bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    const userTz = getUserTimezone(chatId);

    const time1 = convertToUserTime(4, 30, userTz);
    const time2 = convertToUserTime(9, 30, userTz);
    const time3 = convertToUserTime(14, 30, userTz);

    const helpMessage = `*GitHub Commit Reminder Bot - Help*\n\n` +
        `*Commands:*\n` +
        `/start - Get started and see welcome message\n` +
        `/suggest - Get an AI-generated project idea\n` +
        `/stats - View your GitHub statistics and streak\n` +
        `/timezone - Set your timezone\n` +
        `/about - Understand how this bot works\n` +
        `/clear - Clear conversation history\n` +
        `/help - Show this help message\n\n` +
        `*How it works:*\n` +
        `• Automated checks 3 times daily:\n` +
        `  - ${time1} (Morning)\n` +
        `  - ${time2} (Afternoon)\n` +
        `  - ${time3} (Evening)\n` +
        `• If you haven't committed, you get a project idea\n` +
        `• Ideas are tailored to your GitHub profile\n` +
        `• Chat with me anytime about coding questions!\n\n` +
        `Type /about to learn more about the system. Keep coding! 💪`;

    bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
});

// Command: /suggest
bot.onText(/\/suggest/, async (msg) => {
    const chatId = msg.chat.id;

    bot.sendMessage(chatId, '🤖 Generating a unique project idea for you...');

    try {
        const project = await generateProjectIdea(GITHUB_USERNAME, GITHUB_TOKEN);

        const stats = loadStats();
        stats.suggestionsRequested++;
        saveStats(stats);

        const message = `💡 *AI-Generated Project Idea*\n\n` +
            `*${project.title}*\n\n` +
            `${project.description}\n\n` +
            `*Tech Stack:* ${project.techStack}\n` +
            `*Difficulty:* ${project.difficulty}\n\n` +
            `Ready to build? Let's code! 🚀`;

        bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    } catch (error) {
        bot.sendMessage(chatId, '❌ Oops! Failed to generate idea. Try again with /suggest');
    }
});

// Command: /stats
bot.onText(/\/stats/, async (msg) => {
    const chatId = msg.chat.id;

    bot.sendMessage(chatId, '📊 Fetching your GitHub statistics...');

    try {
        const [streak, profile] = await Promise.all([
            getGitHubStreak(),
            getUserGitHubProfile(GITHUB_USERNAME, GITHUB_TOKEN)
        ]);

        const stats = loadStats();

        const message = `📊 *Your GitHub Statistics*\n\n` +
            `🔥 *Current Streak:* ${streak} day${streak !== 1 ? 's' : ''}\n` +
            `📦 *Public Repos:* ${profile.publicRepos}\n` +
            `💻 *Languages:* ${profile.languages || 'N/A'}\n` +
            `🤖 *AI Suggestions Requested:* ${stats.suggestionsRequested}\n\n` +
            `*Recent Projects:*\n${profile.recentRepos}\n\n` +
            `Keep building! 💪`;

        bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    } catch (error) {
        bot.sendMessage(chatId, '❌ Failed to fetch stats. Please try again.');
    }
});

// Command: /timezone - Set timezone
bot.onText(/\/timezone(?:\s+(.+))?/, (msg, match) => {
    const chatId = msg.chat.id;
    const timezone = match[1]?.trim();

    if (!timezone) {
        const currentTz = getUserTimezone(chatId);
        const message = `⏰ *Timezone Settings*\n\n` +
            `Your current timezone: \`${currentTz}\`\n\n` +
            `To change it, use:\n` +
            `/timezone <timezone>\n\n` +
            `*Examples:*\n` +
            `/timezone America/New_York\n` +
            `/timezone Europe/London\n` +
            `/timezone Asia/Tokyo\n` +
            `/timezone Australia/Sydney\n\n` +
            `[Full list of timezones](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)`;

        bot.sendMessage(chatId, message, { parse_mode: 'Markdown', disable_web_page_preview: true });
        return;
    }

    try {
        // Validate timezone by trying to format a date
        const testDate = new Date();
        new Intl.DateTimeFormat('en-US', { timeZone: timezone }).format(testDate);

        setUserTimezone(chatId, timezone);

        const time1 = convertToUserTime(4, 30, timezone);
        const time2 = convertToUserTime(9, 30, timezone);
        const time3 = convertToUserTime(14, 30, timezone);

        const message = `✅ Timezone updated to \`${timezone}\`!\n\n` +
            `Your reminder times:\n` +
            `🌅 Morning: ${time1}\n` +
            `☀️ Afternoon: ${time2}\n` +
            `🌙 Evening: ${time3}`;

        bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    } catch (error) {
        bot.sendMessage(chatId, `❌ Invalid timezone: \`${timezone}\`\n\nPlease use a valid timezone from the [IANA database](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones).`, { parse_mode: 'Markdown', disable_web_page_preview: true });
    }
});

// Command: /about - Explain how the bot works
bot.onText(/\/about/, (msg) => {
    const chatId = msg.chat.id;
    const aboutMessage = `*How This Bot Works*\n\n` +
        `This system has two parts:\n\n` +
        `*1. Automated Commit Checker (GitHub Actions)*\n` +
        `• Runs 3x daily automatically\n` +
        `• Checks if you've committed to GitHub\n` +
        `• Sends you reminders with AI project ideas if you haven't\n\n` +
        `*2. Conversational AI (Me!)*\n` +
        `• Available 24/7 for coding questions\n` +
        `• Helps with debugging, architecture, best practices\n` +
        `• Generates project ideas on demand\n\n` +
        `Note: I can't manually check your commits - that's handled automatically by GitHub Actions. I'm here to chat and help with coding! 💬`;

    bot.sendMessage(chatId, aboutMessage, { parse_mode: 'Markdown' });
});

// Command: /clear - Clear conversation history
bot.onText(/\/clear/, (msg) => {
    const chatId = msg.chat.id;
    clearHistory(chatId);
    bot.sendMessage(chatId, '🗑️ Conversation history cleared! Starting fresh.');
});

function splitMessage(text, maxLength = 4000) {
    if (text.length <= maxLength) {
        return [text];
    }

    const parts = [];
    let current = '';

    const paragraphs = text.split('\n\n');

    for (const paragraph of paragraphs) {
        if ((current + paragraph).length > maxLength) {
            if (current) parts.push(current.trim());
            current = paragraph + '\n\n';
        } else {
            current += paragraph + '\n\n';
        }
    }

    if (current) parts.push(current.trim());
    return parts;
}

function escapeMarkdown(text) {
    return text.replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
}

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (text && text.startsWith('/')) {
        return;
    }

    if (!text) {
        return;
    }

    try {
        bot.sendChatAction(chatId, 'typing');

        const profile = await getUserGitHubProfile(GITHUB_USERNAME, GITHUB_TOKEN);

        const response = await getChatResponse(chatId, text, profile);

        const messageParts = splitMessage(response);

        for (let i = 0; i < messageParts.length; i++) {
            const part = messageParts[i];

            try {
                await bot.sendMessage(chatId, part, { parse_mode: 'Markdown' });
            } catch (markdownError) {
                console.log('Markdown parsing failed, sending as plain text');
                await bot.sendMessage(chatId, part);
            }

            if (i < messageParts.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
    } catch (error) {
        console.error('Error handling message:', error);
        bot.sendMessage(chatId, '❌ Sorry, I encountered an error. Please try again!');
    }
});

console.log('🤖 Bot is running! Send commands or chat naturally...');
console.log('Commands: /start, /help, /suggest, /stats, /clear');
console.log('💬 You can also just chat with me about anything coding-related!');
console.log('Press Ctrl+C to stop.');
