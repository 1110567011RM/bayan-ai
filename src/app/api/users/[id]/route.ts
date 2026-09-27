import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { ApiError, jsonError, requireAdmin } from "@/lib/api";
import { userUpdateSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = { params: { id: string } };

/**
 * PATCH /api/users/[id]
 * تحديث بيانات مستخدم (للمدير فقط).
 */
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const admin = await requireAdmin();

    const raw = await request.json().catch(() => null);
    if (!raw || typeof raw !== "object") {
      throw new ApiError("جسم الطلب غير صالح.", 400);
    }

    const data = userUpdateSchema.parse(raw);

    const target = await prisma.user.findUnique({ where: { id: params.id } });
    if (!target) throw new ApiError("المستخدم غير موجود.", 404);

    // منع المدير من إيقاف أو خفض صلاحية نفسه
    if (
      target.id === admin.id &&
      (data.role === "USER" || data.status === "SUSPENDED")
    ) {
      throw new ApiError(
        "لا يمكنك تغيير دورك أو إيقاف حسابك الخاص.",
        400
      );
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.role !== undefined && { role: data.role }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.password
          ? { passwordHash: await bcrypt.hash(data.password, 12) }
          : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    return jsonError(error);
  }
}

/**
 * DELETE /api/users/[id]
 * حذف مستخدم (للمدير فقط) مع حماية المدير الأخير.
 */
export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const admin = await requireAdmin();

    if (params.id === admin.id) {
      throw new ApiError("لا يمكنك حذف حسابك الخاص.", 400);
    }

    const target = await prisma.user.findUnique({ where: { id: params.id } });
    if (!target) throw new ApiError("المستخدم غير موجود.", 404);

    if (target.role === "ADMIN") {
      const adminsCount = await prisma.user.count({ where: { role: "ADMIN" } });
      if (adminsCount <= 1) {
        throw new ApiError("لا يمكن حذف آخر مدير في النظام.", 400);
      }
    }

    await prisma.user.delete({ where: { id: params.id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
