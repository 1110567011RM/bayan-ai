import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { ApiError, jsonError, requireAdmin } from "@/lib/api";
import { userCreateSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/users
 * يعيد كل المستخدمين (للمدير فقط).
 */
export async function GET() {
  try {
    await requireAdmin();

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        _count: { select: { bots: true, conversations: true } },
      },
    });

    return NextResponse.json({ users });
  } catch (error) {
    return jsonError(error);
  }
}

/**
 * POST /api/users
 * إنشاء مستخدم جديد (للمدير فقط).
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const raw = await request.json().catch(() => null);
    if (!raw || typeof raw !== "object") {
      throw new ApiError("جسم الطلب غير صالح.", 400);
    }

    const data = userCreateSchema.parse(raw);

    const exists = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (exists) throw new ApiError("البريد الإلكتروني مستخدم مسبقًا.", 409);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        role: data.role,
        passwordHash: await bcrypt.hash(data.password, 12),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
