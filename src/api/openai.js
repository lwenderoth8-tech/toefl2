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
    // if (usageRecord.totalTokensUsed >= TOKEN_LIMIT) {
    //     throw new Error(`TOKEN LIMIT REACHED: ${usageRecord.totalTokensUsed} / ${TOKEN_LIMIT}. Please reset in code/database.`);
    // }

    // Wenn usageData übergeben wurde (NACH der Anfrage), aktualisieren
    if (usageData && usageData.total_tokens) {
        usageRecord.totalTokensUsed += usageData.total_tokens;
        usageRecord.lastUpdated = Date.now();
        await usageRecord.save();
        console.log(`Token Usage: ${usageRecord.totalTokensUsed} / ${TOKEN_LIMIT}`);
    }
}

async function callOpenAI(messages, responseFormat = null) {
    // 1. Check Limit (nur Tracking)
    await checkAndTrackUsage();

    console.log(`[OpenAI] Sending request to model: ${MODEL_NAME}`);

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

        // 2. Track Usage
        if (response.data.usage) {
            await checkAndTrackUsage(response.data.usage);
        }

        console.log("[OpenAI] Response received successfully.");
        return response.data.choices[0].message.content;

    } catch (error) {
        console.error('[OpenAI] API Error Details:', error.response ? error.response.data : error.message);
        
        if (error.response && error.response.status === 401) {
            throw new Error('OpenAI API Key ist ungültig oder fehlt.');
        }
        if (error.response && error.response.status === 429) {
            throw new Error('OpenAI Rate Limit oder Quota überschritten (Guthaben leer?).');
        }
        
        throw new Error(`OpenAI Fehler: ${error.message}`);
    }
}

module.exports = { callOpenAI };