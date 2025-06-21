// This is our secure serverless function
const { GoogleGenerativeAI } = require("@google/generative-ai");

// This handler function will be called by Netlify
exports.handler = async function (event, context) {
  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    // Get the prompt from the request body sent by our script.js
    const { prompt } = JSON.parse(event.body);

    // Access the secret API key from the environment variable we set up in Netlify
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Send the prompt to the AI
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Send the AI's response back to our script.js
    return {
      statusCode: 200,
      body: JSON.stringify({ reply: text }),
    };
  } catch (error) {
    console.error("AI function error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "An error occurred while generating content." }),
    };
  }
};