const fetch = require('node-fetch');

exports.handler = async (event) => {
  try {
    // 1. Read the JSON body sent from the browser
    const { prompt } = JSON.parse(event.body);

    // 2. Call Google Gemini API
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta2/models/text-bison-001:generateText',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Use the secret stored in Netlify environment
          'Authorization': `Bearer ${process.env.GOOGLE_AI_API_KEY}`
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

    const data = await response.json();
    const aiText = data.candidates?.[0]?.output || '';

    // 3. Return the generated text back to the browser
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
