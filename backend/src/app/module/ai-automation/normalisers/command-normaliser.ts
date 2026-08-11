import type {
  ExpenseCategory,
  MealName,
  UtilityType,
} from '../ai-command.types';

export type NamedMember = { id: string; name: string };

export type CommandNormalizationHints = {
  expenseCategory: ExpenseCategory | null;
  utilityType: UtilityType | null;
  mealName: MealName | null;
  hasMoney: boolean;
  hasQuantity: boolean;
  mentionsToday: boolean;
  mentionsYesterday: boolean;
  mentionsTomorrow: boolean;
};

export type CommandNormalizationBundle = {
  original: string;
  normalized: string;
  hints: CommandNormalizationHints;
};

const BANGLA_DIGITS = '০১২৩৪৫৬৭৮৯';

const MONEY_CONTEXT_PATTERN =
  /(bazar|bajaar|market|grocery|expense|spent|spend|buy|bought|purchase|purchased|bill|deposit|rent|বাজার|খরচ|কিন|বিল|জমা|ভাড়া|ভাড়া)/iu;

function collapseWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

export function normalizeBanglaDigits(text: string): string {
  return text.replace(/[০-৯]/g, (digit) => {
    const index = BANGLA_DIGITS.indexOf(digit);
    return index >= 0 ? String(index) : digit;
  });
}

function normalizeCurrency(text: string): string {
  let result = text
    .replace(/৳\s*(\d+(?:\.\d+)?)/gu, '$1 taka')
    .replace(/(\d+(?:\.\d+)?)\s*৳/gu, '$1 taka')
    .replace(
      /(\d+(?:\.\d+)?)\s*(?:tk\.?|taka|টাকা|টাকায়|টাকায়)(?=\s|$|[,.;])/giu,
      '$1 taka',
    );

  // Whisper can occasionally hear “taka” as “times/tymes”. Only repair it
  // when the entire command already looks like a money/purchase command so
  // “2 times meal” is not silently converted into money.
  if (MONEY_CONTEXT_PATTERN.test(result)) {
    result = result.replace(
      /(\d+(?:\.\d+)?)\s*(?:times?|tymes?)\b/gi,
      '$1 taka',
    );
  }

  return result;
}

function normalizeUnitsInText(text: string): string {
  return text
    .replace(
      /(\d+(?:\.\d+)?)\s*(?:kgs?|kilograms?|kilos?|কেজি)(?=\s|$|[,.;])/giu,
      '$1 kg',
    )
    .replace(
      /(\d+(?:\.\d+)?)\s*(?:grams?|gms?|gm|গ্রাম)(?=\s|$|[,.;])/giu,
      '$1 g',
    )
    .replace(
      /(\d+(?:\.\d+)?)\s*(?:litres?|liters?|ltrs?|ltr|লিটার)(?=\s|$|[,.;])/giu,
      '$1 l',
    )
    .replace(
      /(\d+(?:\.\d+)?)\s*(?:millilitres?|milliliters?|mls?|মিলিলিটার)(?=\s|$|[,.;])/giu,
      '$1 ml',
    )
    .replace(
      /(\d+(?:\.\d+)?)\s*(?:pieces?|pcs?)(?=\s|$|[,.;])/giu,
      '$1 pcs',
    );
}

function normalizeCommonBanglish(text: string): string {
  return text
    // Today/yesterday/tomorrow. Keep bare “kal/কাল” unchanged because it can
    // mean yesterday or tomorrow depending on context.
    .replace(/\b(?:ajke|aajke|aijke|aijke|agke|aj)\b/gi, 'today')
    .replace(/আজকে|আজ/gu, 'today')
    .replace(/\b(?:gotokal|goto\s*kal)\b/gi, 'yesterday')
    .replace(/গতকাল|গত\s+কাল/gu, 'yesterday')
    .replace(/\b(?:agamikal|agami\s*kal)\b/gi, 'tomorrow')
    .replace(/আগামীকাল|আগামী\s+কাল/gu, 'tomorrow')

    // Action/purchase variants. These are hints only; the original text is
    // still sent to the LLM as the source of truth.
    .replace(/\b(?:kro|koro|korun|add\s+koro|add\s+kro)\b/gi, 'add')
    .replace(
      /\b(?:kinlam|kinchi|kinci|kinsi|kinechi|kinechilam|kinechhi|kintechi|kintechhi)\b/gi,
      'purchased',
    )

    // Common grocery spellings.
    .replace(/\b(?:aloo|alu)\b/gi, 'alu')
    .replace(/\b(?:piaus|piaj|piyaj|peyaj|piaz|peaj|pyaj)\b/gi, 'piyaj')
    .replace(/\b(?:bajaar|bajar|bazar|bazer|bozar)\b/gi, 'bazar');
}

export function normalizeCommandText(text: string): string {
  let result = text.normalize('NFKC');
  result = normalizeBanglaDigits(result);
  result = normalizeCurrency(result);
  result = normalizeUnitsInText(result);
  result = normalizeCommonBanglish(result);

  // Standardise separators without destroying natural-language content.
  result = result
    .replace(/[–—]/g, '-')
    .replace(/\s*([,;])\s*/g, '$1 ')
    .replace(/\s+([.!?])/g, '$1');

  return collapseWhitespace(result);
}

export function normalizeUnit(unit: string | null): string | null {
  if (!unit?.trim()) return null;

  const value = normalizeBanglaDigits(unit)
    .normalize('NFKC')
    .trim()
    .toLocaleLowerCase();

  if (/^(kg|kgs|kilogram|kilograms|kilo|kilos|কেজি)$/u.test(value)) return 'kg';
  if (/^(g|gm|gms|gram|grams|গ্রাম)$/u.test(value)) return 'g';
  if (/^(l|ltr|ltrs|liter|liters|litre|litres|লিটার)$/u.test(value)) return 'l';
  if (/^(ml|mls|milliliter|milliliters|millilitre|millilitres|মিলিলিটার)$/u.test(value)) {
    return 'ml';
  }
  if (/^(pc|pcs|piece|pieces)$/u.test(value)) return 'pcs';
  if (/^(ta|টা)$/u.test(value)) return 'pcs';

  return value;
}

export function inferUtilityType(
  itemName: string | null,
  description: string | null,
): UtilityType | null {
  const text = `${itemName ?? ''} ${description ?? ''}`.toLocaleLowerCase();
  if (!text.trim()) return null;

  if (/(electricity|electric|current\s*bill|বিদ্যুৎ|কারেন্ট)/u.test(text)) {
    return 'ELECTRICITY';
  }
  if (/(internet|wi[ -]?fi|broadband|ইন্টারনেট|ওয়াইফাই|ওয়াইফাই)/u.test(text)) {
    return 'WIFI';
  }
  if (/(gas|গ্যাস)/u.test(text)) return 'GAS';
  if (/(water|পানি|জল)/u.test(text)) return 'WATER';
  if (/(cleaner|cleaning|পরিষ্কার|ক্লিনার)/u.test(text)) return 'CLEANING';

  return null;
}

// export function inferExpenseCategory(
//   itemName: string | null,
//   description: string | null,
// ): ExpenseCategory | null {
//   const text = `${itemName ?? ''} ${description ?? ''}`.toLocaleLowerCase();
//   if (!text.trim()) return null;

//   if (/(electricity|electric|current\s*bill|বিদ্যুৎ|কারেন্ট)/u.test(text)) {
//     return 'ELECTRICITY';
//   }
//   if (/(internet|wi[ -]?fi|broadband|ইন্টারনেট|ওয়াইফাই|ওয়াইফাই)/u.test(text)) {
//     return 'WIFI';
//   }
//   if (/(gas|গ্যাস)/u.test(text)) return 'GAS';
//   if (/(water|পানি|জল)/u.test(text)) return 'WATER';
//   if (/(rent|house\s*rent|room\s*rent|ভাড়া|ভাড়া)/u.test(text)) return 'RENT';
//   if (/(maintenance|repair|fix|mistri|মেরামত|মিস্ত্রি)/u.test(text)) {
//     return 'MAINTENANCE';
//   }
//   if (/(bua|buya|maid|house\s*help|বুয়া|বুয়া)/u.test(text)) return 'BUABILL';
//   if (/(cleaner|cleaning|পরিষ্কার|ক্লিনার)/u.test(text)) return 'CLEANER';

//   if (
//     /(restaurant|রেস্টুরেন্ট|hotel\s*food|snack|নাস্তা|tea|চা|coffee|কফি|prepared\s*food|ready\s*food|খাবার|খাওয়া|খাওয়া|খেয়েছি|খেয়েছি)/u.test(
//       text,
//     )
//   ) {
//     return 'FOOD';
//   }

//   if (
//     /(grocery|market|bazar|বাজার|সবজি|সব্জি|vegetable|alu|aloo|আলু|potato|piyaj|peyaj|piaz|পেঁয়াজ|পিয়াজ|onion|চাল|rice|ডাল|dal|lentil|তেল|oil|মাছ|fish|মাংস|meat|chicken|মুরগি|ডিম|egg|দুধ|milk|salt|লবণ|মসলা|spice|flour|আটা|ময়দা|ময়দা)/u.test(
//       text,
//     )
//   ) {
//     return 'GROCERY';
//   }

//   return null;
// }

const FOOD_TERMS = [
  // English
  'restaurant',
  'hotel food',
  'snack',
  'snacks',
  'tea',
  'coffee',
  'breakfast',
  'lunch',
  'dinner',
  'fast food',
  'burger',
  'pizza',
  'biriyani',
  'biryani',
  'kacchi',
  'meal',
  'prepared food',

  // Banglish
  'nasta',
  'nashta',
  'cha',
  'khabar',
  'khawa',
  'restaurant e',
  'hotel e',

  // Bangla
  'রেস্টুরেন্ট',
  'হোটেলের খাবার',
  'নাস্তা',
  'চা',
  'কফি',
  'খাবার',
  'খাওয়া',
  'খেয়েছি',
  'খেয়েছি',
  'সকালের নাস্তা',
  'দুপুরের খাবার',
  'রাতের খাবার',
  'বিরিয়ানি',
  'বিরিয়ানি',
  'কাচ্চি',
];

const GROCERY_TERMS = [
  // General
  'grocery',
  'groceries',
  'market',
  'bazar',
  'bajar',
  'bazaar',
  'shopping',
  'kitchen item',
  'cooking item',
  'ingredient',

  'বাজার',
  'মুদি',
  'মুদির',
  'রান্নার জিনিস',

  // Rice / grain / flour
  'rice',
  'chal',
  'চাল',

  'atta',
  'আটা',

  'maida',
  'moyda',
  'ময়দা',
  'ময়দা',

  'suji',
  'semolina',
  'সুজি',

  'chira',
  'চিড়া',
  'চিড়া',

  'muri',
  'মুড়ি',
  'মুড়ি',

  // Lentils
  'dal',
  'daal',
  'lentil',
  'lentils',
  'ডাল',

  'mosur dal',
  'masoor dal',
  'মসুর ডাল',

  'mug dal',
  'moong dal',
  'মুগ ডাল',

  'chola dal',
  'ছোলা ডাল',

  // Oil
  'oil',
  'tel',
  'তেল',

  'soybean oil',
  'soyabean oil',
  'সয়াবিন তেল',
  'সয়াবিন তেল',

  'mustard oil',
  'sorisha tel',
  'সরিষার তেল',

  // Sugar / salt
  'sugar',
  'chini',
  'cini',
  'চিনি',

  'salt',
  'lobon',
  'লবণ',

  // Potato
  'potato',
  'potatoes',
  'alu',
  'aloo',
  'আলু',

  // Onion
  'onion',
  'onions',
  'piyaj',
  'peyaj',
  'piaj',
  'piaz',
  'piaus',
  'peaj',
  'পেঁয়াজ',
  'পেয়াজ',
  'পিয়াজ',
  'পিয়াজ',

  // Garlic
  'garlic',
  'rosun',
  'roshun',
  'rashun',
  'রসুন',

  // Ginger
  'ginger',
  'ada',
  'adha',
  'আদা',

  // Chilli
  'chilli',
  'chili',
  'chillies',
  'morich',
  'moricha',
  'মরিচ',

  'green chilli',
  'kacha morich',
  'কাঁচা মরিচ',

  'dry chilli',
  'shukna morich',
  'শুকনা মরিচ',
  'শুকনো মরিচ',

  // Turmeric
  'turmeric',
  'holud',
  'halud',
  'হলুদ',

  // Coriander
  'coriander',
  'dhonia',
  'dhania',
  'ধনিয়া',
  'ধনিয়া',

  // Cumin
  'cumin',
  'jira',
  'jeera',
  'জিরা',

  // Other spices
  'spice',
  'spices',
  'mosla',
  'masala',
  'মসলা',

  'black pepper',
  'gol morich',
  'গোলমরিচ',

  'cinnamon',
  'daruchini',
  'দারুচিনি',

  'cardamom',
  'elach',
  'এলাচ',

  'clove',
  'lobongo',
  'লবঙ্গ',

  'bay leaf',
  'tej pata',
  'tejpata',
  'তেজপাতা',

  // Vegetables
  'vegetable',
  'vegetables',
  'sobji',
  'shobji',
  'সবজি',
  'সব্জি',

  'tomato',
  'টমেটো',

  'cucumber',
  'shosha',
  'sosha',
  'শসা',

  'carrot',
  'gajor',
  'গাজর',

  'cabbage',
  'badha kopi',
  'বাঁধাকপি',

  'cauliflower',
  'ful kopi',
  'phulkopi',
  'ফুলকপি',

  'brinjal',
  'eggplant',
  'begun',
  'বেগুন',

  'pumpkin',
  'kumra',
  'mistikumra',
  'কুমড়া',
  'কুমড়া',
  'মিষ্টিকুমড়া',

  'lau',
  'bottle gourd',
  'লাউ',

  'potol',
  'pointed gourd',
  'পটল',

  'korola',
  'bitter gourd',
  'করলা',

  'beans',
  'shim',
  'শিম',

  // Fish
  'fish',
  'mach',
  'maach',
  'মাছ',

  'ilish',
  'hilsa',
  'ইলিশ',

  'rui',
  'rohu',
  'রুই',

  'katla',
  'কাতলা',

  'tilapia',
  'তেলাপিয়া',
  'তেলাপিয়া',

  // Meat
  'meat',
  'mangsho',
  'mangso',
  'মাংস',

  'beef',
  'gorur mangsho',
  'গরুর মাংস',

  'chicken',
  'murgi',
  'মুরগি',

  'mutton',
  'khashi',
  'খাসি',

  // Egg / dairy
  'egg',
  'eggs',
  'dim',
  'ডিম',

  'milk',
  'dudh',
  'দুধ',

  'powder milk',
  'milk powder',
  'গুঁড়া দুধ',

  'yogurt',
  'doi',
  'দই',

  // Other common groceries
  'bread',
  'pauruti',
  'পাউরুটি',

  'biscuit',
  'biscuits',
  'বিস্কুট',

  'noodles',
  'নুডলস',

  'vermicelli',
  'semai',
  'সেমাই',

  'soy sauce',
  'সয়া সস',

  'vinegar',
  'ভিনেগার',
];

function normalizeForMatching(value: string): string {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase()
    .replace(/[.,!?;:()[\]{}"'`]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function containsTerm(text: string, term: string): boolean {
  const normalizedTerm = normalizeForMatching(term);

  if (!normalizedTerm) {
    return false;
  }

  /*
   * Bengali does not behave reliably with JS \b word boundaries,
   * so phrase matching is intentionally used here.
   *
   * Surrounding spaces reduce accidental Latin substring matches.
   */
  const haystack = ` ${text} `;
  const needle = ` ${normalizedTerm} `;

  if (haystack.includes(needle)) {
    return true;
  }

  // Multi-word / script-safe fallback
  return text === normalizedTerm ||
    text.startsWith(`${normalizedTerm} `) ||
    text.endsWith(` ${normalizedTerm}`) ||
    text.includes(` ${normalizedTerm} `);
}

function containsAny(
  text: string,
  terms: readonly string[],
): boolean {
  return terms.some((term) =>
    containsTerm(text, term),
  );
}

export function inferExpenseCategory(
  itemName: string | null,
  description: string | null,
): ExpenseCategory | null {
  const text = normalizeForMatching(
    `${itemName ?? ''} ${description ?? ''}`,
  );

  if (!text) {
    return null;
  }

  const utilityType = inferUtilityType(itemName, description);
  if (utilityType === 'ELECTRICITY') return 'ELECTRICITY';
  if (utilityType === 'GAS') return 'GAS';
  if (utilityType === 'WATER') return 'WATER';
  if (utilityType === 'WIFI') return 'WIFI';
  if (utilityType === 'CLEANING') return 'CLEANER';

  if (containsAny(text, ['rent', 'house rent', 'room rent', 'ভাড়া', 'ভাড়া'])) {
    return 'RENT';
  }
  if (containsAny(text, ['maintenance', 'repair', 'mistri', 'মেরামত', 'মিস্ত্রি'])) {
    return 'MAINTENANCE';
  }
  if (containsAny(text, ['bua', 'buya', 'maid', 'house help', 'বুয়া', 'বুয়া'])) {
    return 'BUABILL';
  }

  /*
   * FOOD must be checked before GROCERY.
   *
   * Example:
   * "restaurant chicken 250 taka"
   *
   * "chicken" alone is grocery, but restaurant chicken
   * is prepared food.
   */
  if (containsAny(text, FOOD_TERMS)) {
    return 'FOOD';
  }

  if (containsAny(text, GROCERY_TERMS)) {
    return 'GROCERY';
  }

  return null;
}

export function inferMealName(text: string | null): MealName | null {
  const value = text?.toLocaleLowerCase().trim();
  if (!value) return null;

  if (/(breakfast|morning\s*meal|nasta|nashta|নাস্তা|সকালের\s*খাবার)/u.test(value)) {
    return 'BREAKFAST';
  }
  if (/(lunch|noon\s*meal|dupur|dupurer|দুপুর|দুপুরের\s*খাবার)/u.test(value)) {
    return 'LUNCH';
  }
  if (/(dinner|night\s*meal|rat|rater|রাত|রাতের\s*খাবার)/u.test(value)) {
    return 'DINNER';
  }

  return null;
}

export function buildCommandNormalization(text: string): CommandNormalizationBundle {
  const original = collapseWhitespace(text.normalize('NFKC'));
  const normalized = normalizeCommandText(original);

  return {
    original,
    normalized,
    hints: {
      expenseCategory: inferExpenseCategory(null, normalized),
      utilityType: inferUtilityType(null, normalized),
      mealName: inferMealName(normalized),
      hasMoney: /(?:৳|\b\d+(?:\.\d+)?\s*(?:taka|tk|টাকা)\b)/iu.test(
        `${original} ${normalized}`,
      ),
      hasQuantity:
        /\b\d+(?:\.\d+)?\s*(?:kg|g|l|ml|pcs?|কেজি|গ্রাম|লিটার|টা)\b/iu.test(
          `${original} ${normalized}`,
        ),
      mentionsToday: /\btoday\b|আজ/u.test(normalized),
      mentionsYesterday: /\byesterday\b|গতকাল/u.test(normalized),
      mentionsTomorrow: /\btomorrow\b|আগামীকাল/u.test(normalized),
    },
  };
}

function normalizeNameForMatch(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);

  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    for (let j = 1; j <= b.length; j += 1) {
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    previous = current;
  }

  return previous[b.length];
}

function similarity(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) return 0.95;

  const distance = levenshtein(a, b);
  return 1 - distance / Math.max(a.length, b.length);
}

export function resolveMemberName<T extends NamedMember>(
  name: string | null,
  members: T[],
): { member: T | null; ambiguous: boolean } {
  if (!name?.trim()) return { member: null, ambiguous: false };

  const needle = normalizeNameForMatch(name);
  if (!needle) return { member: null, ambiguous: false };

  const prepared = members.map((member) => ({
    member,
    key: normalizeNameForMatch(member.name),
  }));

  const exact = prepared.filter(({ key }) => key === needle);
  if (exact.length === 1) return { member: exact[0].member, ambiguous: false };
  if (exact.length > 1) return { member: null, ambiguous: true };

  const partial = prepared.filter(({ key }) => key.includes(needle) || needle.includes(key));
  if (partial.length === 1) return { member: partial[0].member, ambiguous: false };
  if (partial.length > 1) return { member: null, ambiguous: true };

  // Fuzzy matching helps with small STT spelling errors such as Rahim/Raheem.
  // For very short names, fuzzy matching is intentionally disabled.
  if (needle.length < 4) return { member: null, ambiguous: false };

  const ranked = prepared
    .map(({ member, key }) => ({ member, score: similarity(needle, key) }))
    .sort((a, b) => b.score - a.score);

  const best = ranked[0];
  const second = ranked[1];

  if (!best || best.score < 0.84) return { member: null, ambiguous: false };
  if (second && best.score - second.score < 0.08) {
    return { member: null, ambiguous: true };
  }

  return { member: best.member, ambiguous: false };
}
