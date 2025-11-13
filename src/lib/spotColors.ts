/**
 * Spot Colors Utility
 * 
 * Provides color mapping and CSS generation for parking spots
 * based on their attributes (accessible, charger, compact).
 */

import type { ParkingSpot } from '@/types/admin/parking-spots.types';

/**
 * Color mapping for spot attributes
 */
const SPOT_COLORS = {
  accessible: '#3b82f6',  // Azul - Plazas accesibles (PMR)
  charger: '#22c55e',     // Verde - Plazas con cargador eléctrico
  compact: '#eab308',     // Amarillo - Plazas compactas
  standard: 'hsl(var(--primary))', // Color primario - Plazas estándar
} as const;

/**
 * Get array of colors for a parking spot based on its attributes
 * 
 * @param spot - Parking spot with attributes
 * @returns Array of color strings (hex or CSS variable)
 * 
 * @example
 * // Standard spot (no attributes)
 * getSpotColors({ is_accessible: false, has_charger: false, is_compact: false })
 * // Returns: ['hsl(var(--primary))']
 * 
 * @example
 * // Accessible spot with charger
 * getSpotColors({ is_accessible: true, has_charger: true, is_compact: false })
 * // Returns: ['#3b82f6', '#22c55e']
 * 
 * @example
 * // Spot with all attributes
 * getSpotColors({ is_accessible: true, has_charger: true, is_compact: true })
 * // Returns: ['#3b82f6', '#22c55e', '#eab308']
 */
export const getSpotColors = (spot: Pick<ParkingSpot, 'is_accessible' | 'has_charger' | 'is_compact'>): string[] => {
  const colors: string[] = [];
  
  // Add colors in priority order: accessible > charger > compact
  if (spot.is_accessible) {
    colors.push(SPOT_COLORS.accessible);
  }
  
  if (spot.has_charger) {
    colors.push(SPOT_COLORS.charger);
  }
  
  if (spot.is_compact) {
    colors.push(SPOT_COLORS.compact);
  }
  
  // If no attributes, use standard color
  if (colors.length === 0) {
    colors.push(SPOT_COLORS.standard);
  }
  
  return colors;
};

/**
 * Generate CSS background style for a spot based on its colors
 * 
 * @param colors - Array of color strings
 * @returns CSS background value (solid color or linear gradient)
 * 
 * @example
 * // Single color (standard spot)
 * getSpotBackground(['hsl(var(--primary))'])
 * // Returns: 'hsl(var(--primary))'
 * 
 * @example
 * // Two colors (accessible + charger)
 * getSpotBackground(['#3b82f6', '#22c55e'])
 * // Returns: 'linear-gradient(90deg, #3b82f6 50%, #22c55e 50%)'
 * 
 * @example
 * // Three colors (accessible + charger + compact)
 * getSpotBackground(['#3b82f6', '#22c55e', '#eab308'])
 * // Returns: 'linear-gradient(90deg, #3b82f6 33.33%, #22c55e 33.33% 66.66%, #eab308 66.66%)'
 */
export const getSpotBackground = (colors: string[]): string => {
  // Single color: solid background
  if (colors.length === 1) {
    return colors[0];
  }
  
  // Two colors: split 50/50
  if (colors.length === 2) {
    return `linear-gradient(90deg, ${colors[0]} 50%, ${colors[1]} 50%)`;
  }
  
  // Three colors: split in thirds
  if (colors.length === 3) {
    return `linear-gradient(90deg, ${colors[0]} 33.33%, ${colors[1]} 33.33% 66.66%, ${colors[2]} 66.66%)`;
  }
  
  // Fallback: use first color
  return colors[0];
};

/**
 * Calculate optimal font size for spot number based on text length and button size
 * 
 * @param spotNumber - The spot number text (e.g., "A-1", "B-123")
 * @param buttonSize - Button size in pixels (12-64)
 * @returns Font size in pixels
 * 
 * @example
 * // Short number
 * getFontSize('A-1', 32)
 * // Returns: 12.8 (40% of 32)
 * 
 * @example
 * // Long number (5+ chars)
 * getFontSize('A-12345', 32)
 * // Returns: 10.24 (80% of base size)
 * 
 * @example
 * // Very long number (7+ chars)
 * getFontSize('AB-12345', 32)
 * // Returns: 7.68 (60% of base size)
 */
export const getFontSize = (spotNumber: string, buttonSize: number): number => {
  // Base size: 40% of button size
  const baseSize = buttonSize * 0.4;
  const charCount = spotNumber.length;
  
  // Reduce size for longer numbers
  if (charCount > 6) {
    return baseSize * 0.6; // 60% for very long numbers
  }
  
  if (charCount > 4) {
    return baseSize * 0.8; // 80% for long numbers
  }
  
  return baseSize;
};

/**
 * Get human-readable label for spot attributes
 * 
 * @param spot - Parking spot with attributes
 * @returns Comma-separated string of attribute labels
 * 
 * @example
 * getSpotAttributesLabel({ is_accessible: true, has_charger: true, is_compact: false })
 * // Returns: "Accesible, Cargador"
 */
export const getSpotAttributesLabel = (spot: Pick<ParkingSpot, 'is_accessible' | 'has_charger' | 'is_compact'>): string => {
  const labels: string[] = [];
  
  if (spot.is_accessible) {
    labels.push('Accesible');
  }
  
  if (spot.has_charger) {
    labels.push('Cargador');
  }
  
  if (spot.is_compact) {
    labels.push('Compacta');
  }
  
  return labels.length > 0 ? labels.join(', ') : 'Estándar';
};
