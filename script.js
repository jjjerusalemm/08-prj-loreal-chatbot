// ============================================
// L'ORÉAL BEAUTY CHATBOT - JAVASCRIPT
// ============================================

// DOM Elements
const response = await fetch("https://loreal-chatbot-worker.jtut.workers.dev", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    messages: conversationHistory
  })
});
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

// Array to store conversation history - REQUIRED for conversation context
// Each message has: role ("user" or "assistant") and content (the text)
let conversationHistory = [];

// API endpoint - Replace with YOUR Cloudflare Worker URL
const CLOUDFLARE_WORKER_URL = "https://your-worker.your-subdomain.workers.dev";

// Question count for optional challenge feature
let questionCount = 0;

// ============================================
// INITIALIZATION
// ============================================

// Show welcome message when page loads
function initializeChatbot() {
  const welcomeMessage =
    "👋 Hello! I'm your L'Oréal Beauty Advisor. Ask me about our products, skincare routines, or beauty tips. How can I help you today?";
  displayMessage(welcomeMessage, "assistant");
}

// Initialize on page load
initializeChatbot();

// ============================================
// FORM SUBMISSION - MAIN CHAT FUNCTIONALITY
// ============================================

// Listen for form submission when user sends a message
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault(); // Prevent page reload

  // Get user's message from input field
  const userMessage = userInput.value.trim();

  // Don't send empty messages
  if (!userMessage) return;

  // Display the user's latest question in the highlighted section
  displayLatestQuestion(userMessage);

  // Display user message as bubble
  displayMessage(userMessage, "user");

  // Clear input field for next message
  userInput.value = "";
  userInput.focus();

  // Add user message to conversation history
  conversationHistory.push({
    role: "user",
    content: userMessage,
  });

  // Disable send button while waiting for response
  sendBtn.disabled = true;
  sendBtn.style.opacity = "0.6";

  // Show thinking animation
  showTypingIndicator();

  try {
    // Send message to Cloudflare Worker and get response
    const assistantResponse = await sendMessageToOpenAI(userMessage);

    // Remove typing indicator
    removeTypingIndicator();

    // Display assistant's response as bubble
    displayMessage(assistantResponse, "assistant");

    // Add assistant's response to conversation history
    conversationHistory.push({
      role: "assistant",
      content: assistantResponse,
    });

    // Increment question count for optional challenge
    questionCount++;

    // Optional: Show challenge progress
    if (questionCount === 3) {
      showChallengeUnlock();
    }
  } catch (error) {
    // Remove typing indicator
    removeTypingIndicator();

    // Show error message to user
    const errorMessage =
      "❌ Sorry, I couldn't get a response. Please check your Cloudflare Worker URL and API key. Error: " +
      error.message;
    displayMessage(errorMessage, "assistant");

    console.error("Error communicating with API:", error);
  }

  // Re-enable send button
  sendBtn.disabled = false;
  sendBtn.style.opacity = "1";
});

// ============================================
// SEND MESSAGE TO CLOUDFLARE WORKER
// ============================================

// This function sends the entire conversation history to OpenAI via Cloudflare Worker
async function sendMessageToOpenAI(userMessage) {
  // Create system prompt for context
  const systemMessage = {
    role: "system",
    content:
      "You are a helpful L'Oréal beauty expert. Provide personalized recommendations about skincare, makeup, haircare, and beauty routines. Be friendly and enthusiastic about our products.",
  };

  // Include user name in context if provided
  let userContext = userMessage;
  if (userName.value.trim()) {
    userContext = `${userName.value}: ${userMessage}`;
  }

  // Build the messages array with system prompt and full conversation history
  const messages = [systemMessage, ...conversationHistory];

  // Prepare the request body
  const requestBody = {
    messages: messages,
  };

  // Send POST request to Cloudflare Worker
  const response = await fetch(CLOUDFLARE_WORKER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  // Check if response is successful
  if (!response.ok) {
    throw new Error(`API returned status ${response.status}`);
  }

  // Parse the JSON response
  const data = await response.json();

  // Extract the assistant's message from the response
  // This matches the structure from OpenAI API: data.choices[0].message.content
  const assistantMessage = data.choices[0].message.content;

  return assistantMessage;
}

// ============================================
// DISPLAY FUNCTIONS
// ============================================

// Display a message bubble in the chat window
function displayMessage(message, role) {
  // Create a container for the message
  const messageContainer = document.createElement("div");
  messageContainer.classList.add("message-container", role);

  // Create the message bubble
  const messageBubble = document.createElement("div");
  messageBubble.classList.add("message-bubble", role);
  messageBubble.textContent = message;

  // Create timestamp
  const timestamp = document.createElement("div");
  timestamp.classList.add("message-time");
  timestamp.textContent = getCurrentTime();

  // Add bubble and timestamp to container
  messageContainer.appendChild(messageBubble);
  messageContainer.appendChild(timestamp);

  // Add message container to chat window
  chatWindow.appendChild(messageContainer);

  // Scroll to bottom to show latest message
  scrollToBottom();
}

// Display the latest user question in the highlighted section
function displayLatestQuestion(question) {
  latestQuestionDisplay.textContent = question;
  latestQuestionSection.style.display = "block";
}

// Get current time in HH:MM format
function getCurrentTime() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

// Show "typing" animation while waiting for response
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

// Remove typing indicator
function removeTypingIndicator() {
  const typingIndicator = document.getElementById("typingIndicator");
  if (typingIndicator) {
    typingIndicator.remove();
  }
}

// Automatically scroll chat window to bottom
function scrollToBottom() {
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

// ============================================
// ACTION BUTTONS
// ============================================

// Reset Chat - Clears messages but keeps history
resetBtn.addEventListener("click", () => {
  chatWindow.innerHTML = "";
  initializeChatbot();
  latestQuestionSection.style.display = "none";
  questionCount = 0;
});

// Clear Chat History - Clears everything including conversation array
clearBtn.addEventListener("click", () => {
  conversationHistory = [];
  chatWindow.innerHTML = "";
  initializeChatbot();
  latestQuestionSection.style.display = "none";
  questionCount = 0;
  alert("Chat history cleared! Starting fresh. 🗑️");
});

// Help Button - Shows instructions
helpBtn.addEventListener("click", () => {
  const helpMessage = `
❓ HELP & TIPS

📝 How to use:
• Enter your name (optional) for personalized responses
• Ask questions about skincare, makeup, or beauty routines
• Your conversation history is saved for context

💡 Example questions:
• What's the best skincare routine for oily skin?
• Recommend a foundation for sensitive skin
• How do I apply makeup for an event?
• What haircare products do you recommend?

🎯 Features:
• Message bubbles show your conversation flow
• Latest question highlight at the top
• Timestamps on every message
• Reset to clear display (keeps history)
• Clear History to start completely fresh

Good luck exploring L'Oréal beauty! ✨
  `;

  displayMessage(helpMessage, "assistant");
});

// ============================================
// OPTIONAL CHALLENGE FEATURE
// ============================================

// Show challenge unlock message after 3 questions
function showChallengeUnlock() {
  const challengeMessage =
    "🎉 Congratulations! You've unlocked a special tip: L'Oréal's #1 bestselling skincare line combines science with luxury. Check out our Revitalift collection! ✨";
  displayMessage(challengeMessage, "assistant");
}

// ============================================
// NOTES FOR STUDENTS
// ============================================

/*
KEY CONCEPTS EXPLAINED:
------------------------

1. CONVERSATION HISTORY ARRAY:
   - We store each message as an object: { role: "user" | "assistant", content: "text" }
   - We send the FULL history to OpenAI each time
   - OpenAI uses this to understand context

2. async/await:
   - We use async/await to wait for the API response
   - This prevents the UI from freezing while waiting

3. DOM MANIPULATION:
   - We create elements with createElement()
   - We add classes with classList.add()
   - We append elements with appendChild()

4. ERROR HANDLING:
   - We use try/catch to handle API errors
   - We show user-friendly error messages

5. CLOUDFLARE WORKER:
   - Our Worker handles API authentication
   - It keeps our API key secret (not exposed to browser)
   - It relays requests to OpenAI

TODO: Replace CLOUDFLARE_WORKER_URL with your actual Worker URL!
*/
