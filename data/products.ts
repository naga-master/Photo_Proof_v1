
import type { Product } from '../types';

export const products: Product[] = [
  {
    id: 'prints',
    name: 'Lustre Print',
    shortDescription: 'Professional quality prints with a subtle sheen.',
    detailedDescription: 'Our Lustre Prints are a classic choice, offering the color saturation of a glossy finish with the fingerprint resistance of matte. Printed on archival quality paper, these prints are designed to last a lifetime.',
    specs: {
      'Paper Type': 'Kodak Endura Professional',
      'Finish': 'Lustre (Semi-Matte)',
      'Archival Quality': '100+ years',
    },
    sizes: [
      { size: '4x6', price: 10 },
      { size: '5x7', price: 20 },
      { size: '8x10', price: 30 },
      { size: '11x14', price: 40 },
      { size: '16x20', price: 60 },
      { size: '20x30', price: 85 },
    ],
    types: [
        { name: 'Lustre' },
        { name: 'Glossy' },
        { name: 'Deep Matte' },
    ],
    mockupImages: [
      'https://images.unsplash.com/photo-1516592673884-4a382d112b01?q=80&w=1470&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1517094399396-a3c3f982865c?q=80&w=1470&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1519995522343-c63d5088a28f?q=80&w=1470&auto=format&fit=crop',
    ],
  },
  {
    id: 'fine-art',
    name: 'Fine Art Print',
    shortDescription: 'Museum-quality prints on textured, heavyweight paper.',
    detailedDescription: 'Elevate your photos with our Fine Art Prints. Using archival inks on acid-free, textured paper, these prints offer exceptional image permanence and a stunning, artistic feel.',
    specs: {
      'Paper Type': 'Archival Matte or Textured Rag',
      'Inks': 'Pigment-based archival inks',
      'Weight': '310 gsm',
    },
    sizes: [
      { size: '11x14', price: 90 },
      { size: '16x20', price: 120 },
      { size: '20x30', price: 150 },
    ],
    mockupImages: [
      'https://images.unsplash.com/photo-1593011033158-95244185e353?q=80&w=1470&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1522204523234-8729aa6e3d5f?q=80&w=1470&auto=format&fit=crop',
    ],
  },
  {
    id: 'digitals',
    name: 'Digital File',
    shortDescription: 'High-resolution digital downloads of your photos.',
    detailedDescription: 'Get a high-resolution digital copy of your favorite photos, perfect for sharing online, printing on your own, or for archival purposes. Delivered instantly via email.',
    specs: {
      'Resolution': '300 DPI JPEG',
      'Delivery': 'Instant Download',
      'License': 'Personal Use',
    },
    sizes: [
      { size: 'Single Photo', price: 25 },
      { size: 'Full Gallery', price: 500 },
    ],
    mockupImages: [
      'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1470&auto=format&fit=crop',
    ],
  },
  {
    id: 'canvases',
    name: 'Gallery Wrapped Canvas',
    shortDescription: 'A timeless, ready-to-hang piece of art.',
    detailedDescription: 'Your photo is printed on high-quality canvas and stretched over a sturdy wooden frame. With a classic gallery wrap, this piece is ready to hang and admire right out of the box.',
    specs: {
      'Material': 'Archival-grade canvas',
      'Frame': '1.5" deep solid wood',
      'Finish': 'Protective UV-resistant coating',
    },
    sizes: [
      { size: '16x20', price: 150 },
      { size: '24x36', price: 250 },
    ],
    mockupImages: [
      'https://images.unsplash.com/photo-1596464716127-10e2a3915152?q=80&w=1470&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1618221195724-c94624445f32?q=80&w=1364&auto=format&fit=crop',
    ],
  },
  {
    id: 'metal',
    name: 'Metal Print',
    shortDescription: 'Vibrant, high-gloss prints on a sleek aluminum panel.',
    detailedDescription: 'Make your images pop with a Metal Print. Your photo is infused directly into a sheet of aluminum for a brilliant, durable, and modern display. Comes with a float mount for a stunning wall presentation.',
    specs: {
        'Material': 'Dye-infused Aluminum',
        'Finish': 'High Gloss',
        'Features': 'Waterproof, scratch-resistant',
    },
    sizes: [
        { size: '16x20', price: 220 },
        { size: '24x36', price: 350 },
    ],
    mockupImages: [
        'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=1470&auto=format&fit=crop',
    ],
  },
  {
    id: 'products',
    name: 'Photo Album',
    shortDescription: 'A beautiful, custom-designed album of your day.',
    detailedDescription: 'A handcrafted, lay-flat album featuring your selected images. Choose from a variety of cover materials and customization options to create a perfect heirloom.',
    specs: {
        'Pages': '20-50 thick, lay-flat pages',
        'Cover': 'Linen or Leather options',
        'Design': 'Custom layout included',
    },
    sizes: [
        { size: '10x10 Album', price: 800 },
    ],
    mockupImages: [
        'https://images.unsplash.com/photo-1544226120-de4c36979a49?q=80&w=1470&auto=format&fit=crop',
    ],
  }
];
