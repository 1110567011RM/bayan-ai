import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ApiError, jsonError, requireAdmin, requireUser } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { settingsUpdateSchema } from "@/lib/validators";
import {
  getPublicSettings,
  SECRET_KEYS,
  setSetting,
  SETTING_KEYS,
} from "@/lib/settings";
import { testDeepSeekConnection } from "@/lib/deepseek";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/settings
 * يعيد الإعدادات العامة (بدون كشف الأسرار).
 */
export async function GET() {
  try {
    await requireUser();
    const data = await getPublicSettings();
    return NextResponse.json(data);
  } catch (error) {
    return jsonError(error);
  }
}

/**
 * PUT /api/settings
 * تحديث الإعدادات (للمدير فقط).
 * ملاحظة: قيمة DEEPSEEK_API_KEY الفارغة تعني "لا تغيير".
 */
export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAdmin();

    const rl = rateLimit(`settings:${admin.id}`, 20, 60_000);
    if (!rl.ok) throw new ApiError("عدد كبير من الطلبات.", 429);

    const raw = await request.json().catch(() => null);
    if (!raw || typeof raw !== "object") {
      throw new ApiError("جسم الطلب غير صالح.", 400);
    }

    const body = settingsUpdateSchema.parse(raw);

    for (const [key, value] of Object.entries(body)) {
      if (value === undefined) continue;

      // مفتاح API الفارغ = احتفظ بالقيمة الحالية
      if (
        key === SETTING_KEYS.DEEPSEEK_API_KEY &&
        !String(value).trim()
      ) {
        continue;
      }

      await setSetting(
        key,
        String(value),
        SECRET_KEYS.includes(key)
      );
    }

    const data = await getPublicSettings();
    return NextResponse.json({ ok: true, ...data });
  } catch (error) {
    return jsonError(error);
  }
}

/**
 * POST /api/settings
 * اختبار الاتصال بـ DeepSeek.
 * يمكن تمرير مفتاح مؤقت في الجسم { apiKey } لاختباره قبل الحفظ.
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();

    const rl = rateLimit(`deepseek-test:${admin.id}`, 10, 60_000);
    if (!rl.ok) {
      throw new ApiError("عدد كبير من المحاولات، حاول بعد قليل.", 429);
    }

    const body = await request.json().catch(() => ({}));
    const apiKey =
      typeof body?.apiKey === "string" ? body.apiKey : undefined;

    const result = await testDeepSeekConnection(apiKey);
    return NextResponse.json(result);
  } catch (error) {
    return jsonError(error);
  }
}
