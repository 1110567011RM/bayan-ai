import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiError, jsonError, requireUser } from "@/lib/api";
import { conversationUpdateSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = { params: { id: string } };

/**
 * يحمّل المحادثة مع التحقق من ملكيتها.
 */
async function loadConversation(
  id: string,
  userId: string,
  role: "ADMIN" | "USER"
) {
  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: {
      bot: { select: { id: true, name: true, avatarUrl: true } },
      user: { select: { id: true, name: true, email: true } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!conversation) throw new ApiError("المحادثة غير موجودة.", 404);
  if (conversation.userId !== userId && role !== "ADMIN") {
    throw new ApiError("غير مصرح بالوصول إلى هذه المحادثة.", 403);
  }
  return conversation;
}

/**
 * GET /api/conversations/[id]
 * يعيد المحادثة مع كل رسائلها.
 */
export async function GET(
  _request: NextRequest,
  { params }: RouteContext
) {
  try {
    const user = await requireUser();

    const role =
      user.role === "ADMIN" ? "ADMIN" : "USER";

    const conversation = await loadConversation(
      params.id,
      user.id,
      role
    );

    return NextResponse.json({ conversation });
  } catch (error) {
    return jsonError(error);
  }
}

/**
 * PATCH /api/conversations/[id]
 * تعديل عنوان المحادثة.
 */
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const user = await requireUser();
    await loadConversation(params.id, user.id, user.role);

    const raw = await request.json().catch(() => null);
    if (!raw || typeof raw !== "object") {
      throw new ApiError("جسم الطلب غير صالح.", 400);
    }

    const { title } = conversationUpdateSchema.parse(raw);

    const conversation = await prisma.conversation.update({
      where: { id: params.id },
      data: { title },
    });

    return NextResponse.json({ conversation });
  } catch (error) {
    return jsonError(error);
  }
}

/**
 * DELETE /api/conversations/[id]
 * حذف المحادثة وكل رسائلها.
 */
export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const user = await requireUser();
    await loadConversation(params.id, user.id, user.role);

    await prisma.conversation.delete({ where: { id: params.id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
