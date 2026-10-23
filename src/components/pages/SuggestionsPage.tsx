import { ExternalLink, ShoppingBag, Sparkles } from 'lucide-react';
import AppPageShell from '@/components/pages/AppPageShell';

interface SuggestionsPageProps {
  onBack: () => void;
}

const PLACEHOLDER_SUGGESTIONS = [
  {
    id: '1',
    title: 'Linen blend shirt — ivory',
    store: 'Myntra',
    reason: 'Matches 4 neutrals in your Work wardrobe',
    price: '₹1,799',
    tag: 'Tops',
  },
  {
    id: '2',
    title: 'Wide-leg trousers — charcoal',
    store: 'Ajio',
    reason: 'Pairs with blazers you wear most',
    price: '₹2,249',
    tag: 'Bottoms',
  },
  {
    id: '3',
    title: 'Block-heel sandals — tan',
    store: 'Nykaa Fashion',
    reason: 'Fills a gap in warm-weather footwear',
    price: '₹3,100',
    tag: 'Footwear',
  },
  {
    id: '4',
    title: 'Cotton kurta — indigo print',
    store: 'Amazon',
    reason: 'Similar to prints you saved in Looks',
    price: '₹1,299',
    tag: 'Ethnic',
  },
  {
    id: '5',
    title: 'Lightweight bomber — olive',
    store: 'Flipkart',
    reason: 'Layer for transitional weather in your closet',
    price: '₹2,599',
    tag: 'Outerwear',
  },
  {
    id: '6',
    title: 'Silk scarf — rust floral',
    store: 'Ajio',
    reason: 'Accent for your existing monochrome sets',
    price: '₹899',
    tag: 'Accessories',
  },
];

export default function SuggestionsPage({ onBack }: SuggestionsPageProps) {
  return (
    <AppPageShell
      title="Suggestions"
      subtitle="Ideas inspired by your wardrobe — coming soon with live store results"
      icon={ShoppingBag}
      iconClassName="text-rose-500"
      onBack={onBack}
      wide
    >
      <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-200/70 bg-amber-50/70 px-3 py-2.5 text-xs text-[#6b5a48]">
        <Sparkles className="w-4 h-4 text-wardrobe-accent-gold shrink-0 mt-0.5" />
        <p>
          Static preview. Live suggestions from partner sites will use your wardrobe colors,
          categories, and Looks once product feeds are connected.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {PLACEHOLDER_SUGGESTIONS.map((item) => (
          <article
            key={item.id}
            className="rounded-xl border border-amber-100 bg-white/70 overflow-hidden flex flex-col"
          >
            <div className="aspect-[4/3] bg-gradient-to-br from-amber-100 via-[#f4ead8] to-rose-100 relative">
              <span className="absolute top-2 left-2 text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-white/80 text-ink-600 border border-amber-100">
                {item.tag}
              </span>
              <div className="absolute inset-0 flex items-center justify-center text-ink-300">
                <ShoppingBag className="w-10 h-10 opacity-40" />
              </div>
            </div>
            <div className="p-3 flex flex-col flex-1">
              <p className="text-sm font-medium text-ink-800 leading-snug">{item.title}</p>
              <p className="text-[11px] text-ink-500 mt-1">{item.reason}</p>
              <div className="mt-auto pt-3 flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-ink-800">{item.price}</p>
                  <p className="text-[10px] text-ink-400">{item.store}</p>
                </div>
                <button
                  type="button"
                  disabled
                  className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-lg border border-amber-200 text-ink-400 cursor-not-allowed"
                  title="Store links coming soon"
                >
                  View
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </AppPageShell>
  );
}
