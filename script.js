// ============================================
// L'ORÉAL BEAUTY CHATBOT - JAVASCRIPT
// ============================================

// ============================================
// DOM ELEMENTS
// ============================================
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");
const sendBtn = document.getElementById("sendBtn");
const resetBtn = document.getElementById("resetBtn");
const clearBtn = document.getElementById("clearBtn");
const helpBtn = document.getElementById("helpBtn");
const userName = document.getElementById("userName");
const latestQuestionSection = document.getElementById("latestQuestionSection");
const latestQuestionDisplay = document.getElementById("latestQuestion");

// ============================================
// STATE VARIABLES
// ============================================

let conversationHistory = [];

// YOUR CLOUDFLARE WORKER URL
const CLOUDFLARE_WORKER_URL = "https://loreal-chatbot-worker.jtut.workers.dev/";

let questionCount = 0;

// ============================================
// INITIALIZATION
// ============================================

function initializeChatbot() {
  const welcomeMessage =
    "Welcome to your personal beauty consultation. I'm here to guide you through L'Oréal's finest products and expert beauty advice. What brings you here today?";
  displayMessage(welcomeMessage, "assistant");
  console.log("✅ Beauty Advisor initialized");
  console.log("🔗 Worker URL:", CLOUDFLARE_WORKER_URL);
}

initializeChatbot();

// ============================================
// FORM SUBMISSION - MAIN CHAT FUNCTIONALITY
// ============================================

chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const userMessage = userInput.value.trim();

  if (!userMessage) return;

  displayLatestQuestion(userMessage);
  displayMessage(userMessage, "user");

  userInput.value = "";
  userInput.focus();

  conversationHistory.push({
    role: "user",
    content: userMessage,
  });

  sendBtn.disabled = true;
  sendBtn.style.opacity = "0.6";

  showTypingIndicator();

  try {
    console.log("🚀 Sending message to Worker...");
    const assistantResponse = await sendMessageToOpenAI(userMessage);

    removeTypingIndicator();

    displayMessage(assistantResponse, "assistant");

    conversationHistory.push({
      role: "assistant",
      content: assistantResponse,
    });

    questionCount++;

    if (questionCount === 3) {
      showChallengeUnlock();
    }
  } catch (error) {
    removeTypingIndicator();

    const errorMessage = `I apologize, but I'm currently experiencing a technical difficulty. Please try again in a moment.`;
    displayMessage(errorMessage, "assistant");

    console.error("❌ Chat error:", error);
  }

  sendBtn.disabled = false;
  sendBtn.style.opacity = "1";
});

// ============================================
// SEND MESSAGE TO CLOUDFLARE WORKER
// ============================================

async function sendMessageToOpenAI(userMessage) {
  const systemMessage = {
    role: "system",
    content:
      "You are L'Oréal's premier beauty consultant, providing sophisticated, personalized beauty advice. Speak with elegance and expertise about our luxury products, advanced skincare routines, and professional beauty recommendations. Use refined language and focus on premium, aspirational beauty experiences.",
  };

  const messages = [systemMessage, ...conversationHistory];

  const requestBody = {
    messages: messages,
  };

  try {
    console.log("📤 Fetch details:");
    console.log("   URL:", CLOUDFLARE_WORKER_URL);
    console.log("   Method: POST");
    console.log("   Headers: Content-Type: application/json");
    console.log("   Body messages count:", messages.length);

    const response = await fetch(CLOUDFLARE_WORKER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    console.log("✅ Got response from Worker");
    console.log("   Status:", response.status, response.statusText);

    if (!response.ok) {
      let errorText = "";
      try {
        errorText = await response.text();
      } catch (e) {
        errorText = "Could not read response";
      }
      console.error("❌ Worker error:", errorText);
      throw new Error(`Worker error ${response.status}: ${errorText}`);
    }

    let data;
    try {
      data = await response.json();
      console.log("📥 Parsed response:", data);
    } catch (parseError) {
      console.error("❌ JSON parse error:", parseError);
      const responseText = await response.text();
      console.error("Response text was:", responseText);
      throw new Error("Worker returned invalid JSON");
    }

    if (!data.reply) {
      console.error("❌ No reply in response:", data);

      // Check if it has choices (old format)
      if (data.choices && data.choices[0]?.message?.content) {
        console.log("⚠️ Found old response format, extracting message...");
        return data.choices[0].message.content;
      }

      throw new Error("Worker did not include a reply in response");
    }

    console.log("✅ Successfully got reply from Worker!");
    return data.reply;
  } catch (error) {
    console.error("❌ Fetch error:", error);

    // Better error messages for debugging
    if (error.message.includes("Failed to fetch")) {
      console.error("🔍 DEBUGGING FAILED TO FETCH:");
      console.error(
        "   1. Check Worker URL is correct:",
        CLOUDFLARE_WORKER_URL,
      );
      console.error("   2. Check Worker is deployed in Cloudflare");
      console.error("   3. Check browser console for CORS errors (read below)");
      console.error("   4. Try opening Worker URL directly in browser to test");
      throw new Error(
        "Cannot connect to Worker. Check console for debugging info.",
      );
    }

    throw error;
  }
}

// ============================================
// DISPLAY FUNCTIONS
// ============================================

function displayMessage(message, role) {
  const messageContainer = document.createElement("div");
  messageContainer.classList.add("message-container", role);

  const messageBubble = document.createElement("div");
  messageBubble.classList.add("message-bubble", role);
  messageBubble.textContent = message;

  const timestamp = document.createElement("div");
  timestamp.classList.add("message-time");
  timestamp.textContent = getCurrentTime();

  messageContainer.appendChild(messageBubble);
  messageContainer.appendChild(timestamp);

  chatWindow.appendChild(messageContainer);

  scrollToBottom();
}

function displayLatestQuestion(question) {
  latestQuestionDisplay.textContent = question;
  latestQuestionSection.style.display = "block";
}

function getCurrentTime() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function showTypingIndicator() {
  const typingContainer = document.createElement("div");
  typingContainer.classList.add("message-container", "assistant");
  typingContainer.id = "typingIndicator";

  const typingBubble = document.createElement("div");
  typingBubble.classList.add("typing-indicator");
  typingBubble.innerHTML = "<span></span><span></span><span></span>";

  typingContainer.appendChild(typingBubble);
  chatWindow.appendChild(typingContainer);

  scrollToBottom();
}

function removeTypingIndicator() {
  const typingIndicator = document.getElementById("typingIndicator");
  if (typingIndicator) {
    typingIndicator.remove();
  }
}

function scrollToBottom() {
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

// ============================================
// ACTION BUTTONS
// ============================================

resetBtn.addEventListener("click", () => {
  chatWindow.innerHTML = "";
  initializeChatbot();
  latestQuestionSection.style.display = "none";
  questionCount = 0;
  console.log("🔄 Chat reset");
});

clearBtn.addEventListener("click", () => {
  conversationHistory = [];
  chatWindow.innerHTML = "";
  initializeChatbot();
  latestQuestionSection.style.display = "none";
  questionCount = 0;
  alert("Conversation history has been cleared. Ready for a fresh consultation.");
  console.log("🗑️ History cleared");
});

helpBtn.addEventListener("click", () => {
  const helpMessage = `
ASSISTANCE & GUIDANCE

How to engage with your beauty consultant:
• Share your name for a personalized beauty consultation experience
• Inquire about skincare routines, makeup recommendations, or beauty expertise
• Your conversation history is preserved for continuity

Suggested inquiries:
• What skincare regimen would you recommend for mature skin?
• Which foundation complements warm undertones?
• How should I prepare my skin for a special occasion?
• What haircare solutions address volume concerns?

Available features:
• Elegant message display with conversation flow
• Current inquiry highlighted above
• Timestamps for reference
• Reset display option (preserves conversation context)
• Clear history for a fresh consultation start

Discover the art of L'Oréal beauty.
  `;

  displayMessage(helpMessage, "assistant");
});

function showChallengeUnlock() {
  const challengeMessage =
    "Congratulations on your engagement! As a token of appreciation, I'd like to introduce you to L'Oréal's most beloved skincare collection. Discover the transformative power of our Revitalift range.";
  displayMessage(challengeMessage, "assistant");
}

console.log("✅ Script.js loaded successfully!");
console.log(
  "📝 Check console here for debugging messages when you send a message",
);
