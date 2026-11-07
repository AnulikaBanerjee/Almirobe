export type Article = {
  id: string;
  title: string;
  summary: string;
  body: string;
  tags: string[];
  publishedAt: string;
  author: string;
};

/** Seed content until an admin CMS is wired. */
export const ARTICLES: Article[] = [
  {
    id: 'care-cotton',
    title: 'How to wash cotton so it lasts longer',
    summary: 'Simple habits that keep everyday cotton from fading and shrinking.',
    body:
      'Wash similar colors together in cool water, turn garments inside out, and avoid high dryer heat. ' +
      'Air-drying cotton on a hanger helps preserve shape. Spot-treat stains before they set, and skip fabric softener on towels and athletic knits.',
    tags: ['care', 'cotton'],
    publishedAt: '2026-09-12',
    author: 'Almirobe Editors',
  },
  {
    id: 'style-capsule',
    title: 'Build a 12-piece work capsule',
    summary: 'A short list of neutrals and two accent pieces that mix all week.',
    body:
      'Start with two trousers, two blazers or light jackets, four tops, two shoes, and two adaptable layers. ' +
      'Choose a shared color story so everything pairs. Photograph outfits in Almirobe Looks so you can reuse combinations on busy mornings.',
    tags: ['styling', 'workwear'],
    publishedAt: '2026-08-28',
    author: 'Almirobe Editors',
  },
  {
    id: 'store-seasonal',
    title: 'Packing seasonal clothes into The Loft',
    summary: 'Keep active wardrobes light by rotating off-season pieces.',
    body:
      'Clean and fully dry garments before storage. Use labeled loft boxes with a photo of the bag. ' +
      'Slip cedar or lavender sachets in for wool. Note the season on the box so return-to-wardrobe is one tap.',
    tags: ['storage', 'loft'],
    publishedAt: '2026-07-03',
    author: 'Almirobe Editors',
  },
  {
    id: 'donate-well',
    title: 'What to donate (and what to keep)',
    summary: 'A quick checklist before pieces leave your donation box.',
    body:
      'Donate clean, wearable items with working zippers and buttons. Keep pieces you have worn in the last season or that still fit your lifestyle. ' +
      'Use Declutter Report to surface unworn items, then move them to Donation Box when you are ready.',
    tags: ['declutter', 'donation'],
    publishedAt: '2026-06-18',
    author: 'Almirobe Editors',
  },
];
