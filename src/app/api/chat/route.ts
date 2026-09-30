import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const message =
      typeof body?.message === "string"
        ? body.message.trim()
        : "";

    if (!message) {
      return NextResponse.json(
        {
          success: false,
          error: "الرسالة فارغة.",
        },
        { status: 400 }
      );
    }

    const apiKey = process.env.DEEPSEEK_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error:
            "مفتاح DeepSeek غير موجود. أضف DEEPSEEK_API_KEY إلى متغيرات البيئة.",
        },
        { status: 500 }
      );
    }

    const response = await fetch(DEEPSEEK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content:
              "أنت NOVA، مساعد ذكاء اصطناعي احترافي. أجب باللغة العربية بشكل واضح ومفيد، وإذا تحدث المستخدم بلغة أخرى فأجبه باللغة التي يستخدمها.",
          },
          {
            role: "user",
            content: message,
          },
        ],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("DeepSeek API error:", data);

      return NextResponse.json(
        {
          success: false,
          error:
            data?.error?.message ||
            "حدث خطأ أثناء الاتصال بخدمة الذكاء الاصطناعي.",
        },
        { status: response.status }
      );
    }

    const reply =
      data?.choices?.[0]?.message?.content;

    if (!reply) {
      return NextResponse.json(
        {
          success: false,
          error: "لم يصل رد من DeepSeek.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: reply,
      model: data?.model || "deepseek-chat",
    });
  } catch (error) {
    console.error("Chat API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "حدث خطأ داخلي أثناء معالجة الرسالة.",
      },
      { status: 500 }
    );
  }
}
