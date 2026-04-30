/**
 * Catalogue of every badge the app can award. Loaded by the api-server's
 * badge helper at boot AND by `db:init` to seed the `badges` table.
 *
 * `key` is the stable identifier referenced by the awarding helpers in
 * `artifacts/api-server/src/lib/badges.ts`. Adding a new badge here is
 * idempotent — re-running the seed updates copy/icon but keeps awarded
 * `user_badges` rows intact.
 */
export type BadgeSeed = {
  key: string;
  name: string;
  description: string;
  iconKey: string;
  tier: "bronze" | "silver" | "gold" | "special";
  sortOrder: number;
};

export const BADGE_SEEDS: BadgeSeed[] = [
  {
    key: "first_quiz",
    name: "First Steps",
    description: "Completed your first quiz.",
    iconKey: "scroll",
    tier: "bronze",
    sortOrder: 100,
  },
  {
    key: "scholar",
    name: "Scholar",
    description: "Earned a perfect score on a quiz.",
    iconKey: "graduation-cap",
    tier: "gold",
    sortOrder: 90,
  },
  {
    key: "streak_3",
    name: "Three-Day Devotion",
    description: "Stayed active for three Ethiopian days in a row.",
    iconKey: "flame",
    tier: "bronze",
    sortOrder: 80,
  },
  {
    key: "streak_7",
    name: "Seven-Day Faithful",
    description: "Stayed active for seven Ethiopian days in a row.",
    iconKey: "flame",
    tier: "silver",
    sortOrder: 75,
  },
  {
    key: "streak_30",
    name: "Month of Light",
    description: "A full Ethiopian month of daily activity.",
    iconKey: "flame",
    tier: "gold",
    sortOrder: 70,
  },
  {
    key: "pilgrim",
    name: "Pilgrim",
    description: "Saved five spiritual destinations.",
    iconKey: "map-pin",
    tier: "silver",
    sortOrder: 60,
  },
  {
    key: "hymn_lover",
    name: "Hymn Lover",
    description: "Listened to ten different mezmurs.",
    iconKey: "music",
    tier: "silver",
    sortOrder: 50,
  },
  {
    key: "voice_in_the_choir",
    name: "Voice in the Choir",
    description: "Posted your first comment.",
    iconKey: "message-circle",
    tier: "bronze",
    sortOrder: 40,
  },
  {
    key: "champion",
    name: "Champion",
    description: "Climbed into the weekly top three on the leaderboard.",
    iconKey: "trophy",
    tier: "gold",
    sortOrder: 95,
  },
];
