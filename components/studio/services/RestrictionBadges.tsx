import React from 'react';

interface RestrictionBadgesProps {
  restrictions?: Record<string, any> | null;
  lifecycleConfig?: Record<string, any> | null;
}

const RestrictionBadges: React.FC<RestrictionBadgesProps> = ({ restrictions, lifecycleConfig }) => {
  if (!restrictions && !lifecycleConfig) return null;

  const badges: { label: string; value: string; color: string }[] = [];

  // Photo selection limit
  if (restrictions?.photo_selection_limit) {
    badges.push({
      label: 'Max Photos',
      value: `${restrictions.photo_selection_limit}`,
      color: 'blue',
    });
  }

  // Video support
  if (restrictions?.video_support_enabled) {
    badges.push({
      label: 'Video',
      value: restrictions.video_max_gb ? `${restrictions.video_max_gb}GB` : 'Yes',
      color: 'purple',
    });
  }

  // WhatsApp integration
  if (restrictions?.whatsapp_integration) {
    badges.push({
      label: 'WhatsApp',
      value: 'Enabled',
      color: 'green',
    });
  }

  // Album creation
  if (restrictions?.album_enabled) {
    badges.push({
      label: 'Album',
      value: restrictions.album_quality || 'Included',
      color: 'pink',
    });
  }

  // Editing period
  if (lifecycleConfig?.editing_period_months) {
    badges.push({
      label: 'Editing',
      value: `${lifecycleConfig.editing_period_months}mo`,
      color: 'yellow',
    });
  }

  // Retention period
  if (lifecycleConfig?.retention_years) {
    badges.push({
      label: 'Retention',
      value: `${lifecycleConfig.retention_years}yr`,
      color: 'gray',
    });
  }

  if (badges.length === 0) return null;

  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-800',
    purple: 'bg-purple-100 text-purple-800',
    green: 'bg-green-100 text-green-800',
    pink: 'bg-pink-100 text-pink-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    gray: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {badges.map((badge, idx) => (
        <span
          key={idx}
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colorClasses[badge.color] || colorClasses.gray}`}
        >
          {badge.label}: {badge.value}
        </span>
      ))}
    </div>
  );
};

export default RestrictionBadges;
