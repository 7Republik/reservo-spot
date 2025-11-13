/**
 * Utility functions for managing Visual Editor storage
 * 
 * Handles persistence of editor state in sessionStorage and localStorage.
 * SessionStorage is used for temporary state (canvas lock, hand tool)
 * that should be cleared on logout. LocalStorage is used for persistent
 * preferences (help viewed) that survive logout.
 */

/**
 * Storage keys for Visual Editor
 */
export const VISUAL_EDITOR_STORAGE_KEYS = {
  // SessionStorage keys (cleared on logout)
  CANVAS_LOCKED: 'visual-editor-canvas-locked',
  HAND_TOOL: 'visual-editor-hand-tool',
  
  // LocalStorage keys (persistent)
  HELP_VIEWED: 'visual-editor-help-viewed',
  FIRST_DRAW: 'visual-editor-first-draw',
} as const;

/**
 * Clear all Visual Editor session state
 * 
 * Should be called on user logout to clean up temporary editor state.
 * Does NOT clear localStorage items (help viewed, first draw notification)
 * as these are user preferences that should persist across sessions.
 * 
 * @example
 * ```typescript
 * import { clearVisualEditorSession } from '@/lib/visualEditorStorage';
 * 
 * const handleLogout = async () => {
 *   await supabase.auth.signOut();
 *   clearVisualEditorSession();
 *   navigate('/auth');
 * };
 * ```
 */
export const clearVisualEditorSession = (): void => {
  try {
    // Clear sessionStorage items
    sessionStorage.removeItem(VISUAL_EDITOR_STORAGE_KEYS.CANVAS_LOCKED);
    sessionStorage.removeItem(VISUAL_EDITOR_STORAGE_KEYS.HAND_TOOL);
    
    console.log('Visual Editor session state cleared');
  } catch (error) {
    console.error('Error clearing Visual Editor session state:', error);
  }
};

/**
 * Get canvas lock state from sessionStorage
 * @returns true if canvas is locked, false otherwise
 */
export const getCanvasLockState = (): boolean => {
  try {
    const stored = sessionStorage.getItem(VISUAL_EDITOR_STORAGE_KEYS.CANVAS_LOCKED);
    return stored === 'true';
  } catch (error) {
    console.error('Error reading canvas lock state:', error);
    return false;
  }
};

/**
 * Set canvas lock state in sessionStorage
 * @param isLocked - Whether canvas should be locked
 */
export const setCanvasLockState = (isLocked: boolean): void => {
  try {
    sessionStorage.setItem(VISUAL_EDITOR_STORAGE_KEYS.CANVAS_LOCKED, String(isLocked));
  } catch (error) {
    console.error('Error saving canvas lock state:', error);
  }
};

/**
 * Get hand tool state from sessionStorage
 * @returns true if hand tool is active, false otherwise
 */
export const getHandToolState = (): boolean => {
  try {
    const stored = sessionStorage.getItem(VISUAL_EDITOR_STORAGE_KEYS.HAND_TOOL);
    return stored === 'true';
  } catch (error) {
    console.error('Error reading hand tool state:', error);
    return false;
  }
};

/**
 * Set hand tool state in sessionStorage
 * @param isActive - Whether hand tool should be active
 */
export const setHandToolState = (isActive: boolean): void => {
  try {
    sessionStorage.setItem(VISUAL_EDITOR_STORAGE_KEYS.HAND_TOOL, String(isActive));
  } catch (error) {
    console.error('Error saving hand tool state:', error);
  }
};

/**
 * Check if user has viewed the help dialog
 * @returns true if help has been viewed, false otherwise
 */
export const hasViewedHelp = (): boolean => {
  try {
    const stored = localStorage.getItem(VISUAL_EDITOR_STORAGE_KEYS.HELP_VIEWED);
    return stored === 'true';
  } catch (error) {
    console.error('Error reading help viewed state:', error);
    return false;
  }
};

/**
 * Mark help dialog as viewed
 */
export const markHelpAsViewed = (): void => {
  try {
    localStorage.setItem(VISUAL_EDITOR_STORAGE_KEYS.HELP_VIEWED, 'true');
  } catch (error) {
    console.error('Error saving help viewed state:', error);
  }
};

/**
 * Check if user has seen the first draw notification
 * @returns true if notification has been shown, false otherwise
 */
export const hasSeenFirstDrawNotification = (): boolean => {
  try {
    const stored = localStorage.getItem(VISUAL_EDITOR_STORAGE_KEYS.FIRST_DRAW);
    return stored === 'true';
  } catch (error) {
    console.error('Error reading first draw notification state:', error);
    return false;
  }
};

/**
 * Mark first draw notification as shown
 */
export const markFirstDrawNotificationShown = (): void => {
  try {
    localStorage.setItem(VISUAL_EDITOR_STORAGE_KEYS.FIRST_DRAW, 'true');
  } catch (error) {
    console.error('Error saving first draw notification state:', error);
  }
};
