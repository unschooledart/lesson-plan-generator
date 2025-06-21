// netlify/functions/generate.js

const fetch = require('node-fetch');

exports.handler = async (event) => {
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

    // 2. Validate
    if (!prompt) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error:
            'Missing prompt. Use GET ?prompt=YOUR_TEXT or POST JSON { "prompt": "YOUR_TEXT" }.'
        })
      };
    }

    // 3. Call the REST endpoint for text-bison-001
    const url =
      'https://generativelanguage.googleapis.com/v1beta2/models/text-bison-001:generateText'
      + `?key=${process.env.GOOGLE_AI_API_KEY}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: { text: prompt },
        temperature: 0.7,
        maxOutputTokens: 256
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Google API error: ${errText}`);
    }

    const json = await res.json();
    const aiText = json.candidates?.[0]?.output || '';

    // 4. Return result
    return {
      statusCode: 200,
      body: JSON.stringify({ text: aiText })
    };

  } catch (err) {
    console.error('generate.js error:', err);
    return {
      statusCode: err.message.startsWith('Missing prompt') ? 400 : 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
