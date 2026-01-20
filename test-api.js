const { GoogleGenerativeAI } = require('@google/generative-ai');

// Replace with your actual API key
const API_KEY = 'AIzaSyBtGXMdhgoICaPsrfT_K8FPRbmYLKo-Ob4';

async function testGeminiAPI() {
    console.log('Checking available Gemini models via REST API...\n');

    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
            console.log('❌ Error:', data.error.message);
            return;
        }

        console.log('✅ Available models for your API key:');
        data.models.forEach(model => {
            console.log(`  - ${model.name}`);
        });

        // Now try gemini-2.5-flash (available for your API key)
        console.log('\n--- Testing gemini-2.5-flash ---');
        const { GoogleGenerativeAI } = require('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(API_KEY);
        const geminiModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await geminiModel.generateContent("Say 'API works!' in 3 words.");
        const text = (await result.response).text();
        console.log('✅ Response:', text);

    } catch (error) {
        console.log('❌ FAILED');
        console.log('Error:', error.message);
    }
}

testGeminiAPI().catch(console.error);
