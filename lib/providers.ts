// Shared (client + server) provider catalogue. Contains NO secrets — only public endpoints and model names.
// Server code treats this file as the ALLOWLIST: users can never supply a URL, only choose a provider id.

export type ProviderKind = "openai" | "anthropic" | "gemini";

export type ProviderId =
  | "nvidia"
  | "openai"
  | "anthropic"
  | "gemini"
  | "openrouter"
  | "groq"
  | "mistral"
  | "deepseek"
  | "xai"
  | "together"
  | "cerebras";

export interface ProviderInfo {
  id: ProviderId;
  name: string;
  kind: ProviderKind;
  /** Fixed upstream endpoint (Gemini: base, model is appended server-side). */
  url: string;
  /** NVIDIA uses the server's own key; every other provider needs the user's key. */
  needsKey: boolean;
  /** Suggested models. Providers other than NVIDIA also accept any custom model id. */
  models: { id: string; label: string }[];
  keyUrl?: string;
}

export const PROVIDERS: ProviderInfo[] = [
  {
    id: "nvidia",
    name: "NVIDIA NIM",
    kind: "openai",
    url: "https://integrate.api.nvidia.com/v1/chat/completions",
    needsKey: false,
    models: [
      { id: "openai/gpt-oss-20b", label: "GPT-OSS 20B (balanced)" },
      { id: "nvidia/nemotron-3-super-120b-a12b", label: "Nemotron 3 Super 120B (fast)" },
    ],
  },
  {
    id: "openai",
    name: "OpenAI",
    kind: "openai",
    url: "https://api.openai.com/v1/chat/completions",
    needsKey: true,
    keyUrl: "https://platform.openai.com/api-keys",
    models: [
      { id: "gpt-5-mini", label: "GPT-5 mini" },
      { id: "gpt-5", label: "GPT-5" },
      { id: "gpt-4.1-mini", label: "GPT-4.1 mini" },
      { id: "gpt-4o-mini", label: "GPT-4o mini" },
    ],
  },
  {
    id: "anthropic",
    name: "Anthropic (Claude)",
    kind: "anthropic",
    url: "https://api.anthropic.com/v1/messages",
    needsKey: true,
    keyUrl: "https://console.anthropic.com/settings/keys",
    models: [
      { id: "claude-sonnet-4-5", label: "Claude Sonnet 4.5" },
      { id: "claude-haiku-4-5", label: "Claude Haiku 4.5" },
      { id: "claude-opus-4-1", label: "Claude Opus 4.1" },
    ],
  },
  {
    id: "gemini",
    name: "Google Gemini",
    kind: "gemini",
    url: "https://generativelanguage.googleapis.com/v1beta/models",
    needsKey: true,
    keyUrl: "https://aistudio.google.com/apikey",
    models: [
      { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
      { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
      { id: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash-Lite" },
    ],
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    kind: "openai",
    url: "https://openrouter.ai/api/v1/chat/completions",
    needsKey: true,
    keyUrl: "https://openrouter.ai/keys",
    models: [
      { id: "openai/gpt-5-mini", label: "OpenAI GPT-5 mini" },
      { id: "anthropic/claude-sonnet-4.5", label: "Claude Sonnet 4.5" },
      { id: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash" },
      { id: "deepseek/deepseek-chat", label: "DeepSeek Chat" },
      { id: "meta-llama/llama-3.3-70b-instruct", label: "Llama 3.3 70B" },
      { id: "openai/gpt-oss-20b:free", label: "GPT-OSS 20B (free tier)" },
    ],
  },
  {
    id: "groq",
    name: "Groq",
    kind: "openai",
    url: "https://api.groq.com/openai/v1/chat/completions",
    needsKey: true,
    keyUrl: "https://console.groq.com/keys",
    models: [
      { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B" },
      { id: "openai/gpt-oss-120b", label: "GPT-OSS 120B" },
      { id: "openai/gpt-oss-20b", label: "GPT-OSS 20B" },
    ],
  },
  {
    id: "mistral",
    name: "Mistral AI",
    kind: "openai",
    url: "https://api.mistral.ai/v1/chat/completions",
    needsKey: true,
    keyUrl: "https://console.mistral.ai/api-keys",
    models: [
      { id: "mistral-large-latest", label: "Mistral Large" },
      { id: "mistral-small-latest", label: "Mistral Small" },
    ],
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    kind: "openai",
    url: "https://api.deepseek.com/chat/completions",
    needsKey: true,
    keyUrl: "https://platform.deepseek.com/api_keys",
    models: [
      { id: "deepseek-chat", label: "DeepSeek Chat (V3)" },
      { id: "deepseek-reasoner", label: "DeepSeek Reasoner (R1)" },
    ],
  },
  {
    id: "xai",
    name: "xAI (Grok)",
    kind: "openai",
    url: "https://api.x.ai/v1/chat/completions",
    needsKey: true,
    keyUrl: "https://console.x.ai",
    models: [
      { id: "grok-4", label: "Grok 4" },
      { id: "grok-3-mini", label: "Grok 3 mini" },
    ],
  },
  {
    id: "together",
    name: "Together AI",
    kind: "openai",
    url: "https://api.together.xyz/v1/chat/completions",
    needsKey: true,
    keyUrl: "https://api.together.ai/settings/api-keys",
    models: [
      { id: "meta-llama/Llama-3.3-70B-Instruct-Turbo", label: "Llama 3.3 70B Turbo" },
      { id: "deepseek-ai/DeepSeek-V3", label: "DeepSeek V3" },
      { id: "Qwen/Qwen2.5-72B-Instruct-Turbo", label: "Qwen 2.5 72B Turbo" },
    ],
  },
  {
    id: "cerebras",
    name: "Cerebras",
    kind: "openai",
    url: "https://api.cerebras.ai/v1/chat/completions",
    needsKey: true,
    keyUrl: "https://cloud.cerebras.ai",
    models: [
      { id: "llama-3.3-70b", label: "Llama 3.3 70B" },
      { id: "gpt-oss-120b", label: "GPT-OSS 120B" },
      { id: "qwen-3-32b", label: "Qwen 3 32B" },
    ],
  },
];

export const DEFAULT_PROVIDER: ProviderId = "nvidia";

export function getProvider(id: unknown): ProviderInfo | null {
  return PROVIDERS.find((p) => p.id === id) ?? null;
}

/** Model ids: letters, digits and . _ : / @ + - only (also blocks path/URL injection into Gemini's URL). */
const MODEL_RE = /^[A-Za-z0-9][A-Za-z0-9._:/@+-]{0,119}$/;
export const isValidModelId = (m: unknown): m is string => typeof m === "string" && MODEL_RE.test(m) && !m.includes("..");

/** API keys: visible ASCII, no whitespace (also guarantees the value is safe inside an HTTP header). */
const KEY_RE = /^[\x21-\x7E]{8,400}$/;
export const isValidApiKey = (k: unknown): k is string => typeof k === "string" && KEY_RE.test(k);

export const KEY_HEADER = "x-user-api-key";
