// Global detection for Median native app - Official method from Median docs
const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent.toLowerCase() : '';

// Official detection: check for 'median' in user agent (lowercase)
export const isMedianApp = userAgent.indexOf('median') > -1;
export const isMedianIOS = userAgent.indexOf('medianios') > -1;
export const isMedianAndroid = userAgent.indexOf('medianandroid') > -1;

// Also expose on window for easy access
if (typeof window !== 'undefined') {
  (window as any).isMedianApp = isMedianApp;
  (window as any).isMedianIOS = isMedianIOS;
  (window as any).isMedianAndroid = isMedianAndroid;
}

// Lazy load Median SDK only when needed
export const getMedian = async () => {
  const { default: Median } = await import('median-js-bridge');
  return Median;
};