import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { detectAIProviderAndModel, cachedAISettings, isRealApiKey } from "@/lib/ai/config";

function getSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function GET() {
  try {
    const sb = getSupabaseServerClient();
    if (sb) {
      const { data, error } = await sb.from("system_settings").select("key, value");
      if (!error && data && data.length > 0) {
        for (const row of data) {
          if (row.key && row.value) {
            cachedAISettings[row.key] = row.value;
          }
        }
      }
    }
  } catch (err) {
    console.warn("Failed reading system settings from Supabase:", err);
  }

  const rawKey = cachedAISettings.ai_api_key || "";
  const isReal = isRealApiKey(rawKey);
  const maskedKey = isReal
    ? rawKey.length > 8
      ? rawKey.slice(0, 4) + "••••••••" + rawKey.slice(-4)
      : "••••••••"
    : "";

  return NextResponse.json({
    settings: {
      ...cachedAISettings,
      ai_api_key: maskedKey,
      has_key: isReal,
      raw_key_present: isReal,
    },
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const explicitProvider = body.ai_provider;
    const rawApiKey = body.ai_api_key !== undefined ? String(body.ai_api_key).trim() : undefined;

    // Only update key if user actually submitted a real unmasked key or explicitly cleared it ("")
    if (rawApiKey !== undefined) {
      if (rawApiKey === "") {
        cachedAISettings.ai_api_key = "";
      } else if (isRealApiKey(rawApiKey)) {
        cachedAISettings.ai_api_key = rawApiKey;
        const detected = detectAIProviderAndModel(rawApiKey, explicitProvider);
        cachedAISettings.ai_provider = explicitProvider || detected.provider;
        cachedAISettings.ai_model = detected.model;
      }
    }

    if (explicitProvider && explicitProvider !== "auto") {
      cachedAISettings.ai_provider = explicitProvider;
      const detected = detectAIProviderAndModel(cachedAISettings.ai_api_key || "", explicitProvider);
      cachedAISettings.ai_model = detected.model;
    }

    if (body.ai_agent_enabled !== undefined) {
      cachedAISettings.ai_agent_enabled = String(body.ai_agent_enabled);
    }
    if (body.ai_system_prompt) {
      cachedAISettings.ai_system_prompt = body.ai_system_prompt;
    }

    // Persist to Supabase system_settings table
    try {
      const sb = getSupabaseServerClient();
      if (sb) {
        const rowsToUpsert = [
          { key: "ai_api_key", value: cachedAISettings.ai_api_key, is_secret: true },
          { key: "ai_provider", value: cachedAISettings.ai_provider },
          { key: "ai_model", value: cachedAISettings.ai_model },
          { key: "ai_agent_enabled", value: cachedAISettings.ai_agent_enabled },
          { key: "ai_system_prompt", value: cachedAISettings.ai_system_prompt },
        ];
        await sb.from("system_settings").upsert(rowsToUpsert, { onConflict: "key" });
      }
    } catch (dbErr) {
      console.warn("Could not persist to Supabase system_settings, cached in memory:", dbErr);
    }

    return NextResponse.json({
      success: true,
      message: "AI settings saved successfully.",
      provider: cachedAISettings.ai_provider,
      model: cachedAISettings.ai_model,
      has_key: Boolean(cachedAISettings.ai_api_key),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
