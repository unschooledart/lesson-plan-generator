// netlify/functions/generate.js

const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  try {
    // 1. Grab the prompt from GET or POST
    let prompt = '';
    if (event.httpMethod === 'GET') {
      prompt = event.queryStringParameters?.prompt || '';
    } else if (event.httpMethod === 'POST') {
      if (!event.body) throw new Error('No request body');
      const body = JSON.parse(event.body);
      prompt = body.prompt || '';
    }

    // 2. If no prompt was provided, bail out
    if (!prompt) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error:
            'Missing prompt. Use GET /generate?prompt=YOUR_TEXT or POST JSON {"prompt":"YOUR_TEXT"}.'
        })
      };
    }

    // 3. Call the v1beta generateContent endpoint with the correct model name
    const url =
      'https://generativelanguage.googleapis.com/v1beta/models/text-bison@002:generateContent'
      + `?key=${process.env.GOOGLE_AI_API_KEY}`;

    const apiResponse = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 256
        }
      })
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      throw new Error(`Google API error: ${errorText}`);
    }

    const data = await apiResponse.json();
    const aiText =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      data.candidates?.[0]?.output ||
      '';

    // 4. Return the generated text to the client
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
