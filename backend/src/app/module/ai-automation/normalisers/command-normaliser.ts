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
  hasDepositIntent: boolean;
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

export type InferredExpenseItem = {
  amount: number;
  date: null;
  category: ExpenseCategory | null;
  utilityType: null;
  itemName: string;
  description: null;
  memberName: null;
  quantity: number | null;
  unit: string | null;
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

    // Deposit and dinner variants frequently produced by Banglish typing or STT.
    .replace(/\b(?:joma|zoma|diposit|depojit|deposite)\b/gi, 'deposit')
    .replace(/(?:ডিপোজিট|ডেপোজিট|জমা)/gu, ' deposit ')
    .replace(/\b(?:dinar|diner|dinnar|dinner)\b/gi, 'dinner')
    .replace(/(?:ডিনার|ডীনার)/gu, ' dinner ')

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

export function inferUtilityCommandType(text: string | null): UtilityType | null {
  if (!text?.trim()) return null;
  const value = normalizeForMatching(normalizeCommandText(text));

  if (
    containsAny(value, [
      'electricity bill',
      'electric bill',
      'current bill',
      'current er bill',
      'biddut bill',
      'bidyut bill',
      'বিদ্যুৎ বিল',
      'কারেন্ট বিল',
      'ইলেকট্রিসিটি বিল',
    ])
  ) {
    return 'ELECTRICITY';
  }
  if (
    containsAny(value, [
      'wifi bill',
      'wi fi bill',
      'internet bill',
      'net bill',
      'broadband bill',
      'wifi recharge',
      'internet recharge',
      'ওয়াইফাই বিল',
      'ওয়াইফাই বিল',
      'ইন্টারনেট বিল',
      'নেট বিল',
      'ব্রডব্যান্ড বিল',
    ])
  ) {
    return 'WIFI';
  }
  if (
    containsAny(value, [
      'gas bill',
      'gas er bill',
      'গ্যাস বিল',
      'গ্যাসের বিল',
    ])
  ) {
    return 'GAS';
  }
  if (
    containsAny(value, [
      'water bill',
      'pani bill',
      'panir bill',
      'পানি বিল',
      'পানির বিল',
      'জলের বিল',
    ])
  ) {
    return 'WATER';
  }
  if (
    containsAny(value, [
      'cleaner bill',
      'cleaning bill',
      'cleaner salary',
      'maid bill',
      'maid salary',
      'bua bill',
      'bua salary',
      'ক্লিনার বিল',
      'ক্লিনিং বিল',
      'বুয়া বিল',
      'বুয়া বিল',
      'বুয়ার বেতন',
      'বুয়ার বেতন',
    ])
  ) {
    return 'CLEANING';
  }

  const hasAmountSignal =
    hasExplicitCurrency(value) || /\d+(?:\.\d+)?/u.test(normalizeBanglaDigits(value));
  if (!hasAmountSignal) return null;

  if (
    containsAny(value, [
      'electricity',
      'electric',
      'current',
      'biddut',
      'bidyut',
      'বিদ্যুৎ',
      'কারেন্ট',
    ])
  ) {
    return 'ELECTRICITY';
  }
  if (
    containsAny(value, [
      'wifi',
      'wi fi',
      'internet',
      'broadband',
      'net recharge',
      'ওয়াইফাই',
      'ওয়াইফাই',
      'ইন্টারনেট',
      'ব্রডব্যান্ড',
    ])
  ) {
    return 'WIFI';
  }
  if (
    containsAny(value, [
      'cleaner',
      'cleaning',
      'maid',
      'bua',
      'ক্লিনার',
      'বুয়া',
      'বুয়া',
    ])
  ) {
    return 'CLEANING';
  }

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

const GENERIC_EXPENSE_SUMMARY_NAMES = new Set([
  'bazar',
  'bajar',
  'bazaar',
  'market',
  'grocery',
  'groceries',
  'expense',
  'total',
  'mot',
  'বাজার',
  'খরচ',
  'মোট',
]);

function expenseItemLabel(segment: string): {
  itemName: string;
  quantity: number | null;
  unit: string | null;
} | null {
  const parts = normalizeForMatching(segment)
    .split(/(?:,|;|\/|\b(?:and|ebong|ar)\b|এবং|আর)/u)
    .map((part) => part.trim())
    .filter(Boolean);
  let label = parts.at(-1) ?? '';

  label = label
    .replace(
      /\b(?:today|yesterday|tomorrow|ami|amar|i|we|agke|ajke|gotokal|kal)\b/giu,
      ' ',
    )
    .replace(
      /\b(?:hoice|hoise|hoyeche|hoyese|holo|cost|costs|was|were|is|add|korchi|korechi)\b/giu,
      ' ',
    )
    .replace(/(?:হয়েছে|হইছে|হলো|খরচ হয়েছে|যোগ করো|অ্যাড করো)/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!label) return null;

  const quantityMatch = label.match(
    /^(\d+(?:\.\d+)?)\s*(kg|g|l|ml|pcs?|কেজি|গ্রাম|লিটার|টা)\s+(.+)$/iu,
  );
  if (!quantityMatch) {
    return { itemName: label, quantity: null, unit: null };
  }

  return {
    itemName: quantityMatch[3].trim(),
    quantity: Number(quantityMatch[1]),
    unit: normalizeUnit(quantityMatch[2]),
  };
}

export function reconcileSummaryExpenseItems<
  T extends { itemName: string | null; amount: number | null },
>(items: T[]): T[] {
  if (items.length < 3) return items;
  const [first, ...rest] = items;
  const firstName = normalizeForMatching(first.itemName ?? '');
  const firstAmount = Number(first.amount);
  const restAmounts = rest.map((item) => Number(item.amount));

  if (
    !GENERIC_EXPENSE_SUMMARY_NAMES.has(firstName) ||
    !Number.isFinite(firstAmount) ||
    firstAmount <= 0 ||
    restAmounts.some((amount) => !Number.isFinite(amount) || amount <= 0)
  ) {
    return items;
  }

  const restTotal = restAmounts.reduce((sum, amount) => sum + amount, 0);
  return Math.abs(firstAmount - restTotal) <= 0.01 ? rest : items;
}

export function extractPricedExpenseItems(
  text: string | null,
): InferredExpenseItem[] {
  if (!text?.trim()) return [];
  const normalized = normalizeCommandText(text);
  const pricePattern = /(\d+(?:\.\d+)?)\s*(?:taka|tk)(?=\s|$|[,.;/])/giu;
  const matches = [...normalized.matchAll(pricePattern)];
  if (!matches.length) return [];

  const items: InferredExpenseItem[] = [];
  let previousEnd = 0;
  for (const match of matches) {
    const matchIndex = match.index ?? 0;
    const label = expenseItemLabel(normalized.slice(previousEnd, matchIndex));
    previousEnd = matchIndex + match[0].length;
    const amount = Number(match[1]);
    if (!label?.itemName || !Number.isFinite(amount) || amount <= 0) continue;

    items.push({
      amount,
      date: null,
      category: inferExpenseCategory(label.itemName, null),
      utilityType: null,
      itemName: label.itemName,
      description: null,
      memberName: null,
      quantity: label.quantity,
      unit: label.unit,
    });
  }

  return reconcileSummaryExpenseItems(items);
}

export function inferMealNames(
  text: string | null,
): Array<Exclude<MealName, 'OTHER'>> {
  const value = normalizeForMatching(text ?? '');
  if (!value) return [];
  const matches: Array<Exclude<MealName, 'OTHER'>> = [];

  if (
    containsAny(value, [
      'breakfast',
      'morning meal',
      'nasta',
      'nashta',
      'নাস্তা',
      'সকালের খাবার',
      'সকালের মিল',
    ])
  ) {
    matches.push('BREAKFAST');
  }
  if (
    containsAny(value, [
      'lunch',
      'noon meal',
      'dupur',
      'dupurer',
      'dupurer khabar',
      'দুপুর',
      'দুপুরের খাবার',
      'দুপুরের মিল',
    ])
  ) {
    matches.push('LUNCH');
  }
  if (
    containsAny(value, [
      'dinner',
      'dinar',
      'diner',
      'dinnar',
      'supper',
      'night meal',
      'evening meal',
      'rat',
      'raat',
      'rater',
      'raater',
      'rater khabar',
      'raater khabar',
      'rat er khabar',
      'raat er khabar',
      'রাত',
      'রাতের খাবার',
      'রাত্রের খাবার',
      'রাতের মিল',
      'নৈশভোজ',
      'ডিনার',
    ])
  ) {
    matches.push('DINNER');
  }

  return matches;
}

export function inferMealName(text: string | null): MealName | null {
  return inferMealNames(text)[0] ?? null;
}

export function hasDepositIntent(text: string | null): boolean {
  if (!text?.trim()) return false;
  const value = normalizeForMatching(normalizeCommandText(text));
  return containsAny(value, [
    'deposit',
    'cash deposit',
    'add balance',
    'add fund',
    'add funds',
    'joma',
    'zoma',
    'জমা',
    'ডিপোজিট',
    'ডেপোজিট',
    'ব্যালেন্সে যোগ',
  ]);
}

export function hasExplicitCurrency(text: string | null): boolean {
  if (!text?.trim()) return false;
  return /(?:৳|\b(?:taka|tk)\b|টাকা)/iu.test(text);
}

export function hasPurchaseIntent(text: string | null): boolean {
  if (!text?.trim()) return false;
  return /(?:\b(?:buy|bought|purchase|purchased|spend|spent|paid|bill|expense)\b|কিন|খরচ|দাম|বিল)/iu.test(
    text,
  );
}

export function isSelfReference(value: string | null): boolean {
  if (!value?.trim()) return false;
  const normalized = normalizeForMatching(value);
  return [
    'i',
    'me',
    'my',
    'myself',
    'for me',
    'my account',
    'ami',
    'amar',
    'amake',
    'amar jonno',
    'amar name',
    'nijer',
    'nijer jonno',
    'আমি',
    'আমার',
    'আমাকে',
    'আমার জন্য',
    'আমার নামে',
    'নিজে',
    'নিজের',
    'নিজের জন্য',
  ].includes(normalized);
}

export function inferNumericMoneyAmount(text: string | null): number | null {
  if (!text?.trim()) return null;
  const normalized = normalizeCommandText(text);
  const currencyMatch = normalized.match(
    /(?:৳\s*)?(\d+(?:\.\d+)?)\s*(?:taka|tk|টাকা|৳)/iu,
  );
  if (currencyMatch) return Number(currencyMatch[1]);

  if (!hasDepositIntent(normalized)) return null;
  const numbers = [
    ...new Set(
      [...normalized.matchAll(/\b\d+(?:\.\d+)?\b/gu)].map((match) =>
        Number(match[0]),
      ),
    ),
  ];
  return numbers.length === 1 && numbers[0] > 0 ? numbers[0] : null;
}

export function inferSingleNumericAmount(text: string | null): number | null {
  if (!text?.trim()) return null;
  const normalized = normalizeCommandText(text);
  const numbers = [
    ...new Set(
      [...normalized.matchAll(/\b\d+(?:\.\d+)?\b/gu)].map((match) =>
        Number(match[0]),
      ),
    ),
  ];
  return numbers.length === 1 && numbers[0] > 0 ? numbers[0] : null;
}

export function inferMealServings(text: string | null): number | null {
  if (!text?.trim()) return null;
  const normalized = normalizeCommandText(text).toLocaleLowerCase();
  const explicitCount = normalized.match(
    /(?:^|\s)(\d+(?:\.\d+)?)\s*(?:ta|টি|টা|meal|meals|serving|servings)(?=\s|$|[,.;])/iu,
  );
  if (explicitCount) return Number(explicitCount[1]);

  const mealThenCount = normalized.match(
    /(?:breakfast|lunch|dinner|dinar|diner|ডিনার|নাস্তা|দুপুর|রাত)[^\d]{0,16}(\d+(?:\.\d+)?)/iu,
  );
  return mealThenCount ? Number(mealThenCount[1]) : null;
}

export function inferMealStatus(text: string | null): 'ON' | 'OFF' {
  const normalized = normalizeForMatching(text ?? '');
  return containsAny(normalized, [
    'off',
    'cancel',
    'bondho',
    'bad dao',
    'khabo na',
    'lagbe na',
    'বন্ধ',
    'বাদ দাও',
    'খাব না',
    'লাগবে না',
  ])
    ? 'OFF'
    : 'ON';
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
      hasDepositIntent: hasDepositIntent(normalized),
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

const BANGLA_NAME_TRANSLITERATION: Record<string, string> = {
  অ: 'a',
  আ: 'a',
  ই: 'i',
  ঈ: 'i',
  উ: 'u',
  ঊ: 'u',
  এ: 'e',
  ঐ: 'oi',
  ও: 'o',
  ঔ: 'ou',
  ক: 'k',
  খ: 'kh',
  গ: 'g',
  ঘ: 'gh',
  ঙ: 'ng',
  চ: 'ch',
  ছ: 'chh',
  জ: 'j',
  ঝ: 'jh',
  ঞ: 'n',
  ট: 't',
  ঠ: 'th',
  ড: 'd',
  ঢ: 'dh',
  ণ: 'n',
  ত: 't',
  থ: 'th',
  দ: 'd',
  ধ: 'dh',
  ন: 'n',
  প: 'p',
  ফ: 'f',
  ব: 'b',
  ভ: 'bh',
  ম: 'm',
  য: 'j',
  য়: 'y',
  র: 'r',
  ল: 'l',
  শ: 'sh',
  ষ: 'sh',
  স: 's',
  হ: 'h',
  ড়: 'r',
  ঢ়: 'rh',
  ক্ষ: 'kh',
  'া': 'a',
  'ি': 'i',
  'ী': 'i',
  'ু': 'u',
  'ূ': 'u',
  'ৃ': 'ri',
  'ে': 'e',
  'ৈ': 'oi',
  'ো': 'o',
  'ৌ': 'ou',
  'ং': 'ng',
  'ঃ': 'h',
  'ঁ': 'n',
  '্': '',
};

function phoneticNameTokens(value: string): string[] {
  const transliterated = [...value.normalize('NFKC')]
    .map((character) => BANGLA_NAME_TRANSLITERATION[character] ?? character)
    .join('');

  return normalizeNameForMatch(transliterated)
    .split(' ')
    .map((token) => token.replace(/[aeiouy]/g, ''))
    .filter((token) => token.length >= 2);
}

export function resolveMemberMention<T extends NamedMember>(
  text: string | null,
  members: T[],
): { member: T | null; ambiguous: boolean } {
  if (!text?.trim() || !members.length) {
    return { member: null, ambiguous: false };
  }

  const commandWords = new Set(normalizeNameForMatch(text).split(' '));
  const commandPhonetics = new Set(phoneticNameTokens(text));
  const genericNameTokens = new Set([
    'md',
    'mohammad',
    'mohammed',
    'muhammad',
    'sheikh',
    'sk',
  ]);

  const candidates = members.filter((member) => {
    const nameWords = normalizeNameForMatch(member.name)
      .split(' ')
      .filter((word) => word.length >= 3 && !genericNameTokens.has(word));
    if (
      nameWords.some((word) =>
        [...commandWords].some(
          (commandWord) =>
            commandWord === word || commandWord.startsWith(word),
        ),
      )
    ) {
      return true;
    }

    return phoneticNameTokens(member.name).some((token) =>
      token.length >= 3 &&
      [...commandPhonetics].some(
        (commandToken) =>
          commandToken === token || commandToken.startsWith(token),
      ),
    );
  });

  if (candidates.length === 1) {
    return { member: candidates[0], ambiguous: false };
  }
  return { member: null, ambiguous: candidates.length > 1 };
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

  // Cross-script phonetic matching supports names such as নাজমুল/Najmul and
  // রহিম/Rahim without allowing a match outside the current mess.
  const needlePhonetics = phoneticNameTokens(name);
  if (needlePhonetics.length) {
    const phonetic = prepared.filter(({ member }) => {
      const memberPhonetics = phoneticNameTokens(member.name);
      return needlePhonetics.every((token) => memberPhonetics.includes(token));
    });
    if (phonetic.length === 1) {
      return { member: phonetic[0].member, ambiguous: false };
    }
    if (phonetic.length > 1) return { member: null, ambiguous: true };
  }

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
