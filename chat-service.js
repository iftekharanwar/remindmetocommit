const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const conversationHistory = new Map();

async function getChatResponse(userId, userMessage, userProfile = null) {
    try {
        if (!conversationHistory.has(userId)) {
            conversationHistory.set(userId, [
                {
                    role: 'system',
                    content: `You are a helpful AI coding assistant. You're part of a GitHub commit reminder system, but YOU specifically handle the conversational chat part.

IMPORTANT - How the system works:
- The commit checking and reminders are handled by GitHub Actions (automated workflows)
- GitHub Actions checks commits 3 times daily and sends reminders via Telegram
- YOU (the chat bot) are ONLY for answering coding questions and providing help
- You CANNOT check commits, verify streaks, or send reminders yourself
- If users ask about commit tracking, explain that it's handled automatically by GitHub Actions

Your role:
- Answer coding questions in any language/framework
- Help with debugging and troubleshooting
- Provide guidance on architecture, design decisions, and best practices
- Suggest learning resources and project ideas
- Review code and offer improvements

Your personality:
- Friendly, encouraging, and supportive
- Concise but thorough - keep responses under 500 words unless asked for details
- Use emojis sparingly (1-2 max per response)
- Practical and actionable advice

${userProfile ? `User's GitHub Profile:
- Languages: ${userProfile.languages}
- Public Repos: ${userProfile.publicRepos}
- Recent Projects: ${userProfile.recentRepos}
- Bio: ${userProfile.bio}` : ''}

Remember: You're the coding assistant part of the system. Commit tracking happens automatically via GitHub Actions - you don't do that. Be honest about your capabilities.`
                }
            ]);
        }

        const history = conversationHistory.get(userId);

        history.push({
            role: 'user',
            content: userMessage
        });

        // Keep only last 10 messages (5 exchanges) to avoid token limits
        const recentHistory = history.slice(-11);

        const completion = await groq.chat.completions.create({
            messages: recentHistory,
            model: 'llama-3.3-70b-versatile',
            temperature: 0.7,
            max_tokens: 1000,
        });

        const assistantMessage = completion.choices[0]?.message?.content ||
            "Sorry, I couldn't generate a response. Please try again!";

        history.push({
            role: 'assistant',
            content: assistantMessage
        });

        conversationHistory.set(userId, history);

        return assistantMessage;
    } catch (error) {
        console.error('Error getting chat response:', error.message);

        if (userMessage.toLowerCase().includes('react')) {
            return "I'd love to help with React! Could you be more specific about what you're working on? (I'm having API issues right now, but I'll be back soon! 🔧)";
        }

        return "Sorry, I'm having trouble connecting to my AI brain right now. Please try again in a moment! 🤖";
    }
}

function clearHistory(userId) {
    conversationHistory.delete(userId);
    return true;
}

module.exports = { getChatResponse, clearHistory };
