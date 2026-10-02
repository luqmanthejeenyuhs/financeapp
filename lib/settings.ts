import { prisma } from "@/lib/prisma";

export const SETTINGS_DEFAULTS = {
  maxDailyDeposit: 20000,
  maxDailyWithdrawal: 20000,
  highValueAlarmTier: 100000,
} as const;

export type SettingKey = keyof typeof SETTINGS_DEFAULTS;

export async function getSettings(): Promise<Record<SettingKey, number>> {
  const rows = await prisma.globalSetting.findMany();
  const map = new Map(rows.map((r) => [r.key, r.value]));

  const result = {} as Record<SettingKey, number>;
  for (const key of Object.keys(SETTINGS_DEFAULTS) as SettingKey[]) {
    const raw = map.get(key);
    const parsed = raw !== undefined ? Number(raw) : NaN;
    result[key] = Number.isFinite(parsed) ? parsed : SETTINGS_DEFAULTS[key];
  }
  return result;
}

export async function setSetting(key: SettingKey, value: number) {
  await prisma.globalSetting.upsert({
    where: { key },
    update: { value: String(value) },
    create: { key, value: String(value) },
  });
}
