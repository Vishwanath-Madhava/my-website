/* ============================================================
   AI Chatbot — site interactions + demo agent
   ============================================================ */
(() => {
  "use strict";

  /* ─────────────── nav ─────────────── */
  const nav = document.getElementById("nav");
  const burger = document.getElementById("burger");
  addEventListener("scroll", () => nav.classList.toggle("scrolled", scrollY > 8), { passive: true });
  burger?.addEventListener("click", () => nav.classList.toggle("open"));
  nav.querySelectorAll(".nav-links a").forEach(a =>
    a.addEventListener("click", () => nav.classList.remove("open")));

  /* ─────────────── copy buttons ─────────────── */
  document.querySelectorAll(".copy").forEach(btn => {
    btn.addEventListener("click", async () => {
      const el = document.getElementById(btn.dataset.copy);
      if (!el) return;
      try {
        await navigator.clipboard.writeText(el.innerText);
        const old = btn.textContent;
        btn.textContent = "Copied ✓";
        setTimeout(() => (btn.textContent = old), 1400);
      } catch { btn.textContent = "Ctrl+C"; }
    });
  });

  /* ─────────────── hero chat animation ─────────────── */
  const heroChat = document.getElementById("heroChat");
  const heroScript = [
    { t: "user", text: "Find a 10-minute Python asyncio tutorial on YouTube" },
    { t: "tool", text: "🔧 youtube_search({ query: \"python asyncio tutorial\", max_results: 3 })" },
    { t: "bot",  text: "Here are three solid ones — the first is 11 min and covers async/await, tasks and gather with runnable examples." },
    { t: "user", text: "Email the top pick to sam@example.com" },
    { t: "tool", text: "🔧 email_send({ to: \"sam@example.com\", subject: \"asyncio tutorial\" })" },
    { t: "bot",  text: "Drafted and sent ✅ — want me to post it in Slack #eng too?" },
  ];

  function heroBubble(cls, html) {
    const d = document.createElement("div");
    d.className = "bub " + cls;
    d.innerHTML = html;
    heroChat.appendChild(d);
    return d;
  }

  async function runHero() {
    if (!heroChat) return;
    for (const step of heroScript) {
      if (step.t === "bot") {
        const pending = heroBubble("bot", '<span class="typing"><i></i><i></i><i></i></span>');
        await wait(700);
        pending.textContent = step.text;
      } else {
        heroBubble(step.t, escapeHtml(step.text));
      }
      await wait(step.t === "tool" ? 620 : 900);
      while (heroChat.children.length > 5) heroChat.removeChild(heroChat.firstChild);
    }
    await wait(2600);
    heroChat.innerHTML = "";
    runHero();
  }
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const escapeHtml = s => s.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  /* ─────────────── demo chat ─────────────── */
  const log = document.getElementById("chatLog");
  const form = document.getElementById("chatForm");
  const input = document.getElementById("chatInput");
  const sendBtn = document.getElementById("sendBtn");
  const clearBtn = document.getElementById("clearBtn");
  const modeSwitch = document.getElementById("modeSwitch");
  const backendField = document.getElementById("backendField");
  const backendUrl = document.getElementById("backendUrl");
  const modeBadge = document.getElementById("modeBadge");
  const chatStatus = document.getElementById("chatStatus");
  const sessionIdEl = document.getElementById("sessionId");

  const sessionId = "web-" + Math.random().toString(36).slice(2, 10);
  sessionIdEl.textContent = sessionId;

  let mode = "demo";
  let busy = false;

  function bubble(text, cls) {
    const d = document.createElement("div");
    d.className = "msg " + cls;
    d.textContent = text;
    log.appendChild(d);
    log.scrollTop = log.scrollHeight;
    return d;
  }

  function greet() {
    log.innerHTML = "";
    bubble(
      "Hi! I'm the AI Chatbot demo. I can search YouTube, read and send email, and post to " +
      "Telegram, Slack or Discord.\n\nThis is a simulated agent — no keys needed. Ask me anything, " +
      "or switch to “Live backend” to talk to the real FastAPI server.",
      "bot"
    );
  }

  /* ── simulated agent ───────────────────────────────────── */
  const TOOLS = {
    youtube_search: "youtube_search",
    youtube_video_details: "youtube_video_details",
    email_list: "email_list",
    email_read: "email_read",
    email_send: "email_send",
    telegram_send_message: "telegram_send_message",
    slack_send_message: "slack_send_message",
    discord_send_message: "discord_send_message",
  };

  function plan(message) {
    const m = message.toLowerCase();
    const steps = [];

    if (/\b(what can you|help|capabilit|what do you do|who are you)\b/.test(m)) {
      return {
        steps: [],
        reply:
          "I'm a tool-calling assistant. Right now I can:\n\n" +
          "• ▶  Search YouTube and pull video details\n" +
          "• ✉  List, read and send Gmail\n" +
          "• ➤  Post to Telegram\n" +
          "• #  Post to Slack\n" +
          "• ◈  Post to Discord\n\n" +
          "Only the integrations with credentials are exposed to me — so if a tool is missing, " +
          "it's simply not configured. Ask me to do something and I'll show you the tool calls.",
      };
    }

    if (/\b(youtube|video|tutorial|watch|channel)\b/.test(m)) {
      const q = (message.match(/(?:about|on|for)\s+(.+)$/i)?.[1] || "python asyncio tutorial").replace(/[?.!]$/, "");
      steps.push({ tool: "youtube_search", args: { query: q, max_results: 3 } });
      return {
        steps,
        reply:
          `Found 3 results for “${q}”:\n\n` +
          "1. Python Asyncio Tutorial — 11:04 · 412K views\n" +
          "2. Async Python in 10 Minutes — 09:58 · 188K views\n" +
          "3. asyncio: tasks, gather & timeouts — 14:22 · 96K views\n\n" +
          "Want the full metadata for any of these, or should I email one to someone?",
      };
    }

    if (/\b(email|gmail|inbox|unread|mail)\b/.test(m)) {
      const hasAddress = /[\w.+-]+@[\w-]+\.[\w.]+/.test(message);
      const wantsSend = hasAddress || /\b(send|forward|reply|draft|notify|tell)\b/.test(m);
      if (wantsSend) {
        const to = message.match(/[\w.+-]+@[\w-]+\.[\w.]+/)?.[0] || "sam@example.com";
        steps.push({ tool: "email_send", args: { to, subject: "Quick note", body: "…" } });
        return {
          steps,
          reply:
            `Drafted an email to ${to} and sent it ✅\n\n` +
            "In the real bot I'd confirm the recipient and body with you before sending — " +
            "that's a hard rule in the system prompt.",
        };
      }
      steps.push({ tool: "email_list", args: { query: "is:unread newer_than:7d", max_results: 5 } });
      return {
        steps,
        reply:
          "You have 3 unread messages from the last 7 days:\n\n" +
          "• Priya — “Q4 roadmap draft” (2h ago)\n" +
          "• GitHub — “[repo] CI passed on main” (5h ago)\n" +
          "• Sam — “Re: asyncio tutorial” (yesterday)\n\n" +
          "Want me to read any of them in full?",
      };
    }

    if (/\b(slack)\b/.test(m)) {
      const ch = message.match(/#([\w-]+)/)?.[1] || "eng";
      const text = message.match(/["“](.+?)["”]/)?.[1] || "deploy is green ✅";
      steps.push({ tool: "slack_send_message", args: { channel: "#" + ch, text } });
      return { steps, reply: `Posted to #${ch}:\n\n“${text}”\n\nDelivered via the Slack Web API (chat:write).` };
    }

    if (/\b(telegram|tg)\b/.test(m)) {
      const text = message.match(/["“](.+?)["”]/)?.[1] || "standup moved to 10am";
      steps.push({ tool: "telegram_send_message", args: { chat_id: "default", text } });
      return { steps, reply: `Sent on Telegram:\n\n“${text}”\n\nDelivered via the Bot API.` };
    }

    if (/\b(discord)\b/.test(m)) {
      const text = message.match(/["“](.+?)["”]/)?.[1] || "hello from the chatbot";
      steps.push({ tool: "discord_send_message", args: { channel_id: "default", content: text } });
      return { steps, reply: `Posted to Discord:\n\n“${text}”` };
    }

    if (/\b(hi|hello|hey|yo)\b/.test(m) && m.length < 24) {
      return { steps: [], reply: "Hey! Ask me to find a video, check your inbox, or send a message somewhere." };
    }

    return {
      steps: [],
      reply:
        "I can help with YouTube search, Gmail (list / read / send) and messaging on Telegram, " +
        "Slack and Discord. Try: “Find a Python tutorial on YouTube”, “Any unread email?”, " +
        "or “Send \"deploy is green\" to Slack #eng”.",
    };
  }

  async function runSimulated(message) {
    const { steps, reply } = plan(message);
    for (const s of steps) {
      await wait(420);
      bubble(`🔧 ${s.tool}(${JSON.stringify(s.args)})`, "tool");
    }
    await wait(520);
    bubble(reply, "bot");
  }

  /* ── live backend ──────────────────────────────────────── */
  async function runLive(message) {
    const base = (backendUrl.value || "").trim().replace(/\/$/, "");
    if (!base) throw new Error("Set the API base URL first (e.g. http://127.0.0.1:8000).");
    const r = await fetch(base + "/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message, session_id: sessionId }),
    });
    if (!r.ok) throw new Error(`Backend returned ${r.status} ${r.statusText}`);
    const d = await r.json();
    (d.tool_calls || []).forEach(tc =>
      bubble(`🔧 ${tc.tool}(${typeof tc.arguments === "string" ? tc.arguments : JSON.stringify(tc.arguments)})`, "tool"));
    bubble(d.reply || "(no reply)", "bot");
  }

  /* ── submit ────────────────────────────────────────────── */
  form.addEventListener("submit", async e => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text || busy) return;
    bubble(text, "user");
    input.value = "";
    input.style.height = "auto";
    busy = true;
    sendBtn.disabled = true;
    const pending = bubble("Thinking…", "bot");
    try {
      if (mode === "live") await runLive(text);
      else await runSimulated(text);
      pending.remove();
    } catch (err) {
      pending.remove();
      bubble("Error: " + err.message, "err");
    } finally {
      busy = false;
      sendBtn.disabled = false;
      input.focus();
    }
  });

  input.addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); }
  });
  input.addEventListener("input", () => {
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 140) + "px";
  });

  /* ── suggestions ───────────────────────────────────────── */
  document.querySelectorAll("#suggestions .chip").forEach(chip => {
    chip.addEventListener("click", () => {
      input.value = chip.textContent;
      form.requestSubmit();
    });
  });

  /* ── mode switch ───────────────────────────────────────── */
  modeSwitch.addEventListener("click", e => {
    const btn = e.target.closest(".seg");
    if (!btn) return;
    modeSwitch.querySelectorAll(".seg").forEach(b => b.classList.toggle("active", b === btn));
    mode = btn.dataset.mode;
    const live = mode === "live";
    backendField.hidden = !live;
    modeBadge.textContent = live ? "LIVE" : "DEMO";
    modeBadge.classList.toggle("live", live);
    chatStatus.textContent = live ? "live backend · /api/chat" : "simulated · ready";
    bubble(
      live
        ? "Switched to live mode. Point me at your running server (default http://127.0.0.1:8000) and I'll POST to /api/chat."
        : "Back to the simulated agent — no keys required.",
      "bot"
    );
  });

  /* ── clear ─────────────────────────────────────────────── */
  clearBtn.addEventListener("click", async () => {
    if (mode === "live") {
      const base = (backendUrl.value || "").trim().replace(/\/$/, "");
      if (base) {
        try {
          await fetch(base + "/api/reset", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ session_id: sessionId }),
          });
        } catch { /* ignore */ }
      }
    }
    greet();
  });

  /* ── boot ──────────────────────────────────────────────── */
  greet();
  input.focus();
  runHero();
})();
