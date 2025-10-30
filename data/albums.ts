import type { Photo, Album, Comment } from '../types';

const generateComments = (photoId: number): Comment[] => {
    const comments: Comment[] = [];
    if (photoId % 5 === 0) {
        comments.push({
            id: photoId * 100 + 1,
            author: 'Client',
            text: 'Love this one! Can we get it in black and white?',
            timestamp: '2 days ago',
        });
    }
     if (photoId % 7 === 0) {
        comments.push({
            id: photoId * 100 + 2,
            author: 'Client',
            text: 'This is my absolute favorite!',
            timestamp: '1 day ago',
        });
        comments.push({
            id: photoId * 100 + 3,
            author: 'Studio',
            text: 'So glad you like it! I can definitely provide a B&W version.',
            timestamp: '1 day ago',
        });
    }
    return comments;
}

const generatePhotos = (count: number, albumId: number): Photo[] => {
    return Array.from({ length: count }, (_, i) => {
        const isPortrait = i % 3 === 0;
        const width = isPortrait ? 600 : 800;
        const height = isPortrait ? 800 : 600;
        
        const randomWidth = width + Math.floor(Math.random() * 200) - 100;
        const randomHeight = height + Math.floor(Math.random() * 200) - 100;
        const photoId = (albumId * 1000) + i + 1;

        return {
            id: photoId,
            src: `https://picsum.photos/${randomWidth}/${randomHeight}?random=${photoId}&grayscale`,
            width: randomWidth,
            height: randomHeight,
            alt: `Photo ${i + 1} from album ${albumId}`,
            comments: generateComments(photoId),
        };
    });
};

const albumData = [
    { id: 1, title: 'Engagement Session', photoCount: 72, isLocked: false, clientName: 'Andrew + Samantha', shootDate: '2023-08-15' },
    { id: 2, title: 'Getting Ready', photoCount: 64, isLocked: true, clientName: 'Andrew + Samantha', shootDate: '2023-10-20' },
    { id: 3, title: 'First Look', photoCount: 61, isLocked: false, clientName: 'Andrew + Samantha', shootDate: '2023-10-20' },
    { id: 4, title: 'Ceremony', photoCount: 123, isLocked: false, clientName: 'Andrew + Samantha', shootDate: '2023-10-20' },
    { id: 5, title: 'Reception', photoCount: 150, isLocked: false, clientName: 'Andrew + Samantha', shootDate: '2023-10-20' },
    { id: 6, title: 'Portraits', photoCount: 88, isLocked: false, clientName: 'Jessica & Tom', shootDate: '2023-09-05' },
    { id: 7, title: 'Details', photoCount: 45, isLocked: false, clientName: 'Jessica & Tom', shootDate: '2023-09-05' },
    { id: 8, title: 'Dancing', photoCount: 110, isLocked: false, clientName: 'Maria & Carlos', shootDate: '2023-11-12' },
];

export const albums: Album[] = albumData.map(album => {
    const photos = generatePhotos(album.photoCount, album.id);
    return {
        ...album,
        coverPhotoSrc: photos[0]?.src.replace(/(\d+)\/(\d+)/, '800/600') || `https://picsum.photos/800/600?random=${album.id}&grayscale`, // Use first photo as cover
        photos: photos,
    };
});