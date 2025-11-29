/**
 * Client Mapper
 * Transforms backend client responses to frontend Client type
 */

import type { Client } from '../../types';
import type { Client as BackendClient } from '../../services/clientService';

export const mapClientResponse = (client: BackendClient): Client => ({
    id: String(client.id),
    name: client.name,
    email: client.email,
    username: client.username ?? client.email,
    password: (client as any).password ?? undefined,
    hasPassword: (client as any).has_password ?? false,
    phone: client.phone ?? undefined,
    address: client.address ?? undefined,
    avatarUrl: (client as any).avatar_url ?? null,
    profilePicture: (client as any).profile_picture ?? null,
    whatsappOptIn: (client as any).whatsapp_opt_in ?? false,
    emailOptIn: (client as any).email_opt_in ?? true,
    projects: [],
    totalProjects: (client as any).total_projects ?? 0,
    lastActivity: client.updated_at ?? client.created_at,
    status: (client as any).status ?? (client.is_active ? 'active' : 'inactive'),
});
