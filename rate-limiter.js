const fs = require('fs');
const path = require('path');

const rateLimitPath = path.join(__dirname, 'rate-limit.json');

const LIMITS = {
    aiRequests: 100,
    messagesPerUser: 50,
    totalMessages: 200
};

function loadRateLimitData() {
    if (fs.existsSync(rateLimitPath)) {
        const data = JSON.parse(fs.readFileSync(rateLimitPath, 'utf8'));

        const today = new Date().toISOString().split('T')[0];
        if (data.date !== today) {
            return resetRateLimitData();
        }

        return data;
    }
    return resetRateLimitData();
}

function resetRateLimitData() {
    const today = new Date().toISOString().split('T')[0];
    const data = {
        date: today,
        aiRequests: 0,
        totalMessages: 0,
        userMessages: {}
    };
    saveRateLimitData(data);
    return data;
}

function saveRateLimitData(data) {
    fs.writeFileSync(rateLimitPath, JSON.stringify(data, null, 2));
}

function canMakeAIRequest() {
    const data = loadRateLimitData();

    if (data.aiRequests >= LIMITS.aiRequests) {
        console.warn(`⚠️ Daily AI request limit reached: ${data.aiRequests}/${LIMITS.aiRequests}`);
        return false;
    }

    return true;
}

function incrementAIRequest() {
    const data = loadRateLimitData();
    data.aiRequests++;
    saveRateLimitData(data);
    console.log(`AI requests today: ${data.aiRequests}/${LIMITS.aiRequests}`);
}

function canSendMessage(userId) {
    const data = loadRateLimitData();

    if (data.totalMessages >= LIMITS.totalMessages) {
        console.warn(`⚠️ Daily total message limit reached: ${data.totalMessages}/${LIMITS.totalMessages}`);
        return false;
    }

    const userCount = data.userMessages[userId] || 0;
    if (userCount >= LIMITS.messagesPerUser) {
        console.warn(`⚠️ User ${userId} reached daily message limit: ${userCount}/${LIMITS.messagesPerUser}`);
        return false;
    }

    return true;
}

function incrementMessage(userId) {
    const data = loadRateLimitData();
    data.totalMessages++;
    data.userMessages[userId] = (data.userMessages[userId] || 0) + 1;
    saveRateLimitData(data);

    const userCount = data.userMessages[userId];
    console.log(`Messages - User: ${userCount}/${LIMITS.messagesPerUser}, Total: ${data.totalMessages}/${LIMITS.totalMessages}`);
}

function getRateLimitStatus() {
    const data = loadRateLimitData();
    return {
        aiRequests: `${data.aiRequests}/${LIMITS.aiRequests}`,
        totalMessages: `${data.totalMessages}/${LIMITS.totalMessages}`,
        date: data.date
    };
}

module.exports = {
    canMakeAIRequest,
    incrementAIRequest,
    canSendMessage,
    incrementMessage,
    getRateLimitStatus,
    LIMITS
};
