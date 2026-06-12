import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';

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
  try {
    // Strip markdown code fences if present
    const cleaned = rawText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

/* ── POST /api/chat ─────────────────────────────────────────── */

const CHAT_SYSTEM = `You are AI Builder, an expert PC building consultant with 15+ years of hands-on experience building, benchmarking, and recommending PCs. You give specific, opinionated advice backed by clear reasoning.

ALWAYS respond with raw JSON in this exact shape (no markdown code blocks, no extra text):
{
  "message": "Your conversational response. Be direct, specific, and helpful. Max 3 short paragraphs.",
  "recommendations": []
}

The "recommendations" array is OPTIONAL. Include it ONLY when recommending specific parts. Show 2-3 options when comparing. Each entry:
{
  "id": "kebab-case-id",
  "name": "Full Part Name",
  "category": "CPU | GPU | RAM | Storage | Motherboard | PSU | Case | Cooler",
  "price": "$XXX",
  "badge": "3-5 word label e.g. Best for Gaming",
  "specs": ["spec 1", "spec 2", "spec 3", "spec 4"],
  "pros": ["pro 1", "pro 2", "pro 3"],
  "cons": ["con 1", "con 2"],
  "note": "Optional tradeoff note e.g. vs RTX 4070: 40% more performance for $200 extra"
}

Preferred IDs to use (use these when the part matches):
CPUs    → ryzen-5-7600x | ryzen-7-7800x3d | i5-14600k | i9-14900k
GPUs    → rtx-4060 | rtx-4070 | rtx-4070-ti-super | rtx-4090 | rx-7800-xt
RAM     → ddr5-32gb-corsair | ddr5-32gb-gskill
Storage → samsung-990-pro-1tb | wd-sn850x-1tb
Boards  → msi-b650-tomahawk | asus-b650-strix | asus-z790-hero
PSUs    → corsair-rm850x | seasonic-focus-850
Cases   → fractal-north | lian-li-o11 | nzxt-h510
Coolers → noctua-nh-d15 | corsair-h150i-elite

EXPERTISE RULES:
- Give specific part names and real prices — never vague advice like "get a good GPU"
- Always explain WHY one option is better for the user's stated goal
- Mention compatibility gotchas: AM5 requires DDR5, LGA1700 for Intel 12-14th gen, check PSU wattage for RTX 4090
- For budget advice: budget ~40% on GPU for gaming, ~25% on CPU, ~10% on RAM
- Warn if a user's budget is too low for their stated goal
- If a user has described their full build goal and budget, mention they can hit "Generate My Tutorial" to get a step-by-step assembly guide`;

app.post('/api/chat', async (req, res) => {
  if (!checkApiKey(res)) return;

  const { messages, build } = req.body;
  const client = new Anthropic();
  const system = CHAT_SYSTEM + buildContext(build);

  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 2048,
      thinking: { type: 'adaptive' },
      system,
      messages,
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    const rawText = textBlock?.text ?? '';
    const parsed = parseClaudeJson(rawText);

    if (parsed) {
      res.json({
        reply: parsed.message ?? rawText,
        recommendations: parsed.recommendations ?? [],
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
