import type { Photo } from '../types';

// Let's create a helper to generate photos to avoid repetition
const createPhoto = (id: number, seed: number, alt: string, width: number, height: number): Photo => ({
    id,
    src: `https://picsum.photos/seed/${seed}/${width}/${height}`,
    alt,
    width,
    height,
    comments: [],
});

export const gettingReadyPhotos: Photo[] = [
    createPhoto(1, 101, "Bride and groom walking down the aisle", 800, 1200),
    createPhoto(7, 107, "Groom seeing bride for the first time", 800, 1200),
    createPhoto(8, 108, "Bridal party portrait", 1200, 800),
];

export const ceremonyPhotos: Photo[] = [
    createPhoto(2, 102, "Close-up of wedding rings", 1200, 800),
    createPhoto(9, 109, "Ceremony details", 1200, 800),
    createPhoto(4, 104, "Wedding cake cutting", 800, 1200),
];

export const receptionPhotos: Photo[] = [
    createPhoto(3, 103, "First dance", 1200, 800),
    createPhoto(5, 105, "Guests celebrating", 1200, 800),
    createPhoto(6, 106, "Bride throwing bouquet", 800, 1200),
    createPhoto(10, 110, "Couple's portrait at sunset", 1200, 800),
    createPhoto(11, 111, "Reception venue shot", 1200, 800),
    createPhoto(12, 112, "Candid guest laughter", 800, 1200),
];

receptionPhotos[0].comments = [
    { id: 1, author: 'Client', text: "This is my favorite one! Can we get it in black and white?", timestamp: "2 days ago", replies: [
        { id: 2, author: 'Studio', text: "Absolutely! I've added a B&W version to a 'proofs' folder for you.", timestamp: "1 day ago" }
    ]},
];

export const weddingPhotos: Photo[] = [...gettingReadyPhotos, ...ceremonyPhotos, ...receptionPhotos];


export const engagementPhotos: Photo[] = [
    createPhoto(13, 201, "Couple laughing in a park", 1200, 800),
    createPhoto(14, 202, "Close-up of engagement ring", 800, 1200),
    createPhoto(15, 203, "Walking hand-in-hand", 1200, 800),
    createPhoto(16, 204, "Kiss on the forehead", 800, 1200),
    createPhoto(17, 205, "Candid moment by a lake", 1200, 800),
    createPhoto(18, 206, "Picnic blanket scene", 1200, 800),
];

engagementPhotos[0].comments = [
    { id: 3, author: 'Client', text: "Love this one so much!", timestamp: "5 days ago" }
];

export const familyPortraits: Photo[] = [
    createPhoto(19, 301, "Family of four sitting on a log", 1200, 800),
    createPhoto(20, 302, "Kids playing in leaves", 1200, 800),
    createPhoto(21, 303, "Parents smiling at each other", 800, 1200),
    createPhoto(22, 304, "Full family portrait", 1200, 800),
];