import { prisma } from "@/lib/prisma";

export const SETTING_KEYS = {
  DEEPSEEK_API_KEY: "DEEPSEEK_API_KEY",
} as const;

export const SECRET_KEYS = [
  SETTING_KEYS.DEEPSEEK_API_KEY,
] as const;

export async function getSetting(
  key: string
): Promise<string | null> {
  const setting = await prisma.setting.findUnique({
    where: { key },
  });

  return setting?.value ?? null;
}

export async function setSetting(
  key: string,
  value: string,
  isSecret = false
) {
  return prisma.setting.upsert({
    where: { key },
    update: {
      value,
      isSecret,
    },
    create: {
      key,
      value,
      isSecret,
    },
  });
}

export async function getPublicSettings() {
  const settings = await prisma.setting.findMany({
    where: {
      isSecret: false,
    },
    orderBy: {
      key: "asc",
    },
  });

  return {
    settings: Object.fromEntries(
      settings.map((setting) => [
        setting.key,
        setting.value,
      ])
    ),
    deepseekApiKeyConfigured:
      (await getSetting(SETTING_KEYS.DEEPSEEK_API_KEY)) !== null,
  };
}

export async function getDeepSeekApiKey(): Promise<
  string | null
> {
  const databaseKey = await getSetting(
    SETTING_KEYS.DEEPSEEK_API_KEY
  );

  if (databaseKey?.trim()) {
    return databaseKey.trim();
  }

  const environmentKey =
    process.env.DEEPSEEK_API_KEY;

  return environmentKey?.trim() || null;
}
