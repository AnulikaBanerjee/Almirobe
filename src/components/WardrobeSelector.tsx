import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import type { WardrobeCollection } from '@/types';
import { getWardrobeIcon } from '@/wardrobeIcons';

interface WardrobeSelectorProps {
  collections: WardrobeCollection[];
  activeId: string;
  onSelect: (id: string) => void;
  onAddNew: () => void;
  itemCounts: Record<string, number>;
}

export default function WardrobeSelector({ collections, activeId, onSelect, onAddNew, itemCounts }: WardrobeSelectorProps) {
  return (
    <div className="flex items-center gap-3">
      {/* Left arrow */}
      <button
        onClick={() => {
          const idx = collections.findIndex((c) => c.id === activeId);
          const prevIdx = (idx - 1 + collections.length) % collections.length;
          onSelect(collections[prevIdx].id);
        }}
        className="flex-shrink-0 w-9 h-9 rounded-full border border-ink-700 bg-ink-800/60 text-ink-400 hover:text-ink-100 hover:border-ink-600 hover:bg-ink-700/60 transition-all flex items-center justify-center"
        aria-label="Previous wardrobe"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Carousel tabs */}
      <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar px-1 py-1">
        {collections.map((collection) => {
          const Icon = getWardrobeIcon(collection.icon);
          const isActive = collection.id === activeId;
          const count = itemCounts[collection.id] ?? 0;

          return (
            <button
              key={collection.id}
              onClick={() => onSelect(collection.id)}
              className={`group flex items-center gap-2.5 px-4 py-2.5 rounded-xl border transition-all whitespace-nowrap ${
                isActive
                  ? 'border-wardrobe-accent-gold/50 bg-gradient-to-b from-wardrobe-accent-gold/15 to-wardrobe-accent-gold/5 shadow-lg shadow-wardrobe-accent-gold/10'
                  : 'border-ink-700/50 bg-ink-800/40 hover:border-ink-600 hover:bg-ink-800/70'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                isActive
                  ? 'bg-gradient-to-br from-wardrobe-accent-gold to-amber-700 text-ink-900'
                  : 'bg-ink-700/50 text-ink-400 group-hover:text-ink-200'
              }`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className={`text-sm font-medium leading-tight ${isActive ? 'text-ink-50' : 'text-ink-300'}`}>
                  {collection.name}
                </p>
                <p className="text-[10px] text-ink-500 leading-tight">
                  {count} {count === 1 ? 'piece' : 'pieces'}
                </p>
              </div>
            </button>
          );
        })}

        {/* Add new wardrobe button */}
        <button
          onClick={onAddNew}
          className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-dashed border-ink-600 text-ink-500 hover:text-wardrobe-accent-gold hover:border-wardrobe-accent-gold/40 transition-all whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm font-medium">New Wardrobe</span>
        </button>
      </div>

      {/* Right arrow */}
      <button
        onClick={() => {
          const idx = collections.findIndex((c) => c.id === activeId);
          const nextIdx = (idx + 1) % collections.length;
          onSelect(collections[nextIdx].id);
        }}
        className="flex-shrink-0 w-9 h-9 rounded-full border border-ink-700 bg-ink-800/60 text-ink-400 hover:text-ink-100 hover:border-ink-600 hover:bg-ink-700/60 transition-all flex items-center justify-center"
        aria-label="Next wardrobe"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
