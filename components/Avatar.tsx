import React, { useState } from 'react';
import { getAvatarConfig, generateAvatarSvg } from '../utils/avatarUtils';

interface AvatarProps {
  name: string;
  profilePicture?: string | null;
  size?: number;
  className?: string;
  onClick?: () => void;
}

/**
 * Avatar component that displays profile picture or generated initials
 * Similar to Google, WhatsApp, GitHub avatars
 */
export const Avatar: React.FC<AvatarProps> = ({
  name,
  profilePicture,
  size = 40,
  className = '',
  onClick,
}) => {
  const [imageError, setImageError] = useState(false);
  const config = getAvatarConfig(name, profilePicture);

  // If image failed to load or no profile picture, show initials
  const shouldShowInitials = config.type === 'initials' || imageError;

  const baseStyle: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: '50%',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    userSelect: 'none',
    cursor: onClick ? 'pointer' : 'default',
  };

  if (shouldShowInitials) {
    const fontSize = Math.floor(size * 0.4);
    return (
      <div
        className={className}
        onClick={onClick}
        style={{
          ...baseStyle,
          backgroundColor: config.backgroundColor,
          color: config.textColor,
          fontSize: `${fontSize}px`,
          fontWeight: 500,
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
        title={name}
      >
        {config.initials}
      </div>
    );
  }

  return (
    <img
      src={config.imageUrl}
      alt={name}
      className={className}
      onClick={onClick}
      onError={() => setImageError(true)}
      style={baseStyle}
      title={name}
    />
  );
};

/**
 * Larger avatar variant for profile pages
 */
export const AvatarLarge: React.FC<Omit<AvatarProps, 'size'>> = (props) => {
  return <Avatar {...props} size={80} />;
};

/**
 * Small avatar variant for lists and compact views
 */
export const AvatarSmall: React.FC<Omit<AvatarProps, 'size'>> = (props) => {
  return <Avatar {...props} size={32} />;
};

export default Avatar;
