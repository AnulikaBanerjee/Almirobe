import { toEnglishUtterance } from '@/voice/lexicon';

export interface ParsedSpeechFields {
  productType?: string;
  subtype?: string;
  color?: string;
  occasion?: string;
  weather?: string;
  brand?: string;
  size?: string;
  shelfIndex?: number;
  suggestedName?: string;
  /** Transcript rewritten into English catalog words. */
  normalized?: string;
}

const TYPE_ALIASES: Record<string, string> = {
  't-shirt': 't-shirt',
  tshirt: 't-shirt',
  't shirt': 't-shirt',
  tee: 't-shirt',
  'formal pant': 'formal-pant',
  'formal pants': 'formal-pant',
  trousers: 'formal-pant',
  'half pant': 'half-pant',
  shorts: 'half-pant',
  shirt: 'shirt',
  kurta: 'kurta',
  kurti: 'kurti',
  saree: 'saree',
  sari: 'saree',
  dress: 'dress',
  jeans: 'jeans',
  pants: 'formal-pant',
  pant: 'formal-pant',
  skirt: 'skirt',
  jacket: 'jacket',
  sweater: 'sweater',
  hoodie: 'sweater',
  shoes: 'shoes',
  sandals: 'sandals',
  heels: 'heels',
  sneakers: 'sneakers',
  trainers: 'sneakers',
  bag: 'bag',
  jewellery: 'jewellery',
  jewelry: 'jewellery',
  कमीज: 'shirt',
  शर्ट: 'shirt',
  कुर्ता: 'kurta',
  कुर्ती: 'kurti',
  साड़ी: 'saree',
  जींस: 'jeans',
  जूते: 'shoes',
  শার্ট: 'shirt',
  জিন্স: 'jeans',
  শাড়ি: 'saree',
  ಶರ್ಟ್: 'shirt',
  ಜೀನ್ಸ್: 'jeans',
};

const SUBTYPE_ALIASES: Record<string, string> = {
  'full sleeve': 'full-sleeve',
  'long sleeve': 'full-sleeve',
  'half sleeve': 'half-sleeve',
  sleeveless: 'sleeveless',
  'chinese collar': 'chinese-collar',
  collar: 'collar',
  'round neck': 'round-neck',
  'v neck': 'v-neck',
  chinos: 'chinos',
  jeggings: 'jeggings',
  kolhapuri: 'kolhapuri',
};

const OCCASION_ALIASES: Record<string, string> = {
  office: 'office',
  work: 'office',
  party: 'party',
  house: 'house',
  home: 'house',
  ghar: 'house',
  casual: 'casual',
  ethnic: 'ethnic',
  festive: 'festive',
  ऑफिस: 'office',
  पार्टी: 'party',
  घर: 'house',
  ঘর: 'house',
  ಆಫೀಸ್: 'office',
};

const WEATHER_ALIASES: Record<string, string> = {
  summer: 'summer',
  monsoon: 'monsoon',
  rainy: 'monsoon',
  rain: 'monsoon',
  winter: 'winter',
  all: 'all',
  गर्मी: 'summer',
  बरसात: 'monsoon',
  सर्दी: 'winter',
};

const COLOR_ALIASES: Record<string, string> = {
  'sky blue': 'sky blue',
  'navy blue': 'navy',
  rust: 'rust',
  orange: 'orange',
  mustard: 'mustard',
  maroon: 'maroon',
  beige: 'beige',
  cream: 'cream',
  brown: 'brown',
  tan: 'tan',
  khaki: 'khaki',
  white: 'white',
  black: 'black',
  navy: 'navy',
  blue: 'blue',
  red: 'red',
  green: 'green',
  pink: 'pink',
  grey: 'grey',
  gray: 'grey',
  yellow: 'yellow',
  purple: 'purple',
  neela: 'blue',
  nila: 'blue',
  laal: 'red',
  lal: 'red',
  hara: 'green',
  safed: 'white',
  kaala: 'black',
  kala: 'black',
  peela: 'yellow',
  bhura: 'brown',
  narangi: 'orange',
  सफेद: 'white',
  काला: 'black',
  नीला: 'blue',
  लाल: 'red',
  हरा: 'green',
  भूरा: 'brown',
  नारंगी: 'orange',
};

function firstMatch(text: string, table: Record<string, string>): string | undefined {
  const keys = Object.keys(table).sort((a, b) => b.length - a.length);
  for (const alias of keys) {
    const needle = alias.toLowerCase();
    if (/[a-z0-9]/.test(needle)) {
      const re = new RegExp(`(?:^|\\s)${needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:\\s|$)`, 'i');
      if (re.test(text)) return table[alias];
    } else if (text.includes(alias)) {
      return table[alias];
    }
  }
  return undefined;
}

function titleCase(value: string): string {
  return value.replace(/\b\w/g, (c) => c.toUpperCase());
}

export function suggestedItemName(parsed: ParsedSpeechFields): string | undefined {
  const subtype = parsed.subtype?.replace(/-/g, ' ');
  const parts = [parsed.color, subtype, parsed.productType].filter(Boolean);
  if (parts.length > 0) {
    return titleCase(parts.join(' '));
  }
  return undefined;
}

/** How many wardrobe fields a transcript would fill. Used to pick the best speech alternative. */
export function scoreUtterance(text: string): number {
  const parsed = parseUtterance(text);
  let score = 0;
  if (parsed.subtype) score += 5;
  if (parsed.productType) score += 3;
  if (parsed.color) score += 2;
  if (parsed.occasion) score += 1;
  if (parsed.weather) score += 1;
  if (parsed.size) score += 1;
  return score;
}

export function parseUtterance(text: string): ParsedSpeechFields {
  const normalized = toEnglishUtterance(text);
  const result: ParsedSpeechFields = { normalized };
  result.productType = firstMatch(normalized, TYPE_ALIASES);
  result.subtype = firstMatch(normalized, SUBTYPE_ALIASES);
  result.occasion = firstMatch(normalized, OCCASION_ALIASES);
  result.weather = firstMatch(normalized, WEATHER_ALIASES);
  result.color = firstMatch(normalized, COLOR_ALIASES);

  const sizeMatch = normalized.match(/\bsize\s*(xs|s|m|l|xl|xxl|\d+)\b/i);
  if (sizeMatch) result.size = sizeMatch[1];

  const shelfMatch = normalized.match(/\bshelf\s*(\d+)/i);
  if (shelfMatch) {
    const n = Number(shelfMatch[1]);
    if (!Number.isNaN(n) && n > 0) result.shelfIndex = n - 1;
  }

  const brandMatch = normalized.match(/\bbrand\s+([a-z][a-z0-9]+)/i);
  if (brandMatch) result.brand = brandMatch[1];

  result.suggestedName = suggestedItemName(result);
  return result;
}
