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
        className="flex-shrink-0 w-9 h-9 rounded-full border border-amber-200/80 bg-white/80 text-ink-500 hover:text-ink-800 hover:border-wardrobe-accent-gold/50 hover:bg-white transition-all flex items-center justify-center"
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
                  ? 'border-wardrobe-accent-gold/60 bg-white shadow-lg shadow-wardrobe-accent-gold/15'
                  : 'border-amber-200/70 bg-white/50 hover:border-wardrobe-accent-gold/40 hover:bg-white'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                isActive
                  ? 'bg-gradient-to-br from-wardrobe-accent-gold to-amber-700 text-ink-900'
                  : 'bg-amber-50 text-ink-400 group-hover:text-ink-600'
              }`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className={`text-sm font-medium leading-tight ${isActive ? 'text-ink-800' : 'text-ink-600'}`}>
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
          className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-dashed border-amber-300 text-ink-500 hover:text-amber-800 hover:border-wardrobe-accent-gold/60 bg-white/40 transition-all whitespace-nowrap"
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
        className="flex-shrink-0 w-9 h-9 rounded-full border border-amber-200/80 bg-white/80 text-ink-500 hover:text-ink-800 hover:border-wardrobe-accent-gold/50 hover:bg-white transition-all flex items-center justify-center"
        aria-label="Next wardrobe"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
