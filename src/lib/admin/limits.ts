/** Taken för de långa texterna. Både formulären och actions läser dem, så här står inget som drar in zod i klienten. */
export const TEXT_LIMITS = {
  event: 20000,
  news: 40000,
  page: 60000,
  committee: 20000,
} as const;
