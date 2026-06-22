import { Product, Quote, Technician, LandingConfigs } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    sku: 'SKU-A01',
    name: 'Soporte Articulado Premium',
    description: '',
    price: 450,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDAP_Hywg0z1xV-NVCc_OM_E5YeujMPk0L2DNlLp7axI3oMsHgCZF-gi1kUErfuRimptCHdHe5-2m7oMuSQVWl89mPKqJwyEJebOlKoAlU9Mlt0T99O7JbkEg-W2yMVsmZprewJ6ZN7ZiMPjn-FGsYTfVcflAn5pNUW0t9AEIjRI6h94syj-RAWVE71JMHY3DMi6d-bLeM-U_s2SsZ3N4qbja8tKY3Nr1HJ2fZmzTJOEBqtvqfy6S147PXL5nXYBnq3Rlxb8EeB6L1w',
    category: 'articulado',
    stockLevel: 'In Stock',
    maxLoad: 50,
    tvSizes: '32" - 75"',
    material: 'Acero estructural al carbono de 2mm'
  },
  {
    id: 'prod-2',
    sku: 'SKU-F12',
    name: 'Soporte Fijo Ultra Delgado',
    description: 'Perfil ultra bajo de 2.5cm que deja tu TV pegada como un cuadro. Ideal para salas modernas y paneles decorativos.',
    price: 280,
    image: 'https://placehold.co/600x400/051125/F8F9FF?text=Soporte+Fijo+Ultra+Delgado',
    category: 'fijo',
    stockLevel: 'In Stock',
    maxLoad: 65,
    tvSizes: '40" - 85"',
    material: 'Acero de alta resistencia con recubrimiento electrostático resistente e inoxidable.'
  },
  {
    id: 'prod-3',
    sku: 'SKU-T05',
    name: 'Soporte de Techo Telescópico',
    description: 'Perfecto para locales comerciales, clínicas o dormitorios. Rotación libre de 360° y ajuste telescópico vertical de altura.',
    price: 550,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCSgEMFcohBrYDQ1yAr2bB5jh6EUadFlLLCxPKmfgE2QLHTSg4Z7ThpiVdK5kfP4wwIfWMjY9nQHs8knAWPqC486-YT5a82sg_ov7jl5RiPnbQyuayNJFnZyVsi2vPJ4vwrJIJWcSpETWv9b3xm7Zwq0BM8KjM2_8F0Zb5wdf_FcQtN7N1eYs6N1KUel3QTuVUJqS8JfyDRUP_-YKyFWJnyJdZgs2nr0cBFkup0UOqUK4-9rVBfLL8I9PwUDe9UUclf86F5WH7vhIyY',
    category: 'techo',
    stockLevel: 'Low Stock',
    maxLoad: 45,
    tvSizes: '32" - 65"',
    material: 'Tubo de acero reforzado de aleación aeroespacial resistente a la fatiga.'
  },
  {
    id: 'prod-4',
    sku: 'SKU-P20',
    name: 'Soporte Pedestal Móvil',
    description: 'Pedestal móvil industrial con ruedas silenciosas de alta rotación (con freno). Incluye bandeja ajustable para laptos y consolas AV.',
    price: 1200,
    image: 'https://placehold.co/600x400/051125/F8F9FF?text=Soporte+Pedestal+Movil',
    category: 'pedestal',
    stockLevel: 'In Stock',
    maxLoad: 75,
    tvSizes: '37" - 85"',
    material: 'Pilar reforzado de aluminio anodizado y base sólida de acero grueso.'
  },
  {
    id: 'prod-5',
    sku: 'HVAC-12K',
    name: 'Split Aire Acondicionado Eco Inverter',
    description: 'Equipo de climatización de alta eficiencia clase A++. Purificador de aire integrado, ideal para dormitorios y ambientes residenciales.',
    price: 3400,
    image: 'https://placehold.co/600x400/47607E/FFFFFF?text=Split+AC+12000+BTU',
    category: 'climatizacion',
    stockLevel: 'In Stock',
    maxLoad: 0,
    tvSizes: 'N/A',
    material: 'Compresor rotativo inverter con tecnología R410A ecológica.',
    btu: 12000
  },
  {
    id: 'prod-6',
    sku: 'HVAC-18K',
    name: 'Split Climatizador Inverter Corporativo',
    description: 'Sistema ideal para oficinas y grandes ambientes comerciales. Distribución inteligente tridimensional del flujo de aire frío / caliente.',
    price: 4950,
    image: 'https://placehold.co/600x400/47607E/FFFFFF?text=Split+AC+18000+BTU',
    category: 'climatizacion',
    stockLevel: 'In Stock',
    maxLoad: 0,
    tvSizes: 'N/A',
    material: 'Estructura galvanizada Gold Fin anticorrosiva y filtros HEPA.',
    btu: 18000
  },
  {
    id: 'prod-7',
    sku: 'ESTR-HVAC',
    name: 'Estructura Modular Autoportante Climatización',
    description: 'Proyecto estructural completo de montaje: fabricación e instalación de vigas de soporte pesadas para condensadores en azoteas.',
    price: 7800,
    image: 'https://placehold.co/600x400/C67C3E/FFFFFF?text=Estructura+Modular+HVAC',
    category: 'proyectos estruct',
    stockLevel: 'In Stock',
    maxLoad: 450,
    tvSizes: 'Proyectos Especiales',
    material: 'Vigas en H de acero estructural ASTM A36 con pintura térmica industrial.'
  }
];

export const INITIAL_QUOTES: Quote[] = [
  {
    id: 'COT-785',
    fullName: 'Alejandro Justiniano Vaca',
    phone: '71023456',
    email: 'ale.justiniano@gmail.com',
    serviceType: 'Instalación de Soportes',
    message: 'Necesito instalar el Soporte Articulado Premium SKU-A01 en mi consultorio médico en el Barrio Equipetrol, la pared es de drywall y requiere anclajes especiales.',
    date: '2026-06-05',
    status: 'Pendiente',
    items: [
      {
        product: INITIAL_PRODUCTS[0],
        quantity: 1
      }
    ],
    assignedTechnician: 'Ing. Carlos Mendoza',
    estimatedHours: 2
  },
  {
    id: 'COT-786',
    fullName: 'Mariana Suarez Lijerón',
    phone: '77312908',
    email: 'marianitasl@hotmail.com',
    serviceType: 'Climatización HVAC',
    message: 'Mantenimiento preventivo e higienización para 3 aires acondicionados de 12000 BTU en oficinas centrales. Cuentan con un aire con fuga de gas que requiere recarga.',
    date: '2026-06-06',
    status: 'Asignado',
    items: [],
    assignedTechnician: 'Tec. Luis Justiniano',
    estimatedHours: 4,
    technicianNotes: 'Fuga localizada en tubería de cobre exterior. Reemplazar sección antes de realizar carga.'
  },
  {
    id: 'COT-787',
    fullName: 'Constructora Urubó Premium',
    phone: '70288344',
    email: 'compras@uruboprem.bo',
    serviceType: 'Proyecto Industrial',
    message: 'Cotización por volumen de 15 soportes fijos ultra delgados y 10 soportes de techo telescópicos para el nuevo edificio empresarial.',
    date: '2026-06-06',
    status: 'Aprobado',
    items: [
      {
        product: INITIAL_PRODUCTS[1],
        quantity: 15
      },
      {
        product: INITIAL_PRODUCTS[2],
        quantity: 10
      }
    ],
    assignedTechnician: 'Ing. Carlos Mendoza',
    estimatedHours: 12
  }
];

export const INITIAL_TECHNICIANS: Technician[] = [
  {
    id: 'tech-1',
    name: 'Ing. Carlos Mendoza',
    specialty: 'Soportes de Alta Carga & Estructuras',
    phone: '+591 750-11223',
    status: 'Disponible'
  },
  {
    id: 'tech-2',
    name: 'Tec. Luis Justiniano',
    specialty: 'Climatización & Ciclos de Refrigeración HVAC',
    phone: '+591 750-44556',
    status: 'En Ruta'
  },
  {
    id: 'tech-3',
    name: 'Ing. Marcos Alarcón',
    specialty: 'Automatización & Termorregulación Industrial',
    phone: '+591 750-77889',
    status: 'Disponible'
  }
];

export const INITIAL_LANDING_CONFIGS: LandingConfigs = {
  heroBgImage: '/assets/hero-bg.png',
  heroTag: 'INGENIERÍA INDUSTRIAL • BOLIVIA',
  heroTitle: 'Torre Forte: Ingeniería en Soportes y Climatización',
  heroDescription: 'Fabricación y montaje de soportes para pantallas de TV de alta resistencia, y servicios técnicos corporativos en HVAC para toda Bolivia. Precisión milimétrica, acero certificado y durabilidad garantizada.',
  metric1Val: '12K+',
  metric1Label: 'Instalaciones',
  metric2Val: '100%',
  metric2Label: 'Acero al Carbono',
  metric3Val: '5 años',
  metric3Label: 'Garantía',

  servicesTitle: 'Servicios Técnicos y Climatización',
  servicesSubtitle: 'Soluciones de alta ingeniería ejecutadas por personal certificado bajo estrictas normas de seguridad industrial y civil.',
  service1Title: 'Climatización HVAC',
  service1Desc: 'Instalación certificada, mantenimiento preventivo y correctivo de aires acondicionados tipo Split, Cassette, Ducto y paquetes industriales.',
  service2Title: 'Instalación de Soportes',
  service2Desc: 'Montaje profesional de televisores y monitores pesados en cualquier superficie (drywall, ladrillo, hormigón block), asegurando nivelación óptica perfecta.',
  service3Title: 'Logística & Proyecto',
  service3Desc: 'Fletes integrales, envíos y distribución nacional de lotes corporativos de soportes y equipos de refrigeración industrial directa de fábrica.',

  aboutTitle: 'Sobre Torre Forte',
  aboutLocationTitle: 'Ubicación Central',
  aboutLocationDesc: 'Av. Banzer Km 5, Parque Industrial, Santa Cruz de la Sierra, Bolivia.',
  aboutHoursTitle: 'Horario de Atención',
  aboutHoursDesc: 'Lunes - Viernes: 08:00 a 18:00\nSábados: 08:00 a 12:00',
  aboutContactTitle: 'Contacto Directo',
  aboutContactDesc: 'Celular: +591 700-12345\nCorreo: info@torreforte.com.bo',

  service1Bullet1: 'Carga controlada de gas ecológico (R410A / R32)',
  service1Bullet2: 'Higienización profunda de serpentinas y turbinas',
  service1Bullet3: 'Corrección de fugas y reubicación de condensadores',
  service2Bullet1: 'Anclajes expansivos de seguridad anti-sismo',
  service2Bullet2: 'Canaletas estéticas para ocultamiento de cableado',
  service2Bullet3: 'Sistemas articulados para salas de junta corporativas',
  service3Bullet1: 'Vehículos equipados con sujeción amortiguada',
  service3Bullet2: 'Despachos a Santa Cruz, La Paz, Cochabamba y Beni',
  service3Bullet3: 'Monitoreo satelital y seguro integral de carga',

  matrizTitle: 'Matriz de Carga de Pared y Anclajes Recomendados',
  matrizOpt1Title: '1. Pared de Ladrillo Macizo u Hormigón:',
  matrizOpt1Desc: 'Soporta cualquier peso. Recomendamos el anclaje expansivo metálico de 5/16 incluído libre en nuestro catálogo.',
  matrizOpt2Title: '2. Tabiquería de Drywall (Placa de Yeso):',
  matrizOpt2Desc: 'No soporta pesos altos de forma directa. Requiere ubicar los perfiles metálicos estruturales internos (parantes) cada 40 cm y fijar el soporte allí mediante tornillos tirafondo autoperforantes o anclajes toggler.',

  deliveryTitle: 'Tiempos y Frecuencia de Despachos',
  deliveryCity1Name: 'Santa Cruz',
  deliveryCity1Time: 'Mismo Día (Express)',
  deliveryCity2Name: 'La Paz/Caba',
  deliveryCity2Time: '24 a 48 Horas',
  deliveryCity3Name: 'Sucre/Tarija',
  deliveryCity3Time: '48 a 72 Horas'
};

