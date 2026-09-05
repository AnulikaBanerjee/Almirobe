import { Sparkles, Plus, ArrowLeft } from 'lucide-react';
import { getLookMemberIds } from '@/looks';
import type { WardrobeItem, WardrobeCollection, Look } from '@/types';

interface LooksGalleryProps {
  looks: Look[];
  allItems: WardrobeItem[];
  allCollections: WardrobeCollection[];
  onViewLook: (look: Look) => void;
  onCreateLook: () => void;
  onBack: () => void;
}

function findCollection(collections: WardrobeCollection[], collectionId: string): WardrobeCollection | undefined {
  return collections.find((c) => c.id === collectionId);
}

function findCategoryLabel(collection: WardrobeCollection | undefined, categoryId: string): string {
  return collection?.categories.find((c) => c.id === categoryId)?.label ?? 'Uncategorized';
}

function getLookItems(look: Look, allItems: WardrobeItem[]): WardrobeItem[] {
  return getLookMemberIds(look)
    .map((id) => allItems.find((i) => i.id === id))
    .filter((i): i is WardrobeItem => i !== undefined);
}

function LookCard({ look, allItems, allCollections, onClick }: {
  look: Look;
  allItems: WardrobeItem[];
  allCollections: WardrobeCollection[];
  onClick: () => void;
}) {
  const lookItems = getLookItems(look, allItems);
  const primaryItem = lookItems[0];

  return (
    <button
      onClick={onClick}
      className="group text-left rounded-2xl overflow-hidden border border-ink-700/50 hover:border-wardrobe-accent-gold/40 bg-ink-800/40 hover:bg-ink-800/70 transition-all hover:shadow-xl hover:shadow-wardrobe-accent-gold/10 animate-fade-in-up"
    >
      {/* Visual collage of items */}
      <div className="relative aspect-[4/3] bg-gradient-to-br from-ink-900 to-ink-800 overflow-hidden">
        {lookItems.length > 0 ? (
          <div className="absolute inset-0 grid grid-cols-2 gap-px">
            {lookItems.slice(0, 4).map((item, idx) => (
              <div
                key={item.id}
                className="relative overflow-hidden"
                style={{
                  gridColumn: lookItems.length === 1 ? 'span 2' : undefined,
                  gridRow: lookItems.length === 1 ? 'span 2' : undefined,
                }}
              >
                {item.imageData ? (
                  <img src={item.imageData} alt={item.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                ) : (
                  <div
                    className="w-full h-full transition-transform group-hover:scale-105"
                    style={{ backgroundColor: item.colorHex }}
                  />
                )}
                {/* Gradient overlay for label readability */}
                {idx === 0 && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <Sparkles className="w-8 h-8 text-ink-700" />
          </div>
        )}

        {/* Look name overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent">
          <h3 className="text-base font-serif text-ink-50 leading-tight">{look.name}</h3>
          <p className="text-[11px] text-ink-300 mt-0.5">{lookItems.length} items</p>
        </div>
      </div>

      {/* Item list preview */}
      <div className="p-3">
        <div className="flex flex-wrap gap-1.5">
          {lookItems.slice(0, 5).map((item) => {
            const collection = findCollection(allCollections, item.collectionId);
            return (
              <span
                key={item.id}
                className="text-[10px] px-2 py-0.5 rounded-full bg-ink-900/60 border border-ink-700/40 text-ink-400"
              >
                {findCategoryLabel(collection, item.categoryId)}
              </span>
            );
          })}
          {lookItems.length > 5 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-ink-900/60 border border-ink-700/40 text-ink-500">
              +{lookItems.length - 5} more
            </span>
          )}
        </div>
        {primaryItem && (
          <p className="text-xs text-ink-500 mt-2">
            Main piece: <span className="text-ink-300">{primaryItem.name}</span>
          </p>
        )}
      </div>
    </button>
  );
}

export default function LooksGallery({
  looks, allItems, allCollections, onViewLook, onCreateLook, onBack,
}: LooksGalleryProps) {
  // Sort looks by most recent first
  const sortedLooks = [...looks].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6">
      {/* Header row */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-full border border-ink-700 bg-ink-800/60 text-ink-400 hover:text-ink-100 hover:border-ink-600 hover:bg-ink-700/60 transition-all flex items-center justify-center"
            aria-label="Back to wardrobes"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-2xl font-serif text-ink-50 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-wardrobe-accent-gold" />
              My Looks
            </h2>
            <p className="text-xs text-ink-400 mt-0.5">
              {looks.length} {looks.length === 1 ? 'look' : 'looks'} saved
            </p>
          </div>
        </div>

        <button
          onClick={onCreateLook}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium text-ink-900 bg-gradient-to-r from-wardrobe-accent-gold to-amber-300 hover:shadow-lg hover:shadow-wardrobe-accent-gold/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          New Look
        </button>
      </div>

      {/* Gallery grid or empty state */}
      {sortedLooks.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-24">
          <div className="w-20 h-20 rounded-full bg-ink-800/50 border border-ink-700/50 flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-ink-600" />
          </div>
          <h3 className="text-lg font-serif text-ink-300 mb-1">No looks yet</h3>
          <p className="text-ink-500 text-sm max-w-xs">
            Create a look by opening any item in your wardrobe and tapping "Create a Look" to pair it with other pieces.
          </p>
          <button
            onClick={onCreateLook}
            className="mt-5 flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-medium text-ink-900 bg-gradient-to-r from-wardrobe-accent-gold to-amber-300 hover:shadow-lg hover:shadow-wardrobe-accent-gold/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            Create Your First Look
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedLooks.map((look) => (
            <LookCard
              key={look.id}
              look={look}
              allItems={allItems}
              allCollections={allCollections}
              onClick={() => onViewLook(look)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
