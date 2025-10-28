/**
 * Device Configuration for Testing
 * Comprehensive list of devices to test across mobile, tablet, and desktop
 */

export const DEVICES = {
  // Mobile Devices
  mobile: {
    'iPhone SE': { width: 375, height: 667, isMobile: true, hasTouch: true },
    'iPhone 12': { width: 390, height: 844, isMobile: true, hasTouch: true },
    'iPhone 14 Pro Max': { width: 430, height: 932, isMobile: true, hasTouch: true },
    'Pixel 5': { width: 393, height: 851, isMobile: true, hasTouch: true },
    'Galaxy S20': { width: 360, height: 800, isMobile: true, hasTouch: true },
  },

  // Tablet Devices
  tablet: {
    'iPad Mini': { width: 768, height: 1024, isMobile: true, hasTouch: true },
    'iPad Pro': { width: 1024, height: 1366, isMobile: true, hasTouch: true },
  },

  // Desktop Sizes
  desktop: {
    'Small Laptop': { width: 1280, height: 720, isMobile: false, hasTouch: false },
    'Standard Laptop': { width: 1366, height: 768, isMobile: false, hasTouch: false },
    'Large Desktop': { width: 1920, height: 1080, isMobile: false, hasTouch: false },
    'Ultra-wide': { width: 2560, height: 1440, isMobile: false, hasTouch: false },
  }
};

// Get all devices as flat array
export function getAllDevices() {
  const devices = [];
  for (const [category, categoryDevices] of Object.entries(DEVICES)) {
    for (const [name, config] of Object.entries(categoryDevices)) {
      devices.push({ name, category, ...config });
    }
  }
  return devices;
}

// Get devices by category
export function getDevicesByCategory(category) {
  return Object.entries(DEVICES[category] || {}).map(([name, config]) => ({
    name,
    category,
    ...config
  }));
}

// Critical devices for quick smoke tests
export const CRITICAL_DEVICES = [
  'iPhone SE',      // Smallest mobile
  'iPhone 12',      // Standard mobile
  'iPad Mini',      // Tablet
  'Standard Laptop' // Desktop
];
