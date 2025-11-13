import { useState, useRef, useEffect, memo } from "react";
import { cn } from "@/lib/utils";
import { getSpotColors, getSpotBackground, getFontSize } from "@/lib/spotColors";
import type { ParkingSpot } from "@/types/admin";

interface DraggableSpotProps {
  spot: ParkingSpot;
  size: number;
  onClick: () => void;
  isDrawingMode: boolean;
  isHandToolActive: boolean;
  isDragging: boolean;
  isNewlyCreated?: boolean;
  onDragStart: () => void;
  onDragMove: (x: number, y: number) => void;
  onDragEnd: (x: number, y: number) => void;
}

/**
 * DraggableSpot Component
 * 
 * Renders a parking spot button on the floor plan with:
 * - Dynamic colors based on attributes (accessible, charger, compact)
 * - Automatic font size adjustment based on spot number length
 * - Smooth hover effects and transitions
 * - Click handling for editing spot attributes
 * - Drag & drop for repositioning spots
 * 
 * **Performance Optimizations:**
 * - Memoized with React.memo to prevent unnecessary re-renders
 * - Custom comparison function checks only relevant props
 * - Only re-renders when spot data, size, or interaction state changes
 * 
 * @param spot - Parking spot data with position and attributes
 * @param size - Button size in pixels (12-64)
 * @param onClick - Handler for spot click (opens edit dialog)
 * @param isDrawingMode - Whether drawing mode is active (disables spot clicks)
 * @param isHandToolActive - Whether hand tool is active (disables spot interaction)
 * @param isDragging - Whether this spot is currently being dragged
 * @param isNewlyCreated - Whether this spot was just created (triggers animation)
 * @param onDragStart - Handler for drag start
 * @param onDragMove - Handler for drag move
 * @param onDragEnd - Handler for drag end
 */
const DraggableSpotComponent = ({
  spot,
  size,
  onClick,
  isDrawingMode,
  isHandToolActive,
  isDragging,
  isNewlyCreated = false,
  onDragStart,
  onDragMove,
  onDragEnd,
}: DraggableSpotProps) => {
  // Get colors based on spot attributes
  const colors = getSpotColors(spot);
  const background = getSpotBackground(colors);
  
  // Calculate optimal font size for spot number
  const fontSize = getFontSize(spot.spot_number, size);

  // Local state for drag detection
  const [mouseDownPos, setMouseDownPos] = useState<{ x: number; y: number } | null>(null);
  const [hasMoved, setHasMoved] = useState(false);
  const [isDragIntent, setIsDragIntent] = useState(false);
  const dragTimerRef = useRef<NodeJS.Timeout | null>(null);
  const mouseDownTimeRef = useRef<number>(0);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (dragTimerRef.current) {
        clearTimeout(dragTimerRef.current);
      }
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Don't start drag if in drawing mode or hand tool is active
    if (isDrawingMode || isHandToolActive) return;
    
    // Record initial mouse position and time
    setMouseDownPos({ x: e.clientX, y: e.clientY });
    setHasMoved(false);
    setIsDragIntent(false);
    mouseDownTimeRef.current = Date.now();

    // Set a timer to detect if this is a drag or a click
    // After 150ms without movement, we assume it's a click intent
    dragTimerRef.current = setTimeout(() => {
      if (!hasMoved) {
        // Still no movement after 150ms - likely a click
        setIsDragIntent(false);
      }
    }, 150);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!mouseDownPos) return;

    const deltaX = Math.abs(e.clientX - mouseDownPos.x);
    const deltaY = Math.abs(e.clientY - mouseDownPos.y);

    // If mouse moved more than 5px, it's definitely a drag
    if (deltaX > 5 || deltaY > 5) {
      if (!hasMoved) {
        setHasMoved(true);
        setIsDragIntent(true);
        
        // Clear the click timer
        if (dragTimerRef.current) {
          clearTimeout(dragTimerRef.current);
          dragTimerRef.current = null;
        }

        // Start drag
        onDragStart();
      }

      // Get the floor plan container to calculate relative position
      const floorPlanContainer = document.querySelector('[data-floor-plan-container]');
      if (!floorPlanContainer) return;

      const rect = floorPlanContainer.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      onDragMove(x, y);
    }
  };

  const handleMouseUp = (e: MouseEvent) => {
    // Clear timer
    if (dragTimerRef.current) {
      clearTimeout(dragTimerRef.current);
      dragTimerRef.current = null;
    }

    const mouseUpTime = Date.now();
    const timeDiff = mouseUpTime - mouseDownTimeRef.current;

    // Determine if this was a drag or a click
    const wasDrag = hasMoved && isDragIntent;
    const wasClick = !hasMoved && timeDiff < 500; // Click must be quick (< 500ms)

    if (wasDrag && isDragging) {
      // This was a drag - save the new position
      const floorPlanContainer = document.querySelector('[data-floor-plan-container]');
      if (floorPlanContainer) {
        const rect = floorPlanContainer.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        onDragEnd(x, y);
      }
    } else if (wasClick) {
      // This was a simple click - open the dialog
      // Only open if no movement occurred
      onClick();
    }

    // Reset state
    setMouseDownPos(null);
    setHasMoved(false);
    setIsDragIntent(false);
    mouseDownTimeRef.current = 0;
  };

  // Add/remove global mouse event listeners
  useEffect(() => {
    if (mouseDownPos) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [mouseDownPos, hasMoved, isDragging, isDragIntent]);

  return (
    <button
      onMouseDown={handleMouseDown}
      className={cn(
        "absolute rounded-md font-bold",
        "flex items-center justify-center shadow-lg",
        "transition-all duration-200 ease-in-out",
        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
        // Hover effects only when not dragging and not in special modes
        !isDragging && !isDrawingMode && !isHandToolActive && "hover:scale-110 hover:z-10 hover:shadow-xl",
        // Dragging styles
        isDragging && "opacity-70 scale-105 z-50 cursor-grabbing shadow-2xl",
        // Creation animation
        isNewlyCreated && "animate-spot-pop",
        // Cursor styles
        !isDrawingMode && !isHandToolActive && !isDragging && "cursor-grab",
        isDrawingMode && "cursor-not-allowed",
        isHandToolActive && "cursor-not-allowed"
      )}
      style={{
        left: `${spot.position_x}%`,
        top: `${spot.position_y}%`,
        width: `${size}px`,
        height: `${size}px`,
        transform: 'translate(-50%, -50%)',
        background: background,
        color: 'white',
        fontSize: `${fontSize}px`,
        textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
      }}
      aria-label={`Plaza ${spot.spot_number}${spot.is_accessible ? ', accesible' : ''}${spot.has_charger ? ', con cargador' : ''}${spot.is_compact ? ', compacta' : ''}`}
      disabled={isDrawingMode || isHandToolActive}
    >
      {spot.spot_number}
    </button>
  );
};

/**
 * Memoized version of DraggableSpot with custom comparison
 * 
 * Only re-renders when:
 * - Spot ID changes (different spot)
 * - Spot position changes (x or y)
 * - Spot attributes change (number, accessible, charger, compact)
 * - Size changes
 * - Interaction states change (isDragging, isDrawingMode, isHandToolActive)
 * - isNewlyCreated flag changes (for animation)
 * 
 * This prevents unnecessary re-renders when parent component updates
 * but spot-specific data hasn't changed.
 */
export const DraggableSpot = memo(DraggableSpotComponent, (prevProps, nextProps) => {
  // Check if spot data is the same
  const spotEqual = 
    prevProps.spot.id === nextProps.spot.id &&
    prevProps.spot.position_x === nextProps.spot.position_x &&
    prevProps.spot.position_y === nextProps.spot.position_y &&
    prevProps.spot.spot_number === nextProps.spot.spot_number &&
    prevProps.spot.is_accessible === nextProps.spot.is_accessible &&
    prevProps.spot.has_charger === nextProps.spot.has_charger &&
    prevProps.spot.is_compact === nextProps.spot.is_compact;

  // Check if other props are the same
  const propsEqual =
    prevProps.size === nextProps.size &&
    prevProps.isDragging === nextProps.isDragging &&
    prevProps.isDrawingMode === nextProps.isDrawingMode &&
    prevProps.isHandToolActive === nextProps.isHandToolActive &&
    prevProps.isNewlyCreated === nextProps.isNewlyCreated;

  // Return true if everything is equal (skip re-render)
  // Return false if something changed (do re-render)
  return spotEqual && propsEqual;
});
