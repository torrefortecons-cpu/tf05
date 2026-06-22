export type Product = {
  id: string;
  sku: string;
  name: string;
  description: string;
  price: number;
  image: string;
  images?: string[];
  category: string;
  stockLevel: 'In Stock' | 'Low Stock' | 'Out of Stock' | 'Compra-Venta' | 'Modificado' | 'Fabricado';
  maxLoad: number; // in kg
  tvSizes: string; // e.g. "32\" - 75\""
  material: string; // e.g. "Acero de alta densidad"
  btu?: number;
};

export type CartItem = {
  product: Product;
  quantity: number;
};

export type QuoteStatus = 'Pendiente' | 'Aprobado' | 'Asignado' | 'Completado';

export type Quote = {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  serviceType: string;
  message: string;
  date: string;
  status: QuoteStatus;
  items: CartItem[];
  technicianNotes?: string;
  assignedTechnician?: string;
  estimatedHours?: number;
};

export type Technician = {
  id: string;
  name: string;
  specialty: string;
  phone: string;
  status: 'Disponible' | 'En Ruta' | 'Inactivo';
};

export interface LandingConfigs {
  heroBgImage?: string;
  heroTag: string;
  heroTitle: string;
  heroDescription: string;
  metric1Val: string;
  metric1Label: string;
  metric2Val: string;
  metric2Label: string;
  metric3Val: string;
  metric3Label: string;

  servicesTitle: string;
  servicesSubtitle: string;
  service1Title: string;
  service1Desc: string;
  service2Title: string;
  service2Desc: string;
  service3Title: string;
  service3Desc: string;

  aboutTitle: string;
  aboutLocationTitle: string;
  aboutLocationDesc: string;
  aboutHoursTitle: string;
  aboutHoursDesc: string;
  aboutContactTitle: string;
  aboutContactDesc: string;

  service1Bullet1?: string;
  service1Bullet2?: string;
  service1Bullet3?: string;
  service2Bullet1?: string;
  service2Bullet2?: string;
  service2Bullet3?: string;
  service3Bullet1?: string;
  service3Bullet2?: string;
  service3Bullet3?: string;

  matrizTitle?: string;
  matrizOpt1Title?: string;
  matrizOpt1Desc?: string;
  matrizOpt2Title?: string;
  matrizOpt2Desc?: string;

  deliveryTitle?: string;
  deliveryCity1Name?: string;
  deliveryCity1Time?: string;
  deliveryCity2Name?: string;
  deliveryCity2Time?: string;
  deliveryCity3Name?: string;
  deliveryCity3Time?: string;
}

