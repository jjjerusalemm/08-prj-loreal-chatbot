// ============================================
// L'ORÉAL BEAUTY CHATBOT - CLOUDFLARE WORKER
// ============================================
//
// ✅ COPY THIS ENTIRE FILE INTO CLOUDFLARE
//
// STEPS:
// 1. Go to https://dash.cloudflare.com/workers
// 2. Create or open your Worker
// 3. DELETE all existing code
// 4. COPY THIS ENTIRE FILE
// 5. PASTE it into the Cloudflare editor
// 6. Click "Save and Deploy"
// 7. Your Worker URL will be shown - copy it
// 8. Paste that URL in script.js as CLOUDFLARE_WORKER_URL
//
// Then set your API key:
// 1. Click "Settings" in your Worker
// 2. Find "Variables"
// 3. Click "Add Variable"
// 4. Variable name: OPENAI_API_KEY
// 5. Variable value: (your OpenAI API key)
// 6. Click "Encrypt" then "Save"
//
// ============================================

export default {
  async fetch(request, env) {
    // CORS headers - allow browser requests
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json",
    };

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // Only accept POST
    if (request.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Only POST requests accepted" }),
        { status: 405, headers: corsHeaders },
      );
    }

    try {
      // Get API key from Cloudflare environment variable
      const apiKey = env.OPENAI_API_KEY;

      if (!apiKey) {
        return new Response(
          JSON.stringify({
            error:
              "API key not configured. Add OPENAI_API_KEY to Cloudflare Worker settings.",
          }),
          { status: 500, headers: corsHeaders },
        );
      }

      // Parse request body
      let requestData;
      try {
        requestData = await request.json();
      } catch (e) {
        return new Response(
          JSON.stringify({ error: "Invalid JSON in request" }),
          { status: 400, headers: corsHeaders },
        );
      }

      // Validate messages array
      if (!requestData.messages || !Array.isArray(requestData.messages)) {
        return new Response(
          JSON.stringify({ error: "Request must include messages array" }),
          { status: 400, headers: corsHeaders },
        );
      }

      // Call OpenAI API
      const openaiResponse = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o",
            messages: requestData.messages,
            max_completion_tokens: 300,
            temperature: 0.7,
          }),
        },
      );

      // Check for OpenAI errors
      if (!openaiResponse.ok) {
        let errorMsg = "OpenAI error";
        try {
          const errorData = await openaiResponse.json();
          errorMsg = errorData.error?.message || errorMsg;
        } catch (e) {
          // Could not parse error
        }
        return new Response(JSON.stringify({ error: errorMsg }), {
          status: openaiResponse.status,
          headers: corsHeaders,
        });
      }

      // Parse OpenAI response
      const openaiData = await openaiResponse.json();

      // Extract message
      if (
        !openaiData.choices ||
        !openaiData.choices[0] ||
        !openaiData.choices[0].message?.content
      ) {
        return new Response(
          JSON.stringify({ error: "Invalid response from OpenAI" }),
          { status: 500, headers: corsHeaders },
        );
      }

      const assistantReply = openaiData.choices[0].message.content;

      // Return clean response
      return new Response(
        JSON.stringify({
          reply: assistantReply,
          success: true,
        }),
        { status: 200, headers: corsHeaders },
      );
    } catch (error) {
      console.error("Worker error:", error);
      return new Response(
        JSON.stringify({ error: `Server error: ${error.message}` }),
        { status: 500, headers: corsHeaders },
      );
    }
  },
};
