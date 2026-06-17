import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PARTS_DB = JSON.parse(readFileSync(join(__dirname, 'data', 'parts.json'), 'utf8'));

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running.' });
});

/* ── Shared helpers ─────────────────────────────────────────── */

function checkApiKey(res) {
  if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'your_key_here') {
    res.status(500).json({ error: 'Add your ANTHROPIC_API_KEY to server/.env' });
    return false;
  }
  return true;
}

function buildContext(build) {
  if (!build || Object.keys(build).length === 0) return '';
  const lines = Object.entries(build).map(([k, v]) => `  - ${k}: ${v}`).join('\n');
  return `\n\nUser's current build context:\n${lines}`;
}

function parseClaudeJson(rawText) {
  // Try direct parse first
  try {
    const cleaned = rawText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    return JSON.parse(cleaned);
  } catch {}
  // Extract the first {...} block from the text
  try {
    const start = rawText.indexOf('{');
    const end = rawText.lastIndexOf('}');
    if (start !== -1 && end !== -1) {
      const parsed = JSON.parse(rawText.slice(start, end + 1));
      // Strip any embedded JSON code blocks Claude snuck into the message field
      if (parsed.message) {
        parsed.message = parsed.message.replace(/```json[\s\S]*?```/g, '').replace(/```[\s\S]*?```/g, '').trim();
      }
      return parsed;
    }
  } catch {}
  return null;
}

/* ── POST /api/chat ─────────────────────────────────────────── */

// Catalog is derived from PARTS_DB itself — never hand-typed — so the
// prompt's ID list can never drift out of sync with the real data file.
// It carries id/name/category only: no price, no specs, ever.
const CATALOG_BY_CATEGORY = Object.entries(PARTS_DB).reduce((acc, [id, p]) => {
  (acc[p.category] ??= []).push(`${id} (${p.name})`);
  return acc;
}, {});
const CATALOG_TEXT = Object.entries(CATALOG_BY_CATEGORY)
  .map(([category, ids]) => `  ${category.padEnd(11)} → ${ids.join(' | ')}`)
  .join('\n');

const CHAT_SYSTEM = `You are AI Builder, a PC building expert. Give specific, opinionated advice.

CRITICAL: Your ENTIRE response must be ONLY this JSON object — no text before it, no text after it, no markdown, no code fences:
{
  "message": "2-3 short sentences max. Direct and specific. Never mention prices or dollar amounts.",
  "recommendations": []
}

The "recommendations" array is OPTIONAL. Include it ONLY when recommending specific parts. Show 2-3 options when comparing. Each entry must be EXACTLY:
{
  "id": "part-id from the catalog below",
  "category": "CPU | GPU | RAM | Storage | Motherboard | PSU | Case | Cooler",
  "badge": "3-5 word label e.g. Best for Gaming",
  "note": "Optional one-sentence comparison — no dollar amounts"
}

Do NOT include name, price, specs, pros, or cons in your output — those are looked up from our parts database automatically. You do not know the prices or specs of these parts — only their names and categories.

FULL BUILD RULE: When a user asks for a complete PC build, ALWAYS return exactly 8 recommendations — one per category (CPU, GPU, Motherboard, RAM, Storage, Case, Cooler, PSU). Never describe any component only in prose — every component must be a card. Never return a partial build.

Use ONLY these part IDs (id shown, name in parentheses for context):
${CATALOG_TEXT}

EXPERTISE RULES:
- Give specific part names — never vague advice like "get a good GPU"
- Always explain WHY one option is better for the user's stated goal
- Compatibility notes: AM5 requires DDR5; LGA1700 is for Intel 12th–14th Gen; RTX 4090 needs 850W+ PSU
- For gaming builds: GPU slot has the most impact — prioritise it
- Warn if the user's goal exceeds what their budget can realistically achieve
- Once a user has a complete 8-part build, suggest they hit "Generate My Tutorial" for assembly instructions`;

// Enrichment is the ONLY path price/specs reach the client. If the model
// returns an ID we don't recognize, the recommendation is dropped entirely
// — never passed through with whatever fields the model attached to it.
// There is no fallback to LLM-supplied price/specs, by construction.
function enrichRecommendations(recommendations) {
  const enriched = [];
  for (const rec of recommendations) {
    const db = PARTS_DB[rec.id];
    if (!db) {
      console.error(`[enrichRecommendations] Unknown part id "${rec.id}" returned by the model — dropping it from the response.`);
      continue;
    }
    enriched.push({
      id:       rec.id,
      name:     db.name,
      category: db.category,
      price:    db.price,
      badge:    typeof rec.badge === 'string' ? rec.badge : (db.badge ?? ''),
      emoji:    db.emoji     ?? '💻',
      gradient: db.gradient  ?? 'linear-gradient(135deg, #1a1a2e, #0d0d1e)',
      specs:    db.specs     ?? [],
      pros:     db.pros      ?? [],
      cons:     db.cons      ?? [],
      note:     typeof rec.note === 'string' ? rec.note : null,
    });
  }
  return enriched;
}

app.post('/api/chat', async (req, res) => {
  if (!checkApiKey(res)) return;

  const { messages, build } = req.body;
  const client = new Anthropic();
  const system = CHAT_SYSTEM + buildContext(build);

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system,
      messages,
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    const rawText = textBlock?.text ?? '';
    const parsed = parseClaudeJson(rawText);

    if (parsed) {
      res.json({
        reply: parsed.message ?? rawText,
        recommendations: enrichRecommendations(parsed.recommendations ?? []),
      });
    } else {
      res.json({ reply: rawText || "I couldn't generate a response.", recommendations: [] });
    }
  } catch (err) {
    console.error('Claude chat error:', err.message);
    res.status(500).json({ error: 'Failed to reach Claude. Check your API key.' });
  }
});

/* ── POST /api/tutorial ─────────────────────────────────────── */

const TUTORIAL_SYSTEM = `You are an expert PC assembly instructor. Generate a complete, beginner-friendly, personalised step-by-step assembly tutorial.

Return ONLY raw JSON (no markdown, no code fences):
{
  "title": "Your Custom PC Build Guide",
  "intro": "1-2 sentences personalised to the user's goals and build",
  "tools": ["Phillips #2 screwdriver", "Anti-static wrist strap", ...],
  "sections": [
    {
      "emoji": "🔧",
      "title": "Section name",
      "steps": [
        {
          "title": "Step title",
          "detail": "2-4 sentences of clear, specific instructions. Use real part names when possible.",
          "warning": "Important warning text, or null if none",
          "tip": "Pro tip text, or null if none"
        }
      ]
    }
  ]
}

Generate exactly these 9 sections in order:
1. 🛡️ Before You Begin — workspace setup, anti-static precautions, unboxing checklist
2. 🧠 CPU Installation — identify socket orientation, ZIF lever, thermal paste application
3. 🧩 RAM Installation — which slots to use, DDR5 direction, click confirmation
4. 💾 M.2 SSD Installation — locate slot, angle insertion, screw retention
5. 🏗️ Preparing the Case — remove side panels, I/O shield, standoff check
6. 📋 Motherboard Installation — align to standoffs, I/O shield, screw pattern
7. ⚡ Power Supply Installation — PSU orientation, main connectors (24-pin ATX, 8-pin CPU EPS)
8. 🎮 GPU Installation — PCIe slot, retention clip, power connectors
9. 🚀 First Boot & BIOS Setup — power-on checklist, POST, enabling XMP/EXPO, OS install steps

Be specific, clear, and encouraging. Personalise based on the user's build context if provided.`;

app.post('/api/tutorial', async (req, res) => {
  if (!checkApiKey(res)) return;

  const { build } = req.body;
  const client = new Anthropic();
  const system = TUTORIAL_SYSTEM + buildContext(build);

  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 8000,
      thinking: { type: 'adaptive' },
      system,
      messages: [{ role: 'user', content: 'Generate my personalized PC build tutorial.' }],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    const rawText = textBlock?.text ?? '';
    const parsed = parseClaudeJson(rawText);

    if (parsed) {
      res.json(parsed);
    } else {
      res.status(500).json({ error: 'Failed to parse tutorial response. Please try again.' });
    }
  } catch (err) {
    console.error('Claude tutorial error:', err.message);
    res.status(500).json({ error: 'Failed to generate tutorial. Check your API key.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
