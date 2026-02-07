export default async (req) => {
  try {
    // Allow only POST requests
    if (req.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    // Parse JSON from frontend
    const { messages, stream } = await req.json();

    if (!Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "Invalid messages format" }),
        { status: 400 }
      );
    }

    // Secure API key (server-side only)
    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) {
      return new Response(
        JSON.stringify({ error: "Missing API key" }),
        { status: 500 }
      );
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

    // Convert chat history to Gemini format
    const body = {
      contents: messages.map((m) => ({
        role: m.role === "model" ? "assistant" : "user",
        parts: m.parts || [{ text: m.content || "" }],
      })),
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
      },
    };

    // Call Gemini API
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Gemini API Error:", response.status, err);
      return new Response(
        JSON.stringify({ error: err }),
        { status: response.status }
      );
    }

    // Non-streaming fallback
    if (!stream) {
      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      return new Response(JSON.stringify({ reply: text }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Streaming response
    const reader = response.body.getReader();
    return new Response(
      new ReadableStream({
        async start(controller) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            controller.enqueue(value);
          }
          controller.close();
        },
      }),
      {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
        },
      }
    );
  } catch (err) {
    console.error("Gemini.js Exception:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500 }
    );
  }
};
