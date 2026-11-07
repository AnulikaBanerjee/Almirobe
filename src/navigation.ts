export type MenuPage =
  | 'account'
  | 'account-history'
  | 'contact'
  | 'membership'
  | 'purchase-report'
  | 'declutter-report'
  | 'donation-box'
  | 'the-loft'
  | 'articles'
  | 'suggestions'
  | 'plan-with-friends';

export type AppView =
  | 'wardrobe'
  | 'looks'
  | 'create-look'
  | 'laundry'
  | 'lent'
  | 'gifts'
  | 'plan-trip-wear'
  | MenuPage;

export function isMenuPage(view: AppView): view is MenuPage {
  return (
    view === 'account' ||
    view === 'account-history' ||
    view === 'contact' ||
    view === 'membership' ||
    view === 'purchase-report' ||
    view === 'declutter-report' ||
    view === 'donation-box' ||
    view === 'the-loft' ||
    view === 'articles' ||
    view === 'suggestions' ||
    view === 'plan-with-friends'
  );
}
