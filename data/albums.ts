import type { Album } from '../types';
import { weddingPhotos, engagementPhotos, familyPortraits } from './photos';

export const albums: Album[] = [
  {
    id: 1,
    title: "Andrew & Samantha's Wedding",
    clientId: 1,
    shootDate: "2023-10-10",
    coverPhotoSrc: weddingPhotos[0].src,
    photoCount: weddingPhotos.length,
    isLocked: false,
    photos: weddingPhotos,
  },
  {
    id: 2,
    title: "The Miller Family Portraits",
    clientId: 2,
    shootDate: "2023-09-15",
    coverPhotoSrc: familyPortraits[0].src,
    photoCount: familyPortraits.length,
    isLocked: true,
    photos: familyPortraits,
  },
  {
    id: 3,
    title: "Chris & Jessica's Engagement",
    clientId: 3,
    shootDate: "2023-08-20",
    coverPhotoSrc: engagementPhotos[0].src,
    photoCount: engagementPhotos.length,
    isLocked: false,
    photos: engagementPhotos,
  },
];
