import type { Client } from '../types';

export const clients: Client[] = [
    {
        id: 1,
        name: 'Andrew & Samantha',
        email: 'client@email.com',
        username: 'client@email.com',
        password: 'clientpass',
        phone: '555-0101',
        address: '123 Wedding Ave, Celebration, FL 12345',
        avatarUrl: 'https://i.pravatar.cc/150?u=andrew_samantha',
        whatsappOptIn: true,
        emailOptIn: true,
        projects: [1],
        lastActivity: 'Commented 2 days ago'
    },
    {
        id: 2,
        name: 'The Miller Family',
        email: 'millers@example.com',
        username: 'millers@example.com',
        password: 'familypass',
        phone: '555-0102',
        address: '456 Family Rd, Suburbia, IL 67890',
        avatarUrl: 'https://i.pravatar.cc/150?u=millers',
        whatsappOptIn: false,
        emailOptIn: true,
        projects: [2],
        lastActivity: 'Viewed gallery 1 week ago'
    },
    {
        id: 3,
        name: 'Chris & Jessica',
        email: 'chris.jessica@example.com',
        username: 'chris.jessica@example.com',
        password: 'engaged',
        phone: '555-0103',
        avatarUrl: 'https://i.pravatar.cc/150?u=chris_jessica',
        whatsappOptIn: true,
        emailOptIn: false,
        projects: [3],
        lastActivity: 'Favorited 5 photos 3 days ago'
    },
];