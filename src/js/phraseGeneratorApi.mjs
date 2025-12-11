import OpenAI from "openai";

const client = new OpenAI({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true
});
const API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

export async function generatePhrases(topic) {
    const prompt = `
Generate 3 useful Mandarin Chinese phrases about "${topic}". 
Return them ONLY as JSON in this format:

[
  {"hanzi": "...", "pinyin": "...", "translation": "..."},
  ...
]
`;

    try {
        const response = await client.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }]
        });

        const content = response.choices[0]?.message?.content;

        if (!content) {
            alert("OpenAI returned an empty response.");
            console.warn("Raw response:", response);
            return [];
        }

        try {
            return JSON.parse(content);
        } catch (jsonError) {
            alert("Error parsing OpenAI output as JSON.");
            console.error("JSON parse error:", jsonError);
            console.log("Raw content:", content);
            return [];
        }

    } catch (err) {
        console.error("OpenAI Error:", err);

        if (err.status === 429) {
            alert("Too many requests to OpenAI. Wait a few seconds and try again.");
        } else if (err.status === 401) {
            alert("API key is invalid or missing.");
        } else {
            alert("Network or server error.");
        }

        return [];
    }
}




export async function playTTS(text) {
    try {
        const response = await fetch("https://api.openai.com/v1/audio/speech", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4o-mini-tts",
                voice: "alloy",
                input: text
            })
        });

        if (!response.ok) {
            alert("Error generating audio.");
            return;
        }

        const audioBlob = await response.blob();
        const url = URL.createObjectURL(audioBlob);
        new Audio(url).play();

    } catch (err) {
        alert("Could not connect to audio API.");
        console.error(err);
    }
}
