const express = require('express');
const router = express.Router();
const { callOpenAI } = require('../api/openai');
const { Translation } = require('../db/models');

router.post('/process', async (req, res) => {
    const { text, action, language } = req.body;
    
    try {
        if (action === 'generate_test') {
            const systemPrompt = `You are a TOEFL exam creator. Create a scientific reading passage (approx. 700 words) suitable for university level. 
            Topic: Random scientific topic (Biology, Astronomy, History, Geology, etc.).
            Output strictly valid JSON with this structure:
            {
                "title": "Title of the text",
                "paragraphs": ["Paragraph 1 content...", "Paragraph 2 content...", ...],
                "questions": ["Question 1 (German)?", "Question 2 (German)?", "Question 3 (German)?", "Question 4 (German)?", "Question 5 (German)?"]
            }
            The text must be in English. The questions must be in German.`;

            try {
                const result = await callOpenAI([
                    { role: "system", content: systemPrompt },
                    { role: "user", content: "Generate a new test now." }
                ], 'json');
                return res.json({ result: JSON.parse(result) });
            } catch (aiError) {
                console.error("OpenAI Failed, using Fallback:", aiError.message);
                // Fallback Mock Data
                const topics = ['Quantum Physics', 'Marine Biology', 'Ancient Civilizations', 'Neuroscience'];
                const randomTopic = topics[Math.floor(Math.random() * topics.length)];
                
                const mockTest = {
                    title: `(MOCK) ${randomTopic}: An Overview`,
                    paragraphs: [
                        `This is a generated fallback text about ${randomTopic}. Since the OpenAI API quota is exceeded, this placeholder text is used to demonstrate the functionality. In a real scenario, this would be a 700-word scientific article.`,
                        `The study of ${randomTopic} has fascinated scientists for decades. It involves complex theories and empirical data. Researchers have found numerous correlations that challenge our understanding of the natural world.`,
                        `Furthermore, recent advancements in technology have allowed for deeper insights into ${randomTopic}. This has led to new questions and hypotheses that are currently being tested in laboratories around the world.`,
                        `In conclusion, while this is just a simulation, the field of ${randomTopic} remains a vital area of research with significant implications for the future of science and society.`
                    ],
                    questions: [
                        `Was ist das Hauptthema dieses (Mock-)Textes?`,
                        `Warum wird dieser Text angezeigt?`,
                        `Was hat das Verständnis der natürlichen Welt herausgefordert?`,
                        `Wodurch wurden tiefere Einblicke ermöglicht?`,
                        `Welche Bedeutung hat das Forschungsfeld für die Zukunft?`
                    ]
                };
                return res.json({ result: mockTest });
            }
        }

        let systemPrompt = "";

        if (action === 'translate') {
            systemPrompt = `
                Du bist eine strikte Übersetzungsmaschine.
                Deine Instruktionen:
                1. Übersetze den folgenden Text exakt ins ${language}.
                2. Gib NUR die Übersetzung aus.
                3. Füge KEINE Einleitungen, Erklärungen oder Anmerkungen hinzu.
                4. Halte den Ton neutral und sachlich.
                5. Die Übersetzung darf NIEMALS länger sein als der Originaltext.
            `;
        } else if (action === 'simplify') {
            systemPrompt = `
                Du bist ein Assistent für Textverständnis.
                Deine Instruktionen:
                1. Vereinfache den Inhalt des folgenden englischen Textes drastisch.
                2. Antworte AUSSCHLIESSLICH auf DEUTSCH.
                3. Deine Antwort darf NIEMALS länger sein als der englische Originaltext.
                4. Nutze extrem einfache Sprache (Niveau A2/B1).
                5. Gib nur den vereinfachten Text aus, keine Einleitung ("Hier ist die Vereinfachung...").
            `;
        } else if (action === 'explain') {
            systemPrompt = `
                Du bist ein strikter Tutor.
                Deine Instruktionen:
                1. Erkläre den folgenden Begriff oder Satz auf DEUTSCH.
                2. Halte dich extrem kurz (maximal 2 Sätze).
                3. Gib nur die Erklärung aus, kein "Hallo" oder "Gerne".
            `;
        }

        const result = await callOpenAI([
            { role: "system", content: systemPrompt },
            { role: "user", content: text }
        ]);

        // Speichern für Statistik
        await Translation.create({
            originalText: text,
            translatedText: result,
            type: action,
            language: language
        });

        res.json({ result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;