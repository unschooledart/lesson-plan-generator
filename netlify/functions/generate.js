// netlify/functions/generate.js

const fetch = require('node-fetch');

exports.handler = async (event) => {
  try {
    // 1. Parse the incoming JSON payload
    const { prompt } = JSON.parse(event.body);

    // 2. Call Google Generative Language API (v1beta2 + generateText)
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta2/models/text-bison-001:generateText',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Your API key is read from Netlify's environment variable
          Authorization: `Bearer ${process.env.GOOGLE_AI_API_KEY}`
        },
        body: JSON.stringify({
          prompt: { text: prompt },
          temperature: 0.7,
          maxOutputTokens: 256
        })
      }
    );

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`API error: ${err}`);
    }

    // 3. Extract the AI-generated text
    const data = await response.json();
    const aiText = data.candidates?.[0]?.output || '';

    // 4. Return it to the client
    return {
      statusCode: 200,
      body: JSON.stringify({ text: aiText })
    };

  } catch (error) {
    console.error('AI Function Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
