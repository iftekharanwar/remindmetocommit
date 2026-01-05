const { GoogleGenerativeAI } = require('@google/generative-ai');
const Groq = require('groq-sdk');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

function getRandomProjectFromJSON() {
    const projectsPath = path.join(__dirname, 'project-ideas.json');
    const projects = JSON.parse(fs.readFileSync(projectsPath, 'utf8'));
    const randomIndex = Math.floor(Math.random() * projects.ideas.length);
    return projects.ideas[randomIndex];
}

async function getUserGitHubProfile(username, token) {
    try {
        const [userResponse, reposResponse] = await Promise.all([
            axios.get(`https://api.github.com/users/${username}`, {
                headers: { 'Authorization': `token ${token}` }
            }),
            axios.get(`https://api.github.com/users/${username}/repos?sort=updated&per_page=10`, {
                headers: { 'Authorization': `token ${token}` }
            })
        ]);

        const languages = new Set();
        reposResponse.data.forEach(repo => {
            if (repo.language) languages.add(repo.language);
        });

        return {
            bio: userResponse.data.bio || 'No bio',
            languages: Array.from(languages).join(', '),
            publicRepos: userResponse.data.public_repos,
            recentRepos: reposResponse.data.slice(0, 5).map(r => r.name).join(', ')
        };
    } catch (error) {
        console.error('Error fetching GitHub profile:', error.message);
        return null;
    }
}

async function generateWithGroq(profile) {
    const prompt = `You are a creative software project idea generator. Generate ONE unique, practical project idea for a developer.

${profile ? `Developer Profile:
- Languages: ${profile.languages}
- Public Repos: ${profile.publicRepos}
- Recent Projects: ${profile.recentRepos}
- Bio: ${profile.bio}` : ''}

IMPORTANT RULES:
- NO generic projects (no todo lists, weather apps, or basic dashboards)
- Must be PRACTICAL and solve a real problem
- Should be completable in a few hours to a few days
- Must be interesting and unique
- Should teach something new or useful

Return ONLY a JSON object in this exact format (no markdown, no code blocks, just raw JSON):
{
  "title": "Project Title",
  "description": "A concise 2-3 sentence description of what it does and why it's useful",
  "techStack": "Specific technologies to use",
  "difficulty": "Easy/Medium/Hard"
}`;

    const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.8,
        max_tokens: 500,
    });

    const response = completion.choices[0]?.message?.content || '';

    // Clean up response - remove markdown code blocks if present
    const cleanedResponse = response
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

    return JSON.parse(cleanedResponse);
}

async function generateWithGemini(profile) {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `You are a creative software project idea generator. Generate ONE unique, practical project idea for a developer.

${profile ? `Developer Profile:
- Languages: ${profile.languages}
- Public Repos: ${profile.publicRepos}
- Recent Projects: ${profile.recentRepos}
- Bio: ${profile.bio}` : ''}

IMPORTANT RULES:
- NO generic projects (no todo lists, weather apps, or basic dashboards)
- Must be PRACTICAL and solve a real problem
- Should be completable in a few hours to a few days
- Must be interesting and unique
- Should teach something new or useful

Return ONLY a JSON object in this exact format (no markdown, no code blocks, just raw JSON):
{
  "title": "Project Title",
  "description": "A concise 2-3 sentence description of what it does and why it's useful",
  "techStack": "Specific technologies to use",
  "difficulty": "Easy/Medium/Hard"
}`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    // Clean up response - remove markdown code blocks if present
    const cleanedResponse = response
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

    return JSON.parse(cleanedResponse);
}

async function generateProjectIdea(username, token) {
    const profile = await getUserGitHubProfile(username, token);

    // Try Groq first (best free tier limits)
    try {
        console.log('Attempting to generate idea with Groq...');
        const idea = await generateWithGroq(profile);
        console.log('✅ Successfully generated idea with Groq!');
        return idea;
    } catch (groqError) {
        console.error('❌ Groq failed:', groqError.message);

        // Fallback to Gemini
        try {
            console.log('Attempting to generate idea with Gemini...');
            const idea = await generateWithGemini(profile);
            console.log('✅ Successfully generated idea with Gemini!');
            return idea;
        } catch (geminiError) {
            console.error('❌ Gemini failed:', geminiError.message);

            // Final fallback to JSON file
            console.log('⚠️ Both AI APIs failed. Using random idea from JSON file.');
            return getRandomProjectFromJSON();
        }
    }
}

module.exports = { generateProjectIdea, getUserGitHubProfile };
