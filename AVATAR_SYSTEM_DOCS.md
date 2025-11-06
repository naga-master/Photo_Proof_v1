# Avatar System Implementation

## Overview
Implemented a modern avatar system with colorful initials for clients without profile pictures, similar to Google, WhatsApp, and GitHub.

## Components Created

### 1. Avatar Utility (`utils/avatarUtils.ts`)
- **`getInitials(name)`** - Extracts up to 2 initials from a name
- **`getAvatarColor(name)`** - Returns consistent color based on name hash
- **`getAvatarConfig(name, profilePicture)`** - Determines if showing image or initials
- **`generateAvatarSvg(name, size)`** - Generates SVG data URI for avatars

**Features:**
- 14 Material Design inspired color combinations
- Consistent hashing algorithm ensures same name = same color
- High contrast text colors for accessibility

### 2. Avatar Component (`components/Avatar.tsx`)
- **`<Avatar>`** - Base avatar component with customizable size
- **`<AvatarLarge>`** - 80px variant for profile pages
- **`<AvatarSmall>`** - 32px variant for compact lists
- **Automatic fallback** - If image fails to load, shows initials

**Props:**
```tsx
interface AvatarProps {
  name: string;
  profilePicture?: string | null;
  size?: number;
  className?: string;
  onClick?: () => void;
}
```

## Updated Components

### ClientsPage.tsx
- Replaced `<img>` with `<Avatar>` component in client list table
- Shows colorful initials for clients without photos
- Size: 40px

### ClientDetailsPage.tsx
- Replaced profile picture with `<AvatarLarge>` component
- Shows 80px avatar in client profile sidebar
- Maintains photo upload/change functionality

## Usage Examples

```tsx
// Basic avatar
<Avatar name="John Doe" profilePicture={client.profilePicture} />

// With custom size
<Avatar name="Jane Smith" size={60} />

// Large avatar for profiles
<AvatarLarge name="Bob Johnson" profilePicture={url} />

// Small avatar for lists
<AvatarSmall name="Alice Williams" />

// With click handler
<Avatar 
  name="Charlie Brown" 
  onClick={() => handleClientClick(client)}
/>
```

## Color Palette
14 professional colors chosen from Material Design:
- Red, Pink, Purple, Deep Purple
- Indigo, Blue, Light Blue, Cyan
- Teal, Green, Light Green
- Deep Orange, Brown, Blue Grey

## Benefits
1. **Professional appearance** - No more broken image icons
2. **Instant recognition** - Unique colors help identify clients quickly
3. **Consistent UX** - Same as popular apps (Google, WhatsApp, GitHub)
4. **Performance** - No network requests for generated avatars
5. **Accessible** - High contrast text on colored backgrounds

## Testing
1. Navigate to Clients page - see avatars in table
2. Click on a client - see large avatar in profile
3. Upload a profile picture - see it replace the initials
4. Remove profile picture - see initials avatar return

## Future Enhancements
- Add avatar to invoice client display
- Show avatar in project client selector
- Add avatar to top navigation bar
- Allow custom color themes per studio
