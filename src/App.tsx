import { useMemo, useState } from 'react';
import { Sparkles, DoorOpen, WashingMachine, ArrowRightLeft, Pencil } from 'lucide-react';
import type { LoftBox, WardrobeItem, WardrobeCollection, Look } from '@/types';
import { createStorageProvider, useWardrobeData } from '@/storage';
import { createAuthProvider, type AuthUser } from '@/auth';
import {
  buildUpdatedCollection,
  deleteCollectionState,
  remapItemsForCategoryChanges,
  type CategoryDraft,
} from '@/collections';
import { upsertLook, removeItemFromLooks, type LookEditorContext } from '@/looks';
import { getWardrobeIcon } from '@/wardrobeIcons';
import Wardrobe from '@/components/Wardrobe';
import WardrobeSelector from '@/components/WardrobeSelector';
import WardrobeFormModal from '@/components/WardrobeFormModal';
import LooksGallery from '@/components/LooksGallery';
import LookViewerModal from '@/components/LookViewerModal';
import CreateLookModal from '@/components/CreateLookModal';
import ItemDetailModal from '@/components/ItemDetailModal';
import EditItemModal from '@/components/EditItemModal';
import LaundryView from '@/components/LaundryView';
import LoginScreen from '@/components/LoginScreen';
import DemoModeBanner from '@/components/DemoModeBanner';
import WelcomeScreen from '@/components/WelcomeScreen';
import OnboardingModal from '@/components/OnboardingModal';
import ModalPortal from '@/components/ModalPortal';
import AppMenu from '@/components/AppMenu';
import LentBorrowedView from '@/components/LentBorrowedView';
import AccountPage from '@/components/pages/AccountPage';
import AccountHistoryPage from '@/components/pages/AccountHistoryPage';
import PurchaseReportPage from '@/components/pages/PurchaseReportPage';
import DeclutterReportPage from '@/components/pages/DeclutterReportPage';
import DonationBoxPage from '@/components/pages/DonationBoxPage';
import LoftPage from '@/components/pages/LoftPage';
import ItemImage from '@/components/ItemImage';
import { addActivity, ensureProfilesForUser } from '@/menu/menuStorage';
import { markItemWornToday } from '@/reports/wearTracking';
import { hasCompletedOnboarding, markOnboardingComplete } from '@/userPreferences';
import type { AppView } from '@/navigation';
type WardrobeFormState =
  | { mode: 'create' }
  | { mode: 'edit'; collectionId: string }
  | null;

function App() {
  const authProvider = useMemo(() => createAuthProvider(), []);
  const [user, setUser] = useState<AuthUser | null>(null);
  const profileId = user?.id ?? '__guest__';
  const storageProvider = useMemo(() => createStorageProvider('local', profileId), [profileId]);
  const {
    collections,
    items,
    looks,
    activeCollectionId,
    isLoading,
    storageError,
    setActiveCollectionId,
    setCollections,
    setItems,
    setLooks,
    loftBoxes,
    setLoftBoxes,
  } = useWardrobeData(storageProvider);

  const [showWelcome, setShowWelcome] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [wardrobeForm, setWardrobeForm] = useState<WardrobeFormState>(null);
  const [view, setView] = useState<AppView>('wardrobe');

  // Look-related modal state (managed at App level so gallery and wardrobe can share)
  const [viewingLook, setViewingLook] = useState<Look | null>(null);
  const [lookEditor, setLookEditor] = useState<LookEditorContext | null>(null);
  const [detailItemId, setDetailItemId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<WardrobeItem | null>(null);
  // Pick-an-item mode for "New Look" from the gallery
  const [pickingPrimaryItem, setPickingPrimaryItem] = useState(false);

  const activeCollection = collections.find((c) => c.id === activeCollectionId) ?? collections[0];
  const editingCollection =
    wardrobeForm?.mode === 'edit'
      ? collections.find((c) => c.id === wardrobeForm.collectionId)
      : undefined;

  const collectionItems = useMemo(
    () =>
      items.filter(
        (item) => item.collectionId === activeCollectionId && !item.loftBoxId
      ),
    [items, activeCollectionId]
  );

  const itemCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const collection of collections) {
      counts[collection.id] = items.filter(
        (item) => item.collectionId === collection.id && !item.loftBoxId
      ).length;
    }
    return counts;
  }, [collections, items]);

  const totalItems = items.filter((item) => !item.loftBoxId).length;
  const totalFavorites = items.filter((i) => i.favorite).length;
  const laundryCount = items.filter((i) => i.inLaundry).length;
  const lentCount = items.filter((i) => i.lentStatus).length;
  const ActiveIcon = getWardrobeIcon(activeCollection.icon);

  const detailItem = detailItemId ? items.find((i) => i.id === detailItemId) ?? null : null;
  const detailCollection = detailItem
    ? collections.find((c) => c.id === detailItem.collectionId) ?? activeCollection
    : activeCollection;

  const openItemDetail = (item: WardrobeItem) => {
    setViewingLook(null);
    setDetailItemId(item.id);
  };

  const closeItemDetail = () => setDetailItemId(null);

  // Show login screen if not logged in
  if (!user) {
    return (
      <LoginScreen
        authProvider={authProvider}
        onAuthenticated={(authenticatedUser) => {
          ensureProfilesForUser(authenticatedUser);
          setUser(authenticatedUser);
          setShowWelcome(true);
        }}
      />
    );
  }

  // Show welcome animation after login
  if (showWelcome) {
    return (
      <WelcomeScreen
        userName={user.displayName}
        onDone={() => {
          setShowWelcome(false);
          setShowOnboarding(!hasCompletedOnboarding(user.id));
        }}
      />
    );
  }

  if (isLoading) {
    return (
      <>
        <div className="min-h-screen bg-ink-900 flex items-center justify-center text-ink-300">
          <div className="flex items-center gap-3 text-sm">
            <span className="w-5 h-5 border-2 border-ink-600 border-t-wardrobe-accent-gold rounded-full animate-spin" />
            Opening your wardrobe...
          </div>
        </div>
        {showOnboarding && (
          <OnboardingModal
            onSetupSelf={() => {
              markOnboardingComplete(user.id);
              setShowOnboarding(false);
            }}
          />
        )}
      </>
    );
  }

  const handleSignOut = () => {
    void authProvider.signOut();
    setUser(null);
    setShowWelcome(false);
    setShowOnboarding(false);
    setView('wardrobe');
  };

  const handleEditLookFromViewer = () => {
    if (!viewingLook) return;
    const primary = items.find((i) => i.id === viewingLook.primaryItemId);
    if (primary) {
      setLookEditor({ primaryItem: primary, existingLook: viewingLook });
    }
    setViewingLook(null);
  };

  const handleAddItem = (item: WardrobeItem) => {
    setItems((prev) => [...prev, item]);
  };

  const handleEditItem = (updated: WardrobeItem) => {
    setItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
  };

  const handleToggleFavorite = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, favorite: !item.favorite } : item
      )
    );
  };

  const handleToggleLaundry = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, inLaundry: !item.inLaundry } : item
      )
    );
  };

  const handleDeleteItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    setLooks((prev) => removeItemFromLooks(prev, id));
  };

  const handleSaveLook = (look: Look) => {
    setLooks((prev) => upsertLook(prev, look));
  };

  const handleDeleteLook = (lookId: string) => {
    setLooks((prev) => prev.filter((look) => look.id !== lookId));
  };

  const handleAddCollection = (collection: Omit<WardrobeCollection, 'id'>) => {
    const newId = `wardrobe-${Date.now()}`;
    const newCollection: WardrobeCollection = { ...collection, id: newId };
    setCollections((prev) => [...prev, newCollection]);
    setActiveCollectionId(newId);
  };

  const handleClearLent = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, lentStatus: null, lentParty: undefined, lentNotes: undefined, lentDate: undefined }
          : item
      )
    );
  };

  const handleReturnFromDonation = (itemIds: string[]) => {
    if (itemIds.length === 0) return;
    setItems((prev) =>
      prev.map((item) =>
        itemIds.includes(item.id)
          ? { ...item, markedForDonation: false, donationMarkedAt: undefined }
          : item
      )
    );
  };

  const handleCompleteDonation = (itemIds: string[]) => {
    if (itemIds.length === 0) return;
    setItems((prev) => prev.filter((item) => !itemIds.includes(item.id)));
    setLooks((prev) => itemIds.reduce((acc, id) => removeItemFromLooks(acc, id), prev));
    addActivity(
      user!.id,
      `Donated ${itemIds.length} piece${itemIds.length === 1 ? '' : 's'}`,
      'Removed from wardrobe after donation'
    );
  };

  const packItemForLoft = (item: WardrobeItem, boxId: string): WardrobeItem => ({
    ...item,
    loftBoxId: boxId,
    inLaundry: false,
    markedForDonation: false,
    donationMarkedAt: undefined,
  });

  const handleMoveToLoft = (itemIds: string[], boxId: string) => {
    if (itemIds.length === 0) return;
    setItems((prev) =>
      prev.map((item) =>
        itemIds.includes(item.id) ? packItemForLoft(item, boxId) : item
      )
    );
  };

  const handleReturnFromLoft = (itemIds: string[]) => {
    if (itemIds.length === 0) return;
    setItems((prev) =>
      prev.map((item) =>
        itemIds.includes(item.id) ? { ...item, loftBoxId: null } : item
      )
    );
  };

  const handleSaveLoftBox = (box: LoftBox) => {
    setLoftBoxes((prev) => {
      const exists = prev.some((b) => b.id === box.id);
      if (exists) return prev.map((b) => (b.id === box.id ? box : b));
      return [...prev, box];
    });
  };

  const handleDeleteLoftBox = (boxId: string) => {
    setItems((prev) =>
      prev.map((item) => (item.loftBoxId === boxId ? { ...item, loftBoxId: null } : item))
    );
    setLoftBoxes((prev) => prev.filter((b) => b.id !== boxId));
  };

  const handleUpdateCollection = (
    collectionId: string,
    input: {
      name: string;
      icon: string;
      categoryDrafts: CategoryDraft[];
      displayMode: 'category' | 'shelf';
      shelfCount: number;
      enableSeasonFilter: boolean;
    }
  ) => {
    const existing = collections.find((c) => c.id === collectionId);
    if (!existing) return;

    const updated = buildUpdatedCollection(existing, input);
    setCollections((prev) => prev.map((c) => (c.id === collectionId ? updated : c)));
    setItems((prev) => remapItemsForCategoryChanges(prev, collectionId, updated));
  };

  const handleDeleteCollection = (collectionId: string) => {
    const result = deleteCollectionState(
      collections,
      items,
      looks,
      collectionId,
      activeCollectionId
    );
    if (!result) return;

    setCollections(result.collections);
    setItems(result.items);
    setLooks(result.looks);
    setActiveCollectionId(result.nextActiveCollectionId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-ink-900 via-ink-800 to-ink-900 text-ink-100 relative overflow-hidden">
      {authProvider.isDemo && <DemoModeBanner />}
      {storageError && (
        <div className="relative z-20 px-4 py-2 text-center text-xs text-amber-200 bg-amber-900/40 border-b border-amber-700/40">
          {storageError}
        </div>
      )}
      {/* Ambient background lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-wardrobe-accent-gold/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-wardrobe-accent-rose/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="relative z-30 px-6 py-5 flex items-center justify-between border-b border-ink-700/40 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <AppMenu
              user={user}
              onNavigate={setView}
              onSwitchProfile={(profile) => {
                setUser(profile);
                setView('wardrobe');
                setShowOnboarding(!hasCompletedOnboarding(profile.id));
              }}
            />
            <div>
              <h1 className="text-xl font-serif font-semibold text-ink-50 tracking-wide">My Wardrobe</h1>
              <p className="text-xs text-ink-400">{user.displayName ? `Welcome, ${user.displayName}` : 'Your personal collection'}</p>
            </div>
          </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* View toggle */}
          <div className="flex items-center rounded-full bg-ink-800/60 border border-ink-700/40 p-0.5">
            <button
              onClick={() => setView('wardrobe')}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all ${
                view === 'wardrobe'
                  ? 'bg-gradient-to-r from-wardrobe-accent-gold to-amber-300 text-ink-900'
                  : 'text-ink-400 hover:text-ink-200'
              }`}
            >
              <DoorOpen className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Wardrobes</span>
            </button>
            <button
              onClick={() => setView('looks')}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all ${
                view === 'looks'
                  ? 'bg-gradient-to-r from-wardrobe-accent-gold to-amber-300 text-ink-900'
                  : 'text-ink-400 hover:text-ink-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Looks</span>
              {looks.length > 0 && (
                <span className={`text-[10px] px-1.5 rounded-full ${
                  view === 'looks' ? 'bg-ink-900/20 text-ink-800' : 'bg-ink-700/50 text-ink-300'
                }`}>
                  {looks.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setView('laundry')}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all ${
                view === 'laundry'
                  ? 'bg-gradient-to-r from-sky-500 to-blue-500 text-white'
                  : 'text-ink-400 hover:text-ink-200'
              }`}
            >
              <WashingMachine className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Laundry</span>
              {laundryCount > 0 && (
                <span className={`text-[10px] px-1.5 rounded-full ${
                  view === 'laundry' ? 'bg-white/20 text-white' : 'bg-ink-700/50 text-ink-300'
                }`}>
                  {laundryCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setView('lent')}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all ${
                view === 'lent'
                  ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white'
                  : 'text-ink-400 hover:text-ink-200'
              }`}
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Lent</span>
              {lentCount > 0 && (
                <span className={`text-[10px] px-1.5 rounded-full ${
                  view === 'lent' ? 'bg-white/20 text-white' : 'bg-ink-700/50 text-ink-300'
                }`}>
                  {lentCount}
                </span>
              )}
            </button>
          </div>

          {/* Stats — hidden on small screens */}
          <div className="hidden md:flex items-center gap-2 text-sm text-ink-300">
            <span className="px-3 py-1 rounded-full bg-ink-800/60 border border-ink-700/40">
              {totalItems} pieces
            </span>
            <span className="px-3 py-1 rounded-full bg-ink-800/60 border border-ink-700/40 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-wardrobe-accent-gold" />
              {totalFavorites} favorites
            </span>
          </div>

        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex flex-col items-center px-4 py-6 sm:py-8">
        {view === 'wardrobe' ? (
          <>
            {/* Wardrobe selector carousel */}
            <div className="w-full flex justify-center mb-6">
              <WardrobeSelector
                collections={collections}
                activeId={activeCollectionId}
                onSelect={setActiveCollectionId}
                onAddNew={() => setWardrobeForm({ mode: 'create' })}
                itemCounts={itemCounts}
              />
            </div>

            {/* Active wardrobe title */}
            <div className="text-center mb-6 max-w-2xl animate-fade-in-up" key={activeCollectionId}>
              <div className="inline-flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-wardrobe-accent-gold to-amber-700 flex items-center justify-center">
                  <ActiveIcon className="w-4 h-4 text-ink-900" />
                </div>
                <button
                  onClick={() => setWardrobeForm({ mode: 'edit', collectionId: activeCollectionId })}
                  className="w-8 h-8 rounded-lg border border-ink-700/60 bg-ink-800/60 text-ink-400 hover:text-ink-100 hover:border-wardrobe-accent-gold/40 transition-all flex items-center justify-center"
                  aria-label="Edit wardrobe"
                  title="Edit wardrobe"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl text-ink-50 mb-2 leading-tight">
                {activeCollection.name}
              </h2>
              <p className="text-ink-400 text-sm leading-relaxed">
                {collectionItems.length} {collectionItems.length === 1 ? 'piece' : 'pieces'} in your {activeCollection.name.toLowerCase()} collection
              </p>
            </div>

            {/* Wardrobe */}
            <Wardrobe
              collection={activeCollection}
              items={collectionItems}
              allItems={items}
              allCollections={collections}
              looks={looks}
              onAddItem={handleAddItem}
              onEditItem={handleEditItem}
              onToggleFavorite={handleToggleFavorite}
              onDeleteItem={handleDeleteItem}
              onSaveLook={handleSaveLook}
              onDeleteLook={handleDeleteLook}
              onToggleLaundry={handleToggleLaundry}
              loftBoxes={loftBoxes}
              onMoveToLoft={handleMoveToLoft}
              onReturnFromLoft={handleReturnFromLoft}
              onOpenLoft={() => setView('the-loft')}
            />
          </>
        ) : view === 'looks' ? (
          <LooksGallery
            looks={looks}
            allItems={items}
            allCollections={collections}
            onViewLook={setViewingLook}
            onCreateLook={() => setPickingPrimaryItem(true)}
            onBack={() => setView('wardrobe')}
          />
        ) : view === 'laundry' ? (
          <LaundryView
            allItems={items}
            allCollections={collections}
            onToggleLaundry={handleToggleLaundry}
            onBack={() => setView('wardrobe')}
          />
        ) : view === 'lent' ? (
          <LentBorrowedView
            allItems={items}
            allCollections={collections}
            onUpdateItem={handleEditItem}
            onClearLent={handleClearLent}
            onBack={() => setView('wardrobe')}
          />
        ) : view === 'account' ? (
          <AccountPage
            user={user}
            items={items}
            collections={collections}
            onBack={() => setView('wardrobe')}
            onUpdateUser={setUser}
            onSignOut={handleSignOut}
          />
        ) : view === 'account-history' ? (
          <AccountHistoryPage user={user} onBack={() => setView('wardrobe')} />
        ) : view === 'purchase-report' ? (
          <PurchaseReportPage
            items={items}
            collections={collections}
            onBack={() => setView('wardrobe')}
          />
        ) : view === 'donation-box' ? (
          <DonationBoxPage
            items={items}
            collections={collections}
            onBack={() => setView('wardrobe')}
            onReturnToWardrobe={handleReturnFromDonation}
            onCompleteDonation={handleCompleteDonation}
          />
        ) : view === 'the-loft' ? (
          <LoftPage
            loftBoxes={loftBoxes}
            items={items}
            collections={collections}
            looks={looks}
            onBack={() => setView('wardrobe')}
            onSaveBox={handleSaveLoftBox}
            onDeleteBox={handleDeleteLoftBox}
            onMoveToLoft={handleMoveToLoft}
            onReturnFromLoft={handleReturnFromLoft}
            onEditItem={handleEditItem}
            onDeleteItem={handleDeleteItem}
            onToggleFavorite={handleToggleFavorite}
            onToggleLaundry={handleToggleLaundry}
            onCreateLook={(item) => {
              setLookEditor({ primaryItem: item });
              setView('wardrobe');
            }}
            onViewLook={(look) => {
              setViewingLook(look);
              setView('looks');
            }}
          />
        ) : (
          <DeclutterReportPage
            items={items}
            collections={collections}
            onBack={() => setView('wardrobe')}
            onKeep={(item) => handleEditItem(markItemWornToday(item))}
            onThrowAway={handleDeleteItem}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-4 text-xs text-ink-600 border-t border-ink-700/30">
        A place for everything you wear
      </footer>

      {/* Modals */}
      {showOnboarding && (
        <OnboardingModal
          onSetupSelf={() => {
            markOnboardingComplete(user.id);
            setShowOnboarding(false);
          }}
        />
      )}
      {wardrobeForm && (
        <WardrobeFormModal
          key={wardrobeForm.mode === 'edit' ? wardrobeForm.collectionId : 'create'}
          mode={wardrobeForm.mode}
          collection={editingCollection}
          itemCount={editingCollection ? itemCounts[editingCollection.id] ?? 0 : 0}
          onClose={() => setWardrobeForm(null)}
          onCreate={handleAddCollection}
          onUpdate={(input) => {
            if (wardrobeForm.mode === 'edit') {
              handleUpdateCollection(wardrobeForm.collectionId, input);
            }
          }}
          onDelete={
            wardrobeForm.mode === 'edit'
              ? () => handleDeleteCollection(wardrobeForm.collectionId)
              : undefined
          }
        />
      )}

      {/* Look viewer (from gallery or wardrobe) */}
      {viewingLook && (
        <LookViewerModal
          look={viewingLook}
          allItems={items}
          allCollections={collections}
          onClose={() => setViewingLook(null)}
          onDelete={() => { handleDeleteLook(viewingLook.id); setViewingLook(null); }}
          onEdit={handleEditLookFromViewer}
          onItemClick={openItemDetail}
        />
      )}

      {/* Item detail (from gallery look viewer or future global entry points) */}
      {detailItem && (
        <ItemDetailModal
          item={detailItem}
          collection={detailCollection}
          allItems={items}
          looks={looks}
          onClose={closeItemDetail}
          onEdit={() => { setEditItem(detailItem); closeItemDetail(); }}
          onDelete={() => { handleDeleteItem(detailItem.id); closeItemDetail(); }}
          onCreateLook={() => { setLookEditor({ primaryItem: detailItem }); closeItemDetail(); }}
          onViewLook={(look) => { setViewingLook(look); closeItemDetail(); }}
          onToggleFavorite={handleToggleFavorite}
          onToggleLaundry={handleToggleLaundry}
          onMarkWorn={() => handleEditItem(markItemWornToday(detailItem))}
          loftBoxes={loftBoxes}
          loftBoxName={loftBoxes.find((b) => b.id === detailItem.loftBoxId)?.name}
          onMoveToLoft={(boxId) => {
            handleMoveToLoft([detailItem.id], boxId);
            closeItemDetail();
          }}
          onReturnFromLoft={() => {
            handleReturnFromLoft([detailItem.id]);
            closeItemDetail();
          }}
          onOpenLoft={() => {
            closeItemDetail();
            setView('the-loft');
          }}
        />
      )}

      {editItem && (
        <EditItemModal
          item={editItem}
          collection={collections.find((c) => c.id === editItem.collectionId) ?? activeCollection}
          onClose={() => setEditItem(null)}
          onSave={(updated) => { handleEditItem(updated); setEditItem(null); }}
        />
      )}

      {/* Create look modal (from item detail or edit look) */}
      {lookEditor && (
        <CreateLookModal
          key={lookEditor.existingLook?.id ?? `new-${lookEditor.primaryItem.id}`}
          primaryItem={lookEditor.primaryItem}
          existingLook={lookEditor.existingLook}
          allItems={items}
          allCollections={collections}
          onClose={() => setLookEditor(null)}
          onSave={(look) => { handleSaveLook(look); setLookEditor(null); }}
        />
      )}

      {/* Pick primary item modal (from gallery "New Look") */}
      {pickingPrimaryItem && (
        <PickPrimaryItemModal
          allItems={items}
          allCollections={collections}
          onClose={() => setPickingPrimaryItem(false)}
          onPick={(item) => {
            setPickingPrimaryItem(false);
            setLookEditor({ primaryItem: item });
          }}
        />
      )}
    </div>
  );
}

// Simple item picker for choosing the main piece when creating a look from the gallery
function PickPrimaryItemModal({ allItems, allCollections, onClose, onPick }: {
  allItems: WardrobeItem[];
  allCollections: WardrobeCollection[];
  onClose: () => void;
  onPick: (item: WardrobeItem) => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCollectionId, setActiveCollectionId] = useState<string>('all');

  const filtered = allItems.filter((item) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!item.name.toLowerCase().includes(q) && !item.brand.toLowerCase().includes(q)) return false;
    }
    if (activeCollectionId !== 'all' && item.collectionId !== activeCollectionId) return false;
    return true;
  });

  return (
    <ModalPortal onBackdropClick={onClose} zIndex={400}>
      <div
        className="bg-ink-800 border border-ink-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[min(92vh,820px)] overflow-hidden flex flex-col animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-ink-700 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-wardrobe-accent-gold" />
            <h3 className="text-lg font-serif text-ink-50">Choose Your Main Piece</h3>
          </div>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-200 transition-colors">
            <span className="sr-only">Close</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="px-5 pt-4 pb-2 flex-shrink-0 space-y-2">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items..."
            className="w-full bg-ink-900/70 border border-ink-700/60 rounded-lg px-3 py-2 text-sm text-ink-100 placeholder-ink-500 focus:outline-none focus:border-wardrobe-accent-gold/50 transition-all"
          />
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setActiveCollectionId('all')}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                activeCollectionId === 'all'
                  ? 'bg-wardrobe-accent-gold/20 text-wardrobe-accent-gold border border-wardrobe-accent-gold/40'
                  : 'bg-ink-900/50 text-ink-400 border border-ink-700/40 hover:text-ink-300'
              }`}
            >
              All
            </button>
            {allCollections.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCollectionId(c.id)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                  activeCollectionId === c.id
                    ? 'bg-wardrobe-accent-gold/20 text-wardrobe-accent-gold border border-wardrobe-accent-gold/40'
                    : 'bg-ink-900/50 text-ink-400 border border-ink-700/40 hover:text-ink-300'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 pt-2">
          {filtered.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-ink-400 text-sm">No items found</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {filtered.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onPick(item)}
                  className="group rounded-lg overflow-hidden border border-ink-700/40 hover:border-wardrobe-accent-gold/40 transition-all text-left"
                >
                  <div className="aspect-square relative">
                    <ItemImage item={item} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-1.5 bg-ink-800">
                    <p className="text-[10px] text-ink-200 truncate leading-tight">{item.name}</p>
                    <p className="text-[9px] text-ink-500 truncate">{item.brand}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </ModalPortal>
  );
}

export default App;
