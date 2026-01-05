const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const conversationHistory = new Map();

async function getChatResponse(userId, userMessage, userProfile = null) {
    try {
        if (!conversationHistory.has(userId)) {
            conversationHistory.set(userId, [
                {
                    role: 'system',
                    content: `You are a helpful AI coding assistant integrated into a GitHub commit reminder bot.

Your personality:
- Friendly, encouraging, and supportive
- Knowledgeable about programming, software development, and best practices
- Concise but thorough - keep responses under 500 words unless asked for more detail
- Use emojis occasionally to be friendly (but don't overdo it)

You can help with:
- Coding questions (any language/framework)
- Debugging and troubleshooting
- Architecture and design decisions
- Best practices and code review
- Learning resources and career advice
- Project ideas and tech stack recommendations

${userProfile ? `User's GitHub Profile:
- Languages: ${userProfile.languages}
- Public Repos: ${userProfile.publicRepos}
- Recent Projects: ${userProfile.recentRepos}
- Bio: ${userProfile.bio}` : ''}

Keep answers practical and actionable. If you're unsure, say so rather than making something up.`
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
