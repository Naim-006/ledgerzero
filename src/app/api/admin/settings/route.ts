import { NextResponse } from "next/server";

// Server-side in-memory store fallback for system settings
let serverSettings: Record<string, string> = {
  ai_provider: "openai",
  ai_model: "gpt-4o-mini",
  ai_api_key: process.env.OPENAI_API_KEY || "",
  ai_agent_enabled: "true",
  ai_system_prompt:
    "You are LEDGER ZERO AI, an autonomous financial co-pilot for small businesses. You analyze cash positions, overdue invoices, and impending vendor payments. You always provide mathematically sound, cautious, and practical recommendations.",
};

export async function GET() {
  // Mask API key for security
  const maskedKey = serverSettings.ai_api_key
    ? serverSettings.ai_api_key.slice(0, 4) + "••••••••" + serverSettings.ai_api_key.slice(-4)
    : "";

  return NextResponse.json({
    settings: {
      ...serverSettings,
      ai_api_key: maskedKey,
      has_key: Boolean(serverSettings.ai_api_key),
    },
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (body.ai_provider) serverSettings.ai_provider = body.ai_provider;
    if (body.ai_model) serverSettings.ai_model = body.ai_model;
    if (body.ai_api_key !== undefined && body.ai_api_key !== "") {
      serverSettings.ai_api_key = body.ai_api_key.trim();
    }
    if (body.ai_agent_enabled !== undefined) {
      serverSettings.ai_agent_enabled = String(body.ai_agent_enabled);
    }
    if (body.ai_system_prompt) {
      serverSettings.ai_system_prompt = body.ai_system_prompt;
    }

    return NextResponse.json({
      success: true,
      message: "AI settings saved successfully.",
      has_key: Boolean(serverSettings.ai_api_key),
      provider: serverSettings.ai_provider,
      model: serverSettings.ai_model,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
