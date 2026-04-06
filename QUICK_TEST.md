# 🔧 QUICK WORKER DIAGNOSTIC

## Method 1: Use the Test Page (Easiest)

1. Open this file in your browser: `WORKER_TEST.html`
   - You can open it by right-clicking the file in VS Code → "Open with Live Server"
   - Or go to: `http://localhost:8000/WORKER_TEST.html`

2. Click the buttons in order:
   - **Test 1:** Is Worker Accessible?
   - **Test 2:** Send Hello Message
   - **Test 3:** Full Diagnostic

3. Share the results with me

---

## Method 2: Manual Console Test (If test page doesn't work)

1. Open your chatbot in browser
2. Press **F12** to open Developer Tools
3. Click **"Console"** tab
4. Paste this exactly:

```javascript
fetch("https://loreal-chatbot-worker.jtut.workers.dev", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    messages: [
      { role: "system", content: "You are helpful" },
      { role: "user", content: "hello" },
    ],
  }),
})
  .then((r) => r.json())
  .then((d) => console.log("RESULT:", d))
  .catch((e) => console.log("ERROR:", e.message));
```

5. Press **Enter**
6. Look at what appears in console:

**✅ If you see:**

```
RESULT: { reply: "...", success: true }
```

→ Worker is working! Problem is elsewhere.

**❌ If you see:**

```
ERROR: Failed to fetch
```

→ Worker is NOT accessible. Needs redeploy.

**❌ If you see:**

```
RESULT: { error: "API key not configured..." }
```

→ API key not set in Cloudflare. Add it now.

---

## Method 3: Direct URL Test

1. Open this URL in a NEW browser tab:

```
https://loreal-chatbot-worker.jtut.workers.dev
```

**✅ Should see:**

```json
{ "error": "Only POST requests accepted" }
```

**❌ If you see:**

- 404 error → Worker not deployed
- Blank page → Worker issue
- Timeout → Connection problem

---

## 🎯 What to Do Right Now

### **STEP 1: Run One Test** (5 minutes)

- Use WORKER_TEST.html in browser
- OR run the console paste from Method 2
- Tell me what you see

### **STEP 2: Based on Results:**

**If API key error:**

1. Go to: https://dash.cloudflare.com/workers
2. Click your Worker
3. Settings → Variables
4. Add `OPENAI_API_KEY` = (your key)
5. Save

**If Worker not accessible:**

1. Go to: https://dash.cloudflare.com/workers
2. Click your Worker
3. Copy ALL code from `cloudflare-worker.js` file
4. Delete existing code in editor
5. Paste new code
6. Click "Save and Deploy"
7. Wait 30 seconds

**If Worker is working:**

1. Your chatbot should work now!
2. Try sending a message again
3. Check console for logs

---

## 📝 Tell Me:

After running tests, tell me:

1. **What does WORKER_TEST.html show?** (or console test results)
2. **Can you access the worker URL directly?** (yes/no)
3. **What error do you see?** (Exact error message)

With this info, I can fix it immediately! 🚀
