import { Accessibility, Zap, Car } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Iconos modernos para atributos de plazas de parking
 */

export const SpotAttributeIcons = {
  accessible: Accessibility,
  charger: Zap,
  compact: Car,
};

export const SpotAttributeConfig = {
  accessible: {
    icon: Accessibility,
    label: 'PMR',
    fullLabel: 'Accesible (PMR)',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  charger: {
    icon: Zap,
    label: 'Cargador',
    fullLabel: 'Con Cargador Eléctrico',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
  },
  compact: {
    icon: Car,
    label: 'Reducida',
    fullLabel: 'Plaza Compacta',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
  },
};

interface SpotIconProps {
  type: 'accessible' | 'charger' | 'compact';
  className?: string;
  size?: number;
}

export const SpotIcon = ({ type, className, size = 16 }: SpotIconProps) => {
  const Icon = SpotAttributeConfig[type].icon;
  const color = SpotAttributeConfig[type].color;
  
  return <Icon className={cn(color, className)} size={size} />;
};

interface SpotAttributeBadgeProps {
  type: 'accessible' | 'charger' | 'compact';
  showLabel?: boolean;
  className?: string;
}

export const SpotAttributeBadge = ({ 
  type, 
  showLabel = true, 
  className 
}: SpotAttributeBadgeProps) => {
  const config = SpotAttributeConfig[type];
  const Icon = config.icon;
  
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium',
      config.bgColor,
      config.borderColor,
      config.color,
      'border',
      className
    )}>
      <Icon className="w-3 h-3" />
      {showLabel && config.label}
    </span>
  );
};

export const getSpotAttributes = (spot: {
  is_accessible?: boolean;
  has_charger?: boolean;
  is_compact?: boolean;
}) => {
  const attributes: Array<'accessible' | 'charger' | 'compact'> = [];
  
  if (spot.is_accessible) attributes.push('accessible');
  if (spot.has_charger) attributes.push('charger');
  if (spot.is_compact) attributes.push('compact');
  
  return attributes;
};

export const getSpotAttributesText = (spot: {
  is_accessible?: boolean;
  has_charger?: boolean;
  is_compact?: boolean;
}) => {
  const attributes = getSpotAttributes(spot);
  return attributes.map(attr => SpotAttributeConfig[attr].label).join(', ');
};
