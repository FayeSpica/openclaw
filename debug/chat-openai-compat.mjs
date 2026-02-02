/**
 * Call any OpenAI-compatible API via @mariozechner/pi-ai
 *
 * Usage:
 *   # Ollama (local)
 *   node debug/chat-openai-compat.mjs http://127.0.0.1:11434/v1 llama3.3 ollama-local
 *
 *   # Moonshot / Kimi
 *   node debug/chat-openai-compat.mjs https://api.moonshot.ai/v1 kimi-k2.5 "$MOONSHOT_API_KEY"
 *
 *   # Any OpenAI-compatible endpoint
 *   node debug/chat-openai-compat.mjs https://api.example.com/v1 model-name sk-xxx "your prompt"
 */

import { createRequire } from "node:module";
const require = createRequire(import.meta.url);

const { completeSimple, streamSimple } = require("@mariozechner/pi-ai");

const baseUrl = process.argv[2] || "http://127.0.0.1:11434/v1";
const modelId = process.argv[3] || "llama3.3";
const apiKey = process.argv[4] || "ollama-local";
const prompt = process.argv[5] || "Hello! What is 2 + 2?";

// Manually construct a Model object pointing at a custom OpenAI-compatible endpoint
const model = {
  id: modelId,
  name: modelId,
  api: "openai-completions",
  provider: "custom",
  baseUrl,
  reasoning: false,
  input: ["text"],
  cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
  contextWindow: 128000,
  maxTokens: 4096,
};

console.log(`Base URL: ${baseUrl}`);
console.log(`Model:    ${modelId}`);
console.log(`Prompt:   ${prompt}\n`);

// --- One-shot ---
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

// --- Streaming ---
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
