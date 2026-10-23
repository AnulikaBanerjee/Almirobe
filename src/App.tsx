import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRightLeft,
  Briefcase,
  DoorOpen,
  Gift,
  LogOut,
  Pencil,
  Search,
  Sparkles,
  WashingMachine,
} from 'lucide-react';
import type { GiftRecord, LoftBox, WardrobeItem, WardrobeCollection, Look } from '@/types';
import { createStorageProvider, useWardrobeData } from '@/storage';
import { useAuthSession } from '@/auth/AuthSessionContext';
import type { AuthUser } from '@/auth';
import {
  buildUpdatedCollection,
  deleteCollectionState,
  remapItemsForCategoryChanges,
  type CategoryDraft,
} from '@/collections';
import { upsertLook, removeItemFromLooks, type LookEditorContext } from '@/looks';
import { getWardrobeIcon } from '@/wardrobeIcons';
import AppLogo from '@/components/AppLogo';
import Wardrobe from '@/components/Wardrobe';
import WardrobeSelector from '@/components/WardrobeSelector';
import WardrobeFormModal from '@/components/WardrobeFormModal';
import LooksGallery from '@/components/LooksGallery';
import LookViewerModal from '@/components/LookViewerModal';
import CreateLookPage from '@/components/pages/CreateLookPage';
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
import GiftRecorderView from '@/components/GiftRecorderView';
import AccountPage from '@/components/pages/AccountPage';
import AccountHistoryPage from '@/components/pages/AccountHistoryPage';
import MembershipPage from '@/components/pages/MembershipPage';
import { getAccountProfile } from '@/profile/accountProfileStorage';
import PurchaseReportPage from '@/components/pages/PurchaseReportPage';
import DeclutterReportPage from '@/components/pages/DeclutterReportPage';
import DonationBoxPage from '@/components/pages/DonationBoxPage';
import LoftPage from '@/components/pages/LoftPage';
import ContactPage from '@/components/pages/ContactPage';
import ArticlesPage from '@/components/pages/ArticlesPage';
import SuggestionsPage from '@/components/pages/SuggestionsPage';
import PlanWithFriendsPage from '@/components/pages/PlanWithFriendsPage';
import PlanYourTripWearPage from '@/components/pages/PlanYourTripWearPage';
import UniversalSearchModal from '@/components/UniversalSearchModal';
import OrnatePageFrame from '@/components/layout/OrnatePageFrame';
import ItemImage from '@/components/ItemImage';
import { addActivity, ensureProfilesForUser } from '@/menu/menuStorage';
import { markItemWornToday } from '@/reports/wearTracking';
import {
  hasCompletedOnboarding,
  isGiftRecorderEnabled,
  markOnboardingComplete,
  setGiftRecorderEnabled,
} from '@/userPreferences';
import type { AppView } from '@/navigation';
type WardrobeFormState =
  | { mode: 'create' }
  | { mode: 'edit'; collectionId: string }
  | null;

function App() {
  const {
    user,
    authProvider,
    setUser,
    completeAuthentication,
    signOut,
    isLoading: isAuthLoading,
    activeProfileId,
  } = useAuthSession();
  const profileId = activeProfileId ?? user?.id ?? '__guest__';
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
    gifts,
    setGifts,
  } = useWardrobeData(storageProvider);

  const [showWelcome, setShowWelcome] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [wardrobeForm, setWardrobeForm] = useState<WardrobeFormState>(null);
  const [view, setView] = useState<AppView>('wardrobe');
  const [giftRecorderEnabledState, setGiftRecorderEnabledState] = useState(
    () => isGiftRecorderEnabled(profileId)
  );

  useEffect(() => {
    setGiftRecorderEnabledState(isGiftRecorderEnabled(profileId));
  }, [profileId]);

  const updateGiftRecorderEnabled = (enabled: boolean) => {
    setGiftRecorderEnabled(profileId, enabled);
    setGiftRecorderEnabledState(enabled);
    if (!enabled && view === 'gifts') setView('wardrobe');
  };

  // Look-related modal state (managed at App level so gallery and wardrobe can share)
  const [viewingLook, setViewingLook] = useState<Look | null>(null);
  const [lookEditor, setLookEditor] = useState<LookEditorContext | null>(null);
  const [lookEditorReturnView, setLookEditorReturnView] = useState<AppView>('looks');
  const [detailItemId, setDetailItemId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<WardrobeItem | null>(null);
  const [showUniversalSearch, setShowUniversalSearch] = useState(false);

  const openCreateLook = (ctx: LookEditorContext, returnView: AppView = view) => {
    setLookEditor(ctx);
    setLookEditorReturnView(returnView);
    setView('create-look');
  };

  const closeCreateLook = () => {
    setLookEditor(null);
    setView(lookEditorReturnView);
  };

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
  const giftCount = gifts.length + items.filter((item) => item.isGift).length;
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

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#fffdf8] flex items-center justify-center text-ink-600">
        <div className="flex items-center gap-3 text-sm">
          <span className="w-5 h-5 border-2 border-ink-600 border-t-wardrobe-accent-gold rounded-full animate-spin" />
          Restoring your session...
        </div>
      </div>
    );
  }

  // Show login screen if not logged in
  if (!user) {
    return (
      <LoginScreen
        authProvider={authProvider}
        onAuthenticated={(authenticatedUser) => {
          if (authProvider.isDemo) {
            ensureProfilesForUser(authenticatedUser);
          }
          completeAuthentication(authenticatedUser);
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
        <div className="min-h-screen bg-[#fffdf8] flex items-center justify-center text-ink-600">
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
    void signOut().then(() => {
      setShowWelcome(false);
      setShowOnboarding(false);
      setView('wardrobe');
    });
  };

  const handleEditLookFromViewer = () => {
    if (!viewingLook) return;
    const primary = items.find((i) => i.id === viewingLook.primaryItemId);
    openCreateLook(
      { primaryItem: primary, existingLook: viewingLook },
      view === 'create-look' ? lookEditorReturnView : view
    );
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

  const handleSaveGift = (gift: GiftRecord) => {
    setGifts((previous) => {
      const exists = previous.some((entry) => entry.id === gift.id);
      return exists
        ? previous.map((entry) => (entry.id === gift.id ? gift : entry))
        : [...previous, gift];
    });
  };

  const handleDeleteGift = (id: string) => {
    setGifts((previous) => previous.filter((gift) => gift.id !== id));
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

  const lookFillsScreen =
    (view === 'create-look' && Boolean(lookEditor)) || view === 'plan-trip-wear';

  return (
    <div
      className={`bg-gradient-to-b from-[#fffdf8] via-[#f7f1e6] to-[#efe6d4] text-ink-800 relative overflow-hidden ${
        lookFillsScreen ? 'h-dvh flex flex-col' : 'min-h-screen'
      }`}
    >
      {authProvider.isDemo && <DemoModeBanner />}
      {storageError && (
        <div className="relative z-20 px-4 py-2 text-center text-xs text-amber-200 bg-amber-900/40 border-b border-amber-700/40">
          {storageError}
        </div>
      )}
      {/* Ambient background lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-wardrobe-accent-gold/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-amber-200/20 rounded-full blur-[100px] pointer-events-none" />

      <header className="relative z-30 px-6 py-5 flex items-center justify-between border-b border-amber-200/60 backdrop-blur-sm bg-white/40">
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
              <h1 className="flex items-center gap-2 text-xl font-elite italic font-semibold text-ink-800 tracking-wide">
                <AppLogo size="sm" />
                Almirobe
              </h1>
              <p className="text-xs text-ink-500 mt-0.5">{user.displayName ? `Welcome, ${user.displayName}` : 'Your personal collection'}</p>
            </div>
          </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setShowUniversalSearch(true)}
            className="w-9 h-9 rounded-full flex items-center justify-center text-ink-600 bg-white/70 border border-amber-200/70 hover:text-ink-900 hover:border-wardrobe-accent-gold/50"
            aria-label="Search everywhere"
            title="Search everywhere"
          >
            <Search className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setView('plan-trip-wear')}
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              view === 'plan-trip-wear'
                ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white border-transparent'
                : 'text-ink-600 bg-white/70 border-amber-200/70 hover:text-ink-900 hover:border-wardrobe-accent-gold/50'
            }`}
            title="Plan Your Trip Wear"
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Plan trip</span>
          </button>
          <div className="flex items-center rounded-full bg-white/70 border border-amber-200/70 p-0.5">
            <button
              onClick={() => setView('wardrobe')}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all ${
                view === 'wardrobe'
                  ? 'bg-gradient-to-r from-wardrobe-accent-gold to-amber-300 text-ink-900'
                  : 'text-ink-500 hover:text-ink-800'
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
                  : 'text-ink-500 hover:text-ink-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Looks</span>
              {looks.length > 0 && (
                <span className={`text-[10px] px-1.5 rounded-full ${
                  view === 'looks' ? 'bg-ink-900/20 text-ink-800' : 'bg-amber-100 text-ink-600'
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
                  : 'text-ink-500 hover:text-ink-800'
              }`}
            >
              <WashingMachine className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Laundry</span>
              {laundryCount > 0 && (
                <span className={`text-[10px] px-1.5 rounded-full ${
                  view === 'laundry' ? 'bg-white/20 text-white' : 'bg-amber-100 text-ink-600'
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
                  : 'text-ink-500 hover:text-ink-800'
              }`}
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Lent</span>
              {lentCount > 0 && (
                <span className={`text-[10px] px-1.5 rounded-full ${
                  view === 'lent' ? 'bg-white/20 text-white' : 'bg-amber-100 text-ink-600'
                }`}>
                  {lentCount}
                </span>
              )}
            </button>
            {giftRecorderEnabledState && (
              <button
                onClick={() => setView('gifts')}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all ${
                  view === 'gifts'
                    ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white'
                    : 'text-ink-500 hover:text-ink-800'
                }`}
              >
                <Gift className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Gifts</span>
                {giftCount > 0 && (
                  <span className={`text-[10px] px-1.5 rounded-full ${
                    view === 'gifts' ? 'bg-white/20 text-white' : 'bg-amber-100 text-ink-600'
                  }`}>
                    {giftCount}
                  </span>
                )}
              </button>
            )}
          </div>

          {/* Stats — hidden on small screens */}
          <div className="hidden md:flex items-center gap-2 text-sm text-ink-600">
            <span className="px-3 py-1 rounded-full bg-white/70 border border-amber-200/70">
              {totalItems} pieces
            </span>
            <span className="px-3 py-1 rounded-full bg-white/70 border border-amber-200/70 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-wardrobe-accent-gold" />
              {totalFavorites} favorites
            </span>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium text-ink-600 bg-white/70 border border-amber-200/70 hover:text-ink-900 hover:border-wardrobe-accent-gold/50"
            aria-label="Logout"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Main content */}
      <main
        className={
          lookFillsScreen
            ? 'relative z-10 flex-1 min-h-0 w-full flex flex-col px-2 py-2 sm:px-4 sm:py-3'
            : 'relative z-10 flex flex-col items-center px-4 py-6 sm:py-8'
        }
      >
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
                  className="w-8 h-8 rounded-lg border border-amber-200/80 bg-white/80 text-ink-500 hover:text-ink-800 hover:border-wardrobe-accent-gold/50 transition-all flex items-center justify-center"
                  aria-label="Edit wardrobe"
                  title="Edit wardrobe"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl text-ink-800 mb-2 leading-tight">
                {activeCollection.name}
              </h2>
              <p className="text-ink-500 text-sm leading-relaxed">
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
              onOpenCreateLook={(ctx) => openCreateLook(ctx, 'wardrobe')}
              giftRecorderEnabled={giftRecorderEnabledState}
            />
          </>
        ) : view === 'looks' ? (
          <OrnatePageFrame>
            <LooksGallery
              looks={looks}
              allItems={items}
              allCollections={collections}
              onViewLook={setViewingLook}
              onCreateLook={() => openCreateLook({}, 'looks')}
              onBack={() => setView('wardrobe')}
            />
          </OrnatePageFrame>
        ) : view === 'create-look' && lookEditor ? (
          <OrnatePageFrame fill className="flex-1 min-h-0">
            <CreateLookPage
              editor={lookEditor}
              allItems={items}
              allCollections={collections}
              onBack={closeCreateLook}
              onSave={(look) => {
                handleSaveLook(look);
                closeCreateLook();
              }}
            />
          </OrnatePageFrame>
        ) : view === 'plan-trip-wear' ? (
          <PlanYourTripWearPage
            userId={user.id}
            items={items}
            collections={collections}
            onBack={() => setView('wardrobe')}
          />
        ) : view === 'articles' ? (
          <ArticlesPage onBack={() => setView('wardrobe')} />
        ) : view === 'suggestions' ? (
          <SuggestionsPage onBack={() => setView('wardrobe')} />
        ) : view === 'plan-with-friends' ? (
          <PlanWithFriendsPage onBack={() => setView('wardrobe')} />
        ) : view === 'laundry' ? (
          <OrnatePageFrame>
            <LaundryView
              allItems={items}
              allCollections={collections}
              onToggleLaundry={handleToggleLaundry}
              onBack={() => setView('wardrobe')}
            />
          </OrnatePageFrame>
        ) : view === 'lent' ? (
          <OrnatePageFrame>
            <LentBorrowedView
              allItems={items}
              allCollections={collections}
              onUpdateItem={handleEditItem}
              onClearLent={handleClearLent}
              onBack={() => setView('wardrobe')}
            />
          </OrnatePageFrame>
        ) : view === 'gifts' && giftRecorderEnabledState ? (
          <OrnatePageFrame>
            <GiftRecorderView
              gifts={gifts}
              allItems={items}
              allCollections={collections}
              onSaveGift={handleSaveGift}
              onDeleteGift={handleDeleteGift}
              onBack={() => setView('wardrobe')}
            />
          </OrnatePageFrame>
        ) : view === 'account' ? (
          <AccountPage
            user={user}
            items={items}
            collections={collections}
            giftRecorderEnabled={giftRecorderEnabledState}
            onToggleGiftRecorder={updateGiftRecorderEnabled}
            onBack={() => setView('wardrobe')}
            onUpdateUser={setUser}
            onOpenMembership={() => setView('membership')}
          />
        ) : view === 'account-history' ? (
          <AccountHistoryPage user={user} onBack={() => setView('wardrobe')} />
        ) : view === 'membership' ? (
          <MembershipPage
            currentLevel={getAccountProfile(user.id, user.displayName ?? undefined, user.email ?? undefined).membershipLevel}
            onBack={() => setView('account')}
          />
        ) : view === 'contact' ? (
          <ContactPage userId={user.id} onBack={() => setView('wardrobe')} />
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
            giftRecorderEnabled={giftRecorderEnabledState}
            onBack={() => setView('wardrobe')}
            onSaveBox={handleSaveLoftBox}
            onDeleteBox={handleDeleteLoftBox}
            onMoveToLoft={handleMoveToLoft}
            onReturnFromLoft={handleReturnFromLoft}
            onEditItem={handleEditItem}
            onDeleteItem={handleDeleteItem}
            onToggleFavorite={handleToggleFavorite}
            onToggleLaundry={handleToggleLaundry}
            onCreateLook={(item) => openCreateLook({ primaryItem: item }, 'the-loft')}
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
            onDonate={(item) => {
              handleEditItem(item);
              addActivity(user!.id, `Queued ${item.name} for donation`, 'Moved to donation box from declutter');
            }}
          />
        )}
      </main>

      {/* Footer */}
      {!lookFillsScreen && (
        <footer className="relative z-10 text-center py-4 text-xs text-ink-400 border-t border-amber-200/60">
          A place for everything you wear
        </footer>
      )}

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
          onCreateLook={() => {
            openCreateLook({ primaryItem: detailItem }, view);
            closeItemDetail();
          }}
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
          giftRecorderEnabled={giftRecorderEnabledState}
        />
      )}

      {showUniversalSearch && (
        <UniversalSearchModal
          items={items}
          collections={collections}
          loftBoxes={loftBoxes}
          onClose={() => setShowUniversalSearch(false)}
          onSelect={(item) => openItemDetail(item)}
        />
      )}

    </div>
  );
}

export default App;
