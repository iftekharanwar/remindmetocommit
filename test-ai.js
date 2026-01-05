require('dotenv').config();
const { generateProjectIdea } = require('./ai-service');

const GITHUB_USERNAME = process.env.GITHUB_USERNAME;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

async function test() {
    console.log('Testing AI project idea generation...\n');

    const project = await generateProjectIdea(GITHUB_USERNAME, GITHUB_TOKEN);

    console.log('Generated Project Idea:');
    console.log('======================');
    console.log('Title:', project.title);
    console.log('Description:', project.description);
    console.log('Tech Stack:', project.techStack);
    console.log('Difficulty:', project.difficulty);
}

test();
