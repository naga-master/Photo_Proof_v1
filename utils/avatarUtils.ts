/**
 * Avatar utility functions for generating colorful avatars with initials
 * Similar to Google, WhatsApp, GitHub, etc.
 */

// Material Design inspired color palette for avatars
const AVATAR_COLORS = [
  { bg: '#E57373', text: '#FFFFFF' }, // Red
  { bg: '#F06292', text: '#FFFFFF' }, // Pink
  { bg: '#BA68C8', text: '#FFFFFF' }, // Purple
  { bg: '#9575CD', text: '#FFFFFF' }, // Deep Purple
  { bg: '#7986CB', text: '#FFFFFF' }, // Indigo
  { bg: '#64B5F6', text: '#FFFFFF' }, // Blue
  { bg: '#4FC3F7', text: '#FFFFFF' }, // Light Blue
  { bg: '#4DD0E1', text: '#FFFFFF' }, // Cyan
  { bg: '#4DB6AC', text: '#FFFFFF' }, // Teal
  { bg: '#81C784', text: '#FFFFFF' }, // Green
  { bg: '#AED581', text: '#212121' }, // Light Green
  { bg: '#FF8A65', text: '#FFFFFF' }, // Deep Orange
  { bg: '#A1887F', text: '#FFFFFF' }, // Brown
  { bg: '#90A4AE', text: '#FFFFFF' }, // Blue Grey
];

/**
 * Generate a consistent hash from a string
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Get initials from a name
 * @param name - Full name of the person
 * @returns Up to 2 initials
 */
export function getInitials(name: string): string {
  if (!name || name.trim().length === 0) {
    return '?';
  }

  const trimmedName = name.trim();
  const words = trimmedName.split(/\s+/);
  
  if (words.length === 1) {
    // Single word: take first 2 characters
    return trimmedName.substring(0, 2).toUpperCase();
  }
  
  // Multiple words: take first letter of first and last word
  const firstInitial = words[0][0];
  const lastInitial = words[words.length - 1][0];
  return (firstInitial + lastInitial).toUpperCase();
}

/**
 * Get a consistent color for a name
 * @param name - Name to generate color for
 * @returns Color object with background and text colors
 */
export function getAvatarColor(name: string): { bg: string; text: string } {
  const hash = hashString(name || 'unknown');
  const colorIndex = hash % AVATAR_COLORS.length;
  return AVATAR_COLORS[colorIndex];
}

/**
 * Generate avatar props for a user
 * @param name - User's name
 * @param profilePicture - Optional profile picture URL
 * @returns Avatar configuration
 */
export interface AvatarConfig {
  type: 'image' | 'initials';
  imageUrl?: string;
  initials?: string;
  backgroundColor?: string;
  textColor?: string;
}

export function getAvatarConfig(name: string, profilePicture?: string | null): AvatarConfig {
  if (profilePicture && profilePicture.trim().length > 0) {
    return {
      type: 'image',
      imageUrl: profilePicture,
    };
  }

  const initials = getInitials(name);
  const colors = getAvatarColor(name);
  
  return {
    type: 'initials',
    initials,
    backgroundColor: colors.bg,
    textColor: colors.text,
  };
}

/**
 * Generate inline SVG for an avatar (useful for fallbacks)
 * @param name - User's name
 * @returns Data URI with SVG avatar
 */
export function generateAvatarSvg(name: string, size: number = 100): string {
  const initials = getInitials(name);
  const colors = getAvatarColor(name);
  const fontSize = Math.floor(size * 0.4); // 40% of size

  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="${colors.bg}"/>
      <text
        x="50%"
        y="50%"
        dominant-baseline="central"
        text-anchor="middle"
        font-family="system-ui, -apple-system, sans-serif"
        font-size="${fontSize}"
        font-weight="500"
        fill="${colors.text}"
      >${initials}</text>
    </svg>
  `.trim();

  return `data:image/svg+xml;base64,${btoa(svg)}`;
}
