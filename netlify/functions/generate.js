// netlify/functions/generate.js

const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  try {
    // 1. Read prompt from GET or POST
    let prompt = '';
    if (event.httpMethod === 'GET') {
      prompt = event.queryStringParameters?.prompt || '';
    } else if (event.httpMethod === 'POST') {
      if (!event.body) throw new Error('No request body');
      const body = JSON.parse(event.body);
      prompt = body.prompt || '';
    }

    if (!prompt) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error:
            'Missing prompt. Use GET /generate?prompt=YOUR_TEXT or POST JSON {"prompt":"YOUR_TEXT"}.'
        })
      };
    }

    // 2. Build the text-bison@002 endpoint URL
    const apiUrl =
      'https://generativelanguage.googleapis.com/v1beta2/models/text-bison@002:generateText'
      + `?key=${process.env.GOOGLE_AI_API_KEY}`;

    // 3. Call the PaLM 2 Text Bison model
    const apiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: { text: prompt },
        temperature: 0.7,
        maxOutputTokens: 256
      })
    });

    if (!apiResponse.ok) {
      const errText = await apiResponse.text();
      throw new Error(`Google API error: ${errText}`);
    }

    const data = await apiResponse.json();
    const aiText = data.candidates?.[0]?.output || '';

    // 4. Return the generated text
    return {
      statusCode: 200,
      body: JSON.stringify({ text: aiText })
    };

  } catch (err) {
    console.error('AI Function Error:', err);
    return {
      statusCode: err.message.startsWith('Missing prompt') ? 400 : 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
