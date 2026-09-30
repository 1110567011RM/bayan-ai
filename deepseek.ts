import { getDeepSeekApiKey } from "@/lib/settings";

const DEEPSEEK_API_URL =
  "https://api.deepseek.com/chat/completions";

export async function testDeepSeekConnection(
  temporaryApiKey?: string
) {
  const apiKey =
    temporaryApiKey?.trim() ||
    (await getDeepSeekApiKey());

  if (!apiKey) {
    return {
      success: false,
      error:
        "مفتاح DeepSeek غير موجود. أضف DEEPSEEK_API_KEY أولًا.",
    };
  }

  try {
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
            role: "user",
            content: "اكتب كلمة: OK",
          },
        ],
        temperature: 0,
        max_tokens: 10,
      }),
      cache: "no-store",
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        success: false,
        error:
          data?.error?.message ||
          `فشل الاتصال بـ DeepSeek. رمز الخطأ: ${response.status}`,
      };
    }

    const reply =
      data?.choices?.[0]?.message?.content;

    if (!reply) {
      return {
        success: false,
        error: "تم الاتصال بـ DeepSeek ولكن لم يصل رد.",
      };
    }

    return {
      success: true,
      message: "تم الاتصال بـ DeepSeek بنجاح.",
      model: data?.model || "deepseek-chat",
    };
  } catch (error) {
    console.error(
      "DeepSeek connection test error:",
      error
    );

    return {
      success: false,
      error:
        "تعذر الاتصال بخدمة DeepSeek. تحقق من الاتصال ومفتاح API.",
    };
  }
}
