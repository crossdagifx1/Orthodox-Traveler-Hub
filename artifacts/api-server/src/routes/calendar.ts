import { Router, type IRouter } from "express";

const router: IRouter = Router();

// --- Ethiopian Calendar Logic ---
// (Copied and adapted from frontend EthiopianCalendarProvider)

type EthiopianDate = {
  year: number;
  month: number;
  day: number;
  monthName: string;
  weekday: number;
};

type FastingKey =
  | "none"
  | "wednesday"
  | "friday"
  | "great"
  | "advent"
  | "apostles"
  | "assumption"
  | "nineveh";

type SaintEntry = {
  name: { am: string; en: string };
  description: { am: string; en: string };
};

const SAINTS_BY_DAY: Record<number, SaintEntry> = {
  1: {
    name: { am: "ቅዱስ ዮሐንስ መጥምቅ", en: "Saint John the Baptist" },
    description: {
      am: "ጌታችንን ኢየሱስ ክርስቶስን በዮርዳኖስ ወንዝ ያጠመቀ ነቢይ።",
      en: "The prophet who baptized our Lord in the Jordan river.",
    },
  },
  3: {
    name: { am: "በዓታ ለማርያም", en: "Entry of the Theotokos" },
    description: {
      am: "ቅድስት ድንግል ማርያም ወደ ቤተ መቅደስ የተወሰነችበት ቀን።",
      en: "The Entry of the Most Holy Theotokos into the Temple.",
    },
  },
  5: {
    name: { am: "ቅዱስ ጴጥሮስ ወጳውሎስ", en: "Saints Peter and Paul" },
    description: {
      am: "የክርስቶስ ሐዋርያት ራሶች።",
      en: "The chief apostles of Christ.",
    },
  },
  7: {
    name: { am: "ልደተ ክርስቶስ", en: "Nativity of Christ (Genna)" },
    description: {
      am: "የጌታችን ኢየሱስ ክርስቶስ ልደት።",
      en: "The Nativity of our Lord Jesus Christ.",
    },
  },
  12: {
    name: { am: "ቅዱስ ሚካኤል መልአክ", en: "Archangel Michael" },
    description: {
      am: "የእግዚአብሔር ጦር አለቃ የሆነው ቅዱስ ሚካኤል።",
      en: "The Archangel Michael, captain of the heavenly host.",
    },
  },
  16: {
    name: { am: "ኪዳነ ምሕረት", en: "Kidane Mehret" },
    description: {
      am: "የቅድስት ድንግል ማርያም የምሕረት ቃል ኪዳን።",
      en: "The Covenant of Mercy of the Holy Theotokos.",
    },
  },
  19: {
    name: { am: "ቅዱስ ገብርኤል መልአክ", en: "Archangel Gabriel" },
    description: {
      am: "የእግዚአብሔር መልእክተኛ ቅዱስ ገብርኤል።",
      en: "The Archangel Gabriel, messenger of God.",
    },
  },
  21: {
    name: { am: "ቅድስት ማርያም", en: "The Most Holy Theotokos" },
    description: {
      am: "የጌታችን እናት የቅድስት ድንግል ማርያም መታሰቢያ።",
      en: "Memorial of the Most Holy Theotokos, Mother of our Lord.",
    },
  },
  23: {
    name: { am: "ቅዱስ ጊዮርጊስ", en: "Saint George the Martyr" },
    description: {
      am: "ታላቁ ሰማዕት ቅዱስ ጊዮርጊስ።",
      en: "The Great Martyr Saint George.",
    },
  },
  27: {
    name: { am: "ቅዱስ መድኃኔዓለም", en: "Christ the Savior" },
    description: {
      am: "የዓለም መድኃኒት የክርስቶስ መታሰቢያ።",
      en: "Memorial of Christ the Savior of the world.",
    },
  },
  29: {
    name: { am: "ቅዱስ ባለ እግዚአብሔር", en: "Christ Pantocrator" },
    description: {
      am: "የጌታችን ኢየሱስ ክርስቶስ ሕማማት መታሰቢያ።",
      en: "Memorial of the Passion of our Lord Jesus Christ.",
    },
  },
};

const DEFAULT_SAINT: SaintEntry = {
  name: { am: "ቅዱሳን ኹሉ", en: "All Saints" },
  description: {
    am: "በዚህ ቀን የሚታሰቡ ቅዱሳን አባቶችና እናቶች።",
    en: "Memorial of the holy fathers and mothers of this day.",
  },
};

function gregorianToEthiopian(date: Date): EthiopianDate {
  const gy = date.getUTCFullYear();
  const gm = date.getUTCMonth() + 1;
  const gd = date.getUTCDate();
  const a = Math.floor((14 - gm) / 12);
  const y = gy + 4800 - a;
  const m = gm + 12 * a - 3;
  const jdn =
    gd +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045;
  const r = (jdn - 1723856) % 1461;
  const n = (r % 365) + 365 * Math.floor(r / 1460);
  const ey = 4 * Math.floor((jdn - 1723856) / 1461) + Math.floor(r / 365) - Math.floor(r / 1460);
  const em = Math.floor(n / 30) + 1;
  const ed = (n % 30) + 1;
  const monthNames = [
    "Meskerem",
    "Tikimt",
    "Hidar",
    "Tahsas",
    "Tir",
    "Yekatit",
    "Megabit",
    "Miyazya",
    "Ginbot",
    "Sene",
    "Hamle",
    "Nehasse",
    "Pagume",
  ];
  return {
    year: ey,
    month: em,
    day: ed,
    monthName: monthNames[em - 1] ?? "",
    weekday: date.getUTCDay(),
  };
}

function determineFasting(g: Date): FastingKey {
  const wd = g.getUTCDay();
  if (wd === 3) return "wednesday";
  if (wd === 5) return "friday";
  return "none";
}

// --- Route ---

router.get("/calendar/today", (req, res) => {
  const lang = (req.query.lang as "am" | "en") || "am";
  const now = new Date();
  const eth = gregorianToEthiopian(now);
  const fastingKey = determineFasting(now);
  const saintEntry = SAINTS_BY_DAY[eth.day] ?? DEFAULT_SAINT;

  res.json({
    ethiopian: eth,
    fastingKey,
    saint: {
      name: saintEntry.name[lang] || saintEntry.name.en,
      description: saintEntry.description[lang] || saintEntry.description.en,
    },
    feastTitle: SAINTS_BY_DAY[eth.day] ? (saintEntry.name[lang] || saintEntry.name.en) : null,
  });
});

export default router;
