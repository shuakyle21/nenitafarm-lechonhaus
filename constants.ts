import { MenuItem, Category } from './types';

export const CATEGORIES: Category[] = [
  'Lechon & Grills',
  'Pork Dishes',
  'Beef Dishes',
  'Chicken Dishes',
  'Seafood',
  'Vegetables',
  'Short Orders',
  'Desserts',
  'Extras',
  "Today's Menu"
];

export const MENU_ITEMS: MenuItem[] = [
  // Lechon & Grills
  {
    id: 'l1',
    name: 'Lechon (1 Kilo)',
    price: 700,
    category: 'Lechon & Grills',
    image: 'https://picsum.photos/400/300?random=1',
    isWeighted: true,
  },
  {
    id: 'l2',
    name: 'Lechon Paksiw',
    price: 299,
    category: 'Lechon & Grills',
    image: 'https://picsum.photos/400/300?random=2',
  },
  {
    id: 'l3',
    name: 'Lechon Sisig',
    price: 299,
    category: 'Lechon & Grills',
    image: 'https://picsum.photos/400/300?random=3',
  },
  {
    id: 'l4',
    name: 'Lechon Batchoy',
    price: 99,
    category: 'Lechon & Grills',
    image: 'https://picsum.photos/400/300?random=4',
  },

  // Chicken
  { id: 'c1', name: 'Garlic Chicken', price: 220, category: 'Chicken Dishes', image: 'https://picsum.photos/400/300?random=5' },
  { id: 'c2', name: 'Buttered Chicken', price: 199, category: 'Chicken Dishes', image: 'https://picsum.photos/400/300?random=6' },
  { id: 'c3', name: 'Chicken Bang-Bang', price: 220, category: 'Chicken Dishes', image: 'https://picsum.photos/400/300?random=7' },
  { id: 'c4', name: 'Creamy Mushroom', price: 230, category: 'Chicken Dishes', image: 'https://picsum.photos/400/300?random=8' },
  { id: 'c5', name: 'Spicy Chicken', price: 220, category: 'Chicken Dishes', image: 'https://picsum.photos/400/300?random=9' },
  { id: 'c6', name: 'Chicken Tinola', price: 299, category: 'Chicken Dishes', image: 'https://picsum.photos/400/300?random=10' },

  // Pork
  { id: 'p1', name: 'Pork Adobo', price: 220, category: 'Pork Dishes', image: 'https://picsum.photos/400/300?random=11' },
  { id: 'p2', name: 'Pork Kinilaw', price: 299, category: 'Pork Dishes', image: 'https://picsum.photos/400/300?random=12' },
  { id: 'p3', name: 'Bicol Express', price: 310, category: 'Pork Dishes', image: 'https://picsum.photos/400/300?random=13' },
  { id: 'p4', name: 'Sinigang', price: 320, category: 'Pork Dishes', image: 'https://picsum.photos/400/300?random=14' },
  { id: 'p5', name: 'Pork Estopado', price: 299, category: 'Pork Dishes', image: 'https://picsum.photos/400/300?random=15' },

  // Beef
  { id: 'b1', name: 'Beef Steak', price: 339, category: 'Beef Dishes', image: 'https://picsum.photos/400/300?random=16' },
  { id: 'b2', name: 'Bulalo (Family)', price: 499, category: 'Beef Dishes', image: 'https://picsum.photos/400/300?random=17' },
  { id: 'b3', name: 'Bulalo (Medium)', price: 299, category: 'Beef Dishes', image: 'https://picsum.photos/400/300?random=18' },
  { id: 'b4', name: 'Beef Curry', price: 349, category: 'Beef Dishes', image: 'https://picsum.photos/400/300?random=19' },
  { id: 'b5', name: 'Beef Broccoli', price: 310, category: 'Beef Dishes', image: 'https://picsum.photos/400/300?random=20' },

  // Seafood
  { id: 's1', name: 'Fried Hito', price: 299, category: 'Seafood', image: 'https://picsum.photos/400/300?random=21' },
  { id: 's2', name: 'Sweet & Sour Fillet', price: 220, category: 'Seafood', image: 'https://picsum.photos/400/300?random=22' },
  { id: 's3', name: 'Shrimp Tempura', price: 310, category: 'Seafood', image: 'https://picsum.photos/400/300?random=23' },
  { id: 's4', name: 'Calamares', price: 200, category: 'Seafood', image: 'https://picsum.photos/400/300?random=24' },
  { id: 's5', name: 'Tilapia Sinugba', price: 250, category: 'Seafood', image: 'https://picsum.photos/400/300?random=25' },

  // Vegetables
  { id: 'v1', name: 'Chopsuey', price: 220, category: 'Vegetables', image: 'https://picsum.photos/400/300?random=26' },
  { id: 'v2', name: 'Pako Salad', price: 120, category: 'Vegetables', image: 'https://picsum.photos/400/300?random=27' },

  // Short Orders
  { id: 'so1', name: 'Pancit Canton', price: 175, category: 'Short Orders', image: 'https://picsum.photos/400/300?random=28' },
  { id: 'so2', name: 'Bam-i', price: 270, category: 'Short Orders', image: 'https://picsum.photos/400/300?random=29' },

  // Desserts
  { id: 'd1', name: 'Mango Graham', price: 120, category: 'Desserts', image: 'https://picsum.photos/400/300?random=30' },
  { id: 'd2', name: 'Mango Tapioca', price: 150, category: 'Desserts', image: 'https://picsum.photos/400/300?random=31' },
  { id: 'd3', name: 'Halo-Halo Special', price: 160, category: 'Desserts', image: 'https://picsum.photos/400/300?random=32' },

  // Extras
  { id: 'e1', name: 'Plain Rice', price: 15, category: 'Extras', image: 'https://via.placeholder.com/150?text=Rice' },
  { id: 'e2', name: 'Calamansi Juice', price: 25, category: 'Extras', image: 'https://via.placeholder.com/150?text=Calamansi' },
  {
    id: 'e3',
    name: 'Coke',
    price: 25,
    category: 'Extras',
    image: 'https://via.placeholder.com/150?text=Coke',
    variants: [
      { name: 'Mismo', price: 25 },
      { name: '1.25L', price: 65 },
      { name: '1.5L', price: 85 },
      { name: '1.75L', price: 100 }
    ]
  },

  // Today's Menu
  { id: 'tm1', name: 'Native Tinola Manok (Solo)', price: 70, category: "Today's Menu", image: 'https://via.placeholder.com/150?text=Tinola' },
  { id: 'tm2', name: 'Lechon Paksiw (Solo)', price: 70, category: "Today's Menu", image: 'https://via.placeholder.com/150?text=Paksiw' }
];