/**
 * Provides methods to detect and listen for online/offline status
 */

export interface OfflineState {
  isOffline: boolean;
  lastOnline?: Date;
}

let offlineListeners: Array<(isOffline: boolean) => void> = [];

/**
 * Check if the user is currently offline
 */
export function isOffline(): boolean {
  return !navigator.onLine;
}

/**
 * Check if the user is currently online
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * add a listener for status changes
 */
export function addOfflineListener(callback: (isOffline: boolean) => void): void {
  offlineListeners.push(callback);
}

/**
 * Remove a listener for status changes
 */
export function removeOfflineListener(callback: (isOffline: boolean) => void): void {
  offlineListeners = offlineListeners.filter(listener => listener !== callback);
}

/**
 * Initialize offline detection
 */
export function initOfflineDetection(): void {
  window.addEventListener('online', () => {
    offlineListeners.forEach(listener => listener(false));
    dispatchOfflineEvent(false);
  });

  window.addEventListener('offline', () => {
    offlineListeners.forEach(listener => listener(true));
    dispatchOfflineEvent(true);
  });

}

/**
 * Dispatch a custom event for offline status changes
 */
function dispatchOfflineEvent(offline: boolean): void {
  const event = new CustomEvent('offlineStatusChanged', {
    detail: { isOffline: offline }
  });
  document.dispatchEvent(event);
}

/**
 * Get the current offline state
 */
export function getOfflineState(): OfflineState {
  const lastOnlineStr = localStorage.getItem('lastOnlineTime');
  
  const state: OfflineState = {
    isOffline: isOffline()
  };
  
  if (lastOnlineStr) {
    state.lastOnline = new Date(lastOnlineStr);
  }
  
  return state;
}

/**
 * Update the last online time in localStorage
 */
export function updateLastOnlineTime(): void {
  if (isOnline()) {
    localStorage.setItem('lastOnlineTime', new Date().toISOString());
  }
}
