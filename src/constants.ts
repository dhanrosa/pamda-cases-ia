export interface PhoneModel {
  id: string;
  name: string;
  brand: string;
  imageUrl?: string;
  cameraLayout: 'single-top-left' | 'dual-vertical-left' | 'triple-square-left' | 'dual-diagonal-left' | 'vertical-strip-left' | 'centered-circle' | 'quad-square-center' | 'iphone-11';
  color: string;
  hasLogo?: boolean;   


  
  col1?: string;
  col2?: string;
  col3?: string;
  previewCorrection?: {
    x?: number;
    y?: number;
    scale?: number;
  };
  maskConfig?: {
    x: number;
    y: number;
    width: number;
    height: number;
    borderRadius: number;
    shape: 'rectangle' | 'circle';
    cameraX?: number;
    cameraY?: number;
    cameraWidth?: number;
    cameraHeight?: number;
  };
}

export const PHONE_MODELS: PhoneModel[] = [
  // Apple
  { id: 'iphone-7', name: 'iPhone 7', brand: 'Apple', cameraLayout: 'single-top-left', color: '#333333', hasLogo: true },
  { id: 'iphone-11', name: 'iPhone 11', brand: 'Apple', cameraLayout: 'iphone-11', color: '#D1CDDA', hasLogo: true }, // Purple like the example
  { id: 'iphone-12', name: 'iPhone 12', brand: 'Apple', cameraLayout: 'dual-vertical-left', color: '#27445a', hasLogo: true },
  { id: 'iphone-13', name: 'iPhone 13', brand: 'Apple', cameraLayout: 'dual-diagonal-left', color: '#215e7c', hasLogo: true },
  { id: 'iphone-14-pro', name: 'iPhone 14 Pro', brand: 'Apple', cameraLayout: 'triple-square-left', color: '#4b4353', hasLogo: true },
  { id: 'iphone-15-pro', name: 'iPhone 15 Pro', brand: 'Apple', cameraLayout: 'triple-square-left', color: '#2f2f30', hasLogo: true },
  { id: 'iphone-16-pro', name: 'iPhone 16 Pro', brand: 'Apple', cameraLayout: 'triple-square-left', color: '#1c1c1c', hasLogo: true },

  // Samsung
  { id: 'samsung-s23', name: 'Galaxy S23', brand: 'Samsung', cameraLayout: 'vertical-strip-left', color: '#f0ebe5' },
  { id: 'samsung-s24', name: 'Galaxy S24 Ultra', brand: 'Samsung', cameraLayout: 'vertical-strip-left', color: '#2b2b2b' },
  { id: 'samsung-a54', name: 'Galaxy A54', brand: 'Samsung', cameraLayout: 'vertical-strip-left', color: '#c8f560' },

  // Motorola
  { id: 'moto-g84', name: 'Moto G84', brand: 'Motorola', cameraLayout: 'dual-vertical-left', color: '#be3455' },
  { id: 'moto-edge-40', name: 'Edge 40', brand: 'Motorola', cameraLayout: 'dual-vertical-left', color: '#1a1a1a' },

  // Xiaomi
  { id: 'redmi-note-12', name: 'Redmi Note 12', brand: 'Xiaomi', cameraLayout: 'vertical-strip-left', color: '#007aff' },
  { id: 'poco-x5', name: 'Poco X5 Pro', brand: 'Xiaomi', cameraLayout: 'triple-square-left', color: '#ffce00' },
];
