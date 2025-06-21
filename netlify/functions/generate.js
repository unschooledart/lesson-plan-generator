// netlify/functions/generate.js

const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  try {
    // 1. Determine the prompt from GET or POST
    let prompt = '';

    if (event.httpMethod === 'GET') {
      // Read ?prompt= from query string
      prompt = event.queryStringParameters?.prompt || '';
    } else if (event.httpMethod === 'POST') {
      // Read JSON body
      if (!event.body) throw new Error('No request body');
      const body = JSON.parse(event.body);
      prompt = body.prompt || '';
    }

    // 2. If still no prompt, return 400
    if (!prompt) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error:
            'Missing prompt. Use GET /generate?prompt=YOUR_TEXT or POST JSON {"prompt":"YOUR_TEXT"}.'
        })
      };
    }

    // 3. Call Google Gemini API
    const apiResponse = await fetch(
      'https://generativelanguage.googleapis.com/v1beta2/models/text-bison-001:generateText',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.GOOGLE_AI_API_KEY}`
        },
        body: JSON.stringify({
          prompt: { text: prompt },
          temperature: 0.7,
          maxOutputTokens: 256
        })
      }
    );

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      throw new Error(`Google API error: ${errorText}`);
    }

    const apiData = await apiResponse.json();
    const aiText = apiData.candidates?.[0]?.output || '';

    // 4. Return the AI text
    return {
      statusCode: 200,
      body: JSON.stringify({ text: aiText })
    };
  } catch (err) {
    console.error('AI Function Error:', err);
    return {
      statusCode: err.message.includes('Missing prompt') ? 400 : 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
