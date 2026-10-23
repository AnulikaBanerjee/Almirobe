import { useState } from 'react';
import { BookOpen, ChevronLeft } from 'lucide-react';
import AppPageShell from '@/components/pages/AppPageShell';
import { ARTICLES, type Article } from '@/content/articles';

interface ArticlesPageProps {
  onBack: () => void;
}

export default function ArticlesPage({ onBack }: ArticlesPageProps) {
  const [selected, setSelected] = useState<Article | null>(null);

  if (selected) {
    return (
      <AppPageShell
        title={selected.title}
        subtitle={`By ${selected.author} · ${selected.publishedAt}`}
        icon={BookOpen}
        iconClassName="text-teal-500"
        onBack={() => setSelected(null)}
        wide
      >
        <button
          type="button"
          onClick={() => setSelected(null)}
          className="mb-4 inline-flex items-center gap-1 text-xs text-ink-500 hover:text-ink-800"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          All articles
        </button>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {selected.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wide bg-amber-50 text-ink-500 border border-amber-100"
            >
              {tag}
            </span>
          ))}
        </div>
        <p className="text-sm text-ink-700 leading-relaxed whitespace-pre-wrap">{selected.body}</p>
      </AppPageShell>
    );
  }

  return (
    <AppPageShell
      title="Articles"
      subtitle="Care tips and styling notes from Almirobe"
      icon={BookOpen}
      iconClassName="text-teal-500"
      onBack={onBack}
      wide
    >
      <ul className="space-y-3">
        {ARTICLES.map((article) => (
          <li key={article.id}>
            <button
              type="button"
              onClick={() => setSelected(article)}
              className="w-full text-left rounded-xl border border-amber-100 bg-white/70 px-4 py-3 hover:border-wardrobe-accent-gold/50 hover:bg-amber-50/50 transition-colors"
            >
              <p className="text-sm font-medium text-ink-800">{article.title}</p>
              <p className="text-xs text-ink-500 mt-1">{article.summary}</p>
              <p className="text-[10px] text-ink-400 mt-2 uppercase tracking-wide">
                {article.publishedAt} · {article.author}
              </p>
            </button>
          </li>
        ))}
      </ul>
    </AppPageShell>
  );
}
