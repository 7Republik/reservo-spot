/**
 * Parking Spots Domain Types
 * 
 * Defines all types related to parking spot configuration,
 * including attributes, position, and status.
 */

/**
 * Visual size options for parking spot buttons
 */
export type VisualSize = 'small' | 'medium' | 'large';

/**
 * Parking spot position coordinates (percentage-based)
 */
export interface SpotPosition {
  position_x: number | null;
  position_y: number | null;
}

/**
 * Special attributes for parking spots
 */
export interface SpotAttributes {
  is_accessible: boolean;  // PMR (Movilidad Reducida)
  has_charger: boolean;    // Electric charging
  is_compact: boolean;     // Reduced size (warning)
}

/**
 * Complete parking spot entity
 */
export interface ParkingSpot extends SpotAttributes, SpotPosition {
  id: string;
  spot_number: string;
  group_id: string | null;
  is_active: boolean;
  visual_size: string;
  notes: string | null;
  parking_groups?: {
    id: string;
    name: string;
  };
}

/**
 * Floor plan dimensions for visual editor
 */
export interface FloorPlanDimensions {
  width: number;
  height: number;
}

/**
 * Spot button size configuration (16-64px)
 */
export type SpotButtonSize = number;
