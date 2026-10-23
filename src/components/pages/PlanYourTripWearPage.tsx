import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Briefcase, Mic, MicOff, Plus, Shirt, Trash2, X } from 'lucide-react';
import type { WardrobeCollection, WardrobeItem } from '@/types';
import ItemImage from '@/components/ItemImage';
import { useSpeechToText } from '@/voice/useSpeechToText';
import {
  loadTripPlans,
  saveTripPlans,
  type TripExtraNote,
  type TripPlan,
} from '@/trips/tripStorage';

interface PlanYourTripWearPageProps {
  userId: string;
  items: WardrobeItem[];
  collections: WardrobeCollection[];
  onBack: () => void;
}

function categoryLabelForItem(
  collections: WardrobeCollection[],
  item: WardrobeItem
): string {
  const collection = collections.find((c) => c.id === item.collectionId);
  return collection?.categories.find((c) => c.id === item.categoryId)?.label ?? 'Other';
}

function wardrobeName(collections: WardrobeCollection[], item: WardrobeItem): string {
  return collections.find((c) => c.id === item.collectionId)?.name ?? 'Wardrobe';
}

function newTrip(): TripPlan {
  return {
    id: `trip-${Date.now()}`,
    name: 'Trip pack',
    itemIds: [],
    extras: [],
    updatedAt: Date.now(),
  };
}

export default function PlanYourTripWearPage({
  userId,
  items,
  collections,
  onBack,
}: PlanYourTripWearPageProps) {
  const [trips, setTrips] = useState<TripPlan[]>(() => loadTripPlans(userId));
  const [activeId, setActiveId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeWardrobeId, setActiveWardrobeId] = useState<string>('all');
  const { listening, error: speechError, start, stop, supported } = useSpeechToText('en-IN');

  useEffect(() => {
    saveTripPlans(userId, trips);
  }, [userId, trips]);

  const active = trips.find((t) => t.id === activeId) ?? null;

  const wardrobePool = useMemo(
    () => items.filter((item) => !item.loftBoxId && !item.markedForDonation),
    [items]
  );

  const wardrobeTabs = useMemo(() => {
    const ids = new Set(wardrobePool.map((i) => i.collectionId));
    return [
      { id: 'all', label: 'All wardrobes' },
      ...collections
        .filter((c) => ids.has(c.id))
        .map((c) => ({ id: c.id, label: c.name })),
    ];
  }, [wardrobePool, collections]);

  const categoryTabs = useMemo(() => {
    const scoped =
      activeWardrobeId === 'all'
        ? wardrobePool
        : wardrobePool.filter((i) => i.collectionId === activeWardrobeId);
    const labels = new Set<string>();
    for (const item of scoped) {
      labels.add(categoryLabelForItem(collections, item));
    }
    return ['all', ...Array.from(labels).sort((a, b) => a.localeCompare(b))];
  }, [wardrobePool, collections, activeWardrobeId]);

  const sidebarItems = useMemo(() => {
    return wardrobePool.filter((item) => {
      if (activeWardrobeId !== 'all' && item.collectionId !== activeWardrobeId) return false;
      if (activeCategory === 'all') return true;
      return categoryLabelForItem(collections, item) === activeCategory;
    });
  }, [wardrobePool, collections, activeCategory, activeWardrobeId]);

  const packedItems = useMemo(() => {
    if (!active) return [];
    return active.itemIds
      .map((id) => items.find((i) => i.id === id))
      .filter((i): i is WardrobeItem => Boolean(i));
  }, [active, items]);

  const packedIdSet = useMemo(() => new Set(active?.itemIds ?? []), [active]);

  const updateActive = (patch: Partial<TripPlan>) => {
    if (!active) return;
    setTrips((prev) =>
      prev.map((t) => (t.id === active.id ? { ...t, ...patch, updatedAt: Date.now() } : t))
    );
  };

  const createTrip = () => {
    const trip = newTrip();
    setTrips((prev) => [trip, ...prev]);
    setActiveId(trip.id);
  };

  const addExtra = () => {
    const text = noteDraft.trim();
    if (!text || !active) return;
    const extra: TripExtraNote = { id: `extra-${Date.now()}`, text, createdAt: Date.now() };
    updateActive({ extras: [...active.extras, extra] });
    setNoteDraft('');
  };

  const togglePack = (itemId: string) => {
    if (!active) return;
    if (packedIdSet.has(itemId)) {
      updateActive({ itemIds: active.itemIds.filter((id) => id !== itemId) });
    } else {
      updateActive({ itemIds: [...active.itemIds, itemId] });
    }
  };

  if (!active) {
    return (
      <div className="h-full min-h-0 flex flex-col rounded-2xl border border-ink-700/50 bg-ink-900/40 overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-ink-700/40 shrink-0">
          <div>
            <h2 className="text-xl font-serif text-ink-100 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-wardrobe-accent-gold" />
              Plan Your Trip Wear
            </h2>
            <p className="text-xs text-ink-500 mt-0.5">Pack wardrobe pieces and jot down extras</p>
          </div>
          <button type="button" onClick={onBack} className="text-xs text-ink-400 hover:text-ink-200 underline">
            Back
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <button
            type="button"
            onClick={createTrip}
            className="mb-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-ink-900 bg-gradient-to-r from-wardrobe-accent-gold to-amber-300"
          >
            <Plus className="w-4 h-4" />
            New trip pack
          </button>

          {trips.length === 0 ? (
            <p className="text-sm text-ink-500 py-10 text-center border border-dashed border-ink-700 rounded-xl">
              No trip packs yet. Create one to start packing.
            </p>
          ) : (
            <ul className="space-y-2 max-w-xl">
              {trips.map((trip) => (
                <li key={trip.id}>
                  <button
                    type="button"
                    onClick={() => setActiveId(trip.id)}
                    className="w-full text-left rounded-xl border border-ink-700/60 bg-ink-800/50 px-4 py-3 hover:border-wardrobe-accent-gold/40"
                  >
                    <p className="text-sm font-medium text-ink-100">{trip.name}</p>
                    <p className="text-[11px] text-ink-500 mt-0.5">
                      {trip.itemIds.length} clothes · {trip.extras.length} notes
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 flex flex-col gap-2 overflow-hidden">
      <div className="flex items-center gap-2 shrink-0 px-1">
        <button
          type="button"
          onClick={() => setActiveId(null)}
          className="w-9 h-9 rounded-full border border-ink-700/60 bg-ink-800/60 text-ink-300 hover:text-ink-100 flex items-center justify-center"
          aria-label="All trips"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <input
          value={active.name}
          onChange={(e) => updateActive({ name: e.target.value })}
          className="flex-1 bg-transparent border-b border-ink-700/50 px-1 py-1 text-lg font-serif text-ink-100 focus:outline-none focus:border-wardrobe-accent-gold/50"
        />
        <button
          type="button"
          onClick={() => {
            setTrips((prev) => prev.filter((t) => t.id !== active.id));
            setActiveId(null);
          }}
          className="p-2 text-red-400/80 hover:bg-red-400/10 rounded-lg"
          aria-label="Delete trip"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 min-h-0 flex gap-2 overflow-hidden">
        {/* Left — scrollable wardrobe picker (Create Look style) */}
        <aside className="w-[min(42%,440px)] min-w-[220px] min-h-0 flex flex-col rounded-2xl border border-ink-700/60 bg-ink-800/40 overflow-hidden shrink-0">
          <div className="px-2 pt-2 pb-1 border-b border-ink-700/40 shrink-0 space-y-2">
            <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
              {wardrobeTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveWardrobeId(tab.id);
                    setActiveCategory('all');
                  }}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium border transition-all ${
                    activeWardrobeId === tab.id
                      ? 'bg-wardrobe-accent-gold/20 text-wardrobe-accent-gold border-wardrobe-accent-gold/40'
                      : 'bg-ink-900/50 text-ink-400 border-ink-700/40 hover:text-ink-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
              {categoryTabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveCategory(tab)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium border transition-all ${
                    activeCategory === tab
                      ? 'bg-sky-500/15 text-sky-300 border-sky-400/40'
                      : 'bg-ink-900/50 text-ink-400 border-ink-700/40 hover:text-ink-300'
                  }`}
                >
                  {tab === 'all' ? 'All' : tab}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar px-2 py-2">
            <div className="grid grid-cols-2 gap-2 content-start">
              {sidebarItems.length === 0 ? (
                <p className="col-span-2 text-center text-ink-500 text-sm py-8">No items in this view</p>
              ) : (
                sidebarItems.map((item) => {
                  const packed = packedIdSet.has(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => togglePack(item.id)}
                      className={`flex flex-col rounded-xl border overflow-hidden text-left transition-all ${
                        packed
                          ? 'border-wardrobe-accent-gold/40 bg-wardrobe-accent-gold/10'
                          : 'border-ink-700/50 bg-ink-900/50 hover:border-ink-600'
                      }`}
                    >
                      <div className="aspect-square w-full overflow-hidden border-b border-ink-700 relative">
                        <ItemImage item={item} alt={item.name} className="w-full h-full object-cover" />
                        {packed && (
                          <span className="absolute top-1 right-1 text-[9px] px-1.5 py-0.5 rounded-full bg-wardrobe-accent-gold text-ink-900 font-medium">
                            Packed
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 px-1.5 py-1">
                        <p className="text-[10px] text-ink-100 truncate">{item.name}</p>
                        <p className="text-[9px] text-ink-500 truncate">
                          {wardrobeName(collections, item)} · {categoryLabelForItem(collections, item)}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </aside>

        {/* Right — pack summary + extras */}
        <div className="flex-1 min-w-0 min-h-0 flex flex-col gap-2 overflow-hidden">
          <section className="flex-1 min-h-0 rounded-2xl border border-ink-700/60 bg-ink-800/40 p-3 flex flex-col overflow-hidden">
            <div className="flex items-center gap-2 mb-2 shrink-0">
              <Shirt className="w-4 h-4 text-wardrobe-accent-gold" />
              <h3 className="text-sm font-medium text-ink-200">Packed clothes</h3>
              <span className="text-[10px] text-ink-500">{packedItems.length}</span>
            </div>
            {packedItems.length === 0 ? (
              <p className="text-xs text-ink-500 py-8 text-center">
                Tap items in the wardrobe panel to pack them
              </p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 overflow-y-auto custom-scrollbar content-start">
                {packedItems.map((item) => (
                  <div
                    key={item.id}
                    className="relative rounded-lg border border-ink-700/50 overflow-hidden bg-ink-900/50"
                  >
                    <div className="aspect-square">
                      <ItemImage item={item} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <p className="px-1.5 py-1 text-[10px] truncate text-ink-200">{item.name}</p>
                    <button
                      type="button"
                      onClick={() => togglePack(item.id)}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-ink-950/80 text-ink-300 flex items-center justify-center"
                      aria-label="Unpack"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="h-[38%] min-h-[160px] rounded-2xl border border-ink-700/60 bg-ink-800/40 p-3 flex flex-col overflow-hidden shrink-0">
            <h3 className="text-sm font-medium text-ink-200 mb-1 shrink-0">Other essentials</h3>
            <p className="text-[11px] text-ink-500 mb-2 shrink-0">
              Medicines, chargers, toiletries — type or speak to add.
            </p>
            <div className="flex gap-2 mb-2 shrink-0">
              <input
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addExtra();
                  }
                }}
                placeholder="e.g. toothbrush, sunscreen…"
                className="flex-1 rounded-lg border border-ink-700/50 bg-ink-950/50 px-3 py-2 text-sm text-ink-100 placeholder-ink-600 focus:outline-none focus:border-wardrobe-accent-gold/40"
              />
              {supported && (
                <button
                  type="button"
                  onClick={() => (listening ? stop() : start((text) => setNoteDraft(text)))}
                  className={`p-2 rounded-lg border ${
                    listening
                      ? 'border-red-400/50 bg-red-400/10 text-red-300'
                      : 'border-ink-700/50 text-ink-300 hover:bg-ink-900/60'
                  }`}
                  aria-label={listening ? 'Stop recording' : 'Speak note'}
                >
                  {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              )}
              <button
                type="button"
                onClick={addExtra}
                className="px-3 py-2 rounded-lg text-sm bg-wardrobe-accent-gold text-ink-900 font-medium"
              >
                Add
              </button>
            </div>
            {speechError && <p className="text-[11px] text-red-400 mb-2">{speechError}</p>}
            <ul className="space-y-1.5 overflow-y-auto flex-1 custom-scrollbar">
              {active.extras.map((extra) => (
                <li
                  key={extra.id}
                  className="flex items-start justify-between gap-2 rounded-lg border border-ink-700/50 bg-ink-900/50 px-3 py-2 text-sm text-ink-200"
                >
                  <span>{extra.text}</span>
                  <button
                    type="button"
                    onClick={() =>
                      updateActive({ extras: active.extras.filter((e) => e.id !== extra.id) })
                    }
                    className="text-ink-500 hover:text-red-400"
                    aria-label="Remove note"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
