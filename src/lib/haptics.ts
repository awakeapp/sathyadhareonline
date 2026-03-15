/**
 * Utility for triggering haptic feedback on devices that support it.
 */
export const haptics = {
  /**
   * Impact feedback for subtle mechanical feels
   */
  impact: (type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
      switch (type) {
        case 'light':
          window.navigator.vibrate(10);
          break;
        case 'medium':
          window.navigator.vibrate(20);
          break;
        case 'heavy':
          window.navigator.vibrate(40);
          break;
      }
    }
  },

  /**
   * Success notification - a clear, positive pulse
   */
  success: () => {
    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate([20, 30, 20]);
    }
  },

  /**
   * Warning/Error notification - a series of pulses
   */
  error: () => {
    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate([50, 50, 50]);
    }
  }
};
