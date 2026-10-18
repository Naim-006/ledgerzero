import { NextResponse } from "next/server";
import { detectAIProviderAndModel, getEffectiveServerApiKey } from "@/lib/ai/config";

export async function POST(req: Request) {
  try {
    const { prompt, businessContext, apiKey: explicitKey, provider: explicitProvider } = await req.json();

    const effectiveApiKey = await getEffectiveServerApiKey(explicitKey);

    // If NO API key is connected, explicitly inform the user (no fake preset responses)
    if (!effectiveApiKey) {
      return NextResponse.json({
        connected: false,
        source: "disconnected",
        answer: `⚠️ **AI API is not connected.**

To enable live AI analysis and autonomous task execution for your business, please connect your **DeepSeek (深度求索)**, **GLM (智谱 AI)**, **Qwen (通义千问)**, **OpenAI**, or **Gemini** API key in the **Admin Portal** (/admin) or paste it directly below.`,
        suggestedActions: [
          "Connect DeepSeek / AI Key",
          "Open POS Sell Register",
          "Check Cash Flow Forecast",
        ],
      });
    }

    const detected = detectAIProviderAndModel(effectiveApiKey, explicitProvider);
    const provider = detected.provider;
    const model = detected.model;

    const cash = Number(businessContext?.cash || 0);
    const payables = Number(businessContext?.payablesDue7Days || 0);
    const receivables = Number(businessContext?.receivables || 0);
    const lowStockCount = Number(businessContext?.lowStockCount || 0);
    const netGap = cash - payables;

    const systemPrompt = `You are LEDGER ZERO AI, an autonomous financial co-pilot and agent for small businesses (中小企业智能金融助手).
Primary Currency: Chinese Yuan (CNY / ¥).
Competition context: Tsinghua PBCSF & WeBank International Track (Topic E: SME Finance Copilot).
Live Business Status:
- Cash in Hand & Bank: ¥${(cash / 100).toFixed(2)}
- Bills Due in 7 Days: ¥${(payables / 100).toFixed(2)}
- Uncollected Customer Invoices: ¥${(receivables / 100).toFixed(2)}
- Low Stock Items Needing Restock: ${lowStockCount}
- 7-Day Net Cash Position: ${netGap >= 0 ? "+" : "-"}¥${Math.abs(netGap / 100).toFixed(2)}

You are AGENTIC: When the user asks you to do a task (such as add stock, create an invoice, record a transaction, draft a reminder, or check financing), acknowledge the task clearly, explain what was planned/calculated, and specify the exact parameters (product name, quantity, price, customer, amount).
Respond in friendly, natural language. If the user writes in Chinese, answer in Chinese. If in Bengali, answer in Bengali. Otherwise, answer in clear English.`;

    // 1. DeepSeek API (深度求索 - China) or OpenAI
    if (provider === "deepseek" || provider === "openai") {
      const endpoint =
        provider === "deepseek"
          ? "https://api.deepseek.com/chat/completions"
          : "https://api.openai.com/v1/chat/completions";

      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${effectiveApiKey}`,
          },
          body: JSON.stringify({
            model: provider === "deepseek" ? "deepseek-chat" : model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: prompt },
            ],
            temperature: 0.3,
            max_tokens: 800,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const answer = data.choices?.[0]?.message?.content || "No response received.";
          return NextResponse.json({
            connected: true,
            source: `${provider}_live`,
            model: data.model || model,
            answer,
          });
        }
      } catch (err) {
        // Fallback to OpenAI endpoint if DeepSeek endpoint errored
        if (provider === "deepseek") {
          try {
            const fallbackRes = await fetch("https://api.openai.com/v1/chat/completions", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${effectiveApiKey}`,
              },
              body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                  { role: "system", content: systemPrompt },
                  { role: "user", content: prompt },
                ],
                temperature: 0.3,
                max_tokens: 800,
              }),
            });
            if (fallbackRes.ok) {
              const data = await fallbackRes.json();
              return NextResponse.json({
                connected: true,
                source: "openai_live",
                model: "gpt-4o-mini",
                answer: data.choices?.[0]?.message?.content || "",
              });
            }
          } catch {}
        }
      }
    }

    // 2. GLM / Zhipu AI (智谱清言 - China)
    if (provider === "glm") {
      try {
        const response = await fetch("https://open.bigmodel.cn/api/paas/v4/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${effectiveApiKey}`,
          },
          body: JSON.stringify({
            model: "glm-4-flash",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: prompt },
            ],
            temperature: 0.3,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          return NextResponse.json({
            connected: true,
            source: "glm_live",
            model: "glm-4-flash",
            answer: data.choices?.[0]?.message?.content || "",
          });
        }
      } catch (glmErr) {
        console.warn("GLM error:", glmErr);
      }
    }

    // 3. Qwen / DashScope (通义千问 - 阿里 - China)
    if (provider === "qwen") {
      try {
        const response = await fetch("https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${effectiveApiKey}`,
          },
          body: JSON.stringify({
            model: "qwen-plus",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: prompt },
            ],
            temperature: 0.3,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          return NextResponse.json({
            connected: true,
            source: "qwen_live",
            model: "qwen-plus",
            answer: data.choices?.[0]?.message?.content || "",
          });
        }
      } catch (qwenErr) {
        console.warn("Qwen error:", qwenErr);
      }
    }

    // 4. Google Gemini
    if (provider === "gemini") {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${effectiveApiKey}`;
      const response = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${systemPrompt}\n\nUser request: "${prompt}"` }] }],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const answer = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response received.";
        return NextResponse.json({
          connected: true,
          source: "gemini_live",
          model: "gemini-1.5-flash",
          answer,
        });
      }
    }

    // 5. Groq Fast Llama (Llama 3.1 8B Instant primary, with 3.3 70B fallback)
    if (provider === "groq") {
      const modelsToTry = [
        "llama-3.1-8b-instant",
        "llama-3.3-70b-versatile",
      ];
      let lastGroqError = "";

      for (const groqModel of modelsToTry) {
        try {
          const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${effectiveApiKey}`,
            },
            body: JSON.stringify({
              model: groqModel,
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: prompt },
              ],
              temperature: 0.3,
              max_tokens: 800,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            return NextResponse.json({
              connected: true,
              source: "groq_live",
              model: groqModel,
              answer: data.choices?.[0]?.message?.content || "",
            });
          } else {
            const errJson = await response.json().catch(() => null);
            lastGroqError = errJson?.error?.message || `HTTP ${response.status} from Groq`;
            // If the key is invalid or unauthorized, stop immediately rather than trying other models
            if (response.status === 401 || errJson?.error?.code === "invalid_api_key") {
              break;
            }
          }
        } catch (fetchErr: any) {
          lastGroqError = fetchErr.message || "Network request failed";
        }
      }

      return NextResponse.json({
        connected: false,
        error: true,
        answer: `⚠️ **Groq API Error:** ${lastGroqError}. Please verify that your Groq API key (starts with gsk_...) is valid and has active quota.`,
      });
    }

    return NextResponse.json({
      connected: true,
      error: true,
      answer: `⚠️ **API Error (${detected.name}):** Could not complete request. Please verify that your API key is valid and has active quota.`,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        connected: false,
        error: true,
        answer: `Connection error: ${err.message || "Failed to reach AI endpoint."}`,
      },
      { status: 500 }
    );
  }
}
