export type MenuPage =
  | 'account'
  | 'account-history'
  | 'purchase-report'
  | 'declutter-report'
  | 'donation-box'
  | 'the-loft';

export type AppView = 'wardrobe' | 'looks' | 'laundry' | 'lent' | MenuPage;

export function isMenuPage(view: AppView): view is MenuPage {
  return (
    view === 'account' ||
    view === 'account-history' ||
    view === 'purchase-report' ||
    view === 'declutter-report' ||
    view === 'donation-box' ||
    view === 'the-loft'
  );
}
