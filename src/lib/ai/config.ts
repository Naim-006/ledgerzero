import { createClient } from "@supabase/supabase-js";

export interface AIProviderInfo {
  provider: "deepseek" | "glm" | "qwen" | "openai" | "gemini" | "groq" | "anthropic";
  model: string;
  name: string;
  origin: "China" | "Global";
}

// Helper to auto-detect provider and model based on API key format and preferences
export function detectAIProviderAndModel(
  apiKey: string,
  preferredProvider?: string
): AIProviderInfo {
  const key = (apiKey || "").trim();

  if (preferredProvider === "deepseek") {
    return { provider: "deepseek", model: "deepseek-chat", name: "DeepSeek (深度求索)", origin: "China" };
  }
  if (preferredProvider === "glm" || preferredProvider === "zhipu") {
    return { provider: "glm", model: "glm-4-flash", name: "GLM (智谱 AI)", origin: "China" };
  }
  if (preferredProvider === "qwen" || preferredProvider === "dashscope") {
    return { provider: "qwen", model: "qwen-turbo", name: "Qwen (通义千问)", origin: "China" };
  }

  if (key.startsWith("sk-ant")) {
    return { provider: "anthropic", model: "claude-3-5-sonnet-20241022", name: "Anthropic Claude", origin: "Global" };
  }
  if (key.startsWith("AIza")) {
    return { provider: "gemini", model: "gemini-1.5-flash", name: "Google Gemini", origin: "Global" };
  }
  if (key.startsWith("gsk_")) {
    return { provider: "groq", model: "llama-3.3-70b-versatile", name: "Groq Fast Llama", origin: "Global" };
  }
  if (key.startsWith("glm") || key.includes(".")) {
    return { provider: "glm", model: "glm-4-flash", name: "GLM (智谱 AI)", origin: "China" };
  }

  // For general sk-... keys, default to DeepSeek (China Flagship) or OpenAI compatible
  return { provider: "deepseek", model: "deepseek-chat", name: "DeepSeek-V3 (深度求索)", origin: "China" };
}

// Global server memory cache for AI settings
export const cachedAISettings: Record<string, string> = {
  ai_provider: "deepseek",
  ai_model: "deepseek-chat",
  ai_api_key: process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY || "",
  ai_agent_enabled: "true",
  ai_system_prompt:
    "You are LEDGER ZERO AI, an autonomous financial co-pilot and business agent for small businesses (中小企业智能金融助手). You analyze cash positions, sales hisab, inventory stock, invoices, and working capital in Chinese Yuan (CNY / ¥).",
};

export async function getEffectiveServerApiKey(explicitKey?: string): Promise<string> {
  if (explicitKey && explicitKey.trim()) {
    return explicitKey.trim();
  }
  if (cachedAISettings.ai_api_key && cachedAISettings.ai_api_key.trim()) {
    return cachedAISettings.ai_api_key.trim();
  }
  if (process.env.DEEPSEEK_API_KEY) {
    return process.env.DEEPSEEK_API_KEY.trim();
  }
  if (process.env.OPENAI_API_KEY) {
    return process.env.OPENAI_API_KEY.trim();
  }

  // Attempt to fetch from Supabase system_settings
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (url && anonKey) {
      const sb = createClient(url, anonKey);
      const { data } = await sb.from("system_settings").select("value").eq("key", "ai_api_key").single();
      if (data?.value && data.value.trim()) {
        cachedAISettings.ai_api_key = data.value.trim();
        const detected = detectAIProviderAndModel(data.value.trim());
        cachedAISettings.ai_provider = detected.provider;
        cachedAISettings.ai_model = detected.model;
        return data.value.trim();
      }
    }
  } catch (err) {
    console.warn("Could not query Supabase for AI key:", err);
  }

  return "";
}
