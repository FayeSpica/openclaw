/**
 * Minimal LLM chat call using @mariozechner/pi-ai
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-... node debug/chat.mjs
 *   OPENAI_API_KEY=sk-... node debug/chat.mjs openai gpt-4o
 */

import { createRequire } from "node:module";
const require = createRequire(import.meta.url);

// pi-ai is CJS in node_modules, use createRequire to load it
const { completeSimple, streamSimple, getModel } = require("@mariozechner/pi-ai");

const provider = process.argv[2] || "anthropic";
const modelId = process.argv[3] || "claude-sonnet-4-20250514";
const prompt = process.argv[4] || "Hello! What is 2 + 2?";

const API_KEY_ENV = {
  anthropic: "ANTHROPIC_API_KEY",
  openai: "OPENAI_API_KEY",
  google: "GOOGLE_API_KEY",
};

const envName = API_KEY_ENV[provider] || `${provider.toUpperCase()}_API_KEY`;
const apiKey = process.env[envName];
if (!apiKey) {
  console.error(`Missing ${envName}. Set it via environment variable.`);
  process.exit(1);
}

const model = getModel(provider, modelId);
console.log(`Provider: ${provider}  Model: ${model.id}`);
console.log(`Prompt:   ${prompt}\n`);

// --- One-shot (completeSimple) ---
console.log("=== completeSimple ===");
const response = await completeSimple(
  model,
  {
    messages: [{ role: "user", content: prompt, timestamp: Date.now() }],
  },
  { apiKey, maxTokens: 256 },
);

const text = response.content
  .filter((b) => b.type === "text")
  .map((b) => b.text)
  .join("");
console.log("Response:", text);
console.log("Usage:   ", response.usage);

// --- Streaming (streamSimple) ---
console.log("\n=== streamSimple ===");
const stream = streamSimple(
  model,
  {
    messages: [{ role: "user", content: prompt, timestamp: Date.now() }],
  },
  { apiKey, maxTokens: 256 },
);

for await (const event of stream) {
  if (event.type === "text") {
    process.stdout.write(event.delta);
  }
  if (event.type === "done") {
    console.log("\nUsage:", event.message?.usage);
  }
  if (event.type === "error") {
    console.error("Error:", event.error);
  }
}
