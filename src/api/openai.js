const axios = require('axios');
const { TokenUsage } = require('../db/models');

const MODEL_NAME = "gpt-4o-mini";
const TOKEN_LIMIT = parseInt(process.env.TOKEN_LIMIT) || 500000;

async function checkAndTrackUsage(usageData) {
    let usageRecord = await TokenUsage.findOne();
    if (!usageRecord) {
        usageRecord = await TokenUsage.create({ totalTokensUsed: 0 });
    }

    // Check Limit VOR der Anfrage (basierend auf bisherigem Verbrauch)
    if (usageRecord.totalTokensUsed >= TOKEN_LIMIT) {
        throw new Error(`TOKEN LIMIT REACHED: ${usageRecord.totalTokensUsed} / ${TOKEN_LIMIT}. Please reset in code/database.`);
    }

    // Wenn usageData übergeben wurde (NACH der Anfrage), aktualisieren
    if (usageData && usageData.total_tokens) {
        usageRecord.totalTokensUsed += usageData.total_tokens;
        usageRecord.lastUpdated = Date.now();
        await usageRecord.save();
        console.log(`Token Usage: ${usageRecord.totalTokensUsed} / ${TOKEN_LIMIT}`);
    }
}

async function callOpenAI(messages, responseFormat = null) {
    console.log("callOpenAI started. Checking limits...");
    // 1. Check Limit
    await checkAndTrackUsage();
    console.log("Limit check passed. Calling OpenAI API...");

    try {
        const payload = {
            model: MODEL_NAME,
            messages: messages,
            temperature: 0.7
        };

        if (responseFormat === 'json') {
            payload.response_format = { type: "json_object" };
        }

        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            payload,
            {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log("OpenAI API response received.");

        // 2. Track Usage
        await checkAndTrackUsage(response.data.usage);

        return response.data.choices[0].message.content;
    } catch (error) {
        console.error('OpenAI API Error Details:', error.response ? JSON.stringify(error.response.data) : error.message);
        if (error.message.includes('TOKEN LIMIT')) throw error;
        throw new Error('Fehler bei der KI-Anfrage: ' + (error.response?.data?.error?.message || error.message));
    }
}

module.exports = { callOpenAI };