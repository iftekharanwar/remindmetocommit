# GitHub Commit Reminder Bot 🤖

An intelligent Telegram bot that helps you maintain your GitHub commit streak with AI-powered project suggestions and conversational coding assistance.

## Features

✅ **Automated Daily Reminders** - Get notified 3x daily (morning, afternoon, evening) if you haven't committed

🤖 **AI Project Suggestions** - Receive unique, personalized project ideas powered by Groq and Gemini AI

💬 **Conversational AI** - Chat naturally about coding questions, debugging, and architecture

📊 **GitHub Stats Tracking** - Monitor your commit streak and repository statistics

🌍 **Timezone Support** - Automatic timezone detection and conversion

🔄 **Multi-API Fallback** - Groq → Gemini → JSON fallback ensures always-available suggestions

## Commands

- `/start` - Get started and see your reminder schedule
- `/suggest` - Get an AI-generated project idea
- `/stats` - View your GitHub statistics and streak
- `/timezone` - Set your timezone (e.g., `/timezone America/New_York`)
- `/clear` - Clear conversation history
- `/help` - Show help message

You can also chat naturally with the bot about any coding topic!

## Tech Stack

- **Node.js** - Runtime environment
- **Telegram Bot API** - Bot interface
- **Groq AI** (Llama 3.3) - Primary AI for conversations and ideas
- **Google Gemini** - Backup AI service
- **GitHub API** - Commit tracking and profile data
- **GitHub Actions** - Automated scheduled reminders

## Setup

### Prerequisites

- Node.js 18+
- Telegram Bot Token
- GitHub Personal Access Token
- Groq API Key
- Gemini API Key (optional)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/iftekharanwar/remindmetocommit.git
cd remindmetocommit
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file:
```env
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id
GITHUB_TOKEN=your_github_token
GITHUB_USERNAME=your_github_username
GROQ_API_KEY=your_groq_api_key
GEMINI_API_KEY=your_gemini_api_key
```

4. Run the bot:
```bash
npm start
```

## Deployment

### Deploy to Railway.app (Recommended)

Railway offers $5 in free credits per month, which is more than enough for this bot.

1. Push code to GitHub
2. Go to [railway.app](https://railway.app) and sign in with GitHub
3. Click **"New Project"** → **"Deploy from GitHub repo"**
4. Select the `remindmetocommit` repository
5. Add environment variables in the **Variables** tab:
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_CHAT_ID`
   - `GITHUB_TOKEN`
   - `GITHUB_USERNAME`
   - `GROQ_API_KEY`
   - `GEMINI_API_KEY`
6. Deploy! The bot will be live 24/7.

### GitHub Actions Setup

Add these secrets to your GitHub repository (Settings → Secrets → Actions):
- `TELEGRAM_BOT_TOKEN` - Your Telegram bot token
- `TELEGRAM_CHAT_ID` - Your Telegram chat ID
- `GH_TOKEN` - Your GitHub personal access token
- `GH_USERNAME` - Your GitHub username
- `GROQ_API_KEY` - Your Groq API key
- `GEMINI_API_KEY` - Your Gemini API key (optional backup)

The workflow will automatically run 3x daily to check commits and send reminders.

## How It Works

1. **Scheduled Checks**: GitHub Actions runs 3x daily (10 AM, 3 PM, 8 PM IST)
2. **Commit Detection**: Checks if you've committed today via GitHub API
3. **Smart Reminders**: If no commit, sends AI-generated project idea via Telegram
4. **Conversational AI**: Bot is always available for coding questions and assistance

## License

ISC

## Author

Built with ❤️ by [iftekharanwar](https://github.com/iftekharanwar)

---
