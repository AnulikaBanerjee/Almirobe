/**
 * Maps spoken wardrobe phrases (English misspellings, Hindi, Bengali, Kannada,
 * and common romanized forms) onto the English words the form parser understands.
 * Longer phrases are applied first.
 */
const PHRASES: Array<[string, string]> = [
  // Sleeve / neck — English variants the recognizer often emits
  ['three quarter sleeve', 'full sleeve'],
  ['three-quarter sleeve', 'full sleeve'],
  ['three quarter sleeves', 'full sleeve'],
  ['full sleeves', 'full sleeve'],
  ['long sleeves', 'full sleeve'],
  ['fullsleeve', 'full sleeve'],
  ['fullsleeves', 'full sleeve'],
  ['fullsleave', 'full sleeve'],
  ['fullsleaves', 'full sleeve'],
  ['halfsleave', 'half sleeve'],
  ['halfsleaves', 'half sleeve'],
  ['longsleeve', 'full sleeve'],
  ['half sleeves', 'half sleeve'],
  ['short sleeves', 'half sleeve'],
  ['halfsleeve', 'half sleeve'],
  ['shortsleeve', 'half sleeve'],
  ['short sleeve', 'half sleeve'],
  ['without sleeves', 'sleeveless'],
  ['without sleeve', 'sleeveless'],
  ['no sleeves', 'sleeveless'],
  ['no sleeve', 'sleeveless'],
  ['sleave', 'sleeve'],
  ['sleaves', 'sleeve'],
  ['sleevs', 'sleeve'],
  ['mandarin collar', 'chinese collar'],
  ['band collar', 'chinese collar'],
  ['crew neck', 'round neck'],
  ['vee neck', 'v neck'],
  ['v-neck', 'v neck'],

  // Hindi — sleeves
  ['फुल स्लीव', 'full sleeve'],
  ['फूल स्लीव', 'full sleeve'],
  ['पूरी बाजू', 'full sleeve'],
  ['पूरी बांह', 'full sleeve'],
  ['पूरी स्लीव', 'full sleeve'],
  ['फुल बाजू', 'full sleeve'],
  ['लंबी बाजू', 'full sleeve'],
  ['लम्बी बाजू', 'full sleeve'],
  ['हाफ स्लीव', 'half sleeve'],
  ['हाफ़ स्लीव', 'half sleeve'],
  ['आधी बाजू', 'half sleeve'],
  ['आधी बांह', 'half sleeve'],
  ['हाफ बाजू', 'half sleeve'],
  ['छोटी बाजू', 'half sleeve'],
  ['बिना बाजू', 'sleeveless'],
  ['बिना स्लीव', 'sleeveless'],
  ['स्लीवलेस', 'sleeveless'],
  ['चाइनीज कॉलर', 'chinese collar'],
  ['गोल गला', 'round neck'],
  ['वी नेक', 'v neck'],

  // Hindi — romanized
  ['poori baju', 'full sleeve'],
  ['puri baju', 'full sleeve'],
  ['poori baaju', 'full sleeve'],
  ['puri baaju', 'full sleeve'],
  ['lambi baju', 'full sleeve'],
  ['full baju', 'full sleeve'],
  ['aadhi baju', 'half sleeve'],
  ['adhi baju', 'half sleeve'],
  ['aadhi baaju', 'half sleeve'],
  ['half baju', 'half sleeve'],
  ['chhoti baju', 'half sleeve'],
  ['choti baju', 'half sleeve'],
  ['bina baju', 'sleeveless'],
  ['bina sleeve', 'sleeveless'],
  ['sleeve nahi', 'sleeveless'],
  ['bina baaju', 'sleeveless'],

  // Bengali — sleeves
  ['ফুল স্লিভ', 'full sleeve'],
  ['লং স্লিভ', 'full sleeve'],
  ['পুরো হাতা', 'full sleeve'],
  ['লম্বা হাতা', 'full sleeve'],
  ['হাফ স্লিভ', 'half sleeve'],
  ['আধা হাতা', 'half sleeve'],
  ['ছোট হাতা', 'half sleeve'],
  ['বিনা হাতা', 'sleeveless'],
  ['হাতা ছাড়া', 'sleeveless'],
  ['স্লিভলেস', 'sleeveless'],
  ['চাইনিজ কলার', 'chinese collar'],
  ['গোল গলা', 'round neck'],

  // Bengali — romanized
  ['puro hata', 'full sleeve'],
  ['lomba hata', 'full sleeve'],
  ['full hata', 'full sleeve'],
  ['adha hata', 'half sleeve'],
  ['half hata', 'half sleeve'],
  ['bina hata', 'sleeveless'],
  ['hata chara', 'sleeveless'],

  // Kannada — sleeves
  ['ಫುಲ್ ಸ್ಲೀವ್', 'full sleeve'],
  ['ಪೂರ್ಣ ತೋಳು', 'full sleeve'],
  ['ಉದ್ದ ತೋಳು', 'full sleeve'],
  ['ಹಾಫ್ ಸ್ಲೀವ್', 'half sleeve'],
  ['ಅರ್ಧ ತೋಳು', 'half sleeve'],
  ['ತೋಳಿಲ್ಲದ', 'sleeveless'],
  ['ಸ್ಲೀವ್ ಇಲ್ಲದ', 'sleeveless'],
  ['ಸ್ಲೀವ್ಲೆಸ್', 'sleeveless'],
  ['ಚೈನೀಸ್ ಕಾಲರ್', 'chinese collar'],
  ['ರೌಂಡ್ ನೆಕ್', 'round neck'],

  // Kannada — romanized
  ['poorna tholu', 'full sleeve'],
  ['udda tholu', 'full sleeve'],
  ['full tholu', 'full sleeve'],
  ['ardha tholu', 'half sleeve'],
  ['half tholu', 'half sleeve'],
  ['tholu illa', 'sleeveless'],
  ['tholu illade', 'sleeveless'],

  // Types — Hindi
  ['टी शर्ट', 't-shirt'],
  ['टी-शर्ट', 't-shirt'],
  ['टीशर्ट', 't-shirt'],
  ['फॉर्मल पैंट', 'formal pant'],
  ['हाफ पैंट', 'half pant'],
  ['कमीज', 'shirt'],
  ['शर्ट', 'shirt'],
  ['कुर्ता', 'kurta'],
  ['कुर्ती', 'kurti'],
  ['साड़ी', 'saree'],
  ['साडी', 'saree'],
  ['ड्रेस', 'dress'],
  ['जींस', 'jeans'],
  ['पैंट', 'pants'],
  ['स्कर्ट', 'skirt'],
  ['जैकेट', 'jacket'],
  ['स्वेटर', 'sweater'],
  ['हुडी', 'sweater'],
  ['जूते', 'shoes'],
  ['जूता', 'shoes'],
  ['सैंडल', 'sandals'],
  ['हील्स', 'heels'],
  ['स्नीकर्स', 'sneakers'],
  ['बैग', 'bag'],
  ['गहने', 'jewellery'],

  // Types — Bengali
  ['টি শার্ট', 't-shirt'],
  ['টিশার্ট', 't-shirt'],
  ['ফরমাল প্যান্ট', 'formal pant'],
  ['হাফ প্যান্ট', 'half pant'],
  ['শার্ট', 'shirt'],
  ['কুর্তা', 'kurta'],
  ['কুর্তি', 'kurti'],
  ['শাড়ি', 'saree'],
  ['শাড়ি', 'saree'],
  ['ড্রেস', 'dress'],
  ['জিন্স', 'jeans'],
  ['প্যান্ট', 'pants'],
  ['স্কার্ট', 'skirt'],
  ['জ্যাকেট', 'jacket'],
  ['স্যুয়েটার', 'sweater'],
  ['জুতা', 'shoes'],
  ['স্যান্ডেল', 'sandals'],
  ['হিল', 'heels'],
  ['স্নিকার', 'sneakers'],
  ['ব্যাগ', 'bag'],

  // Types — Kannada
  ['ಟಿ ಶರ್ಟ್', 't-shirt'],
  ['ಟಿಶರ್ಟ್', 't-shirt'],
  ['ಫಾರ್ಮಲ್ ಪ್ಯಾಂಟ್', 'formal pant'],
  ['ಹಾಫ್ ಪ್ಯಾಂಟ್', 'half pant'],
  ['ಶರ್ಟ್', 'shirt'],
  ['ಕುರ್ತಾ', 'kurta'],
  ['ಕುರ್ತಿ', 'kurti'],
  ['ಸೀರೆ', 'saree'],
  ['ಡ್ರೆಸ್', 'dress'],
  ['ಜೀನ್ಸ್', 'jeans'],
  ['ಪ್ಯಾಂಟ್', 'pants'],
  ['ಸ್ಕರ್ಟ್', 'skirt'],
  ['ಜಾಕೆಟ್', 'jacket'],
  ['ಸ್ವೆಟರ್', 'sweater'],
  ['ಶೂ', 'shoes'],
  ['ಸ್ಯಾಂಡಲ್', 'sandals'],
  ['ಹೀಲ್ಸ್', 'heels'],
  ['ಸ್ನೀಕರ್', 'sneakers'],
  ['ಬ್ಯಾಗ್', 'bag'],

  // Romanized types
  ['t shirt', 't-shirt'],
  ['tee shirt', 't-shirt'],
  ['formal pant', 'formal pant'],
  ['half pant', 'half pant'],

  // Colors — Hindi
  ['आसमानी', 'sky blue'],
  ['स्काई ब्लू', 'sky blue'],
  ['नेवी ब्लू', 'navy'],
  ['नेवी', 'navy'],
  ['मैरून', 'maroon'],
  ['मरून', 'maroon'],
  ['बेज', 'beige'],
  ['क्रीम', 'cream'],
  ['खाकी', 'khaki'],
  ['नारंगी', 'orange'],
  ['संतरी', 'orange'],
  ['गुलाबी', 'pink'],
  ['पीला', 'yellow'],
  ['भूरा', 'brown'],
  ['स्लेटी', 'grey'],
  ['सफेद', 'white'],
  ['सफ़ेद', 'white'],
  ['काला', 'black'],
  ['नीला', 'blue'],
  ['लाल', 'red'],
  ['हरा', 'green'],
  ['बैंगनी', 'purple'],

  // Colors — Bengali
  ['আকাশি', 'sky blue'],
  ['নেভি', 'navy'],
  ['মেরুন', 'maroon'],
  ['বেইজ', 'beige'],
  ['ক্রিম', 'cream'],
  ['খাকি', 'khaki'],
  ['কমলা', 'orange'],
  ['গোলাপি', 'pink'],
  ['হলুদ', 'yellow'],
  ['বাদামি', 'brown'],
  ['ধূসর', 'grey'],
  ['সাদা', 'white'],
  ['কালো', 'black'],
  ['নীল', 'blue'],
  ['লাল', 'red'],
  ['সবুজ', 'green'],
  ['বেগুনি', 'purple'],

  // Colors — Kannada
  ['ಆಕಾಶ ನೀಲಿ', 'sky blue'],
  ['ನೇವಿ', 'navy'],
  ['ಮೆರೂನ್', 'maroon'],
  ['ಬೇಜ್', 'beige'],
  ['ಕ್ರೀಮ್', 'cream'],
  ['ಖಾಕಿ', 'khaki'],
  ['ಕಿತ್ತಳೆ', 'orange'],
  ['ಗುಲಾಬಿ', 'pink'],
  ['ಹಳದಿ', 'yellow'],
  ['ಕಂದು', 'brown'],
  ['ಬೂದು', 'grey'],
  ['ಬಿಳಿ', 'white'],
  ['ಶ್ವೇತ', 'white'],
  ['ಕಪ್ಪು', 'black'],
  ['ನೀಲಿ', 'blue'],
  ['ಕೆಂಪು', 'red'],
  ['ಹಸಿರು', 'green'],
  ['ನೇರಳೆ', 'purple'],

  // Romanized colors
  ['sky blue', 'sky blue'],
  ['aasmani', 'sky blue'],
  ['neela', 'blue'],
  ['nila', 'blue'],
  ['neeli', 'blue'],
  ['laal', 'red'],
  ['lal', 'red'],
  ['hara', 'green'],
  ['sabuj', 'green'],
  ['hasiru', 'green'],
  ['safed', 'white'],
  ['safaid', 'white'],
  ['shada', 'white'],
  ['sada', 'white'],
  ['bili', 'white'],
  ['kaala', 'black'],
  ['kala', 'black'],
  ['kalo', 'black'],
  ['kappu', 'black'],
  ['peela', 'yellow'],
  ['holud', 'yellow'],
  ['haladi', 'yellow'],
  ['bhura', 'brown'],
  ['badami', 'brown'],
  ['kandu', 'brown'],
  ['narangi', 'orange'],
  ['komola', 'orange'],
  ['kittale', 'orange'],
  ['gulabi', 'pink'],
  ['golapi', 'pink'],

  // Occasion
  ['ऑफिस', 'office'],
  ['ऑफ़िस', 'office'],
  ['पार्टी', 'party'],
  ['घर', 'house'],
  ['कैजुअल', 'casual'],
  ['एथनिक', 'ethnic'],
  ['त्योहार', 'festive'],
  ['অফিস', 'office'],
  ['পার্টি', 'party'],
  ['বাড়ি', 'house'],
  ['ক্যাজুয়াল', 'casual'],
  ['উৎসব', 'festive'],
  ['ಆಫೀಸ್', 'office'],
  ['ಪಾರ್ಟಿ', 'party'],
  ['ಮನೆ', 'house'],
  ['ಹಬ್ಬ', 'festive'],
  ['ghar', 'house'],
  ['bari', 'house'],
  ['mane', 'house'],
  ['daftar', 'office'],

  // Weather
  ['गर्मी', 'summer'],
  ['गर्म', 'summer'],
  ['बरसात', 'monsoon'],
  ['बारिश', 'monsoon'],
  ['सर्दी', 'winter'],
  ['ঠান্ডা', 'winter'],
  ['গরম', 'summer'],
  ['বৃষ্টি', 'monsoon'],
  ['বর্ষা', 'monsoon'],
  ['শীত', 'winter'],
  ['ಬೇಸಿಗೆ', 'summer'],
  ['ಮಳೆ', 'monsoon'],
  ['ಚಳಿಗಾಲ', 'winter'],
  ['garmi', 'summer'],
  ['barish', 'monsoon'],
  ['sardi', 'winter'],
  ['gorom', 'summer'],
  ['brishti', 'monsoon'],
  ['sheet', 'winter'],
  ['beesige', 'summer'],
  ['malege', 'monsoon'],

  // Size / shelf / brand words so the English regexes can see them
  ['साइज़', 'size'],
  ['साइज', 'size'],
  ['সাইজ', 'size'],
  ['ಗಾತ್ರ', 'size'],
  ['शेल्फ', 'shelf'],
  ['তাক', 'shelf'],
  ['ಶೆಲ್ಫ್', 'shelf'],
  ['ब्रांड', 'brand'],
  ['ব্র্যান্ড', 'brand'],
  ['ಬ್ರಾಂಡ್', 'brand'],
];

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

let compiled: Array<{ re: RegExp; to: string }> | null = null;

function patterns(): Array<{ re: RegExp; to: string }> {
  if (compiled) return compiled;
  const unique = new Map<string, string>();
  for (const [from, to] of PHRASES) {
    const key = from.trim().toLowerCase();
    if (!unique.has(key)) unique.set(key, to);
  }
  compiled = [...unique.entries()]
    .sort((a, b) => b[0].length - a[0].length)
    .map(([from, to]) => {
      const latin = /^[\u0000-\u007F]+$/.test(from);
      const body = escapeRegExp(from);
      return {
        re: new RegExp(latin ? `(?<![a-z0-9])${body}(?![a-z0-9])` : body, 'giu'),
        to: ` ${to} `,
      };
    });
  return compiled;
}

/** Rewrite a transcript into English catalog words, keeping unrecognized speech. */
export function toEnglishUtterance(text: string): string {
  const cleaned = text
    .normalize('NFC')
    .replace(/[-–—]/g, ' ')
    .replace(/[.,/#!$%^&*;:{}=_`~()?।॥]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return '';
  let out = ` ${cleaned} `;
  for (const { re, to } of patterns()) {
    out = out.replace(re, to);
  }
  return out.replace(/\s+/g, ' ').trim();
}
