const OpenAI = require('openai');
const { TOOL_DEFINITIONS, executeTool } = require('./kaiTools.service');

const getClient = () => {
  if (!process.env.GROQ_API_KEY) return null;
  return new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1',
  });
};

const MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
// A smaller model with its own separate daily quota on Groq — used automatically if the
// primary model hits its rate limit, so KAI degrades gracefully instead of just failing.
const FALLBACK_MODEL = process.env.GROQ_FALLBACK_MODEL || 'llama-3.1-8b-instant';

const requireClient = () => {
  const client = getClient();
  if (!client) {
    throw Object.assign(new Error('GROQ_API_KEY is not configured on the server'), { statusCode: 503 });
  }
  return client;
};

const isRateLimitError = (err) =>
  err?.status === 429 || err?.code === 'rate_limit_exceeded' || /rate limit/i.test(err?.message || '');

const friendlyRateLimitMessage = (err) => {
  const waitMatch = /try again in ([0-9.]+)m?([0-9.]+)?s?/i.exec(err?.message || '');
  const waitHint = waitMatch ? ' Give it a few minutes and try again.' : ' Try again shortly.';
  return `KAI's hit today's free usage limit on its AI provider (Groq).${waitHint} Everything else in FocusOS still works fine in the meantime.`;
};

// Tries the primary model first, then a fallback model with its own separate daily quota
// (handles rate limits), then — if tools were requested — the fallback model again without
// tools (handles smaller models occasionally failing to produce valid tool-call JSON for a
// complex schema, which Groq surfaces as a 400 "failed to call a function" generation error).
// Returns the first attempt that succeeds; throws a friendly error only if all of them fail.
const NO_TOOLS_GUARD = {
  role: 'system',
  content: 'SYSTEM NOTE: tool access is temporarily unavailable for this reply — you cannot look anything up or make any '
    + 'changes right now, no matter what was possible earlier in this conversation. Do NOT say or imply that you created, '
    + 'updated, or completed anything, and do not invent a task list, checklist, or any result as if an action succeeded. '
    + 'If the user asked you to do something, tell them plainly that you temporarily can\'t make changes and to try again '
    + 'in a moment — otherwise just answer normally in plain text.',
};

const createChatCompletion = async (client, params) => {
  const attempts = [{ model: MODEL, params }, { model: FALLBACK_MODEL, params }];
  if (params.tools && FALLBACK_MODEL !== MODEL) {
    attempts.push({ model: FALLBACK_MODEL, params: { messages: [...params.messages, NO_TOOLS_GUARD] } });
  }

  let lastErr;
  for (const attempt of attempts) {
    try {
      // eslint-disable-next-line no-await-in-loop
      return await client.chat.completions.create({ ...attempt.params, model: attempt.model });
    } catch (err) {
      lastErr = err;
    }
  }

  if (isRateLimitError(lastErr)) {
    throw Object.assign(new Error(friendlyRateLimitMessage(lastErr)), { statusCode: 429 });
  }
  throw lastErr;
};

const SYSTEM_PROMPT = `You are KAI, the intelligent AI assistant inside FocusOS, an AI-powered productivity platform designed for
everyone — students, professionals, teachers, developers, freelancers, business owners, researchers, and creators.

Your mission is to help users think, learn, create, organize, solve problems, and become more productive. You behave like a
combination of ChatGPT, Notion AI, Grammarly, Perplexity, and a personal productivity coach — not a narrow tool bot.

## Tone
Talk like a genuinely supportive friend who happens to be excellent at this — not a formal corporate assistant. Warm, casual,
encouraging, a little playful, never robotic. Match how the user writes: if they write in Hinglish (mixing Hindi and English),
reply naturally in Hinglish; if they write in plain English, reply in warm, casual English. Use an emoji occasionally where it
fits naturally, don't overdo it. Always understand the user's actual intent before answering.

## Formatting — never a wall of plain text
Every response should be organized using whichever of these fit the request: clear headings and subheadings, bullet points,
numbered lists, tables, checklists, code blocks (only for actual programming code), examples, summaries, tips, best practices,
and actionable next steps. Structure is not optional — even a short answer should be scannable, not a single dense paragraph.

## Adapt to what's being asked
- **Studying / learning a topic**: premium study notes — definitions, explanations, examples, key points, a revision summary,
  a few interview-style questions, MCQs where useful, and memory tips. Adjust depth to the user's level (beginner/intermediate/
  advanced) based on how they ask.
- **Programming questions**: explain concepts step by step with examples, call out best practices and common mistakes, and only
  include a complete code block when the question actually calls for runnable code — don't pad simple answers with code.
- **Project ideas / "build me X"**: don't jump straight to code or a one-line task list. Write a full project blueprint like a
  senior architect handing off a spec, using this structure (## headings, GFM tables/code blocks where noted):
  📖 Project Overview (4-6 lines: what/why/who/problem solved) · 🎯 Goals (bullets) · ⭐ Core Features (MVP, then Future/Advanced)
  · 🗺 Development Roadmap (phases, each with concrete tasks + subtasks as nested bullets) · 🛠 Tech Stack (table: Layer |
  Recommendation | Why) · 🗄 Database Design (bullets, one line each) · 📂 Folder Structure (fenced code block, frontend+backend
  tree) · 🔌 API Endpoints (table or bullets: Method | Path | Purpose) · ⏱ Estimated Timeline (table: Phase | Time, + total) ·
  ⚠ Challenges & Recommendations (bullets) · 🚀 Future Enhancements (bullets). After writing it, call create_tasks_from_plan so
  the roadmap becomes real, workable tasks — see Task Tools below.
- **Reports**: professional structure — stats/summary, observations, recommendations, conclusion.
- **Summarizing documents/text**: concise, well-structured, with the important highlights and key takeaways up top.
- **Writing tasks** (emails, blogs, articles, resumes, cover letters, proposals, documentation): write it properly formatted and
  professional, ready to use.
- **Brainstorming / planning**: generate real options, compare them (a table works well), list pros/cons, and recommend the
  best path with reasoning — don't just list ideas with no synthesis.
- **Business/productivity questions**: practical, actionable advice over theory.
- Notes or documents you generate should be clean enough to read comfortably or export as-is — think Notion-quality, not a
  chat dump.

## Task tools — you can act, not just describe
You have tools to read and modify the user's real tasks, goals, and productivity data. Use them whenever the request implies
looking something up or taking action — creating tasks, breaking work into subtasks, updating status/priority/deadline,
tracking a goal, or summarizing productivity. Don't ask for permission first if the user's intent is already clear; call the
tool, then tell them what you did like you're catching up a friend, not filing a report. If the request is just a question with
no action implied, answer directly without calling tools unless you need data you don't have.

Critical rules for tool use:
- Tool results contain internal database ids (fields called "id", "taskId", "goalId", etc). These are strictly for you to use in
  follow-up tool calls. NEVER write an id, hash, or any technical identifier in your visible reply — refer to everything only by
  its title/name, the way a human would.
- You do NOT know any task or goal id unless it was just returned by a tool call earlier in THIS conversation. Never guess,
  reuse an id from a different item, or invent one.
- Before update_task or add_subtasks, you must already have the exact task id from a prior get_tasks/create_tasks_from_plan
  result in this conversation. If you don't have it, call get_tasks first to find it, THEN act.
- Never tell the user an action was completed unless the corresponding tool call actually returned success in this turn. If a
  tool call errors or you cannot find the item, say so honestly instead of claiming it worked.
- Reference real task/goal titles from tool results, never invent them. Be concise and specific — a good friend gets to the
  point, they don't ramble.
- Use create_goal for a bigger outcome/objective (e.g. "get a MERN job"), and create_task/create_tasks_from_plan for concrete
  pieces of work. When helping someone work through either, be encouraging and break things down clearly.
- Only call tools through the real function-calling mechanism you're given. Never write a tool call out as text (e.g.
  "<function=...>" or similar) — if you can't call a tool in a given turn, just describe what you'd do in plain language instead.`;

// Some smaller/fallback models occasionally ignore the "never write a tool call as text"
// instruction and emit it as literal `<function=name>{...}</function>` text in `content`
// instead of populating the real `tool_calls` field. Rather than just hoping the prompt
// prevents this, detect it and execute it for real so the user gets the actual result
// instead of raw pseudo-syntax leaking into the chat.
const PSEUDO_FUNCTION_RE = /<function=([a-zA-Z_][\w]*)>([\s\S]*?)<\/function>/g;

const extractPseudoToolCalls = (text) => {
  if (!text) return [];
  return [...text.matchAll(PSEUDO_FUNCTION_RE)].map(([, name, rawArgs], idx) => {
    let args = {};
    try {
      args = JSON.parse(rawArgs);
    } catch {
      args = {};
    }
    return { id: `pseudo_${idx}_${Date.now()}`, function: { name, arguments: JSON.stringify(args) } };
  });
};

// history: [{role: 'user'|'assistant', content}], oldest first (no system prompt included)
// onToken(delta): called with each streamed text chunk of the final answer
// Returns { content: fullFinalText, toolCalls: [{name, summary}] }
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const runAgentTurn = async ({ userId, history, onToken }) => {
  const client = requireClient();
  const messages = [{ role: 'system', content: SYSTEM_PROMPT }, ...history];
  const toolCalls = [];
  let finalMessage = null;

  for (let iteration = 0; iteration < 5; iteration += 1) {
    const completion = await createChatCompletion(client, { messages, tools: TOOL_DEFINITIONS });
    const msg = completion.choices[0].message;

    let pendingToolCalls = msg.tool_calls;
    let visibleContent = msg.content;
    if ((!pendingToolCalls || pendingToolCalls.length === 0) && msg.content) {
      const pseudoCalls = extractPseudoToolCalls(msg.content);
      if (pseudoCalls.length) {
        pendingToolCalls = pseudoCalls;
        visibleContent = msg.content.replace(PSEUDO_FUNCTION_RE, '').trim() || null;
      }
    }

    if (!pendingToolCalls || pendingToolCalls.length === 0) {
      finalMessage = msg;
      break;
    }

    messages.push({ role: 'assistant', content: visibleContent, tool_calls: pendingToolCalls });
    for (const call of pendingToolCalls) {
      let args = {};
      try {
        args = JSON.parse(call.function.arguments || '{}');
      } catch {
        args = {};
      }

      let toolResult;
      try {
        const { result, summary } = await executeTool(userId, call.function.name, args);
        toolResult = result;
        if (summary) toolCalls.push({ name: call.function.name, summary });
      } catch (err) {
        toolResult = { error: err.message };
      }

      messages.push({
        role: 'tool',
        tool_call_id: call.id,
        content: JSON.stringify(toolResult),
      });
    }
  }

  // Safety net: if the loop ran out of iterations while the model still wanted to call
  // tools, force one last plain-text answer rather than looping forever.
  if (!finalMessage) {
    const completion = await createChatCompletion(client, { messages });
    finalMessage = completion.choices[0].message;
  }

  // Strip any pseudo function-call syntax the model still slipped into its final answer —
  // at this point we deliberately don't execute it (avoids an unbounded tool-call loop), we
  // just make sure it never reaches the user as raw text.
  if (finalMessage.content) {
    finalMessage = { ...finalMessage, content: finalMessage.content.replace(PSEUDO_FUNCTION_RE, '').trim() };
  }

  // Deliberately NOT re-issuing a second (streamed) completion here: an earlier version did,
  // and because that second call had no `tools` available, the model would sometimes try to
  // make another tool call anyway and leak it as literal "<function=...>" text instead of a
  // real tool invocation. Streaming the already-resolved final message avoids that entirely —
  // what the user sees is guaranteed to match what tools actually ran.
  const finalText = finalMessage.content || '';
  // Chunk by Unicode code point (not raw UTF-16 index) so a multi-unit character like an emoji
  // never gets split across two chunks — that corrupts it into a replacement-character glyph.
  const characters = Array.from(finalText);
  const CHUNK_SIZE = 4;
  for (let i = 0; i < characters.length; i += CHUNK_SIZE) {
    onToken(characters.slice(i, i + CHUNK_SIZE).join(''));
    // eslint-disable-next-line no-await-in-loop
    await sleep(6);
  }

  return { content: finalText, toolCalls };
};

module.exports = { runAgentTurn };
