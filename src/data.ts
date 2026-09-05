import type { WardrobeCollection, WardrobeItem } from './types';

export const INITIAL_COLLECTIONS: WardrobeCollection[] = [
  {
    id: 'clothes',
    name: 'Clothes',
    icon: 'shirt',
    categories: [
      { id: 'tops', label: 'Tops' },
      { id: 'bottoms', label: 'Bottoms' },
      { id: 'dresses', label: 'Dresses' },
      { id: 'outerwear', label: 'Outerwear' },
    ],
  },
  {
    id: 'shoes',
    name: 'Shoes',
    icon: 'shoes',
    categories: [
      { id: 'sneakers', label: 'Sneakers' },
      { id: 'boots', label: 'Boots' },
      { id: 'heels', label: 'Heels' },
      { id: 'flats', label: 'Flats' },
      { id: 'sandals', label: 'Sandals' },
    ],
  },
  {
    id: 'jewelry',
    name: 'Jewelry',
    icon: 'jewelry',
    categories: [
      { id: 'necklaces', label: 'Necklaces' },
      { id: 'rings', label: 'Rings' },
      { id: 'earrings', label: 'Earrings' },
      { id: 'bracelets', label: 'Bracelets' },
    ],
  },
];

export const INITIAL_ITEMS: WardrobeItem[] = [
  // Clothes
  { id: 'c1', collectionId: 'clothes', name: 'White Silk Blouse', categoryId: 'tops', color: 'Ivory', colorHex: '#f8f4ed', brand: 'Reformation', size: 'M', season: 'all', notes: 'Perfect for layering', favorite: true, inLaundry: true, createdAt: Date.now() - 100000 },
  { id: 'c2', collectionId: 'clothes', name: 'Classic Denim Jeans', categoryId: 'bottoms', color: 'Blue', colorHex: '#4a6d8c', brand: 'Levi\'s', size: '28', season: 'all', favorite: false, inLaundry: true, createdAt: Date.now() - 90000 },
  { id: 'c3', collectionId: 'clothes', name: 'Wool Trench Coat', categoryId: 'outerwear', color: 'Camel', colorHex: '#c19a6b', brand: 'Burberry', size: 'M', season: 'winter', notes: 'Investment piece', favorite: true, inLaundry: false, createdAt: Date.now() - 80000 },
  { id: 'c4', collectionId: 'clothes', name: 'Floral Summer Dress', categoryId: 'dresses', color: 'Pink', colorHex: '#d4849a', brand: 'Cotton On', size: 'S', season: 'summer', notes: 'Breathable cotton', favorite: true, inLaundry: false, createdAt: Date.now() - 60000 },
  { id: 'c5', collectionId: 'clothes', name: 'Cashmere Sweater', categoryId: 'tops', color: 'Olive', colorHex: '#7d7a4e', brand: 'Everlane', size: 'M', season: 'winter', favorite: false, inLaundry: true, createdAt: Date.now() - 50000 },
  { id: 'c6', collectionId: 'clothes', name: 'Pleated Midi Skirt', categoryId: 'bottoms', color: 'Charcoal', colorHex: '#3a3733', brand: 'Zara', size: 'S', season: 'fall', favorite: false, inLaundry: false, createdAt: Date.now() - 40000 },
  { id: 'c7', collectionId: 'clothes', name: 'Linen Button-down', categoryId: 'tops', color: 'Sage', colorHex: '#b2b88a', brand: 'J.Crew', size: 'M', season: 'spring', favorite: false, inLaundry: false, createdAt: Date.now() - 20000 },
  { id: 'c8', collectionId: 'clothes', name: 'Velvet Blazer', categoryId: 'outerwear', color: 'Burgundy', colorHex: '#5c1f2e', brand: 'AllSaints', size: 'S', season: 'winter', notes: 'Holiday parties', favorite: true, inLaundry: false, createdAt: Date.now() - 5000 },

  // Shoes
  { id: 's1', collectionId: 'shoes', name: 'White Sneakers', categoryId: 'sneakers', color: 'White', colorHex: '#f0f0ee', brand: 'Common Projects', size: '7', season: 'spring', favorite: false, inLaundry: false, createdAt: Date.now() - 70000 },
  { id: 's2', collectionId: 'shoes', name: 'Black Leather Boots', categoryId: 'boots', color: 'Black', colorHex: '#1a1a1a', brand: 'Dr. Martens', size: '7', season: 'fall', favorite: true, inLaundry: false, createdAt: Date.now() - 65000 },
  { id: 's3', collectionId: 'shoes', name: 'Red Stiletto Heels', categoryId: 'heels', color: 'Red', colorHex: '#8b2020', brand: 'Christian Louboutin', size: '7', season: 'all', notes: 'Special occasions', favorite: true, inLaundry: false, createdAt: Date.now() - 30000 },
  { id: 's4', collectionId: 'shoes', name: 'Ballet Flats', categoryId: 'flats', color: 'Blush', colorHex: '#decbc4', brand: 'Repetto', size: '7', season: 'spring', favorite: false, inLaundry: true, createdAt: Date.now() - 15000 },
  { id: 's5', collectionId: 'shoes', name: 'Leather Sandals', categoryId: 'sandals', color: 'Tan', colorHex: '#c8a982', brand: 'Birkenstock', size: '7', season: 'summer', favorite: false, inLaundry: false, createdAt: Date.now() - 8000 },

  // Jewelry
  { id: 'j1', collectionId: 'jewelry', name: 'Gold Hoop Earrings', categoryId: 'earrings', color: 'Gold', colorHex: '#d4af37', brand: 'Mejuri', size: 'One Size', season: 'all', favorite: false, inLaundry: false, createdAt: Date.now() - 50000 },
  { id: 'j2', collectionId: 'jewelry', name: 'Pearl Necklace', categoryId: 'necklaces', color: 'Pearl', colorHex: '#f0ead6', brand: 'Tiffany & Co.', size: '16"', season: 'all', notes: 'Heirloom', favorite: true, inLaundry: false, createdAt: Date.now() - 35000 },
  { id: 'j3', collectionId: 'jewelry', name: 'Diamond Solitaire Ring', categoryId: 'rings', color: 'Silver', colorHex: '#c0c0c0', brand: 'Cartier', size: '6', season: 'all', favorite: true, inLaundry: false, createdAt: Date.now() - 25000 },
  { id: 'j4', collectionId: 'jewelry', name: 'Stacked Gold Bracelets', categoryId: 'bracelets', color: 'Gold', colorHex: '#c9a96e', brand: 'Gorjana', size: 'One Size', season: 'all', favorite: false, inLaundry: false, createdAt: Date.now() - 12000 },
  { id: 'j5', collectionId: 'jewelry', name: 'Sapphire Drop Earrings', categoryId: 'earrings', color: 'Blue', colorHex: '#4169e1', brand: 'Blue Nile', size: 'One Size', season: 'all', notes: 'Anniversary gift', favorite: true, inLaundry: false, createdAt: Date.now() - 3000 },
];
