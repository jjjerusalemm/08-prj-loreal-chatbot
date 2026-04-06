// ============================================
// L'ORÉAL BEAUTY CHATBOT - CLOUDFLARE WORKER
// ============================================
//
// HOW TO USE THIS CODE:
// 1. Go to Cloudflare Workers Dashboard
// 2. Create a new Worker
// 3. Copy THIS ENTIRE CODE into the Worker editor
// 4. Click "Save and Deploy"
// 5. Copy your Worker URL and paste it into script.js (CLOUDFLARE_WORKER_URL)
// 6. Set your API key (see instructions below)
//
// ============================================
// SET YOUR OPENAI API KEY
// ============================================
//
// In Cloudflare Dashboard:
// 1. Go to your Worker settings
// 2. Navigate to "Settings" → "Variables"
// 3. Click "Add Variable"
// 4. Name: OPENAI_API_KEY
// 5. Value: (Paste your OpenAI API key here)
// 6. Click "Encrypt" (if available)
// 7. Save
//
// ============================================

export default {
  async fetch(request, env) {
    // ============================================
    // CORS HEADERS (Allow requests from your app)
    // ============================================
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json",
    };

    // ============================================
    // HANDLE CORS PREFLIGHT
    // ============================================
    // Browsers send an OPTIONS request first - we need to respond with CORS headers
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // ============================================
    // ONLY ACCEPT POST REQUESTS
    // ============================================
    if (request.method !== "POST") {
      return new Response(
        JSON.stringify({
          error: "Only POST requests are accepted",
        }),
        { status: 405, headers: corsHeaders },
      );
    }

    try {
      // ============================================
      // GET API KEY FROM CLOUDFLARE ENVIRONMENT
      // ============================================
      const apiKey = env.OPENAI_API_KEY;

      // Check if API key is set
      if (!apiKey) {
        console.error("OPENAI_API_KEY is not set in Cloudflare Worker");
        return new Response(
          JSON.stringify({
            error:
              "API key is not configured. Set OPENAI_API_KEY in Cloudflare Dashboard.",
          }),
          { status: 500, headers: corsHeaders },
        );
      }

      // ============================================
      // PARSE REQUEST BODY
      // ============================================
      // The request body should contain: { messages: [...] }
      let requestData;
      try {
        requestData = await request.json();
      } catch (parseError) {
        return new Response(
          JSON.stringify({
            error: "Invalid JSON in request body",
          }),
          { status: 400, headers: corsHeaders },
        );
      }

      // Validate that messages array exists
      if (!requestData.messages || !Array.isArray(requestData.messages)) {
        return new Response(
          JSON.stringify({
            error: "Request must include a 'messages' array",
          }),
          { status: 400, headers: corsHeaders },
        );
      }

      // ============================================
      // BUILD REQUEST TO OPENAI API
      // ============================================
      const openaiUrl = "https://api.openai.com/v1/chat/completions";

      const openaiRequest = {
        model: "gpt-4o", // L'Oréal Chatbot uses gpt-4o (as per instructions)
        messages: requestData.messages, // Full conversation history
        max_completion_tokens: 300, // Limit response length
        temperature: 0.7, // Balance between deterministic and creative
      };

      // ============================================
      // SEND REQUEST TO OPENAI
      // ============================================
      const openaiResponse = await fetch(openaiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(openaiRequest),
      });

      // Check if OpenAI API returned an error
      if (!openaiResponse.ok) {
        const errorData = await openaiResponse.json();
        console.error("OpenAI API error:", errorData);

        return new Response(
          JSON.stringify({
            error: `OpenAI API error: ${errorData.error?.message || "Unknown error"}`,
          }),
          { status: openaiResponse.status, headers: corsHeaders },
        );
      }

      // ============================================
      // PARSE OPENAI RESPONSE
      // ============================================
      const openaiData = await openaiResponse.json();

      // Extract assistant's message using the exact path from instructions
      // data.choices[0].message.content
      if (
        !openaiData.choices ||
        !openaiData.choices[0] ||
        !openaiData.choices[0].message
      ) {
        console.error("Unexpected OpenAI response structure:", openaiData);
        return new Response(
          JSON.stringify({
            error: "Unexpected response format from OpenAI",
          }),
          { status: 500, headers: corsHeaders },
        );
      }

      // ============================================
      // RETURN RESPONSE
      // ============================================
      // Return the full OpenAI response (script.js will extract message.content)
      return new Response(JSON.stringify(openaiData), {
        headers: corsHeaders,
      });
    } catch (error) {
      // ============================================
      // CATCH ANY UNEXPECTED ERRORS
      // ============================================
      console.error("Worker error:", error);

      return new Response(
        JSON.stringify({
          error: `Server error: ${error.message}`,
        }),
        { status: 500, headers: corsHeaders },
      );
    }
  },
};

// ============================================
// NOTES FOR STUDENTS
// ============================================

/*
WHY DO WE USE A CLOUDFLARE WORKER?
------------------------------------

1. SECURITY:
   - Your OpenAI API key stays on Cloudflare servers
   - Your browser never sees the API key
   - This prevents your key from being exposed in client-side code

2. CORS:
   - Web browsers block requests across different domains
   - Our Worker is on the same domain, so it can make the request
   - Then it returns the response to our app

3. AUTHENTICATION:
   - The Worker adds the API key to requests
   - OpenAI verifies the key and processes the request
   - Our browser app stays secure

HOW IT WORKS:
-------------

1. User sends message from browser
2. script.js sends request to Cloudflare Worker
3. Worker receives request with conversation history
4. Worker adds API key and sends to OpenAI API
5. OpenAI returns assistant's response
6. Worker returns response to script.js
7. script.js displays response to user

REQUEST FLOW:
-----------
Browser App → Cloudflare Worker → OpenAI API
      ↑            ↓
      └────────────┘
*/
