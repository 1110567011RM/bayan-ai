import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, requireUser } from "@/lib/api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/stats
 * يعيد ملخصًا كاملًا للإحصائيات:
 *  - الإجماليات (مستخدمون/بوتات/محادثات/رسائل/توكنات).
 *  - النشاط اليومي (آخر 14 يومًا).
 *  - آخر 5 محادثات.
 *  - أعلى 5 بوتات استخدامًا.
 */
export async function GET() {
  try {
    const user = await requireUser();
    const isAdmin = user.role === "ADMIN";

    // نطاقات الاستعلام حسب الدور
    const convoScope = isAdmin ? {} : { userId: user.id };
    const botScope = isAdmin ? {} : { ownerId: user.id };
    const msgScope = isAdmin ? {} : { conversation: { userId: user.id } };
    const usageScope = isAdmin ? {} : { userId: user.id };

    const [usersCount, botsCount, conversationsCount, messagesCount, usageAgg] =
      await Promise.all([
        isAdmin ? prisma.user.count() : Promise.resolve(1),
        prisma.bot.count({ where: botScope }),
        prisma.conversation.count({ where: convoScope }),
        prisma.message.count({ where: msgScope }),
        prisma.usage.aggregate({
          where: usageScope,
          _sum: {
            totalTokens: true,
            promptTokens: true,
            completionTokens: true,
          },
        }),
      ]);

    // ---- النشاط اليومي: آخر 14 يومًا ----
    const since = new Date();
    since.setDate(since.getDate() - 13);
    since.setHours(0, 0, 0, 0);

    const recentMessages = await prisma.message.findMany({
      where: { createdAt: { gte: since }, ...msgScope },
      select: { createdAt: true },
    });

    const dailyMap = new Map<string, number>();
    for (let i = 0; i < 14; i++) {
      const d = new Date(since);
      d.setDate(since.getDate() + i);
      dailyMap.set(d.toISOString().slice(0, 10), 0);
    }

    for (const m of recentMessages) {
      const key = m.createdAt.toISOString().slice(0, 10);
      if (dailyMap.has(key)) {
        dailyMap.set(key, (dailyMap.get(key) ?? 0) + 1);
      }
    }

    const daily = Array.from(dailyMap.entries()).map(([date, count]) => ({
      date,
      count,
    }));

    // ---- آخر 5 محادثات ----
    const recentConversations = await prisma.conversation.findMany({
      where: convoScope,
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: {
        bot: { select: { name: true, avatarUrl: true } },
        _count: { select: { messages: true } },
      },
    });

    // ---- أعلى 5 بوتات استخدامًا ----
    const grouped = await prisma.conversation.groupBy({
      by: ["botId"],
      where: convoScope,
      _count: { botId: true },
      orderBy: { _count: { botId: "desc" } },
      take: 5,
    });

    const botNames = await prisma.bot.findMany({
      where: { id: { in: grouped.map((g) => g.botId) } },
      select: { id: true, name: true },
    });

    const topBots = grouped.map((g) => ({
      botId: g.botId,
      name: botNames.find((b) => b.id === g.botId)?.name ?? "بوت محذوف",
      conversations: g._count.botId,
    }));

    return NextResponse.json({
      totals: {
        users: usersCount,
        bots: botsCount,
        conversations: conversationsCount,
        messages: messagesCount,
        totalTokens: usageAgg._sum.totalTokens ?? 0,
        promptTokens: usageAgg._sum.promptTokens ?? 0,
        completionTokens: usageAgg._sum.completionTokens ?? 0,
      },
      daily,
      recentConversations,
      topBots,
    });
  } catch (error) {
    return jsonError(error);
  }
}
