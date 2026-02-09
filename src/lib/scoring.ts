import { z } from "zod";

export const pointConfigSchema = z.object({
  flash: z.number().int().min(0),
  attempts: z.record(z.string(), z.number().int().min(0)),
  maxAttempts: z.number().int().min(1),
  minPoints: z.number().int().min(0),
});

export type PointConfig = z.infer<typeof pointConfigSchema>;

export function calculatePoints(config: PointConfig, attempts: number): number {
  if (attempts <= 0) return 0;
  if (attempts === 1) return config.flash;
  const key = String(attempts);
  if (key in config.attempts) return config.attempts[key];
  if (attempts > config.maxAttempts) return config.minPoints;
  return config.minPoints;
}
