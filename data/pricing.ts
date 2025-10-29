import type { PricingCategory } from '../types';

export const pricingData: PricingCategory[] = [
  {
    id: 'prints',
    name: 'Prints',
    sizeGroups: [
      { size: '20 X 30', items: [ { type: 'Lustre', price: 85 }, { type: 'Glossy', price: 85 }, { type: 'Deep Matte', price: 90 } ] },
      { size: '16 X 20', items: [ { type: 'Lustre', price: 60 }, { type: 'Glossy', price: 60 }, { type: 'Deep Matte', price: 65 } ] },
      { size: '11 X 14', items: [ { type: 'Lustre', price: 40 }, { type: 'Glossy', price: 40 }, { type: 'Deep Matte', price: 45 } ] },
      { size: '8 X 10', items: [ { type: 'Lustre', price: 30 }, { type: 'Glossy', price: 30 }, { type: 'Deep Matte', price: 35 } ] },
      { size: '5 X 7', items: [ { type: 'Lustre', price: 20 }, { type: 'Glossy', price: 20 }, { type: 'Deep Matte', price: 25 } ] },
      { size: '4 X 6', items: [ { type: 'Lustre', price: 10 }, { type: 'Glossy', price: 10 }, { type: 'Deep Matte', price: 15 } ] },
    ],
  },
  {
    id: 'fine-art',
    name: 'Fine Art Prints',
    sizeGroups: [
      { size: '20 X 30', items: [ { type: 'Archival Matte', price: 150 }, { type: 'Textured Rag', price: 175 } ] },
      { size: '16 X 20', items: [ { type: 'Archival Matte', price: 120 }, { type: 'Textured Rag', price: 140 } ] },
      { size: '11 X 14', items: [ { type: 'Archival Matte', price: 90 }, { type: 'Textured Rag', price: 105 } ] },
    ],
  },
  {
    id: 'digitals',
    name: 'Digitals',
    sizeGroups: [
        { size: 'Single Photo', items: [ { type: 'High-Resolution', price: 25 }, { type: 'Social Media', price: 10 } ] },
        { size: 'Full Gallery', items: [ { type: 'High-Resolution', price: 500 } ] },
    ],
  },
  {
    id: 'canvases',
    name: 'Canvases',
    sizeGroups: [
        { size: '24 X 36', items: [ { type: 'Gallery Wrap', price: 250 } ] },
        { size: '16 X 20', items: [ { type: 'Gallery Wrap', price: 150 } ] },
    ],
  },
  {
    id: 'metal',
    name: 'Metal Prints',
    sizeGroups: [
        { size: '24 X 36', items: [ { type: 'High Gloss', price: 350 } ] },
        { size: '16 X 20', items: [ { type: 'High Gloss', price: 220 } ] },
    ],
  },
  {
    id: 'products',
    name: 'Products',
    sizeGroups: [
        { size: '10x10 Album', items: [ { type: 'Linen Cover', price: 800 }, { type: 'Leather Cover', price: 950 }] },
        { size: 'Set of 50 Cards', items: [ { type: 'Custom Design', price: 120 } ]}
    ],
  },
  {
    id: 'packages',
    name: 'Packages',
    sizeGroups: [],
  },
];
