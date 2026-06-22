import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import { generateQuotationPDF } from '../utils/quotationPdf';
import { runStatisticalAgent, StatAgentResult } from '../utils/geminiStatsAgent';
import { Product, Quote, Technician, QuoteStatus, CartItem, LandingConfigs } from '../types';
import CostCalculator from './CostCalculator';
import { 
  Building2, Users, ShoppingBag, DollarSign, CheckCircle2, AlertCircle, Clock, 
  HelpCircle, Sparkles, Send, Trash2, Edit3, PlusCircle, UserPlus, PhoneCall, RefreshCw, Mail,
  TrendingUp, Plus, Search, Filter, X, FileText, Check, ShieldCheck, Lock, Printer, Info
} from 'lucide-react';
export interface FinancialRecord {
  id: string;
  date: string;
  client: string;
  item: string;
  amount: number;
  discount: number;
  paymentMethod: string;
  status: 'Paid' | 'Borrador' | 'Enviada' | 'Aceptada';
  type: 'sale' | 'quote';
  quantity: number;
  operator?: string;
  notes?: string;
  clientRole?: string;
  clientPhone?: string;
  clientNit?: string;
  clientEmail?: string;
  clientAddress?: string;
  dueDate?: string;
  taxRate?: number;
  capital?: number;
  profit?: number;
  items?: { name: string; quantity: number; unitPrice: number }[];
}

export interface RecLineItem {
  itemKey: string;
  qty: number;
  customAmount: number | null;
}

function LineItemsEditor({ lines, setLines, dynamicItemOptions }: {
  lines: RecLineItem[];
  setLines: (lines: RecLineItem[]) => void;
  dynamicItemOptions: Record<string, { name: string; price: number }>;
}) {
  const updateLine = (idx: number, patch: Partial<RecLineItem>) => {
    setLines(lines.map((l, i) => i === idx ? { ...l, ...patch } : l));
  };
  const addLine = () => setLines([...lines, { itemKey: Object.keys(dynamicItemOptions)[0] || 'tv_art', qty: 1, customAmount: null }]);
  const removeLine = (idx: number) => setLines(lines.filter((_, i) => i !== idx));

  return (
    <div className="space-y-3">
      {lines.map((line, idx) => {
        const unitPrice = line.customAmount !== null ? line.customAmount : (dynamicItemOptions[line.itemKey]?.price || 0);
        const lineTotal = unitPrice * line.qty;
        return (
          <div key={idx} className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2 relative">
            {lines.length > 1 && (
              <button
                type="button"
                onClick={() => removeLine(idx)}
                className="absolute top-2 right-2 text-rose-500 hover:text-rose-700 cursor-pointer"
                title="Eliminar este producto"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <div className="grid grid-cols-2 gap-3 pr-6">
              <div>
                <label className="block text-[12px] font-bold text-slate-400 uppercase tracking-wide mb-1">Servicio / Soporte:</label>
                <select
                  value={line.itemKey}
                  onChange={(e) => updateLine(idx, { itemKey: e.target.value, customAmount: null })}
                  className="w-full bg-white border p-1.5 text-xs rounded text-slate-800 focus:outline-[#051125] cursor-pointer"
                >
                  {Object.entries(dynamicItemOptions).map(([key, item]) => (
                    <option key={key} value={key}>{item.name} (Bs. {item.price})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-bold text-slate-400 uppercase tracking-wide mb-1">Cantidad:</label>
                <input
                  type="number"
                  min="1"
                  value={line.qty}
                  onChange={(e) => updateLine(idx, { qty: Math.max(1, parseInt(e.target.value) || 1) })}
                  className="w-full bg-white border p-1.5 text-xs rounded text-slate-800 focus:outline-[#051125] font-mono"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pr-6 items-end">
              <div>
                <label className="block text-[12px] font-bold text-slate-400 uppercase tracking-wide mb-1">Monto Unitario (Opcional):</label>
                <input
                  type="number"
                  value={line.customAmount !== null ? line.customAmount : ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    updateLine(idx, { customAmount: val === '' ? null : Math.max(0, parseFloat(val) || 0) });
                  }}
                  placeholder={`Defecto (Bs. ${dynamicItemOptions[line.itemKey]?.price || 0})`}
                  className="w-full bg-white border p-1.5 text-xs rounded text-slate-800 focus:outline-[#051125] font-mono placeholder:text-slate-400"
                />
              </div>
              <p className="text-[11px] text-slate-500 font-mono pb-1.5">
                Subtotal: <span className="font-bold text-slate-800">Bs. {lineTotal.toFixed(2)}</span>
              </p>
            </div>
          </div>
        );
      })}
      <button
        type="button"
        onClick={addLine}
        className="w-full flex items-center justify-center gap-1.5 border-2 border-dashed border-slate-300 text-slate-500 hover:text-[#051125] hover:border-[#051125] rounded-lg py-2 text-xs font-bold transition-colors cursor-pointer"
      >
        <Plus className="w-3.5 h-3.5" /> Agregar Producto
      </button>
    </div>
  );
}

export function generatePDF(record: FinancialRecord): jsPDF {
  const lineItems = record.items && record.items.length > 0
    ? record.items
    : [{ name: record.item, quantity: record.quantity || 1, unitPrice: record.amount / (record.quantity || 1) }];

  const discountPct = record.discount || 0;
  // For legacy records, record.amount is already net of discount; rebuild the pre-discount subtotal so it matches.
  const rawSubtotal = lineItems.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0);
  const subtotal = (!record.items && discountPct > 0 && discountPct < 100)
    ? record.amount / (1 - discountPct / 100)
    : rawSubtotal;

  return generateQuotationPDF({
    id: record.id,
    docLabel: record.type === 'sale' ? 'COMPROBANTE DE VENTA' : 'COTIZACIÓN COMERCIAL',
    date: record.date,
    validUntil: record.dueDate,
    clientName: record.client || 'Público General',
    clientNit: record.clientNit,
    clientRole: record.clientRole,
    clientPhone: record.clientPhone,
    clientEmail: record.clientEmail,
    clientAddress: record.clientAddress,
    items: lineItems.map(it => ({ name: it.name, quantity: it.quantity, unitPrice: it.unitPrice })),
    discountPct: (!record.items && subtotal > 0) ? (1 - record.amount / subtotal) * 100 : discountPct,
    taxRatePct: record.taxRate || 0,
    notes: record.notes,
  });
}

export function generateQuoteRequestPDF(quote: Quote): jsPDF {
  const items = quote.items.length > 0
    ? quote.items.map(it => ({
        name: `${it.product.name}${it.product.sku ? ` - ${it.product.sku}` : ''}`,
        description: [
          it.product.tvSizes ? `Soporta TV: ${it.product.tvSizes}` : '',
          it.product.maxLoad > 0 ? `Carga Máx: ${it.product.maxLoad} Kg` : ''
        ].filter(Boolean).join(' · '),
        quantity: it.quantity,
        unitPrice: it.product.price
      }))
    : [{ name: `Servicio Especializado: ${quote.serviceType}`, description: quote.message || 'Evaluación técnica en sitio.', quantity: 1, unitPrice: 0 }];

  return generateQuotationPDF({
    id: quote.id,
    docLabel: 'SOLICITUD DE COTIZACIÓN',
    date: quote.date,
    validUntil: '3 días hábiles desde su emisión',
    clientName: quote.fullName,
    clientPhone: quote.phone,
    clientEmail: quote.email,
    clientRole: quote.serviceType,
    items,
    notes: quote.message || undefined,
  });
}

function paymentMethodLabel(method: string): string {
  switch (method) {
    case 'cash': return 'Efectivo';
    case 'transfer': return 'Transferencia';
    case 'card': return 'Tarjeta';
    case 'qr': return 'QR / Pago móvil';
    default: return 'A convenir';
  }
}
interface AdminPanelProps {
  products: Product[];
  quotes: Quote[];
  technicians: Technician[];
  onUpdateQuoteStatus: (quoteId: string, status: QuoteStatus, techNotes?: string, assignedTech?: string) => void;
  onUpdateQuote?: (quote: Quote) => void;
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onAddTechnician: (tech: Technician) => void;
  onUpdateTechStatus: (techId: string, status: 'Disponible' | 'En Ruta' | 'Inactivo') => void;
  defaultTab?: string;
  landingConfigs?: LandingConfigs;
  onUpdateLandingConfigs?: (configs: LandingConfigs) => void;
}

export default function AdminPanel({
  products,
  quotes,
  technicians,
  onUpdateQuoteStatus,
  onUpdateQuote,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onAddTechnician,
  onUpdateTechStatus,
  defaultTab,
  landingConfigs,
  onUpdateLandingConfigs
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<string>(defaultTab || 'metrics');

  // --- AI Statistical Agent (Gemini + code execution) ---
  const [statsPrompt, setStatsPrompt] = useState('');
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsResult, setStatsResult] = useState<StatAgentResult | null>(null);
  const [statsError, setStatsError] = useState('');

  const handleRunStatsAgent = async () => {
    if (!statsPrompt.trim()) return;
    setStatsLoading(true);
    setStatsError('');
    setStatsResult(null);
    try {
      const dataset = {
        ventasYCotizaciones: financialRecords.map(r => ({
          id: r.id, fecha: r.date, cliente: r.client, item: r.item, monto: r.amount,
          descuento: r.discount, metodoPago: r.paymentMethod, estado: r.status, tipo: r.type,
          cantidad: r.quantity, operador: r.operator, capital: r.capital, ganancia: r.profit
        })),
        cotizacionesRecibidas: quotes.map(q => ({
          id: q.id, fecha: q.date, cliente: q.fullName, servicio: q.serviceType, estado: q.status,
          items: q.items.map(it => ({ producto: it.product.name, cantidad: it.quantity, precio: it.product.price }))
        })),
        productos: products.map(p => ({ sku: p.sku, nombre: p.name, precio: p.price, categoria: p.category, cargaMaxima: p.maxLoad })),
        tecnicos: technicians.map(t => ({ nombre: t.name, especialidad: t.specialty, estado: t.status }))
      };
      const result = await runStatisticalAgent(statsPrompt.trim(), dataset);
      setStatsResult(result);
    } catch (err: any) {
      setStatsError(err?.message || 'Ocurrió un error al consultar al agente estadístico.');
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab]);
  
  // --- Ventas & Control Financiero State ---
  const [financialRecords, setFinancialRecords] = useState<FinancialRecord[]>(() => {
    const saved = localStorage.getItem('torre_forte_financial_records');
    return saved ? JSON.parse(saved) : [
      { id: 'INV-2049', date: '2026-06-08', client: 'Apex Logistics Corp.', item: 'Mantenimiento Climatización HVAC', amount: 8712.50, discount: 0, paymentMethod: 'transfer', status: 'Paid', type: 'sale', quantity: 1, operator: 'Carlos Mendoza', notes: 'Servicio programado mensual completado sin novedad.' },
      { id: 'QTE-0891', date: '2026-06-07', client: 'Sarah Jenkins', item: 'Soporte Articulado Premium x2', amount: 3345.60, discount: 5, paymentMethod: 'cash', status: 'Borrador', type: 'quote', quantity: 2, operator: 'Daniel Rocha', notes: 'Borrador de proforma enviado.' },
      { id: 'INV-2048', date: '2026-06-06', client: 'Downtown Dental', item: 'Instalación Básica & Cableado', amount: 5924.50, discount: 10, paymentMethod: 'qr', status: 'Paid', type: 'sale', quantity: 1, operator: 'Mireya Rojas', notes: 'Despacho de soporte y cableado del televisor 65 pulgadas.' },
      { id: 'INV-2047', date: '2026-06-05', client: 'Metro Gym', item: 'Soporte Fijo de Pared Pesado x4', amount: 4182.00, discount: 0, paymentMethod: 'card', status: 'Paid', type: 'sale', quantity: 4, operator: 'Carlos Mendoza', notes: 'Gimnasio central, soportes instalados con anclaje químico.' },
      { id: 'INV-2046', date: '2026-06-04', client: 'Clínica Los Ángeles', item: 'Soporte TV Articulado Premium x3', amount: 1350.00, discount: 0, paymentMethod: 'transfer', status: 'Paid', type: 'sale', quantity: 3, operator: 'Carlos Mendoza', notes: 'Instalación en salas de internación.' },
      { id: 'INV-2045', date: '2026-06-03', client: 'Banco Unión', item: 'Mantenimiento Climatización HVAC', amount: 5400.00, discount: 15, paymentMethod: 'transfer', status: 'Paid', type: 'sale', quantity: 12, operator: 'Daniel Rocha', notes: 'Filtros de aire condicionado y carga de gas.' },
      { id: 'INV-2044', date: '2026-06-02', client: 'Andrés Villarroel', item: 'Soporte TV Móvil con Ruedas x1', amount: 1200.00, discount: 0, paymentMethod: 'qr', status: 'Paid', type: 'sale', quantity: 1, operator: 'Mireya Rojas', notes: 'Entregado en domicilio del usuario.' },
      { id: 'INV-2043', date: '2026-06-02', client: 'Hipermaxi S.A.', item: 'Soporte Fijo de Pared de 85 pulgadas', amount: 1850.00, discount: 0, paymentMethod: 'transfer', status: 'Paid', type: 'sale', quantity: 2, operator: 'Carlos Mendoza', notes: 'Instalación para pantallas de área de cajas.' },
      { id: 'INV-2042', date: '2026-06-01', client: 'Restaurante El Aljibe', item: 'Instalación Básica & Cableado', amount: 750.00, discount: 0, paymentMethod: 'cash', status: 'Paid', type: 'sale', quantity: 3, operator: 'Daniel Rocha', notes: 'Soportes normales fijos instalados.' },
      { id: 'QTE-0890', date: '2026-05-31', client: 'Inmobiliaria Santa Cruz', item: 'Soporte TV Articulado Premium x5', amount: 2250.00, discount: 5, paymentMethod: 'cash', status: 'Enviada', type: 'quote', quantity: 5, operator: 'Mireya Rojas', notes: 'Proforma para salas de juntas.' },
      { id: 'INV-2041', date: '2026-05-30', client: 'Hotel Buganvillas', item: 'Soporte TV Articulado Premium x10', amount: 4500.00, discount: 10, paymentMethod: 'transfer', status: 'Paid', type: 'sale', quantity: 10, operator: 'Carlos Mendoza', notes: 'Compra para suites matrimoniales.' },
      { id: 'INV-2040', date: '2026-05-29', client: 'María René Terrazas', item: 'Soporte TV Fijo de Pared x1', amount: 350.00, discount: 0, paymentMethod: 'qr', status: 'Paid', type: 'sale', quantity: 1, operator: 'Daniel Rocha', notes: 'Dormitorio principal.' },
      { id: 'INV-2039', date: '2026-05-28', client: 'Condominio Sevilla', item: 'Mantenimiento Climatización HVAC', amount: 4200.00, discount: 0, paymentMethod: 'transfer', status: 'Paid', type: 'sale', quantity: 4, operator: 'Carlos Mendoza', notes: 'Revisión técnica anual.' },
      { id: 'INV-2038', date: '2026-05-27', client: 'Estudio de Abogados Paz', item: 'Soporte TV Articulado Premium x2', amount: 900.00, discount: 0, paymentMethod: 'card', status: 'Paid', type: 'sale', quantity: 2, operator: 'Mireya Rojas', notes: 'Montaje en paredes drywall con anclajes especiales.' },
      { id: 'INV-2037', date: '2026-05-18', client: 'Colegio Saint George', item: 'Soporte TV Móvil con Ruedas x4', amount: 4800.00, discount: 5, paymentMethod: 'transfer', status: 'Paid', type: 'sale', quantity: 4, operator: 'Carlos Mendoza', notes: 'Uso en aulas interactivas.' },
      { id: 'INV-2036', date: '2026-05-15', client: 'Carlos Hurtado', item: 'Soporte TV Articulado Premium x1', amount: 450.00, discount: 0, paymentMethod: 'cash', status: 'Paid', type: 'sale', quantity: 1, operator: 'Daniel Rocha', notes: 'Cargado en sucursal central.' },
      { id: 'QTE-0889', date: '2026-05-12', client: 'Constructora El Bosque', item: 'Servicio de Instalación y Cableado', amount: 1540.00, discount: 0, paymentMethod: 'transfer', status: 'Aceptada', type: 'quote', quantity: 7, operator: 'Carlos Mendoza', notes: 'Proforma aceptada para bloque de departamentos nuevos.' }
    ];
  });
  const [recNotes, setRecNotes] = useState('');

  // --- Local States for Edición Inicio Customization ---
  const [localHeroBgImage, setLocalHeroBgImage] = useState(landingConfigs?.heroBgImage || '');
  const [localHeroTag, setLocalHeroTag] = useState(landingConfigs?.heroTag || '');
  const [localHeroTitle, setLocalHeroTitle] = useState(landingConfigs?.heroTitle || '');
  const [localHeroDescription, setLocalHeroDescription] = useState(landingConfigs?.heroDescription || '');
  const [localMetric1Val, setLocalMetric1Val] = useState(landingConfigs?.metric1Val || '');
  const [localMetric1Label, setLocalMetric1Label] = useState(landingConfigs?.metric1Label || '');
  const [localMetric2Val, setLocalMetric2Val] = useState(landingConfigs?.metric2Val || '');
  const [localMetric2Label, setLocalMetric2Label] = useState(landingConfigs?.metric2Label || '');
  const [localMetric3Val, setLocalMetric3Val] = useState(landingConfigs?.metric3Val || '');
  const [localMetric3Label, setLocalMetric3Label] = useState(landingConfigs?.metric3Label || '');

  const [localServicesTitle, setLocalServicesTitle] = useState(landingConfigs?.servicesTitle || '');
  const [localServicesSubtitle, setLocalServicesSubtitle] = useState(landingConfigs?.servicesSubtitle || '');
  const [localService1Title, setLocalService1Title] = useState(landingConfigs?.service1Title || '');
  const [localService1Desc, setLocalService1Desc] = useState(landingConfigs?.service1Desc || '');
  const [localService2Title, setLocalService2Title] = useState(landingConfigs?.service2Title || '');
  const [localService2Desc, setLocalService2Desc] = useState(landingConfigs?.service2Desc || '');
  const [localService3Title, setLocalService3Title] = useState(landingConfigs?.service3Title || '');
  const [localService3Desc, setLocalService3Desc] = useState(landingConfigs?.service3Desc || '');

  const [localAboutTitle, setLocalAboutTitle] = useState(landingConfigs?.aboutTitle || '');
  const [localAboutLocationTitle, setLocalAboutLocationTitle] = useState(landingConfigs?.aboutLocationTitle || '');
  const [localAboutLocationDesc, setLocalAboutLocationDesc] = useState(landingConfigs?.aboutLocationDesc || '');
  const [localAboutHoursTitle, setLocalAboutHoursTitle] = useState(landingConfigs?.aboutHoursTitle || '');
  const [localAboutHoursDesc, setLocalAboutHoursDesc] = useState(landingConfigs?.aboutHoursDesc || '');
  const [localAboutContactTitle, setLocalAboutContactTitle] = useState(landingConfigs?.aboutContactTitle || '');
  const [localAboutContactDesc, setLocalAboutContactDesc] = useState(landingConfigs?.aboutContactDesc || '');

  const [localService1Bullet1, setLocalService1Bullet1] = useState(landingConfigs?.service1Bullet1 || '');
  const [localService1Bullet2, setLocalService1Bullet2] = useState(landingConfigs?.service1Bullet2 || '');
  const [localService1Bullet3, setLocalService1Bullet3] = useState(landingConfigs?.service1Bullet3 || '');

  const [localService2Bullet1, setLocalService2Bullet1] = useState(landingConfigs?.service2Bullet1 || '');
  const [localService2Bullet2, setLocalService2Bullet2] = useState(landingConfigs?.service2Bullet2 || '');
  const [localService2Bullet3, setLocalService2Bullet3] = useState(landingConfigs?.service2Bullet3 || '');

  const [localService3Bullet1, setLocalService3Bullet1] = useState(landingConfigs?.service3Bullet1 || '');
  const [localService3Bullet2, setLocalService3Bullet2] = useState(landingConfigs?.service3Bullet2 || '');
  const [localService3Bullet3, setLocalService3Bullet3] = useState(landingConfigs?.service3Bullet3 || '');

  const [localMatrizTitle, setLocalMatrizTitle] = useState(landingConfigs?.matrizTitle || '');
  const [localMatrizOpt1Title, setLocalMatrizOpt1Title] = useState(landingConfigs?.matrizOpt1Title || '');
  const [localMatrizOpt1Desc, setLocalMatrizOpt1Desc] = useState(landingConfigs?.matrizOpt1Desc || '');
  const [localMatrizOpt2Title, setLocalMatrizOpt2Title] = useState(landingConfigs?.matrizOpt2Title || '');
  const [localMatrizOpt2Desc, setLocalMatrizOpt2Desc] = useState(landingConfigs?.matrizOpt2Desc || '');

  const [localDeliveryTitle, setLocalDeliveryTitle] = useState(landingConfigs?.deliveryTitle || '');
  const [localDeliveryCity1Name, setLocalDeliveryCity1Name] = useState(landingConfigs?.deliveryCity1Name || '');
  const [localDeliveryCity1Time, setLocalDeliveryCity1Time] = useState(landingConfigs?.deliveryCity1Time || '');
  const [localDeliveryCity2Name, setLocalDeliveryCity2Name] = useState(landingConfigs?.deliveryCity2Name || '');
  const [localDeliveryCity2Time, setLocalDeliveryCity2Time] = useState(landingConfigs?.deliveryCity2Time || '');
  const [localDeliveryCity3Name, setLocalDeliveryCity3Name] = useState(landingConfigs?.deliveryCity3Name || '');
  const [localDeliveryCity3Time, setLocalDeliveryCity3Time] = useState(landingConfigs?.deliveryCity3Time || '');

  const [showSaveToast, setShowSaveToast] = useState(false);

  useEffect(() => {
    if (landingConfigs) {
      setLocalHeroBgImage(landingConfigs.heroBgImage || '');
      setLocalHeroTag(landingConfigs.heroTag);
      setLocalHeroTitle(landingConfigs.heroTitle);
      setLocalHeroDescription(landingConfigs.heroDescription);
      setLocalMetric1Val(landingConfigs.metric1Val);
      setLocalMetric1Label(landingConfigs.metric1Label);
      setLocalMetric2Val(landingConfigs.metric2Val);
      setLocalMetric2Label(landingConfigs.metric2Label);
      setLocalMetric3Val(landingConfigs.metric3Val);
      setLocalMetric3Label(landingConfigs.metric3Label);

      setLocalServicesTitle(landingConfigs.servicesTitle);
      setLocalServicesSubtitle(landingConfigs.servicesSubtitle);
      setLocalService1Title(landingConfigs.service1Title);
      setLocalService1Desc(landingConfigs.service1Desc);
      setLocalService2Title(landingConfigs.service2Title);
      setLocalService2Desc(landingConfigs.service2Desc);
      setLocalService3Title(landingConfigs.service3Title);
      setLocalService3Desc(landingConfigs.service3Desc);

      setLocalAboutTitle(landingConfigs.aboutTitle);
      setLocalAboutLocationTitle(landingConfigs.aboutLocationTitle);
      setLocalAboutLocationDesc(landingConfigs.aboutLocationDesc);
      setLocalAboutHoursTitle(landingConfigs.aboutHoursTitle);
      setLocalAboutHoursDesc(landingConfigs.aboutHoursDesc);
      setLocalAboutContactTitle(landingConfigs.aboutContactTitle);
      setLocalAboutContactDesc(landingConfigs.aboutContactDesc);

      setLocalService1Bullet1(landingConfigs.service1Bullet1 || '');
      setLocalService1Bullet2(landingConfigs.service1Bullet2 || '');
      setLocalService1Bullet3(landingConfigs.service1Bullet3 || '');
      setLocalService2Bullet1(landingConfigs.service2Bullet1 || '');
      setLocalService2Bullet2(landingConfigs.service2Bullet2 || '');
      setLocalService2Bullet3(landingConfigs.service2Bullet3 || '');
      setLocalService3Bullet1(landingConfigs.service3Bullet1 || '');
      setLocalService3Bullet2(landingConfigs.service3Bullet2 || '');
      setLocalService3Bullet3(landingConfigs.service3Bullet3 || '');

      setLocalMatrizTitle(landingConfigs.matrizTitle || '');
      setLocalMatrizOpt1Title(landingConfigs.matrizOpt1Title || '');
      setLocalMatrizOpt1Desc(landingConfigs.matrizOpt1Desc || '');
      setLocalMatrizOpt2Title(landingConfigs.matrizOpt2Title || '');
      setLocalMatrizOpt2Desc(landingConfigs.matrizOpt2Desc || '');

      setLocalDeliveryTitle(landingConfigs.deliveryTitle || '');
      setLocalDeliveryCity1Name(landingConfigs.deliveryCity1Name || '');
      setLocalDeliveryCity1Time(landingConfigs.deliveryCity1Time || '');
      setLocalDeliveryCity2Name(landingConfigs.deliveryCity2Name || '');
      setLocalDeliveryCity2Time(landingConfigs.deliveryCity2Time || '');
      setLocalDeliveryCity3Name(landingConfigs.deliveryCity3Name || '');
      setLocalDeliveryCity3Time(landingConfigs.deliveryCity3Time || '');
    }
  }, [landingConfigs]);

  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isCapitalModalOpen, setIsCapitalModalOpen] = useState(false);
  const [isDepreciationModalOpen, setIsDepreciationModalOpen] = useState(false);
  const [selectedDepreciationIndex, setSelectedDepreciationIndex] = useState<number>(0);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [newlyCreatedRecord, setNewlyCreatedRecord] = useState<FinancialRecord | null>(null);
  const [recType, setRecType] = useState<'sale' | 'quote'>('sale');
  const [recClient, setRecClient] = useState('');
  const [recClientRole, setRecClientRole] = useState('');
  const [recClientPhone, setRecClientPhone] = useState('');
  const [recClientNit, setRecClientNit] = useState('');
  const [recClientEmail, setRecClientEmail] = useState('');
  const [recClientAddress, setRecClientAddress] = useState('');
  const [recDueDate, setRecDueDate] = useState('');
  const [recTaxRate, setRecTaxRate] = useState<number>(0);
  const [recLineItems, setRecLineItems] = useState<RecLineItem[]>([{ itemKey: 'tv_art', qty: 1, customAmount: null }]);
  const [recDiscount, setRecDiscount] = useState(0);
  const [recPayMethod, setRecPayMethod] = useState('transfer');
  const [recStatus, setRecStatus] = useState<'Paid' | 'Borrador' | 'Enviada' | 'Aceptada'>('Paid');

  // --- Edit Financial Record States ---
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editRecId, setEditRecId] = useState('');
  const [editRecType, setEditRecType] = useState<'sale' | 'quote'>('sale');
  const [editRecClient, setEditRecClient] = useState('');
  const [editRecNotes, setEditRecNotes] = useState('');
  const [editRecClientRole, setEditRecClientRole] = useState('');
  const [editRecClientPhone, setEditRecClientPhone] = useState('');
  const [editRecClientNit, setEditRecClientNit] = useState('');
  const [editRecClientEmail, setEditRecClientEmail] = useState('');
  const [editRecClientAddress, setEditRecClientAddress] = useState('');
  const [editRecDueDate, setEditRecDueDate] = useState('');
  const [editRecTaxRate, setEditRecTaxRate] = useState<number>(0);
  const [editRecLineItems, setEditRecLineItems] = useState<RecLineItem[]>([{ itemKey: 'tv_art', qty: 1, customAmount: null }]);
  const [editRecDiscount, setEditRecDiscount] = useState(0);
  const [editRecPayMethod, setEditRecPayMethod] = useState('transfer');
  const [editRecStatus, setEditRecStatus] = useState<'Paid' | 'Borrador' | 'Enviada' | 'Aceptada'>('Paid');
  const [editRecOperator, setEditRecOperator] = useState('Carlos Mendoza');

  // --- Edit Incoming Quote States ---
  const [isEditQuoteModalOpen, setIsEditQuoteModalOpen] = useState(false);
  const [editQuoteId, setEditQuoteId] = useState('');
  const [editQuoteFullName, setEditQuoteFullName] = useState('');
  const [editQuotePhone, setEditQuotePhone] = useState('');
  const [editQuoteEmail, setEditQuoteEmail] = useState('');
  const [editQuoteServiceType, setEditQuoteServiceType] = useState('');
  const [editQuoteMessage, setEditQuoteMessage] = useState('');
  const [editQuoteStatus, setEditQuoteStatus] = useState<QuoteStatus>('Pendiente');
  const [editQuoteTechnicianNotes, setEditQuoteTechnicianNotes] = useState('');
  const [editQuoteAssignedTechnician, setEditQuoteAssignedTechnician] = useState('');
  const [editQuoteItems, setEditQuoteItems] = useState<CartItem[]>([]);
  const [editQuoteDate, setEditQuoteDate] = useState('');
  
  // States to hold operator names for registered operations, defaulting to Carlos Mendoza
  const [recOperator, setRecOperator] = useState('Carlos Mendoza');
  const [expOperator, setExpOperator] = useState('Carlos Mendoza');
  const [invOperator, setInvOperator] = useState('Carlos Mendoza');

  // Search & Filter state for transactions list
  const [searchFilter, setSearchFilter] = useState('');
  const [quoteSearchFilter, setQuoteSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all'); // 'all', 'sale', 'quote'
  const [operatorFilter, setOperatorFilter] = useState<string>('all');
  const [timePeriodFilter, setTimePeriodFilter] = useState<'last_week' | 'week' | 'month' | 'year' | 'all'>('all');
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(4); // Mayo = 4
  const [selectedWeekStart, setSelectedWeekStart] = useState<string>('all');

  // Search & Filter state for Expenses (Gastos)
  const [expSearchFilter, setExpSearchFilter] = useState('');
  const [expCategoryFilter, setExpCategoryFilter] = useState<string>('all');
  const [expOperatorFilter, setExpOperatorFilter] = useState<string>('all');
  const [expTimePeriodFilter, setExpTimePeriodFilter] = useState<'last_week' | 'week' | 'month' | 'year' | 'all'>('all');
  const [expSelectedYear, setExpSelectedYear] = useState<number>(2026);
  const [expSelectedMonth, setExpSelectedMonth] = useState<number>(4); // Mayo = 4
  const [expSelectedWeekStart, setExpSelectedWeekStart] = useState<string>('all');

  // Search & Filter state for Capital Investments (Inversiones de Capital)
  const [capSearchFilter, setCapSearchFilter] = useState('');
  const [capTypeFilter, setCapTypeFilter] = useState<string>('all');
  const [capOperatorFilter, setCapOperatorFilter] = useState<string>('all');
  const [capTimePeriodFilter, setCapTimePeriodFilter] = useState<'last_week' | 'week' | 'month' | 'year' | 'all'>('all');
  const [capSelectedYear, setCapSelectedYear] = useState<number>(2026);
  const [capSelectedMonth, setCapSelectedMonth] = useState<number>(4); // Mayo = 4
  const [capSelectedWeekStart, setCapSelectedWeekStart] = useState<string>('all');

  // Custom Capital override states
  const [recCapital, setRecCapital] = useState<number | null>(null);
  const [editRecCapital, setEditRecCapital] = useState<number | null>(null);

  const itemOptions: Record<string, { name: string; price: number }> = {
    'tv_fixed': { name: 'Soporte TV Fijo de Pared', price: 350 },
    'tv_wheeled': { name: 'Soporte TV Móvil con Ruedas', price: 1200 },
    'tv_art': { name: 'Soporte TV Articulado Premium', price: 450 },
    'install': { name: 'Servicio de Instalación y Cableado', price: 250 },
    'hvac': { name: 'Mantenimiento Climatización HVAC', price: 450 },
    'delivery': { name: 'Despacho de Logística y Transporte', price: 80 }
  };

  // Build a dynamic item dictionary merging initial options and live customizable products list
  const dynamicItemOptions: Record<string, { name: string; price: number }> = {
    ...itemOptions
  };
  products.forEach(p => {
    dynamicItemOptions[p.id] = { name: p.sku ? `${p.sku} - ${p.name}` : p.name, price: p.price };
  });

  const handleAddFinancialRecord = (e: React.FormEvent) => {
    e.preventDefault();

    const computedItems = recLineItems.map(line => ({
      name: dynamicItemOptions[line.itemKey]?.name || 'Servicio Torre Forte',
      quantity: line.qty,
      unitPrice: line.customAmount !== null ? line.customAmount : (dynamicItemOptions[line.itemKey]?.price || 0)
    }));
    const calculatedBase = computedItems.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0);
    const finalAmount = calculatedBase - (calculatedBase * (recDiscount / 100));
    const totalQty = computedItems.reduce((sum, it) => sum + it.quantity, 0);
    const itemSummary = computedItems.map(it => `${it.name}${it.quantity > 1 ? ` x${it.quantity}` : ''}`).join(', ');

    // Calculate Capital & Profit
    const finalCapital = recCapital !== null ? recCapital : parseFloat((finalAmount * 0.6).toFixed(2));
    const finalProfit = parseFloat((finalAmount - finalCapital).toFixed(2));

    // Handle tax addition if applicable (amount + tax, or if amount already includes tax - we just calculate it in PDF)
    // We'll keep amount as base net amount, and tax rate will be calculated on top in PDF style Wodexo!
    const prefix = recType === 'sale' ? 'INV' : 'QTE';
    const randomId = Math.floor(1000 + Math.random() * 9000);
    const newRecord: FinancialRecord = {
      id: `${prefix}-${randomId}`,
      date: new Date().toISOString().split('T')[0],
      client: recClient.trim(),
      item: itemSummary,
      items: computedItems,
      amount: parseFloat(finalAmount.toFixed(2)),
      discount: recDiscount,
      paymentMethod: recPayMethod,
      status: recType === 'sale' ? recStatus : 'Borrador',
      type: recType,
      quantity: totalQty,
      operator: recOperator,
      notes: recNotes,
      clientRole: recType === 'quote' ? (recClientRole.trim() || undefined) : undefined,
      clientPhone: recType === 'quote' ? (recClientPhone.trim() || undefined) : undefined,
      clientNit: recType === 'quote' ? (recClientNit.trim() || undefined) : undefined,
      clientEmail: recType === 'quote' ? (recClientEmail.trim() || undefined) : undefined,
      clientAddress: recType === 'quote' ? (recClientAddress.trim() || undefined) : undefined,
      dueDate: recType === 'quote' ? (recDueDate || undefined) : undefined,
      taxRate: recType === 'quote' ? (recTaxRate || 0) : 0,
      capital: finalCapital,
      profit: finalProfit
    };

    setFinancialRecords([newRecord, ...financialRecords]);
    addAuditLog('Creación', `Nuevo registro de flujo de caja (${recType === 'sale' ? 'Venta Directa' : 'Proforma'}): ${newRecord.id} para ${recClient.trim() || 'Público General'} por Bs. ${newRecord.amount}`, recOperator);
    
    if (recType === 'quote') {
      // Set newly created record and show success modal
      setNewlyCreatedRecord(newRecord);
      setShowSuccessModal(true);
    } else {
      // For sales: Just show a quick success message and no modal!
      alert(`¡Venta Directa ${newRecord.id} registrada con éxito!`);
    }

    // reset form
    setRecClient('');
    setRecNotes('');
    setRecClientRole('');
    setRecClientPhone('');
    setRecClientNit('');
    setRecClientEmail('');
    setRecClientAddress('');
    setRecDueDate('');
    setRecTaxRate(0);
    setRecLineItems([{ itemKey: 'tv_art', qty: 1, customAmount: null }]);
    setRecDiscount(0);
    setRecPayMethod('transfer');
    setRecCapital(null);
    setRecOperator('Carlos Mendoza');
    setIsRecordModalOpen(false);
  };

  const handleDeleteRecord = (id: string) => {
    if (confirm(`¿Confirmas remover el registro ${id} permanentemente?`)) {
      setFinancialRecords(financialRecords.filter(r => r.id !== id));
    }
  };

  const handleStartEditRecord = (rec: FinancialRecord) => {
    setEditRecId(rec.id);
    setEditRecType(rec.type);
    setEditRecClient(rec.client);
    setEditRecNotes(rec.notes || '');
    setEditRecClientRole(rec.clientRole || '');
    setEditRecClientPhone(rec.clientPhone || '');
    setEditRecClientNit(rec.clientNit || '');
    setEditRecClientEmail(rec.clientEmail || '');
    setEditRecClientAddress(rec.clientAddress || '');
    setEditRecDueDate(rec.dueDate || '');
    setEditRecTaxRate(rec.taxRate || 0);
    
    const findItemKey = (name: string) => {
      const cleanItemName = name.replace(/\s+x\d+$/, ''); // Strip x2, x3, etc.
      return Object.entries(dynamicItemOptions).find(([_, opt]) => opt.name === cleanItemName)?.[0] || 'tv_art';
    };

    if (rec.items && rec.items.length > 0) {
      setEditRecLineItems(rec.items.map(it => {
        const itemKey = findItemKey(it.name);
        const defaultPrice = dynamicItemOptions[itemKey]?.price || 0;
        return {
          itemKey,
          qty: it.quantity,
          customAmount: Math.abs(defaultPrice - it.unitPrice) > 0.05 ? parseFloat(it.unitPrice.toFixed(2)) : null
        };
      }));
    } else {
      // Legacy single-item record: rebuild a one-line editor from the aggregate fields
      const itemKey = findItemKey(rec.item);
      const defaultPrice = dynamicItemOptions[itemKey]?.price || 0;
      const baseAmt = defaultPrice * (rec.quantity || 1);
      const expectedAmt = baseAmt - (baseAmt * ((rec.discount || 0) / 100));
      let customAmount: number | null = null;
      if (Math.abs(expectedAmt - rec.amount) > 0.05) {
        const discountMult = 1 - (rec.discount || 0) / 100;
        const originalCustom = discountMult > 0 ? (rec.amount / (rec.quantity || 1)) / discountMult : 0;
        customAmount = parseFloat(originalCustom.toFixed(2));
      }
      setEditRecLineItems([{ itemKey, qty: rec.quantity || 1, customAmount }]);
    }

    setEditRecDiscount(rec.discount || 0);
    setEditRecPayMethod(rec.paymentMethod);
    setEditRecStatus(rec.status);
    setEditRecOperator(rec.operator || 'Carlos Mendoza');
    setEditRecCapital(rec.capital !== undefined ? rec.capital : null);
    setIsEditModalOpen(true);
  };

  const handleSaveEditRecord = (e: React.FormEvent) => {
    e.preventDefault();
    
    const computedItems = editRecLineItems.map(line => ({
      name: dynamicItemOptions[line.itemKey]?.name || 'Servicio Torre Forte',
      quantity: line.qty,
      unitPrice: line.customAmount !== null ? line.customAmount : (dynamicItemOptions[line.itemKey]?.price || 0)
    }));
    const calculatedBase = computedItems.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0);
    const finalAmount = calculatedBase - (calculatedBase * (editRecDiscount / 100));
    const totalQty = computedItems.reduce((sum, it) => sum + it.quantity, 0);
    const itemSummary = computedItems.map(it => `${it.name}${it.quantity > 1 ? ` x${it.quantity}` : ''}`).join(', ');

    // Calculate Capital & Profit
    const finalCapital = editRecCapital !== null ? editRecCapital : parseFloat((finalAmount * 0.6).toFixed(2));
    const finalProfit = parseFloat((finalAmount - finalCapital).toFixed(2));

    let editedRec: FinancialRecord | null = null;
    const updatedRecords = financialRecords.map(rec => {
      if (rec.id === editRecId) {
        editedRec = {
          ...rec,
          client: editRecClient.trim(),
          item: itemSummary,
          items: computedItems,
          amount: parseFloat(finalAmount.toFixed(2)),
          discount: editRecDiscount,
          paymentMethod: editRecPayMethod,
          status: editRecStatus,
          quantity: totalQty,
          operator: editRecOperator,
          notes: editRecNotes,
          clientRole: editRecType === 'quote' ? (editRecClientRole.trim() || undefined) : undefined,
          clientPhone: editRecType === 'quote' ? (editRecClientPhone.trim() || undefined) : undefined,
          clientNit: editRecType === 'quote' ? (editRecClientNit.trim() || undefined) : undefined,
          clientEmail: editRecType === 'quote' ? (editRecClientEmail.trim() || undefined) : undefined,
          clientAddress: editRecType === 'quote' ? (editRecClientAddress.trim() || undefined) : undefined,
          dueDate: editRecType === 'quote' ? (editRecDueDate || undefined) : undefined,
          taxRate: editRecType === 'quote' ? (editRecTaxRate || 0) : 0,
          capital: finalCapital,
          profit: finalProfit
        };
        return editedRec;
      }
      return rec;
    });
    
    setFinancialRecords(updatedRecords);
    addAuditLog('Modificación', `Registro de caja editado: ${editRecId} por Bs. ${finalAmount.toFixed(2)}`, editRecOperator);
    alert('Registro modificado con éxito.');
    setIsEditModalOpen(false);

    if (editedRec) {
      setNewlyCreatedRecord(editedRec);
      setShowSuccessModal(true);
    }
  };

  const handleStartEditQuote = (quote: Quote) => {
    setEditQuoteId(quote.id);
    setEditQuoteFullName(quote.fullName);
    setEditQuotePhone(quote.phone);
    setEditQuoteEmail(quote.email);
    setEditQuoteServiceType(quote.serviceType);
    setEditQuoteMessage(quote.message || '');
    setEditQuoteStatus(quote.status);
    setEditQuoteTechnicianNotes(quote.technicianNotes || '');
    setEditQuoteAssignedTechnician(quote.assignedTechnician || '');
    setEditQuoteItems(quote.items || []);
    setEditQuoteDate(quote.date);
    setIsEditQuoteModalOpen(true);
  };

  const handleSaveEditQuote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateQuote) return;
    
    const updatedQuote: Quote = {
      id: editQuoteId,
      fullName: editQuoteFullName.trim(),
      phone: editQuotePhone.trim(),
      email: editQuoteEmail.trim(),
      serviceType: editQuoteServiceType,
      message: editQuoteMessage.trim(),
      status: editQuoteStatus,
      technicianNotes: editQuoteTechnicianNotes.trim() || undefined,
      assignedTechnician: editQuoteAssignedTechnician || undefined,
      items: editQuoteItems,
      date: editQuoteDate
    };
    
    onUpdateQuote(updatedQuote);
    addAuditLog('Modificación', `Cotización recibida editada: ${editQuoteId} para ${editQuoteFullName.trim()}`, 'Admin');
    alert('Cotización modificada con éxito.');
    setIsEditQuoteModalOpen(false);
  };

  const handleDownloadPDF = () => {
    if (!newlyCreatedRecord) return;
    try {
      const doc = generatePDF(newlyCreatedRecord);
      doc.save(`${newlyCreatedRecord.id}_TorreForte.pdf`);
    } catch (error) {
      console.error('Error al descargar el PDF:', error);
      alert('Error al descargar el PDF. Inténtalo de nuevo.');
    }
  };

  const handleShareWhatsApp = async () => {
    if (!newlyCreatedRecord) return;
    try {
      const doc = generatePDF(newlyCreatedRecord);
      const pdfBlob = doc.output('blob');
      const pdfFile = new File([pdfBlob], `${newlyCreatedRecord.id}_TorreForte.pdf`, { type: 'application/pdf' });
      const messageText = `Hola, te adjunto la proforma/comprobante de Torre Forte. Registro: ${newlyCreatedRecord.id}. Cliente: ${newlyCreatedRecord.client || 'Público General'}. Total: Bs. ${newlyCreatedRecord.amount}`;

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        await navigator.share({
          files: [pdfFile],
          title: `Torre Forte - ${newlyCreatedRecord.id}`,
          text: messageText,
        });
      } else {
        // Fallback for desktop or non-sharing browsers
        doc.save(`${newlyCreatedRecord.id}_TorreForte.pdf`);
        const encodedText = encodeURIComponent(`${messageText}\n\n*Nota:* He descargado el PDF a tu dispositivo. Puedes adjuntarlo en la conversación de WhatsApp.`);
        window.open(`https://api.whatsapp.com/send?text=${encodedText}`, '_blank');
      }
    } catch (error) {
      console.error('Error al generar o compartir el PDF:', error);
      alert('Hubo un error al generar o compartir el PDF. Se procederá a descargar el archivo de forma local.');
      try {
        const doc = generatePDF(newlyCreatedRecord);
        doc.save(`${newlyCreatedRecord.id}_TorreForte.pdf`);
      } catch (err) {
        console.error('Error en descarga de respaldo:', err);
      }
    }
  };
  
  // Create state for quote detail view & AI prompt
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [statusDraft, setStatusDraft] = useState<QuoteStatus>('Pendiente');
  const [techDraft, setTechDraft] = useState<string>('');
  const [notesDraft, setNotesDraft] = useState<string>('');
  const [aiDraftOutput, setAiDraftOutput] = useState<string>('');
  const [aiGenerating, setAiGenerating] = useState<boolean>(false);

  // Inventario manager state
  const [newProdName, setNewProdName] = useState('');
  const [newProdSku, setNewProdSku] = useState('');
  const [newProdPrice, setNewProdPrice] = useState(0);
  const [newProdCategory, setNewProdCategory] = useState<string>('articulado');
  const [newProdStock, setNewProdStock] = useState<'In Stock' | 'Low Stock' | 'Out of Stock' | 'Compra-Venta' | 'Modificado' | 'Fabricado'>('Compra-Venta');
  const [newProdMaxLoad, setNewProdMaxLoad] = useState(45);
  const [newProdSizes, setNewProdSizes] = useState('32" - 65"');
  const [newProdDescription, setNewProdDescription] = useState('');
  const [newProdMaterial, setNewProdMaterial] = useState('');
  
  // Categorías de producto dinámicas administrables
  const [categories, setCategories] = useState<string[]>([
    'articulado',
    'fijo',
    'techo',
    'pedestal',
    'climatizacion',
    'proyectos estruct'
  ]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isManagingCategories, setIsManagingCategories] = useState(false);

  // BTU capacity para aires acondicionados
  const [newProdBtu, setNewProdBtu] = useState<number | ''>('');
  const [editProdBtu, setEditProdBtu] = useState<number | ''>('');

  // Estados para Imagen de Nuevo Producto (se permiten hasta 3 imágenes por producto)
  const [newImageSource, setNewImageSource] = useState<'preset' | 'url' | 'upload'>('preset');
  const [newProdImages, setNewProdImages] = useState<string[]>([
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDAP_Hywg0z1xV-NVCc_OM_E5YeujMPk0L2DNlLp7axI3oMsHgCZF-gi1kUErfuRimptCHdHe5-2m7oMuSQVWl89mPKqJwyEJebOlKoAlU9Mlt0T99O7JbkEg-W2yMVsmZprewJ6ZN7ZiMPjn-FGsYTfVcflAn5pNUW0t9AEIjRI6h94syj-RAWVE71JMHY3DMi6d-bLeM-U_s2SsZ3N4qbja8tKY3Nr1HJ2fZmzTJOEBqtvqfy6S147PXL5nXYBnq3Rlxb8EeB6L1w',
    '',
    ''
  ]);
  const [activeImageSlot, setActiveImageSlot] = useState<number>(0);

  const setNewProdImageAt = (index: number, val: string) => {
    setNewProdImages(prev => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
  };

  // Technician creation state
  const [newTechName, setNewTechName] = useState('');
  const [newTechSpecialty, setNewTechSpecialty] = useState('');
  const [newTechPhone, setNewTechPhone] = useState('');

  // --- Configuración y Gestión Tab States ---
  const [sheetsSalesId, setSheetsSalesId] = useState('1BxiMVs0XRX5QO_aIGYI6A');
  const [sheetsInvId, setSheetsInventoryId] = useState('1CxiMVs0XRX5QO_aIGYI6B');
  const [firebaseOpsToday, setFirebaseOpsToday] = useState(1245);
  const [firebaseLastSync, setFirebaseLastSync] = useState('Hace 2 minutos');
  const [isFirebaseSyncing, setIsFirebaseSyncing] = useState(false);

  // --- Manufacturing Cost Calculator States ---
  const [mountType, setMountType] = useState<'empotrado' | 'ruedas'>('empotrado');
  const [marginInput, setMarginInput] = useState<number>(35);
  const [qtySteel, setQtySteel] = useState<number>(4.5);
  const [costSteel, setCostSteel] = useState<number>(14.50);
  const [qtyPaint, setQtyPaint] = useState<number>(0.25);
  const [costPaint, setCostPaint] = useState<number>(95.00);
  const [qtyHw, setQtyHw] = useState<number>(1);
  const [costHw, setCostHw] = useState<number>(28.50);
  const [qtyLabor, setQtyLabor] = useState<number>(1.5);
  const [costLabor, setCostLabor] = useState<number>(125.00);
  const [costEnergy, setCostEnergy] = useState<number>(15.00);
  const [costOverhead, setCostOverhead] = useState<number>(35.00);

  // --- Expenses and Investments Tracking States ---
  interface ExpenseRecord {
    id: string;
    date: string;
    category: string;
    description: string;
    amount: number;
    operator?: string;
  }

  interface CapitalInvestment {
    id: string;
    date: string;
    type: string;
    name: string;
    initialCost: number;
    lifespanYears: number;
    recovered: number;
    operator?: string;
  }

  const [expenseCategories, setExpenseCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem('torre_forte_expense_categories');
    return saved ? JSON.parse(saved) : ['Materia Prima', 'Servicios', 'Transporte', 'Otros'];
  });

  const [investmentTypes, setInvestmentTypes] = useState<string[]>(() => {
    const saved = localStorage.getItem('torre_forte_investment_types');
    return saved ? JSON.parse(saved) : ['Heavy Machinery', 'Fleet Vehicle', 'IT Infrastructure', 'Real Estate'];
  });

  const [expenseRecords, setExpenseRecords] = useState<ExpenseRecord[]>(() => {
    const saved = localStorage.getItem('torre_forte_expense_records');
    return saved ? JSON.parse(saved) : [
      { id: 'EXP-001', date: '2026-05-24', category: 'Materia Prima', description: 'Materiales y Soportes HVAC - Trabajo #4092', amount: 1240.50 },
      { id: 'EXP-002', date: '2026-05-22', category: 'Transporte', description: 'Combustible de Flota - Camión 03 & 05', amount: 345.00 },
      { id: 'EXP-003', date: '2026-05-15', category: 'Servicios', description: 'Planilla de Técnicos Quincenal', amount: 8450.00 },
      { id: 'EXP-004', date: '2026-05-01', category: 'Otros', description: 'Alquiler Mensual Almacén Central', amount: 3500.00 }
    ];
  });

  const [capitalInvestments, setCapitalInvestments] = useState<CapitalInvestment[]>(() => {
    const saved = localStorage.getItem('torre_forte_capital_investments');
    return saved ? JSON.parse(saved) : [
      { id: 'INV-A1', date: '2026-01-10', type: 'Fleet Vehicle', name: 'Ford Transit T-250 (Furgón)', initialCost: 42000, lifespanYears: 5, recovered: 18900 },
      { id: 'INV-A2', date: '2026-03-05', type: 'Heavy Machinery', name: 'Cortadora Plasma CNC de Perfiles', initialCost: 15500, lifespanYears: 7, recovered: 12710 },
      { id: 'INV-A3', date: '2026-04-12', type: 'IT Infrastructure', name: 'Infraestructura de Servidor Local & VoIP', initialCost: 27900, lifespanYears: 3, recovered: 5120 }
    ];
  });

  const [expFormDate, setExpFormDate] = useState<string>('');
  const [expFormCategory, setExpFormCategory] = useState<string>('Materia Prima');
  const [expFormDescription, setExpFormDescription] = useState<string>('');
  const [expFormAmount, setExpFormAmount] = useState<string>('');

  const [invFormDate, setInvFormDate] = useState<string>('');
  const [invFormType, setInvFormType] = useState<string>('Heavy Machinery');
  const [invFormName, setInvFormName] = useState<string>('');
  const [invFormCost, setInvFormCost] = useState<string>('');
  const [invFormLifespan, setInvFormLifespan] = useState<string>('');

  const [isManagingExpenseCategories, setIsManagingExpenseCategories] = useState(false);
  const [isManagingInvestmentTypes, setIsManagingInvestmentTypes] = useState(false);

  useEffect(() => {
    localStorage.setItem('torre_forte_financial_records', JSON.stringify(financialRecords));
  }, [financialRecords]);

  useEffect(() => {
    localStorage.setItem('torre_forte_expense_records', JSON.stringify(expenseRecords));
  }, [expenseRecords]);

  useEffect(() => {
    localStorage.setItem('torre_forte_capital_investments', JSON.stringify(capitalInvestments));
  }, [capitalInvestments]);

  useEffect(() => {
    localStorage.setItem('torre_forte_expense_categories', JSON.stringify(expenseCategories));
  }, [expenseCategories]);

  useEffect(() => {
    localStorage.setItem('torre_forte_investment_types', JSON.stringify(investmentTypes));
  }, [investmentTypes]);

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(expFormAmount);
    if (isNaN(amountVal) || amountVal <= 0) {
      alert('Por favor, ingresa un monto válido.');
      return;
    }
    const newId = `EXP-${Math.floor(100 + Math.random() * 900)}`;
    const dateVal = expFormDate || new Date().toISOString().split('T')[0];
    const newExpense: ExpenseRecord = {
      id: newId,
      date: dateVal,
      category: expFormCategory,
      description: expFormDescription || 'Gasto operacional general',
      amount: amountVal,
      operator: expOperator
    };
    setExpenseRecords(prev => [newExpense, ...prev]);
    addAuditLog('Creación', `Gasto registrado: ${newExpense.description} por Bs. ${amountVal}`, expOperator);
    
    // Reset Form
    setExpFormDescription('');
    setExpFormAmount('');
    setExpOperator('Carlos Mendoza');
    setIsExpenseModalOpen(false);
    alert('Gasto registrado de manera exitosa.');
  };

  const handleAddInvestment = (e: React.FormEvent) => {
    e.preventDefault();
    const costVal = parseFloat(invFormCost);
    const lifespanVal = parseInt(invFormLifespan);
    if (isNaN(costVal) || costVal <= 0) {
      alert('Por favor, ingresa un costo inicial válido.');
      return;
    }
    if (isNaN(lifespanVal) || lifespanVal <= 0) {
      alert('Por favor, ingresa una vida útil válida en años.');
      return;
    }
    if (!invFormName.trim()) {
      alert('Por favor, ingresa el nombre o SKU del activo.');
      return;
    }

    const newId = `INV-A${Math.floor(10 + Math.random() * 90)}`;
    const dateVal = invFormDate || new Date().toISOString().split('T')[0];
    const newInvestment: CapitalInvestment = {
      id: newId,
      date: dateVal,
      type: invFormType,
      name: invFormName,
      initialCost: costVal,
      lifespanYears: lifespanVal,
      recovered: 0,
      operator: invOperator
    };
    setCapitalInvestments(prev => [...prev, newInvestment]);
    addAuditLog('Creación', `Nueva inversión de capital registrada: "${invFormName}" por Bs. ${costVal}`, invOperator);
    
    // Reset Form
    setInvFormName('');
    setInvFormCost('');
    setInvFormLifespan('');
    setInvOperator('Carlos Mendoza');
    setIsCapitalModalOpen(false);
    alert('Activo de capital registrado exitosamente.');
  };

  interface UserRecord {
    id: string;
    name: string;
    role: string;
    lastAccess: string;
    status: 'Activo' | 'Offline' | 'Suspendido';
  }

  const [usersList, setUsersList] = useState<UserRecord[]>([
    { id: '1', name: 'Carlos Mendoza', role: 'Admin', lastAccess: 'Hoy, 08:42 AM', status: 'Activo' },
    { id: '2', name: 'Ana Silva', role: 'Empleado (Ventas)', lastAccess: 'Ayer, 14:15 PM', status: 'Activo' },
    { id: '3', name: 'Luis Rojas', role: 'Empleado (Técnico)', lastAccess: 'Oct 24, 09:10 AM', status: 'Offline' },
    { id: '4', name: 'María Torres', role: 'Empleado (Logística)', lastAccess: 'Oct 20, 16:30 PM', status: 'Suspendido' }
  ]);

  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState('Empleado (Ventas)');
  const [userSearchText, setUserSearchText] = useState('');

  // Estados para Edición de Usuarios
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editUserName, setEditUserName] = useState('');
  const [editUserRole, setEditUserRole] = useState('Empleado (Ventas)');
  const [editUserStatus, setEditUserStatus] = useState<'Activo' | 'Offline' | 'Suspendido'>('Activo');

  // Estados para Edición de Egresos
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [editExpenseDate, setEditExpenseDate] = useState('');
  const [editExpenseOperator, setEditExpenseOperator] = useState('');
  const [editExpenseCategory, setEditExpenseCategory] = useState('');
  const [editExpenseDescription, setEditExpenseDescription] = useState('');
  const [editExpenseAmount, setEditExpenseAmount] = useState<number>(0);

  // Estados para Registro de Administradores con Acceso Total
  const [isAdminRegisterOpen, setIsAdminRegisterOpen] = useState(false);
  const [adminRegName, setAdminRegName] = useState('');
  const [adminRegEmail, setAdminRegEmail] = useState('');
  const [adminRegPassword, setAdminRegPassword] = useState('');
  const [adminRegPin, setAdminRegPin] = useState('');
  const [adminRegDept, setAdminRegDept] = useState('Gerencia General');

  // Estados para Edición de Productos de Venta (Catálogo)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editProdName, setEditProdName] = useState('');
  const [editProdSku, setEditProdSku] = useState('');
  const [editProdPrice, setEditProdPrice] = useState<number>(0);
  const [editProdCategory, setEditProdCategory] = useState<string>('articulado');
  const [editProdStock, setEditProdStock] = useState<'In Stock' | 'Low Stock' | 'Out of Stock' | 'Compra-Venta' | 'Modificado' | 'Fabricado'>('Compra-Venta');
  const [editProdSizes, setEditProdSizes] = useState('');
  const [editProdMaxLoad, setEditProdMaxLoad] = useState('');
  const [editProdDescription, setEditProdDescription] = useState('');
  const [editProdMaterial, setEditProdMaterial] = useState('');

  // Estados para Imagen en Edición (se permiten hasta 3 imágenes por producto)
  const [editImageSource, setEditImageSource] = useState<'preset' | 'url' | 'upload'>('preset');
  const [editProdImages, setEditProdImages] = useState<string[]>(['', '', '']);
  const [activeEditImageSlot, setActiveEditImageSlot] = useState<number>(0);

  const setEditProdImageAt = (index: number, val: string) => {
    setEditProdImages(prev => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
  };

  const initiateEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setEditProdName(prod.name);
    setEditProdSku(prod.sku);
    setEditProdPrice(prod.price);
    setEditProdCategory(prod.category);
    setEditProdStock(prod.stockLevel as any);
    setEditProdSizes(prod.tvSizes || '');
    setEditProdMaxLoad(prod.maxLoad || 0);
    setEditProdBtu(prod.btu || '');
    setEditProdDescription(prod.description || '');
    setEditProdMaterial(prod.material || '');

    if (prod.images && prod.images.length > 0) {
      setEditProdImages([
        prod.images[0] || prod.image || '',
        prod.images[1] || '',
        prod.images[2] || ''
      ]);
    } else {
      setEditProdImages([
        prod.image || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDAP_Hywg0z1xV-NVCc_OM_E5YeujMPk0L2DNlLp7axI3oMsHgCZF-gi1kUErfuRimptCHdHe5-2m7oMuSQVWl89mPKqJwyEJebOlKoAlU9Mlt0T99O7JbkEg-W2yMVsmZprewJ6ZN7ZiMPjn-FGsYTfVcflAn5pNUW0t9AEIjRI6h94syj-RAWVE71JMHY3DMi6d-bLeM-U_s2SsZ3N4qbja8tKY3Nr1HJ2fZmzTJOEBqtvqfy6S147PXL5nXYBnq3Rlxb8EeB6L1w',
        '',
        ''
      ]);
    }
    setActiveEditImageSlot(0);
  };

  const handleEditProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    if (!editProdName || !editProdSku || editProdPrice <= 0) {
      alert('Por favor, ingresa un nombre, SKU válido y precio mayor a 0 Bs.');
      return;
    }

    const image1 = editProdImages[0] || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDAP_Hywg0z1xV-NVCc_OM_E5YeujMPk0L2DNlLp7axI3oMsHgCZF-gi1kUErfuRimptCHdHe5-2m7oMuSQVWl89mPKqJwyEJebOlKoAlU9Mlt0T99O7JbkEg-W2yMVsmZprewJ6ZN7ZiMPjn-FGsYTfVcflAn5pNUW0t9AEIjRI6h94syj-RAWVE71JMHY3DMi6d-bLeM-U_s2SsZ3N4qbja8tKY3Nr1HJ2fZmzTJOEBqtvqfy6S147PXL5nXYBnq3Rlxb8EeB6L1w';
    const image2 = editProdImages[1] || '';
    const image3 = editProdImages[2] || '';

    const updatedProduct: Product = {
      ...editingProduct,
      name: editProdName,
      sku: editProdSku,
      price: editProdPrice,
      category: editProdCategory,
      stockLevel: editProdStock as any,
      tvSizes: editProdSizes,
      maxLoad: Number(editProdMaxLoad) || 0,
      image: image1,
      images: [image1, image2, image3].filter(Boolean),
      btu: editProdBtu ? Number(editProdBtu) : undefined,
      description: editProdDescription,
      material: editProdMaterial
    };

    onUpdateProduct(updatedProduct);
    alert('Soporte/Producto de venta modificado con éxito en el catálogo.');
    setEditingProduct(null);
  };

  const handleRegisterAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminRegName.trim()) {
      alert('Por favor, ingresa el nombre del nuevo administrador.');
      return;
    }
    if (!adminRegEmail.trim()) {
      alert('Por favor, ingresa el correo corporativo del administrador.');
      return;
    }
    if (!adminRegPin.trim() || adminRegPin.length < 4) {
      alert('Por favor, ingresa un PIN de seguridad de al menos 4 dígitos.');
      return;
    }

    const newAdmin: UserRecord = {
      id: `admin-${Date.now()}`,
      name: adminRegName,
      role: 'Admin',
      lastAccess: 'Hoy, Acceso Concedido',
      status: 'Activo'
    };

    setUsersList(prev => [...prev, newAdmin]);
    addAuditLog(
      'Creación',
      `REGISTRO CORPORATIVO DE SEGURIDAD: Se registró al Administrador General "${adminRegName}" (${adminRegEmail}) con Acceso Total al panel de registros en el departamento de "${adminRegDept}". PIN asignado.`,
      'Carlos Mendoza (Mánager)'
    );

    alert(`¡Administrador ${adminRegName} registrado con éxito en la base de datos de Torre Forte!\n\nSe ha habilitado acceso total e inalterable al panel de registros y base de datos.`);

    // Reset fields
    setAdminRegName('');
    setAdminRegEmail('');
    setAdminRegPassword('');
    setAdminRegPin('');
    setAdminRegDept('Gerencia General');
    setIsAdminRegisterOpen(false);
  };

  interface AuditLogRecord {
    id: string;
    time: string;
    type: 'Modificación' | 'Creación' | 'Eliminación' | 'Sincronización';
    description: string;
    user: string;
  }

  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([
    { id: 'log-1', time: 'HOY • 10:23 AM', type: 'Modificación', description: 'Actualización de precio en "Soporte TV 65"', user: 'A. Silva' },
    { id: 'log-2', time: 'HOY • 09:15 AM', type: 'Creación', description: 'Nueva cotización #COT-4492 generada', user: 'C. Mendoza' },
    { id: 'log-3', time: 'AYER • 16:45 PM', type: 'Eliminación', description: 'Registro de inventario INV-882 de forma irreversible', user: 'C. Mendoza' },
    { id: 'log-4', time: 'AYER • 11:30 AM', type: 'Sincronización', description: 'Sincronización manual con Google Sheets completada', user: 'Sistema' }
  ]);

  const addAuditLog = (type: 'Modificación' | 'Creación' | 'Eliminación' | 'Sincronización', description: string, user: string = 'Carlos Mendoza') => {
    const now = new Date();
    const formattedTime = `HOY • ${now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase()}`;
    const newLog: AuditLogRecord = {
      id: `log-${Date.now()}`,
      time: formattedTime,
      type,
      description,
      user
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const handleUpdateSheetsIds = (e: React.FormEvent) => {
    e.preventDefault();
    addAuditLog('Modificación', `ID de Google Sheets actualizados: Ventas y Cotizaciones a "${sheetsSalesId}"`, 'Carlos Mendoza');
    alert('Google Sheets IDs de Sincronización actualizados correctamente.');
  };

  const handleFirebaseSync = () => {
    setIsFirebaseSyncing(true);
    setTimeout(() => {
      setIsFirebaseSyncing(false);
      setFirebaseOpsToday(prev => prev + 1);
      setFirebaseLastSync('Hace unos segundos');
      addAuditLog('Sincronización', 'Sincronización manual forzada con la base de datos de Firebase', 'Sistema');
      alert('Sincronización forzada con Firebase finalizada con éxito.');
    }, 1200);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim()) {
      alert('Por favor, ingresa el nombre del nuevo usuario.');
      return;
    }
    const newUser: UserRecord = {
      id: `user-${Date.now()}`,
      name: newUserName,
      role: newUserRole,
      lastAccess: 'Sin accesos aún',
      status: 'Activo'
    };
    setUsersList(prev => [...prev, newUser]);
    addAuditLog('Creación', `Nuevo usuario registrado: "${newUserName}" con rol "${newUserRole}"`, 'Carlos Mendoza');
    setNewUserName('');
    alert(`Usuario ${newUserName} registrado de forma segura.`);
  };

  const handleToggleUserStatus = (userId: string, newStatus: 'Activo' | 'Offline' | 'Suspendido') => {
    const u = usersList.find(usr => usr.id === userId);
    if (!u) return;
    setUsersList(prev => prev.map(usr => usr.id === userId ? { ...usr, status: newStatus } : usr));
    addAuditLog('Modificación', `Estado del usuario "${u.name}" cambiado a "${newStatus}"`, 'Carlos Mendoza');
  };

  const handleDeleteUser = (userId: string) => {
    const u = usersList.find(usr => usr.id === userId);
    if (!u) return;
    setUsersList(prev => prev.filter(usr => usr.id !== userId));
    addAuditLog('Eliminación', `Usuario "${u.name}" removido de la plataforma`, 'Carlos Mendoza');
  };

  const handleStartEditUser = (usr: UserRecord) => {
    setEditingUserId(usr.id);
    setEditUserName(usr.name);
    setEditUserRole(usr.role);
    setEditUserStatus(usr.status);
  };

  const handleUpdateUser = (e: React.FormEvent) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    if (!editingUserId) return;
    const u = usersList.find(usr => usr.id === editingUserId);
    if (!u) return;
    if (!editUserName.trim()) {
      return;
    }
    setUsersList(prev => prev.map(usr => usr.id === editingUserId ? { ...usr, name: editUserName, role: editUserRole, status: editUserStatus } : usr));
    addAuditLog('Modificación', `Usuario "${u.name}" actualizado a "${editUserName}" con rol "${editUserRole}" y estado "${editUserStatus}"`, 'Carlos Mendoza');
    setEditingUserId(null);
    setEditUserName('');
  };

  const handleCloseExpenseModal = () => {
    setEditingExpenseId(null);
    setExpFormDate('');
    setExpFormCategory('Materia Prima');
    setExpFormDescription('');
    setExpFormAmount('');
    setExpOperator('Carlos Mendoza');
    setIsExpenseModalOpen(false);
  };

  const handleStartEditExpense = (exp: ExpenseRecord) => {
    setEditingExpenseId(exp.id);
    setExpFormDate(exp.date);
    setExpFormCategory(exp.category);
    setExpFormDescription(exp.description);
    setExpFormAmount(String(exp.amount));
    setExpOperator(exp.operator || 'Carlos Mendoza');
    setIsExpenseModalOpen(true);
  };

  const handleUpdateExpense = (e: React.FormEvent) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    if (!editingExpenseId) return;
    const exp = expenseRecords.find(item => item.id === editingExpenseId);
    if (!exp) return;
    if (!expFormDescription.trim()) {
      alert('Por favor, ingresa el concepto del gasto.');
      return;
    }
    const amountVal = parseFloat(expFormAmount);
    if (isNaN(amountVal) || amountVal <= 0) {
      alert('Por favor, ingresa un monto válido.');
      return;
    }
    setExpenseRecords(prev => prev.map(item => item.id === editingExpenseId ? {
      ...item,
      date: expFormDate || new Date().toISOString().split('T')[0],
      operator: expOperator,
      category: expFormCategory,
      description: expFormDescription,
      amount: amountVal
    } : item));
    addAuditLog('Modificación', `Gasto modificado: "${exp.description}" (Bs. ${exp.amount}) -> "${expFormDescription}" (Bs. ${amountVal})`, expOperator);
    
    // Reset Form
    handleCloseExpenseModal();
    alert('Gasto actualizado de manera exitosa.');
  };

  // 1. Calculations for Business Analytics Metrics Cards
  const totalInvoicedQuotes = quotes.filter(q => q.status === 'Completado' || q.status === 'Asignado');
  const projectedEarnings = quotes.reduce((acc, q) => {
    const qValue = q.items.reduce((val, i) => val + (i.product.price * i.quantity), 0);
    return acc + (qValue || 250); // Fallback base valuation for service-only quotes
  }, 0);
  
  const pendingQuotations = quotes.filter(q => q.status === 'Pendiente').length;
  const activeTechnicianCount = technicians.filter(t => t.status === 'En Ruta').length;

  // Dynamic financial totals calculation matching the uploaded HTML metrics
  const totalPaidRevenue = financialRecords
    .filter(r => r.type === 'sale' && r.status === 'Paid')
    .reduce((acc, r) => acc + r.amount, 0);

  const activeQuoteValueAll = financialRecords
    .filter(r => r.type === 'quote')
    .reduce((acc, r) => acc + r.amount, 0);

  const displayedYtdRevenue = 993225 + totalPaidRevenue;
  const displayedActiveQuotesCount = 24 + financialRecords.filter(r => r.type === 'quote').length;
  const displayedActiveQuotesValue = 264860 + activeQuoteValueAll;

  const handleOpenQuoteDetails = (quote: Quote) => {
    setSelectedQuote(quote);
    setStatusDraft(quote.status);
    setTechDraft(quote.assignedTechnician || '');
    setNotesDraft(quote.technicianNotes || '');
    
    // Auto-generate high-quality preset message
    const totalVal = quote.items && quote.items.length > 0
      ? quote.items.reduce((a, b) => a + (b.product.price * b.quantity), 0)
      : 250;
    
    const itemsList = quote.items && quote.items.length > 0 
      ? quote.items.map(i => `- ${i.product.name}${i.product.sku ? ` (${i.product.sku})` : ''} x${i.quantity} (Costo: Bs. ${i.product.price * i.quantity})`).join('\n')
      : '- Evaluación y asesoramiento técnico de instalación estructural.';

    const initialMsg = `Estimado(a) ${quote.fullName},\n\nLe saludamos cordialmente de parte de TORRE FORTE Soportes & Climatización.\n\nHemos registrado correctamente su solicitud de presupuesto con código de seguimiento ${quote.id}.\n\nDetalles de su Requerimiento:\nTipo de servicio: ${quote.serviceType}\n${itemsList}\nCosto Total: Bs. ${totalVal}\n\nQuedamos atentos a sus comentarios para coordinar los próximos pasos.\n\nAtentamente,\nTorre Forte Soportes & Climatización`;
    
    setAiDraftOutput(initialMsg);
  };

  const handleSaveQuoteChanges = () => {
    if (selectedQuote) {
      onUpdateQuoteStatus(selectedQuote.id, statusDraft, notesDraft, techDraft);
      // Update selected quote view immediately
      setSelectedQuote({
        ...selectedQuote,
        status: statusDraft,
        assignedTechnician: techDraft,
        technicianNotes: notesDraft
      });
      alert(`La cotización ${selectedQuote.id} ha sido actualizada con éxito.`);
    }
  };

  // Simulating professional Gemini AI response formulation
  const handleGenerateAiResponse = () => {
    if (!selectedQuote) return;
    setAiGenerating(true);
    
    setTimeout(() => {
      const itemsList = selectedQuote.items.length > 0 
        ? selectedQuote.items.map(i => `- ${i.product.name} (SKU: ${i.product.sku}) x${i.quantity} (Costo: Bs. ${i.product.price * i.quantity})`).join('\n')
        : '- Inspección física y evaluación técnica de anclajes / ambiente HVAC en sitio.';

      const totalVal = selectedQuote.items.length > 0
        ? selectedQuote.items.reduce((a, b) => a + (b.product.price * b.quantity), 0)
        : 250; // default service fee

      const techAssigned = techDraft || 'Uno de nuestros ingenieros con equipamiento';

      const output = `Estimado(a) *${selectedQuote.fullName}*,\n\nLe saludamos cordialmente de parte del departamento de ingeniería civil y de climatización de *TORRE FORTE Soportes & Climatización*.\n\nHemos registrado correctamente su solicitud de presupuesto con código de seguimiento *${selectedQuote.id}*.\n\n*Detalles de su Requerimiento:*\nTipo de servicio: ${selectedQuote.serviceType}\n${itemsList}\nCosto de Equipamiento: *Bs. ${totalVal}*\n\n*Próximos Pasos & Coordinación de Instalación:*\nHemos pre-asignado a nuestro operador certificado: *${techAssigned}* para realizar la visita técnica e instalación.\n\nPor favor, confírmenos si se encuentra disponible para recibir al equipo técnico el día de mañana en los horarios de atención de 08:30 a 12:00. Adicionalmente, le recordamos que incluimos pernos expandidores de alta seguridad libres de cargo.\n\nQuedamos atentos a su confirmación por este medio o al +591 700-12345.\n\nAtentamente,\n*Dpto de Operaciones de Torre Forte*`;
      
      setAiDraftOutput(output);
      setAiGenerating(false);
    }, 1200);
  };

  const copyAiText = () => {
    if (aiDraftOutput) {
      navigator.clipboard.writeText(aiDraftOutput);
      alert('Respuesta redactada copiada al portapapeles. Listo para enviar por WhatsApp corporativo.');
    }
  };

  const handleSendWhatsAppDirect = () => {
    if (!selectedQuote) return;
    const cleanedPhone = selectedQuote.phone.replace(/\D/g, '');
    const phoneWithCountry = cleanedPhone.length === 8 ? '591' + cleanedPhone : cleanedPhone;
    const url = `https://api.whatsapp.com/send?phone=${phoneWithCountry}&text=${encodeURIComponent(aiDraftOutput)}`;
    window.open(url, '_blank');
  };

  const handleSendEmailDirect = () => {
    if (!selectedQuote) return;
    const subject = `Respuesta solicitud de presupuesto Torre Forte - ${selectedQuote.id}`;
    const url = `mailto:${selectedQuote.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(aiDraftOutput)}`;
    window.open(url, '_blank');
  };

  const handleAddProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName || !newProdSku || newProdPrice <= 0) {
      alert('Por favor, ingresa un nombre, SKU válido y precio mayor a 0 Bs.');
      return;
    }

    const image1 = newProdImages[0] || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDAP_Hywg0z1xV-NVCc_OM_E5YeujMPk0L2DNlLp7axI3oMsHgCZF-gi1kUErfuRimptCHdHe5-2m7oMuSQVWl89mPKqJwyEJebOlKoAlU9Mlt0T99O7JbkEg-W2yMVsmZprewJ6ZN7ZiMPjn-FGsYTfVcflAn5pNUW0t9AEIjRI6h94syj-RAWVE71JMHY3DMi6d-bLeM-U_s2SsZ3N4qbja8tKY3Nr1HJ2fZmzTJOEBqtvqfy6S147PXL5nXYBnq3Rlxb8EeB6L1w';
    const image2 = newProdImages[1] || '';
    const image3 = newProdImages[2] || '';

    const draftDesc = newProdDescription.trim() || (
      newProdCategory === 'climatizacion'
        ? `Unidad de aire acondicionado / climatización eficiente con potencia certificada.`
        : newProdCategory === 'proyectos estruct'
        ? `Servicio/Proyecto estructural e instalación a medida de alta gama.`
        : `Soporte fabricado con acero al carbono para resistencia extrema en entornos residenciales o corporativos.`
    );

    const draftMat = newProdMaterial.trim() || (
      newProdCategory === 'climatizacion' 
        ? 'Compresor inverter de alta eficiencia y bajo consumo energético.' 
        : 'Acero de alta resistencia reforzado con pintura electrostática anti-corrosión.'
    );

    const newProd: Product = {
      id: `prod-${Date.now()}`,
      sku: newProdSku.toUpperCase(),
      name: newProdName,
      description: draftDesc,
      price: newProdPrice,
      image: image1,
      images: [image1, image2, image3].filter(Boolean),
      category: newProdCategory,
      stockLevel: newProdStock,
      maxLoad: newProdMaxLoad,
      tvSizes: newProdCategory === 'climatizacion' ? 'N/A' : newProdSizes,
      material: draftMat,
      ...(newProdBtu ? { btu: Number(newProdBtu) } : {})
    };

    onAddProduct(newProd);
    
    // reset form
    setNewProdName('');
    setNewProdSku('');
    setNewProdPrice(0);
    setNewProdCategory('articulado');
    setNewProdStock('In Stock');
    setNewProdImages([
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDAP_Hywg0z1xV-NVCc_OM_E5YeujMPk0L2DNlLp7axI3oMsHgCZF-gi1kUErfuRimptCHdHe5-2m7oMuSQVWl89mPKqJwyEJebOlKoAlU9Mlt0T99O7JbkEg-W2yMVsmZprewJ6ZN7ZiMPjn-FGsYTfVcflAn5pNUW0t9AEIjRI6h94syj-RAWVE71JMHY3DMi6d-bLeM-U_s2SsZ3N4qbja8tKY3Nr1HJ2fZmzTJOEBqtvqfy6S147PXL5nXYBnq3Rlxb8EeB6L1w',
      '',
      ''
    ]);
    setActiveImageSlot(0);
    setNewImageSource('preset');
    setNewProdBtu('');
    setNewProdDescription('');
    setNewProdMaterial('');
    alert('Soporte añadido con éxito al catálogo de la página principal.');
  };

  const handleTechSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTechName || !newTechSpecialty) {
      alert('Por favor ingresa nombre y especialidad técnica.');
      return;
    }

    const tech: Technician = {
      id: `tech-${Date.now()}`,
      name: newTechName,
      specialty: newTechSpecialty,
      phone: newTechPhone || '+591 700-00000',
      status: 'Disponible'
    };

    onAddTechnician(tech);
    setNewTechName('');
    setNewTechSpecialty('');
    setNewTechPhone('');
    alert('Operador Técnico registrado con éxito.');
  };

  // Dynamic filter for financial records used both for loops and dynamic totals calculation
  const filteredFinancialRecords = financialRecords.filter(rec => {
    // 1. Search Query Match
    const clientMatch = (rec.client || '').toLowerCase().includes(searchFilter.toLowerCase());
    const itemMatch = (rec.item || '').toLowerCase().includes(searchFilter.toLowerCase());
    const notesMatch = (rec.notes || '').toLowerCase().includes(searchFilter.toLowerCase());
    const matchSearch = clientMatch || itemMatch || notesMatch;
    
    // 2. Type Match: Only sales are shown in this financial panel (quotes are in their own tab)
    const matchType = rec.type === 'sale';
    
    // 3. User / Operator Match
    const matchOperator = operatorFilter === 'all' ? true : (rec.operator === operatorFilter);
    
    // 4. Time Period Match
    let matchTime = true;
    const recDateObj = new Date(rec.date);
    if (!isNaN(recDateObj.getTime())) {
      const recYear = recDateObj.getFullYear();
      const recMonth = recDateObj.getMonth();
      
      if (timePeriodFilter === 'year') {
        matchTime = recYear === selectedYear;
      } else if (timePeriodFilter === 'month') {
        matchTime = (recYear === selectedYear) && (recMonth === selectedMonth);
      } else if (timePeriodFilter === 'week') {
        const recStart = new Date(recDateObj);
        recStart.setDate(recDateObj.getDate() - recDateObj.getDay());
        const recStartStr = recStart.toISOString().split('T')[0];
        matchTime = selectedWeekStart === 'all' ? true : recStartStr === selectedWeekStart;
      } else if (timePeriodFilter === 'last_week') {
        // Default filter: records belonging to the last week registered
        const dates = financialRecords.map(r => new Date(r.date).getTime()).filter(t => !isNaN(t));
        if (dates.length > 0) {
          const maxDateTime = Math.max(...dates);
          const limitTime = maxDateTime - 7 * 24 * 60 * 60 * 1000;
          const recTime = recDateObj.getTime();
          matchTime = recTime >= limitTime && recTime <= maxDateTime;
        }
      }
    }
    
    return matchSearch && matchType && matchOperator && matchTime;
  });

  // Dynamic Sum Totals
  const totalFinancialAmount = filteredFinancialRecords.reduce((sum, rec) => sum + rec.amount, 0);
  const totalFinancialCapital = filteredFinancialRecords.reduce((sum, rec) => {
    const capitalVal = rec.capital !== undefined ? rec.capital : (rec.amount * 0.6);
    return sum + capitalVal;
  }, 0);
  const totalFinancialProfit = filteredFinancialRecords.reduce((sum, rec) => {
    const profitVal = rec.profit !== undefined ? rec.profit : (rec.amount * 0.4);
    return sum + profitVal;
  }, 0);

  // Dynamic filter for expenses (Gastos)
  const filteredExpenseRecords = expenseRecords.filter(exp => {
    // 1. Search filter: description, category, or registered operator
    const searchLower = expSearchFilter.toLowerCase();
    const descMatch = (exp.description || '').toLowerCase().includes(searchLower);
    const catMatch = (exp.category || '').toLowerCase().includes(searchLower);
    const opMatch = (exp.operator || 'Carlos Mendoza').toLowerCase().includes(searchLower);
    const matchSearch = descMatch || catMatch || opMatch;

    // 2. Category Match
    const matchCategory = expCategoryFilter === 'all' ? true : (exp.category === expCategoryFilter);

    // 3. User / Operator Match
    const matchOperator = expOperatorFilter === 'all' ? true : ((exp.operator || 'Carlos Mendoza') === expOperatorFilter);

    // 4. Time Period Match
    let matchTime = true;
    const recDateObj = new Date(exp.date);
    if (!isNaN(recDateObj.getTime())) {
      const recYear = recDateObj.getFullYear();
      const recMonth = recDateObj.getMonth();
      
      if (expTimePeriodFilter === 'year') {
        matchTime = recYear === expSelectedYear;
      } else if (expTimePeriodFilter === 'month') {
        matchTime = (recYear === expSelectedYear) && (recMonth === expSelectedMonth);
      } else if (expTimePeriodFilter === 'week') {
        const recStart = new Date(recDateObj);
        recStart.setDate(recDateObj.getDate() - recDateObj.getDay());
        const recStartStr = recStart.toISOString().split('T')[0];
        matchTime = expSelectedWeekStart === 'all' ? true : recStartStr === expSelectedWeekStart;
      } else if (expTimePeriodFilter === 'last_week') {
        const dates = expenseRecords.map(r => new Date(r.date).getTime()).filter(t => !isNaN(t));
        if (dates.length > 0) {
          const maxDateTime = Math.max(...dates);
          const limitTime = maxDateTime - 7 * 24 * 60 * 60 * 1000;
          const recTime = recDateObj.getTime();
          matchTime = recTime >= limitTime && recTime <= maxDateTime;
        }
      }
    }
    return matchSearch && matchCategory && matchOperator && matchTime;
  });

  const totalExpenseAmount = filteredExpenseRecords.reduce((sum, exp) => sum + exp.amount, 0);

  // Dynamic filter for capital investments (Inversiones de Capital)
  const filteredCapitalInvestments = capitalInvestments.filter(inv => {
    // 1. Search Query Match
    const searchLower = capSearchFilter.toLowerCase();
    const nameMatch = (inv.name || '').toLowerCase().includes(searchLower);
    const typeMatchStr = (inv.type || '').toLowerCase().includes(searchLower);
    const opMatch = (inv.operator || 'Carlos Mendoza').toLowerCase().includes(searchLower);
    const matchSearch = nameMatch || typeMatchStr || opMatch;

    // 2. Type Match
    const matchType = capTypeFilter === 'all' ? true : (inv.type === capTypeFilter);

    // 3. User / Operator Match
    const matchOperator = capOperatorFilter === 'all' ? true : ((inv.operator || 'Carlos Mendoza') === capOperatorFilter);

    // 4. Time Match
    let matchTime = true;
    const recDateObj = new Date(inv.date);
    if (!isNaN(recDateObj.getTime())) {
      const recYear = recDateObj.getFullYear();
      const recMonth = recDateObj.getMonth();
      
      if (capTimePeriodFilter === 'year') {
        matchTime = recYear === capSelectedYear;
      } else if (capTimePeriodFilter === 'month') {
        matchTime = (recYear === capSelectedYear) && (recMonth === capSelectedMonth);
      } else if (capTimePeriodFilter === 'week') {
        const recStart = new Date(recDateObj);
        recStart.setDate(recDateObj.getDate() - recDateObj.getDay());
        const recStartStr = recStart.toISOString().split('T')[0];
        matchTime = capSelectedWeekStart === 'all' ? true : recStartStr === capSelectedWeekStart;
      } else if (capTimePeriodFilter === 'last_week') {
        const dates = capitalInvestments.map(r => new Date(r.date).getTime()).filter(t => !isNaN(t));
        if (dates.length > 0) {
          const maxDateTime = Math.max(...dates);
          const limitTime = maxDateTime - 7 * 24 * 60 * 60 * 1000;
          const recTime = recDateObj.getTime();
          matchTime = recTime >= limitTime && recTime <= maxDateTime;
        }
      }
    }
    return matchSearch && matchType && matchOperator && matchTime;
  });

  const totalCapitalInitialCost = filteredCapitalInvestments.reduce((sum, inv) => sum + inv.initialCost, 0);
  const totalCapitalRecovered = filteredCapitalInvestments.reduce((sum, inv) => sum + inv.recovered, 0);
  const totalCapitalRemanente = filteredCapitalInvestments.reduce((sum, inv) => sum + (inv.initialCost - inv.recovered), 0);

  return (
    <div className="max-w-[1820px] mx-auto px-2 md:px-8 py-4 md:py-8 animate-fade-in text-sm relative">
      
      {/* Floating Dynamic Success Toast */}
      {showSaveToast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold px-5 py-4 rounded-xl shadow-2xl border border-emerald-400/30 animate-fade-in transition-all">
          <div className="bg-white/20 p-1.5 rounded-lg">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold uppercase tracking-wide">¡Guardado con éxito!</span>
            <span className="text-[13px] text-emerald-50 text-light mt-0.5">Los cambios se aplicaron instantáneamente.</span>
          </div>
        </div>
      )}
      <div className="lg:hidden flex flex-col gap-0.5 bg-transparent mb-0.5 select-none touch-pan-x">
        {/* Horizontal scroll ribbon prioritizing icons with circular chips and badges */}
        <div className="flex flex-nowrap gap-2 overflow-x-auto pb-1 pt-0.5 px-0.5 snap-x touch-pan-x">
          
          {/* Metric Selector */}
          <button 
            onClick={() => setActiveTab('metrics')}
            className="flex flex-col items-center gap-0.5 shrink-0 snap-start active:scale-95 transition-transform focus:outline-none"
          >
            <div className={`w-9 h-9 rounded-full flex items-center justify-center relative transition-all duration-300 ${
              activeTab === 'metrics' 
                ? 'bg-[#C67C3E] text-white shadow-md shadow-[#C67C3E]/20 ring-2 ring-offset-2 ring-offset-white ring-[#C67C3E]' 
                : 'bg-slate-100 text-slate-500 border border-slate-200'
            }`}>
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className={`text-[8px] tracking-wide font-bold uppercase text-center w-12 truncate ${
              activeTab === 'metrics' ? 'text-[#C67C3E]' : 'text-slate-500'
            }`}>
              Métricas
            </span>
          </button>

          {/* Ventas Selector */}
          <button 
            onClick={() => setActiveTab('ventas')}
            className="flex flex-col items-center gap-0.5 shrink-0 snap-start active:scale-95 transition-transform focus:outline-none"
          >
            <div className={`w-9 h-9 rounded-full flex items-center justify-center relative transition-all duration-300 ${
              activeTab === 'ventas' 
                ? 'bg-[#C67C3E] text-white shadow-md shadow-[#C67C3E]/20 ring-2 ring-offset-2 ring-offset-white ring-[#C67C3E]' 
                : 'bg-slate-100 text-slate-500 border border-slate-200'
            }`}>
              <DollarSign className="w-5 h-5" />
            </div>
            <span className={`text-[8px] tracking-wide font-bold uppercase text-center w-12 truncate ${
              activeTab === 'ventas' ? 'text-[#C67C3E]' : 'text-slate-500'
            }`}>
              Ventas
            </span>
          </button>

          {/* Capital Selector */}
          <button 
            onClick={() => setActiveTab('capital')}
            className="flex flex-col items-center gap-0.5 shrink-0 snap-start active:scale-95 transition-transform focus:outline-none"
          >
            <div className={`w-9 h-9 rounded-full flex items-center justify-center relative transition-all duration-300 ${
              activeTab === 'capital' 
                ? 'bg-[#C67C3E] text-white shadow-md shadow-[#C67C3E]/20 ring-2 ring-offset-2 ring-offset-white ring-[#C67C3E]' 
                : 'bg-slate-100 text-slate-500 border border-slate-200'
            }`}>
              <TrendingUp className="w-5 h-5 rotate-45" />
            </div>
            <span className={`text-[8px] tracking-wide font-bold uppercase text-center w-12 truncate ${
              activeTab === 'capital' ? 'text-[#C67C3E]' : 'text-slate-500'
            }`}>
              Capital
            </span>
          </button>

          {/* Gastos Selector */}
          <button 
            onClick={() => setActiveTab('expenses')}
            className="flex flex-col items-center gap-0.5 shrink-0 snap-start active:scale-95 transition-transform focus:outline-none"
          >
            <div className={`w-9 h-9 rounded-full flex items-center justify-center relative transition-all duration-300 ${
              activeTab === 'expenses' 
                ? 'bg-[#C67C3E] text-white shadow-md shadow-[#C67C3E]/20 ring-2 ring-offset-2 ring-offset-white ring-[#C67C3E]' 
                : 'bg-slate-100 text-slate-500 border border-slate-200'
            }`}>
              <Plus className="w-5 h-5" />
            </div>
            <span className={`text-[8px] tracking-wide font-bold uppercase text-center w-12 truncate ${
              activeTab === 'expenses' ? 'text-[#C67C3E]' : 'text-slate-500'
            }`}>
              Gastos
            </span>
          </button>

          {/* Quotes Selector with badge */}
          <button 
            onClick={() => setActiveTab('quotes')}
            className="flex flex-col items-center gap-0.5 shrink-0 snap-start active:scale-95 transition-transform focus:outline-none"
          >
            <div className={`w-9 h-9 rounded-full flex items-center justify-center relative transition-all duration-300 ${
              activeTab === 'quotes' 
                ? 'bg-[#C67C3E] text-white shadow-md shadow-[#C67C3E]/20 ring-2 ring-offset-2 ring-offset-white ring-[#C67C3E]' 
                : 'bg-slate-100 text-slate-500 border border-slate-200'
            }`}>
              <FileText className="w-5 h-5" />
              {quotes.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white font-extrabold text-[7px] w-3.5 h-3.5 rounded-full flex items-center justify-center border border-white">
                  {quotes.length}
                </span>
              )}
            </div>
            <span className={`text-[8px] tracking-wide font-bold uppercase text-center w-12 truncate ${
              activeTab === 'quotes' ? 'text-[#C67C3E]' : 'text-slate-500'
            }`}>
              Cotizar
            </span>
          </button>

          {/* Inventory Selector with badge */}
          <button 
            onClick={() => setActiveTab('inventory')}
            className="flex flex-col items-center gap-0.5 shrink-0 snap-start active:scale-95 transition-transform focus:outline-none"
          >
            <div className={`w-9 h-9 rounded-full flex items-center justify-center relative transition-all duration-300 ${
              activeTab === 'inventory' 
                ? 'bg-[#C67C3E] text-white shadow-md shadow-[#C67C3E]/20 ring-2 ring-offset-2 ring-offset-white ring-[#C67C3E]' 
                : 'bg-slate-100 text-slate-500 border border-slate-200'
            }`}>
              <ShoppingBag className="w-5 h-5" />
              {products.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-amber-500 text-white font-extrabold text-[7px] w-3.5 h-3.5 rounded-full flex items-center justify-center border border-white">
                  {products.length}
                </span>
              )}
            </div>
            <span className={`text-[8px] tracking-wide font-bold uppercase text-center w-12 truncate ${
              activeTab === 'inventory' ? 'text-[#C67C3E]' : 'text-slate-500'
            }`}>
              Inven.
            </span>
          </button>

          {/* Calculator Selector */}
          <button 
            onClick={() => setActiveTab('calculator')}
            className="flex flex-col items-center gap-0.5 shrink-0 snap-start active:scale-95 transition-transform focus:outline-none"
          >
            <div className={`w-9 h-9 rounded-full flex items-center justify-center relative transition-all duration-300 ${
              activeTab === 'calculator' 
                ? 'bg-[#C67C3E] text-white shadow-md shadow-[#C67C3E]/20 ring-2 ring-offset-2 ring-offset-white ring-[#C67C3E]' 
                : 'bg-slate-100 text-slate-500 border border-slate-200'
            }`}>
              <HelpCircle className="w-5 h-5" />
            </div>
            <span className={`text-[8px] tracking-wide font-bold uppercase text-center w-12 truncate ${
              activeTab === 'calculator' ? 'text-[#C67C3E]' : 'text-slate-500'
            }`}>
              Cálculo
            </span>
          </button>

          {/* Users Selector */}
          <button 
            onClick={() => setActiveTab('techs')}
            className="flex flex-col items-center gap-0.5 shrink-0 snap-start active:scale-95 transition-transform focus:outline-none"
          >
            <div className={`w-9 h-9 rounded-full flex items-center justify-center relative transition-all duration-300 ${
              activeTab === 'techs' 
                ? 'bg-[#C67C3E] text-white shadow-md shadow-[#C67C3E]/20 ring-2 ring-offset-2 ring-offset-white ring-[#C67C3E]' 
                : 'bg-slate-100 text-slate-500 border border-slate-200'
            }`}>
              <Users className="w-5 h-5" />
            </div>
            <span className={`text-[8px] tracking-wide font-bold uppercase text-center w-12 truncate ${
              activeTab === 'techs' ? 'text-[#C67C3E]' : 'text-slate-500'
            }`}>
              Usuarios
            </span>
          </button>

          {/* Edición Inicio Selector */}
          <button 
            onClick={() => setActiveTab('edicion_inicio')}
            className="flex flex-col items-center gap-0.5 shrink-0 snap-start active:scale-95 transition-transform focus:outline-none"
          >
            <div className={`w-9 h-9 rounded-full flex items-center justify-center relative transition-all duration-300 ${
              activeTab === 'edicion_inicio' 
                ? 'bg-[#C67C3E] text-white shadow-md shadow-[#C67C3E]/20 ring-2 ring-offset-2 ring-offset-white ring-[#C67C3E]' 
                : 'bg-slate-100 text-slate-500 border border-slate-200'
            }`}>
              <Sparkles className="w-5 h-5" />
            </div>
            <span className={`text-[8px] tracking-wide font-bold uppercase text-center w-12 truncate ${
              activeTab === 'edicion_inicio' ? 'text-[#C67C3E]' : 'text-slate-500'
            }`}>
              Inicio
            </span>
          </button>

          {/* Settings Selector */}
          <button 
            onClick={() => setActiveTab('settings')}
            className="flex flex-col items-center gap-0.5 shrink-0 snap-start active:scale-95 transition-transform focus:outline-none"
          >
            <div className={`w-9 h-9 rounded-full flex items-center justify-center relative transition-all duration-300 ${
              activeTab === 'settings' 
                ? 'bg-[#C67C3E] text-white shadow-md shadow-[#C67C3E]/20 ring-2 ring-offset-2 ring-offset-white ring-[#C67C3E]' 
                : 'bg-slate-100 text-slate-500 border border-slate-200'
            }`}>
              <Building2 className="w-5 h-5" />
            </div>
            <span className={`text-[8px] tracking-wide font-bold uppercase text-center w-12 truncate ${
              activeTab === 'settings' ? 'text-[#C67C3E]' : 'text-slate-500'
            }`}>
              Ajustes
            </span>
          </button>

        </div>
      </div>
      
      {/* Main Grid Layout: Left Navigation Column & Right Active Content Column */}
      <div className="grid grid-cols-1 lg:grid-cols-[22.5%_1fr] gap-4 md:gap-8 items-start">
        
        {/* Left Column: Combined Header & Navigation */}
        <div className="hidden lg:flex flex-col gap-6 lg:sticky lg:top-4 w-full">
          
          {/* Header Container (aligned/inside the left column) */}
          <div className="px-2">
            <span className="text-[13px] font-mono font-bold tracking-widest text-[#C67C3E] uppercase block leading-tight">PANEL DE CONTROL CORPORATIVO</span>
            <h2 className="text-xl font-extrabold text-[#051125] tracking-tight mt-1 leading-snug">Operaciones Torre Forte</h2>
          </div>

          {/* Vertical Navigation Sidebar */}
          <div className="bg-[#051125] rounded-2xl p-4 border border-slate-700/30 shadow-xl select-none w-full">
          <span className="block text-[13px] font-bold text-slate-400 uppercase tracking-widest mb-4 px-2">MÓDULOS DEL PANEL</span>
          <div className="flex flex-col gap-1.5">
            
            {/* TABS 1: METRICAS */}
            <button 
              onClick={() => setActiveTab('metrics')}
              className={`group/tab relative py-3 px-4 font-black cursor-pointer transition-all duration-300 flex items-center gap-3 rounded-xl w-full text-left focus:outline-none ${
                activeTab === 'metrics' 
                  ? 'bg-white text-[#051125] shadow-lg font-black font-extrabold' 
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <TrendingUp className={`w-5 h-5 shrink-0 transition-colors ${activeTab === 'metrics' ? 'text-[#C67C3E]' : 'text-slate-400 group-hover/tab:text-slate-200'}`} />
              <span className="text-[14.3px] uppercase tracking-wider font-extrabold flex-grow">Métricas</span>
              {activeTab === 'metrics' && <div className="w-2 h-2 rounded-full bg-[#C67C3E] shrink-0"></div>}
            </button>

            {/* TABS 3: VENTAS */}
            <button 
              onClick={() => setActiveTab('ventas')}
              className={`group/tab relative py-3 px-4 font-black cursor-pointer transition-all duration-300 flex items-center gap-3 rounded-xl w-full text-left focus:outline-none ${
                activeTab === 'ventas' 
                  ? 'bg-white text-[#051125] shadow-lg font-black font-extrabold' 
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <DollarSign className={`w-5 h-5 shrink-0 transition-colors ${activeTab === 'ventas' ? 'text-[#C67C3E]' : 'text-slate-400 group-hover/tab:text-slate-200'}`} />
              <span className="text-[14.3px] uppercase tracking-wider font-extrabold flex-grow">Ventas & Finanzas</span>
              {activeTab === 'ventas' && <div className="w-2 h-2 rounded-full bg-[#C67C3E] shrink-0"></div>}
            </button>

            {/* TABS 7.5: INVERSIONES DE CAPITAL */}
            <button 
              onClick={() => setActiveTab('capital')}
              className={`group/tab relative py-3 px-4 font-black cursor-pointer transition-all duration-300 flex items-center gap-3 rounded-xl w-full text-left focus:outline-none ${
                activeTab === 'capital' 
                  ? 'bg-white text-[#051125] shadow-lg font-black font-extrabold' 
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <TrendingUp className={`w-5 h-5 shrink-0 transition-colors ${activeTab === 'capital' ? 'text-[#C67C3E]' : 'text-slate-400 group-hover/tab:text-slate-200'}`} />
              <span className="text-[14.3px] uppercase tracking-wider font-extrabold flex-grow">Inversiones de Capital</span>
              {activeTab === 'capital' && <div className="w-2 h-2 rounded-full bg-[#C67C3E] shrink-0"></div>}
            </button>

            {/* TABS 7: GASTOS */}
            <button 
              onClick={() => setActiveTab('expenses')}
              className={`group/tab relative py-3 px-4 font-black cursor-pointer transition-all duration-300 flex items-center gap-3 rounded-xl w-full text-left focus:outline-none ${
                activeTab === 'expenses' 
                  ? 'bg-white text-[#051125] shadow-lg font-black font-extrabold' 
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Plus className={`w-5 h-5 shrink-0 transition-colors ${activeTab === 'expenses' ? 'text-[#C67C3E]' : 'text-slate-400 group-hover/tab:text-slate-200'}`} />
              <span className="text-[14.3px] uppercase tracking-wider font-extrabold flex-grow">Gastos</span>
              {activeTab === 'expenses' && <div className="w-2 h-2 rounded-full bg-[#C67C3E] shrink-0"></div>}
            </button>

            {/* TABS 2: COTIZACIONES */}
            <button 
              onClick={() => setActiveTab('quotes')}
              className={`group/tab relative py-3 px-4 font-black cursor-pointer transition-all duration-300 flex items-center gap-3 rounded-xl w-full text-left focus:outline-none ${
                activeTab === 'quotes' 
                  ? 'bg-white text-[#051125] shadow-lg font-black font-extrabold' 
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <FileText className={`w-5 h-5 shrink-0 transition-colors ${activeTab === 'quotes' ? 'text-[#C67C3E]' : 'text-slate-400 group-hover/tab:text-slate-200'}`} />
              <span className="text-[14.3px] uppercase tracking-wider font-extrabold flex-grow">Cotizaciones</span>
              <span className={`text-[13px] px-2.5 py-0.5 rounded-full ${activeTab === 'quotes' ? 'bg-[#051125] text-white font-bold' : 'bg-white/10 text-slate-300'}`}>
                {quotes.length}
              </span>
              {activeTab === 'quotes' && <div className="w-2 h-2 rounded-full bg-[#C67C3E] shrink-0 ml-1"></div>}
            </button>

            {/* TABS 4: INVENTARIO */}
            <button 
              onClick={() => setActiveTab('inventory')}
              className={`group/tab relative py-3 px-4 font-black cursor-pointer transition-all duration-300 flex items-center gap-3 rounded-xl w-full text-left focus:outline-none ${
                activeTab === 'inventory' 
                  ? 'bg-white text-[#051125] shadow-lg font-black font-extrabold' 
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <ShoppingBag className={`w-5 h-5 shrink-0 transition-colors ${activeTab === 'inventory' ? 'text-[#C67C3E]' : 'text-slate-400 group-hover/tab:text-slate-200'}`} />
              <span className="text-[14.3px] uppercase tracking-wider font-extrabold flex-grow">Inventario</span>
              <span className={`text-[13px] px-2.5 py-0.5 rounded-full ${activeTab === 'inventory' ? 'bg-[#051125] text-white font-bold' : 'bg-white/10 text-slate-350'}`}>
                {products.length}
              </span>
              {activeTab === 'inventory' && <div className="w-2 h-2 rounded-full bg-[#C67C3E] shrink-0 ml-1"></div>}
            </button>

            {/* TABS 8: CALCULADORA */}
            <button 
              onClick={() => setActiveTab('calculator')}
              className={`group/tab relative py-3 px-4 font-black cursor-pointer transition-all duration-300 flex items-center gap-3 rounded-xl w-full text-left focus:outline-none ${
                activeTab === 'calculator' 
                  ? 'bg-white text-[#051125] shadow-lg font-black font-extrabold' 
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <HelpCircle className={`w-5 h-5 shrink-0 transition-colors ${activeTab === 'calculator' ? 'text-[#C67C3E]' : 'text-slate-400 group-hover/tab:text-slate-200'}`} />
              <span className="text-[14.3px] uppercase tracking-wider font-extrabold flex-grow">Calculadora de Costos</span>
              {activeTab === 'calculator' && <div className="w-2 h-2 rounded-full bg-[#C67C3E] shrink-0"></div>}
            </button>

            {/* TABS 5: GESTION DE USUARIOS (Reemplaza a Técnicos) */}
            <button 
              onClick={() => setActiveTab('techs')}
              className={`group/tab relative py-3 px-4 font-black cursor-pointer transition-all duration-300 flex items-center gap-3 rounded-xl w-full text-left focus:outline-none ${
                activeTab === 'techs' 
                  ? 'bg-white text-[#051125] shadow-lg font-black font-extrabold' 
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Users className={`w-5 h-5 shrink-0 transition-colors ${activeTab === 'techs' ? 'text-[#C67C3E]' : 'text-slate-400 group-hover/tab:text-slate-200'}`} />
              <span className="text-[14.3px] uppercase tracking-wider font-extrabold flex-grow">Gestión de Usuarios</span>
              {activeTab === 'techs' && <div className="w-2 h-2 rounded-full bg-[#C67C3E] shrink-0 ml-1"></div>}
            </button>

            {/* TABS 9: EDICION INICIO */}
            <button 
              onClick={() => setActiveTab('edicion_inicio')}
              className={`group/tab relative py-3 px-4 font-black cursor-pointer transition-all duration-300 flex items-center gap-3 rounded-xl w-full text-left focus:outline-none ${
                activeTab === 'edicion_inicio' 
                  ? 'bg-white text-[#051125] shadow-lg font-black font-extrabold' 
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Sparkles className={`w-5 h-5 shrink-0 transition-colors ${activeTab === 'edicion_inicio' ? 'text-[#C67C3E]' : 'text-slate-400 group-hover/tab:text-slate-200'}`} />
              <span className="text-[14.3px] uppercase tracking-wider font-extrabold flex-grow">Edición Inicio</span>
              {activeTab === 'edicion_inicio' && <div className="w-2 h-2 rounded-full bg-[#C67C3E] shrink-0"></div>}
            </button>

            {/* TABS 6: CONFIGURACION */}
            <button 
              onClick={() => setActiveTab('settings')}
              className={`group/tab relative py-3 px-4 font-black cursor-pointer transition-all duration-300 flex items-center gap-3 rounded-xl w-full text-left focus:outline-none ${
                activeTab === 'settings' 
                  ? 'bg-white text-[#051125] shadow-lg font-black font-extrabold' 
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Building2 className={`w-5 h-5 shrink-0 transition-colors ${activeTab === 'settings' ? 'text-[#C67C3E]' : 'text-slate-400 group-hover/tab:text-slate-200'}`} />
              <span className="text-[14.3px] uppercase tracking-wider font-extrabold flex-grow">Configuración</span>
              {activeTab === 'settings' && <div className="w-2 h-2 rounded-full bg-[#C67C3E] shrink-0"></div>}
            </button>

          </div>
        </div>
      </div>

      {/* Right Column: Active Tab Content */}
      <div className="space-y-6 min-w-0">

      {/* METRICS TAB VIEW */}
      {activeTab === 'metrics' && (
        <div className="space-y-8 animate-fade-in">

          {/* AI Statistical Agent (Gemini + code execution) */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#C67C3E]" />
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Asistente Estadístico IA (Gemini)</h3>
            </div>
            <p className="text-[13px] text-slate-500">
              Escribe libremente qué quieres analizar (ventas, cotizaciones, productos, técnicos...). El agente ejecuta código para calcular las cifras y devuelve los resultados en formato estructurado.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 my-2">
              <textarea
                value={statsPrompt}
                onChange={(e) => setStatsPrompt(e.target.value)}
                rows={3}
                placeholder="Ej. ¿Cuál es el ticket promedio de venta por mes y qué producto generó más ingresos?"
                className="flex-1 bg-orange-50/40 border-2 border-dashed border-[#C67C3E]/40 rounded-lg p-4 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#C67C3E] focus:bg-white focus:ring-2 focus:ring-[#C67C3E]/20 resize-none transition-colors"
              />
              <button
                onClick={handleRunStatsAgent}
                disabled={statsLoading || !statsPrompt.trim()}
                className="bg-[#051125] hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold px-5 py-2.5 rounded-lg cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap shrink-0 self-start sm:self-stretch"
              >
                {statsLoading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Analizando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Analizar con IA
                  </>
                )}
              </button>
            </div>

            {statsError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{statsError}</span>
              </div>
            )}

            {statsResult && (
              <div className="space-y-3 animate-fade-in">
                {statsResult.summary && (
                  <p className="text-xs text-slate-700 bg-[#C67C3E]/5 border border-[#C67C3E]/10 p-3 rounded-lg italic">
                    {statsResult.summary}
                  </p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {statsResult.results.map((r, idx) => (
                    <div key={idx} className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block font-mono">{r.variable}</span>
                      <span className="text-xs text-slate-600 block mt-0.5">{r.label}</span>
                      <span className="text-base font-bold text-[#051125] font-mono block mt-1">{String(r.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Summary metrics row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Projected Earnings */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="bg-emerald-50 text-emerald-600 p-3 rounded-lg">
                <DollarSign className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <span className="text-[13px] text-slate-400 font-bold uppercase tracking-wider block">Cartera en Cotización</span>
                <span className="text-xl font-bold font-mono text-slate-800 tracking-tight block">Bs. {projectedEarnings}</span>
              </div>
            </div>

            {/* Active Quotes */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="bg-amber-50 text-amber-600 p-3 rounded-lg">
                <Clock className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <span className="text-[13px] text-slate-400 font-bold uppercase tracking-wider block">Pendientes de Aprobación</span>
                <span className="text-xl font-bold font-mono text-slate-800 tracking-tight block">{pendingQuotations} Cotizaciones</span>
              </div>
            </div>

            {/* Active Techs */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="bg-sky-50 text-sky-600 p-3 rounded-lg">
                <Users className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <span className="text-[13px] text-slate-400 font-bold uppercase tracking-wider block">Técnicos Despachados</span>
                <span className="text-xl font-bold font-mono text-slate-800 tracking-tight block">{activeTechnicianCount} Activos</span>
              </div>
            </div>

            {/* Soportes Cant */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="bg-[#C67C3E]/10 text-[#C67C3E] p-3 rounded-lg">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <span className="text-[13px] text-slate-400 font-bold uppercase tracking-wider block">Modelos Disponibles</span>
                <span className="text-xl font-bold font-mono text-slate-800 tracking-tight block">{products.length} Diseños de Metal</span>
              </div>
            </div>

          </div>

          {/* SVG CHARTS PANEL SECTION */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Income Projections Bar Chart */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">Prospección Mensual de Ventas e Instalaciones</h3>
              <div className="flex justify-center py-4">
                <svg className="w-full h-48" viewBox="0 0 400 160">
                  {/* Grid lines */}
                  <line x1="40" y1="20" x2="380" y2="20" stroke="#F1F5F9" strokeWidth="1" />
                  <line x1="40" y1="60" x2="380" y2="60" stroke="#F1F5F9" strokeWidth="1" />
                  <line x1="40" y1="100" x2="380" y2="100" stroke="#F1F5F9" strokeWidth="1" />
                  <line x1="40" y1="140" x2="380" y2="140" stroke="#E2E8F0" strokeWidth="1" />

                  {/* Y Axis markings */}
                  <text x="10" y="24" fill="#94A3B8" fontSize="8" fontFamily="sans-serif">Bs. 30K</text>
                  <text x="10" y="64" fill="#94A3B8" fontSize="8" fontFamily="sans-serif">Bs. 15K</text>
                  <text x="10" y="104" fill="#94A3B8" fontSize="8" fontFamily="sans-serif">Bs. 5K</text>
                  <text x="15" y="144" fill="#94A3B8" fontSize="8" fontFamily="sans-serif">0</text>

                  {/* Bars */}
                  {/* Ene */}
                  <rect x="70" y="60" width="22" height="80" rx="3" fill="#1B263B" />
                  <text x="72" y="152" fill="#64748B" fontSize="8" fontFamily="sans-serif">Marzo</text>
                  <text x="71" y="52" fill="#0F172A" fontSize="8" fontWeight="bold" fontFamily="monospace">15K</text>

                  {/* Feb */}
                  <rect x="150" y="40" width="22" height="100" rx="3" fill="#47607E" />
                  <text x="152" y="152" fill="#64748B" fontSize="8" fontFamily="sans-serif">Abril</text>
                  <text x="151" y="32" fill="#0F172A" fontSize="8" fontWeight="bold" fontFamily="monospace">22K</text>

                  {/* Mar */}
                  <rect x="230" y="25" width="22" height="115" rx="3" fill="#C67C3E" />
                  <text x="232" y="152" fill="#64748B" fontSize="8" fontFamily="sans-serif">Mayo</text>
                  <text x="231" y="17" fill="#0F172A" fontSize="8" fontWeight="bold" fontFamily="monospace">28K</text>

                  {/* Proyección Junio */}
                  <rect x="310" y="10" width="22" height="130" rx="3" fill="#051125" />
                  <text x="312" y="152" fill="#64748B" fontSize="8" fontFamily="sans-serif">Junio (Act)</text>
                  <text x="311" y="5" fill="#0F172A" fontSize="8" fontWeight="bold" fontFamily="monospace">35K</text>
                </svg>
              </div>
              <p className="text-[13px] text-slate-400 mt-2">
                * Valores consolidados sobre presupuesto bruto de ventas de soportes metálicos industriales e instalaciones asignadas.
              </p>
            </div>

            {/* Distribution pie chart diagram */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">Canales de Servicio Autorizados</h3>
                <div className="flex gap-12 items-center py-4 justify-center">
                  <svg width="120" height="120" viewBox="0 0 32 32" className="transform -rotate-90">
                    <circle r="16" cx="16" cy="16" fill="transparent" stroke="#E2E8F0" strokeWidth="4" />
                    <circle r="16" cx="16" cy="16" fill="transparent" stroke="#C67C3E" strokeWidth="4" strokeDasharray="60 100" />
                    <circle r="16" cx="16" cy="16" fill="transparent" stroke="#1B263B" strokeWidth="4" strokeDasharray="30 100" strokeDashoffset="-60" />
                  </svg>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-[#C67C3E]"></span>
                      <span className="text-slate-600">Soportes Articulados Premium (60%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-[#1B263B]"></span>
                      <span className="text-slate-600">Mantenimiento Climatización (30%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-[#E2E8F0]"></span>
                      <span className="text-slate-600">Proyectos Especiales (10%)</span>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-[13px] text-slate-400 border-t pt-2">
                * Datos extraídos a partir de las {quotes.length} solicitudes registradas activamente en esta sesión de trabajo.
              </p>
            </div>

          </div>

        </div>
      )}

       {/* INCOMING QUOTES MANAGEMENT & REALIZED QUOTES TAB VIEW */}
      {activeTab === 'quotes' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Floating Action Button (FAB) for Registering Quotes (only on mobile) */}
          <button
            onClick={() => {
              setRecType('quote');
              setRecStatus('Borrador');
              setIsRecordModalOpen(true);
            }}
            title="Registrar Cotización"
            className="fixed bottom-6 right-6 z-50 md:hidden bg-[#C67C3E] hover:bg-[#b06c32] text-white font-bold w-12 h-12 rounded-full cursor-pointer flex items-center justify-center gap-0.5 transition-all scale-100 hover:scale-105 active:scale-95 shadow-xl hover:shadow-2xl hover:shadow-[#C67C3E]/30 border-2 border-white select-none"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span className="text-[11px] font-black tracking-tight shrink-0 text-white">RC</span>
          </button>
          
          {/* TOP BANNER WITH ACTION BUTTON */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div>
              <h3 className="text-lg font-bold text-[#051125] flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#C67C3E]" />
                Módulo Integrado de Cotizaciones & Proformas
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Monitorea solicitudes web recibidas y registra presupuestos/cotizaciones oficiales corporativas.
              </p>
            </div>
            <button
              onClick={() => {
                setRecType('quote');
                setRecStatus('Borrador');
                setIsRecordModalOpen(true);
              }}
              className="hidden md:flex bg-[#C67C3E] hover:bg-[#b06c32] text-white font-bold py-2.5 px-4 rounded-lg text-xs cursor-pointer items-center gap-1.5 transition-colors shadow-sm whitespace-nowrap md:self-auto justify-center"
            >
              <Plus className="w-4 h-4" />
              Registrar Cotización
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Quotes list (7 columns) */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Historial de Cotizaciones Recibidas</h3>
              </div>
              
              {quotes.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm">Sin cotizaciones registradas actualmente.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                  {quotes.map(quote => {
                    const quoteValue = quote.items.reduce((ac, it) => ac + (it.product.price * it.quantity), 0);
                    
                    return (
                      <div 
                        key={quote.id}
                        onClick={() => handleOpenQuoteDetails(quote)}
                        className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer flex justify-between items-center ${selectedQuote?.id === quote.id ? 'bg-slate-50 border-l-4 border-[#C67C3E]' : ''}`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-slate-700">{quote.id}</span>
                            <span className={`text-[12px] font-semibold px-2 py-0.5 rounded-full ${
                              quote.status === 'Pendiente' ? 'bg-amber-55 text-amber-700' :
                              quote.status === 'Aprobado' ? 'bg-sky-50 text-sky-700' :
                              quote.status === 'Asignado' ? 'bg-[#ffb780]/20 text-[#6f3800]' :
                              'bg-emerald-50 text-emerald-700'
                            }`}>
                              {quote.status}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-slate-800 mt-1 line-clamp-1">{quote.fullName}</h4>
                          <p className="text-[13px] text-slate-400 font-mono mt-0.5">{quote.date} • {quote.serviceType}</p>
                        </div>

                        <div className="text-right flex-shrink-0 flex items-center gap-3">
                          <div>
                            <span className="font-mono text-xs font-bold text-[#051125] block">
                              Bs. {quoteValue || 250}
                            </span>
                            <span className="text-[12px] text-slate-400 block mt-0.5">
                              {quote.assignedTechnician ? quote.assignedTechnician.split(' ')[1] : 'Sin asignación'}
                            </span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartEditQuote(quote);
                            }}
                            className="p-1.5 rounded hover:bg-slate-200 text-slate-500 hover:text-[#C67C3E] transition-colors cursor-pointer inline-block"
                            title="Editar Cotización"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quote inspector detail view (5 columns) */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl shadow-sm p-5 space-y-6">
              {selectedQuote ? (
                <div className="space-y-4 animate-fade-in">
                  
                  {/* Header */}
                  <div className="border-b pb-3 flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">Detalles de {selectedQuote.id}</h3>
                      <p className="text-[13px] text-slate-400 mt-0.5">Fecha de Recepción: {selectedQuote.date}</p>
                    </div>
                    <button 
                      onClick={() => setSelectedQuote(null)}
                      className="text-slate-400 hover:text-slate-700 text-xs font-bold cursor-pointer"
                    >
                      Cerrar espec.
                    </button>
                  </div>

                  {/* Cliente info */}
                  <div className="space-y-4 text-xs">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50/60 p-3 rounded-lg border border-slate-100">
                      <div>
                        <strong className="block text-slate-400 uppercase tracking-widest text-[11px] mb-0.5">Cliente Responsable:</strong>
                        <p className="font-bold text-[13.5px] text-slate-800">{selectedQuote.fullName}</p>
                        <p className="text-slate-500 font-mono text-[11.5px] mt-0.5">{selectedQuote.phone}</p>
                        <p className="text-slate-500 font-mono text-[11.5px] truncate">{selectedQuote.email}</p>
                      </div>
                      <div>
                        <strong className="block text-slate-400 uppercase tracking-widest text-[11px] mb-0.5">Servicio Solicitado:</strong>
                        <p className="font-bold text-[13px] text-[#C67C3E]">{selectedQuote.serviceType}</p>
                        <p className="text-slate-500 font-mono text-[11.5px] mt-0.5">Seguimiento: {selectedQuote.id}</p>
                      </div>
                    </div>
                    {selectedQuote.message && (
                      <div>
                        <strong className="block text-slate-400 uppercase tracking-widest text-[12px] mb-1">Mensaje/Requerimiento adicional:</strong>
                        <p className="text-slate-600 bg-[#C67C3E]/5 p-2.5 rounded text-[13.5px] leading-relaxed border border-[#C67C3E]/10 italic">
                          "{selectedQuote.message}"
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Tabla de detalles de la cotización */}
                  <div className="border-t pt-4">
                    <strong className="block text-slate-400 uppercase tracking-widest text-[12px] mb-2">Detalles de Productos / Servicios:</strong>
                    {selectedQuote.items && selectedQuote.items.length > 0 ? (
                      <div className="border border-slate-200 rounded-lg overflow-hidden shadow-xs">
                        <table className="w-full text-left border-collapse text-[11.5px] bg-slate-50/50">
                          <thead>
                            <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-semibold font-sans">
                              <th className="p-2">Item</th>
                              <th className="p-2 text-center w-12">Cant</th>
                              <th className="p-2 text-right w-20">Unit</th>
                              <th className="p-2 text-right w-24">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {selectedQuote.items.map((item, idx) => {
                              const unitPrice = item.product.price;
                              const totalLine = unitPrice * item.quantity;
                              return (
                                <tr key={idx} className="text-slate-700 hover:bg-slate-50/55 transition-colors">
                                  <td className="p-2">
                                    <div className="font-bold text-slate-800 leading-tight">
                                      {item.product.name}
                                    </div>
                                    {item.product.sku && (
                                      <div className="text-[10px] text-[#C67C3E] font-mono leading-none mt-0.5">
                                        SKU: {item.product.sku}
                                      </div>
                                    )}
                                    <div className="text-[10px] text-slate-400 font-normal leading-tight mt-0.5">
                                      {(() => {
                                        const specs = [];
                                        if (item.product.tvSizes) {
                                          specs.push(`Soporta TV: ${item.product.tvSizes}`);
                                        }
                                        if (item.product.maxLoad && item.product.maxLoad > 0) {
                                          specs.push(`Carga Máx: ${item.product.maxLoad} Kg`);
                                        }
                                        return specs.join(' · ');
                                      })()}
                                    </div>
                                  </td>
                                  <td className="p-2 text-center font-bold font-mono text-slate-800">{item.quantity}</td>
                                  <td className="p-2 text-right font-mono text-slate-500">Bs. {unitPrice.toLocaleString('es-BO', { minimumFractionDigits: 2 })}</td>
                                  <td className="p-2 text-right font-mono font-bold text-[#051125]">Bs. {totalLine.toLocaleString('es-BO', { minimumFractionDigits: 2 })}</td>
                                </tr>
                              );
                            })}
                            <tr className="bg-slate-50/80 font-bold border-t border-slate-200 text-slate-800 text-[12px]">
                              <td colSpan={3} className="p-2 text-right font-semibold">Total:</td>
                              <td className="p-2 text-right font-mono text-[#051125] font-extrabold">
                                Bs. {selectedQuote.items.reduce((acc, i) => acc + (i.product.price * i.quantity), 0).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="bg-slate-50 p-3 rounded text-center text-slate-400 italic text-xs">
                        Servicio Especializado / Evaluación Técnica en Sitio.
                      </div>
                    )}
                  </div>

                  {/* Change quote details form */}
                  <div className="border-t pt-4 space-y-3">
                    <h4 className="text-[14px] font-bold uppercase tracking-wider text-slate-400">Asignación Técnica</h4>
                    
                    {/* Status drafting selector */}
                    <div>
                      <label className="block text-[13px] text-slate-500 mb-1 font-semibold">Estado de la Solicitud:</label>
                      <select 
                        value={statusDraft}
                        onChange={(e) => setStatusDraft(e.target.value as QuoteStatus)}
                        className="w-full bg-slate-50 text-slate-800 border rounded p-1.5 text-xs"
                      >
                        <option value="Pendiente">Pendiente (Revisión preliminar)</option>
                        <option value="Aprobado">Aprobado (Presupuesto aceptado)</option>
                        <option value="Asignado">Asignado (Técnico despachado)</option>
                        <option value="Completado">Completado e Facturado</option>
                      </select>
                    </div>

                    {/* Technician drafting selector */}
                    <div>
                      <label className="block text-[13px] text-slate-500 mb-1 font-semibold">Operador Técnico Asignado:</label>
                      <select 
                        value={techDraft}
                        onChange={(e) => setTechDraft(e.target.value)}
                        className="w-full bg-slate-50 text-slate-800 border rounded p-1.5 text-xs"
                      >
                        <option value="">Sin Asignar</option>
                        {technicians.map(t => (
                          <option key={t.id} value={t.name}>{t.name} ({t.specialty.split(' ')[0]})</option>
                        ))}
                      </select>
                    </div>

                    {/* Technician internal notes */}
                    <div>
                      <label className="block text-[13px] text-slate-500 mb-1 font-semibold">Instrucciones de Campo:</label>
                      <textarea 
                        rows={2}
                        value={notesDraft}
                        onChange={(e) => setNotesDraft(e.target.value)}
                        placeholder="Indicar tipo de tornillo, ubicación exacta de andamios..."
                        className="w-full bg-slate-50 text-slate-800 border p-2 text-xs rounded"
                      />
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 pt-2">
                      <button 
                        onClick={handleSaveQuoteChanges}
                        className="flex-1 bg-[#051125] hover:bg-slate-800 text-white text-xs font-bold py-2 rounded-lg cursor-pointer"
                      >
                        Guardar Asignación
                      </button>
                      <button
                        onClick={handleGenerateAiResponse}
                        className="bg-[#C67C3E] hover:bg-[#b06c32] text-white text-xs font-bold px-3 py-2 rounded-lg cursor-pointer flex items-center justify-center gap-1.5"
                        title="Redactar proforma con Inteligencia Artificial"
                      >
                        <Sparkles className="w-4 h-4 animate-bounce" />
                        Redactar AI
                      </button>
                      <button
                        onClick={() => {
                          const doc = generateQuoteRequestPDF(selectedQuote);
                          doc.save(`${selectedQuote.id}_Cotizacion_TorreForte.pdf`);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-2 rounded-lg cursor-pointer flex items-center justify-center gap-1.5"
                        title="Descargar cotización en PDF"
                      >
                        <FileText className="w-4 h-4" />
                        PDF
                      </button>
                    </div>

                  </div>

                  {/* AI Draft Response Output (Gemini Mocked/Leveraged) */}
                  {aiDraftOutput !== undefined && aiDraftOutput !== '' && (
                    <div className="bg-[#051125] text-white p-4 rounded-lg border border-white/10 space-y-3 animate-fade-in mt-4">
                      <div className="flex justify-between items-center border-b border-white/10 pb-1.5 text-[11px] sm:text-[12px] uppercase tracking-wider text-[#ffb780] font-mono">
                        <span>Respuesta / Proforma Lista para Envío</span>
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-sans">Editable</span>
                      </div>

                      <div className="relative">
                        <textarea
                          value={aiDraftOutput}
                          onChange={(e) => setAiDraftOutput(e.target.value)}
                          rows={6}
                          className="w-full text-[13px] text-slate-100 font-sans whitespace-pre-wrap leading-relaxed bg-white/5 p-2 rounded focus:outline-none focus:ring-1 focus:ring-[#C67C3E] border border-white/5 resize-y"
                          placeholder="Escribe la respuesta que deseas enviar..."
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                        <button 
                          onClick={handleSendWhatsAppDirect}
                          className="text-center bg-[#25D366] hover:bg-[#20ba59] text-white text-[12px] font-extrabold py-2 px-2.5 rounded transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                          title="Enviar respuesta directamente al número de WhatsApp del cliente"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                          Enviar WhatsApp
                        </button>
                        
                        <button 
                          onClick={handleSendEmailDirect}
                          className="text-center bg-sky-600 hover:bg-sky-500 text-white text-[12px] font-extrabold py-2 px-2.5 rounded transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                          title="Enviar respuesta directamente al correo electrónico del cliente"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          Enviar Correo
                        </button>

                        <button 
                          onClick={copyAiText}
                          className="text-center bg-white/10 hover:bg-white/20 text-white text-[12px] font-semibold py-2 px-2.5 rounded transition-all cursor-pointer flex items-center justify-center gap-1.5"
                          title="Copiar texto de la respuesta al portapapeles"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Copiar Texto
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-center text-slate-400">
                  <HelpCircle className="w-10 h-10 stroke-1 mb-2" />
                  <p className="text-xs">Selecciona una cotización de la lista de pendientes para ver la ficha de despacho técnico, programar reparaciones y redactar respuestas formales de ventas.</p>
                </div>
              )}
            </div>

          </div>

          {/* SECCIÓN NUEVA: COTIZACIONES REALIZADAS */}
          <div className="bg-white border-t-4 border-t-[#C67C3E] border border-slate-200/80 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#C67C3E]" />
                  Cotizaciones Realizadas (Histórico de Proformas)
                </h4>
                <p className="text-[12px] text-slate-500 mt-0.5">Visor de presupuestos oficiales generados para clientes y empresas.</p>
              </div>
              
              {/* Buscador de cotizaciones realizadas */}
              <div className="relative flex items-center bg-white border border-slate-200 rounded-lg text-xs w-full sm:w-64 shadow-xs">
                <Search className="w-3.5 h-3.5 text-slate-300 absolute left-2.5" />
                <input
                  type="text"
                  value={quoteSearchFilter}
                  onChange={(e) => setQuoteSearchFilter(e.target.value)}
                  placeholder="Buscar por cliente, ítem..."
                  className="pl-8 pr-2 py-1.5 rounded-lg border-none bg-transparent w-full focus:outline-none text-xs text-slate-800"
                />
              </div>
            </div>

            {(() => {
              const realizedQuotes = financialRecords.filter(rec => {
                if (rec.type !== 'quote') return false;
                if (quoteSearchFilter.trim() !== '') {
                  const q = quoteSearchFilter.toLowerCase();
                  const clientMatch = (rec.client || '').toLowerCase().includes(q);
                  const itemMatch = (rec.item || '').toLowerCase().includes(q);
                  const notesMatch = (rec.notes || '').toLowerCase().includes(q);
                  const idMatch = rec.id.toLowerCase().includes(q);
                  return clientMatch || itemMatch || notesMatch || idMatch;
                }
                return true;
              });

              if (realizedQuotes.length === 0) {
                return (
                  <div className="p-10 text-center text-slate-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300 animate-pulse" />
                    <p className="text-xs">No hay cotizaciones registradas actualmente en este histórico.</p>
                  </div>
                );
              }

              return (
                <div className="overflow-auto max-h-[350px] border border-slate-200 rounded-lg">
                  <p className="sm:hidden text-[11px] text-slate-400 font-semibold flex items-center gap-1 px-1.5 py-1 bg-slate-50 border-b">
                    👉 Desliza la tabla hacia los lados para ver todas las columnas
                  </p>
                  <table className="w-full min-w-[500px] md:min-w-[820px] text-left text-[11px] md:text-xs border-collapse divide-y divide-slate-200">
                    <thead className="bg-[#051125] text-slate-200 sticky top-0 z-20 shadow-xs">
                      <tr className="uppercase tracking-wider text-[11px] font-extrabold border-b border-slate-200/20">
                        <th className="py-1.5 px-1 md:px-3 text-left font-bold text-white/95">Fecha</th>
                        <th className="py-1.5 px-1 md:px-3 text-left font-bold text-white/95">Referencia</th>
                        <th className="py-1.5 px-1 md:px-3 text-left font-bold text-white/95">Cliente</th>
                        <th className="py-1.5 px-1 md:px-3 text-left font-bold text-white/95">Detalle / Ítem</th>
                        <th className="py-1.5 px-1 md:px-3 text-right font-bold text-white/95">Monto (Bs.)</th>
                        <th className="py-1.5 px-1 md:px-3 text-center font-bold text-white/95">Estado</th>
                        <th className="py-1.5 px-1 md:px-3 text-center w-24 font-bold text-white/95">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-sans text-slate-700 bg-white">
                      {realizedQuotes.map(rec => {
                        return (
                          <tr key={rec.id} className="hover:bg-[#C67C3E]/5 transition-all duration-200 border-b border-slate-100">
                            <td className="py-1.5 px-1 md:px-3 text-slate-500 whitespace-nowrap font-mono">{rec.date}</td>
                            <td className="py-1.5 px-1 md:px-3 text-slate-700 whitespace-nowrap font-bold font-mono text-[#C67C3E]">{rec.id}</td>
                            <td className="py-1.5 px-1 md:px-3 text-slate-600 font-semibold">
                              <div>{rec.client || 'Público General'}</div>
                              {(rec.clientPhone || rec.clientNit) && (
                                <div className="text-[10px] text-slate-400 font-bold font-mono mt-0.5 whitespace-nowrap">
                                  {rec.clientPhone && <span>📞 {rec.clientPhone}</span>}
                                  {rec.clientPhone && rec.clientNit && <span className="mx-1 text-slate-300">|</span>}
                                  {rec.clientNit && <span>NIT: {rec.clientNit}</span>}
                                </div>
                              )}
                            </td>
                            <td className="py-1.5 px-1 md:px-3 text-slate-700">
                              <div className="font-bold text-[#051125] text-[11.5px] md:text-xs">{rec.item}</div>
                              {rec.notes && <div className="text-[10px] text-slate-400 italic line-clamp-1 mt-0.5">{rec.notes}</div>}
                            </td>
                            <td className="py-1.5 px-1 md:px-3 text-right font-mono font-bold text-[#051125]">
                              Bs. {rec.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="py-1.5 px-1 md:px-3 text-center">
                              <span className={`text-[10.5px] font-bold px-1.5 py-0.2 rounded-full ${
                                rec.status === 'Borrador' ? 'bg-amber-50 text-amber-550 border border-amber-200' :
                                rec.status === 'Enviada' ? 'bg-sky-50 text-sky-600 border border-sky-200' :
                                'bg-emerald-50 text-emerald-600 border border-emerald-200'
                              }`}>
                                {rec.status}
                              </span>
                            </td>
                            <td className="py-1.5 px-1 md:px-3 text-center">
                              <div className="flex justify-center gap-1">
                                <button
                                  onClick={() => {
                                    try {
                                      const doc = generatePDF(rec);
                                      doc.save(`${rec.id}_Proforma_TorreForte.pdf`);
                                    } catch (error) {
                                      console.error('Error al generar PDF:', error);
                                      alert('Error al generar el PDF de la proforma.');
                                    }
                                  }}
                                  className="text-emerald-600 hover:text-emerald-800 p-1 rounded hover:bg-emerald-50 transition-colors cursor-pointer inline-block"
                                  title="Imprimir PDF de Cotización / Factura Proforma"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleStartEditRecord(rec)}
                                  className="text-slate-400 hover:text-[#C67C3E] p-1 rounded hover:bg-[#C67C3E]/5 transition-colors cursor-pointer inline-block"
                                  title="Editar Registro de Cotización"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteRecord(rec.id)}
                                  className="text-rose-400 hover:text-rose-700 p-1 rounded hover:bg-rose-50 transition-colors cursor-pointer inline-block"
                                  title="Eliminar Registro de Cotización"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>

        </div>
      )}

      {/* VENTAS & REGISTRO FINANCIERO TAB VIEW */}
      {activeTab === 'ventas' && (
        <div className="space-y-4 animate-fade-in">
          
          {/* Floating Action Button (FAB) for Registering Sales */}
          <button
            onClick={() => {
              setRecType('sale');
              setRecStatus('Paid');
              setIsRecordModalOpen(true);
            }}
            title="Registrar Venta"
            className="fixed bottom-6 right-6 z-50 bg-[#10b981] hover:bg-[#059669] text-white font-bold w-12 h-12 rounded-full cursor-pointer flex items-center justify-center gap-0.5 transition-all scale-100 hover:scale-105 active:scale-95 shadow-xl hover:shadow-2xl hover:shadow-[#10b981]/30 border-2 border-white select-none"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span className="text-[11px] font-black tracking-tight shrink-0">RV</span>
          </button>
          
          {/* Table list Module */}
          <div className="bg-white border-t-4 border-t-[#C67C3E] border border-slate-200/80 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col">
            
            <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Historial Operativo de Caja • Ventas Directas</h4>
                  <p className="text-[12px] text-slate-500">Verifique, ordene y gestione recibos de comercialización cobrados en caja.</p>
                </div>
                
                {/* Search Bar */}
                <div className="relative flex items-center bg-white border border-slate-400 rounded-lg text-xs w-full md:w-64 shadow-xs">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5" />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Buscar cliente, servicio o nota..."
                    className="pl-8 pr-2 py-1.5 rounded-lg border-none bg-transparent w-full focus:outline-none focus:ring-0 text-xs text-slate-700"
                  />
                </div>
              </div>

              {/* Advanced Filter Row: Cargado por and Periodo on the exact same row */}
              <div className="pt-2 border-t border-slate-200/50 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {/* Filter by Operator (User) */}
                  <div className="space-y-1">
                    <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest truncate">Cargado Por (Usuario):</span>
                    <select
                      value={operatorFilter}
                      onChange={(e) => setOperatorFilter(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg text-xs px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#C67C3E] text-slate-600 cursor-pointer"
                    >
                      <option value="all">👤 Todos los Usuarios</option>
                      {usersList.map(u => (
                        <option key={u.id} value={u.name}>👤 {u.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Filter by Time Period Mode */}
                  <div className="space-y-1">
                    <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest truncate">Periodo:</span>
                    <select
                      value={timePeriodFilter}
                      onChange={(e) => {
                        const val = e.target.value as any;
                        setTimePeriodFilter(val);
                        
                        // Auto-fill selectedWeekStart if week is selected
                        const availableWeeks = (Array.from(new Set(financialRecords.map(r => {
                          const d = new Date(r.date);
                          if (isNaN(d.getTime())) return null;
                          const sun = new Date(d);
                          sun.setDate(d.getDate() - d.getDay());
                          return sun.toISOString().split('T')[0];
                        }).filter(Boolean))) as string[]).sort((a, b) => b.localeCompare(a));

                        if (val === 'week' && availableWeeks.length > 0 && selectedWeekStart === 'all') {
                          setSelectedWeekStart(availableWeeks[0]);
                        }
                      }}
                      className="w-full bg-white border border-slate-200 rounded-lg text-xs px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#C67C3E] text-slate-600 cursor-pointer font-medium"
                    >
                      <option value="last_week">📅 Última Semana Registrada (Defecto)</option>
                      <option value="week">📅 Ver de Semana Específica</option>
                      <option value="month">📅 Ver de Mes Específico</option>
                      <option value="year">📅 Ver de Año Específico</option>
                      <option value="all">📅 Mostrar Histórico Completo</option>
                    </select>
                  </div>
                </div>

                {/* Dynamic specific selectors depending on chosen time mode */}
                {timePeriodFilter !== 'all' && timePeriodFilter !== 'last_week' && (
                  <div className="space-y-1 max-w-[50%]">
                    {(() => {
                      const availableYears = (Array.from(new Set(financialRecords.map(r => {
                        const d = new Date(r.date);
                        return isNaN(d.getTime()) ? 2026 : d.getFullYear();
                      }))) as number[]).sort((a, b) => b - a);

                      const availableWeeks = (Array.from(new Set(financialRecords.map(r => {
                        const d = new Date(r.date);
                        if (isNaN(d.getTime())) return null;
                        const sun = new Date(d);
                        sun.setDate(d.getDate() - d.getDay());
                        return sun.toISOString().split('T')[0];
                      }).filter(Boolean))) as string[]).sort((a, b) => b.localeCompare(a));

                      const getWeekLabel = (sundayStr: string) => {
                        if (!sundayStr) return '';
                        const d = new Date(sundayStr);
                        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
                        return `Semana del ${d.getDate()} de ${months[d.getMonth()]} (${d.getFullYear()})`;
                      };

                      if (timePeriodFilter === 'year') {
                        return (
                          <>
                            <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest">Seleccione Año:</span>
                            <select
                              value={selectedYear}
                              onChange={(e) => setSelectedYear(parseInt(e.target.value) || 2026)}
                              className="w-full bg-amber-50/50 border border-amber-200 rounded-lg text-xs px-2.5 py-1.5 focus:outline-none text-amber-950 cursor-pointer"
                            >
                              {availableYears.map(yr => (
                                <option key={yr} value={yr}>Año {yr}</option>
                              ))}
                            </select>
                          </>
                        );
                      }

                      if (timePeriodFilter === 'month') {
                        return (
                          <div className="grid grid-cols-2 gap-1.5">
                            <div>
                              <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest">Año:</span>
                              <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(parseInt(e.target.value) || 2026)}
                                className="w-full bg-amber-50/50 border border-amber-200 rounded-lg text-xs px-1.5 py-1.5 focus:outline-none text-amber-950 cursor-pointer"
                              >
                                {availableYears.map(yr => (
                                  <option key={yr} value={yr}>{yr}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest">Mes:</span>
                              <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(parseInt(e.target.value) || 0)}
                                className="w-full bg-amber-50/50 border border-amber-200 rounded-lg text-xs px-1.5 py-1.5 focus:outline-none text-amber-950 cursor-pointer"
                              >
                                <option value={0}>Ene</option>
                                <option value={1}>Feb</option>
                                <option value={2}>Mar</option>
                                <option value={3}>Abr</option>
                                <option value={4}>May</option>
                                <option value={5}>Jun</option>
                                <option value={6}>Jul</option>
                                <option value={7}>Ago</option>
                                <option value={8}>Sep</option>
                                <option value={9}>Oct</option>
                                <option value={10}>Nov</option>
                                <option value={11}>Dic</option>
                              </select>
                            </div>
                          </div>
                        );
                      }

                      if (timePeriodFilter === 'week') {
                        return (
                          <>
                            <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest">Seleccione Semana:</span>
                            <select
                              value={selectedWeekStart}
                              onChange={(e) => setSelectedWeekStart(e.target.value)}
                              className="w-full bg-amber-50/50 border border-amber-200 rounded-lg text-xs px-2.5 py-1.5 focus:outline-none text-amber-950 cursor-pointer"
                            >
                              <option value="all">Todas las semanas</option>
                              {availableWeeks.map(wkStr => (
                                <option key={wkStr} value={wkStr}>{getWeekLabel(wkStr)}</option>
                              ))}
                            </select>
                          </>
                        );
                      }

                      return null;
                    })()}
                  </div>
                )}
              </div>
            </div>

            <p className="sm:hidden text-[11px] text-slate-400 font-semibold flex items-center gap-1 px-1">
              👉 Desliza la tabla hacia los lados para ver todas las columnas
            </p>
            <div className="overflow-auto max-h-[380px] border border-slate-200 rounded-lg">
              <table className="w-full min-w-[500px] md:min-w-[920px] text-left text-[11px] md:text-xs border-collapse divide-y divide-slate-200">
                <thead className="bg-[#051125] text-slate-200 sticky top-0 z-20 shadow-xs">
                  <tr className="uppercase tracking-wider text-[11px] font-extrabold border-b border-slate-200/20">
                    <th className="py-1.5 px-1 md:px-3 text-left font-bold text-white/95">Fecha</th>
                    <th className="py-1.5 px-1 md:px-3 text-left font-bold text-white/95">Cargado Por</th>
                    <th className="py-1.5 px-1 md:px-3 text-left font-bold text-white/95">Producto / Servicio</th>
                    <th className="py-1.5 px-1 md:px-3 text-right font-bold text-white/95">Precio (Bs.)</th>
                    <th className="py-1.5 px-1 md:px-3 text-right font-bold text-slate-300">Capital (Bs.)</th>
                    <th className="py-1.5 px-1 md:px-3 text-right font-bold text-emerald-300">Ganancia (Bs.)</th>
                    <th className="py-1.5 px-1 md:px-3 text-left font-bold text-white/95">Notas</th>
                    <th className="py-1.5 px-1 md:px-3 text-center w-24 font-bold text-white/95 sticky right-0 z-30 bg-[#051125] shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.3)]">Editar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans text-slate-700 bg-white">
                  {filteredFinancialRecords.map(rec => {
                    const capitalVal = rec.capital !== undefined ? rec.capital : (rec.amount * 0.6);
                    const profitVal = rec.profit !== undefined ? rec.profit : (rec.amount * 0.4);

                    return (
                      <tr key={rec.id} className="hover:bg-[#C67C3E]/5 transition-all duration-200 border-b border-slate-100">
                        <td className="py-1 px-1 md:px-3 text-slate-500 whitespace-nowrap font-mono">{rec.date}</td>
                        <td className="py-1 px-1 md:px-3 font-semibold text-[#051125] whitespace-nowrap">
                          <span className="bg-slate-100/80 text-slate-705 text-[10.5px] px-1.5 py-0.2 rounded-full font-mono border border-slate-200">
                            {rec.operator || 'Carlos Mendoza'}
                          </span>
                        </td>
                        <td className="py-1 px-1 md:px-3 text-slate-600">
                          <div className="font-bold text-[#051125] text-[11.5px] md:text-xs">{rec.item}</div>
                        </td>
                        <td className="py-1 px-1 md:px-3 text-right font-mono font-bold text-[#051125]">
                          {rec.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-1 px-1 md:px-3 text-right font-mono text-slate-500 font-semibold">
                          {capitalVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-1 px-1 md:px-3 text-right font-mono font-bold text-emerald-700 bg-emerald-50/20">
                          {profitVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-1 px-1 md:px-3 text-slate-600 italic font-medium max-w-[200px] truncate" title={rec.notes || ''}>
                          {rec.notes || <span className="text-slate-300">—</span>}
                        </td>
                        <td className="py-1 px-1 md:px-3 text-center sticky right-0 z-10 bg-white group-hover:bg-[#C67C3E]/5 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.08)]">
                          <div className="flex justify-center gap-1">
                            <button
                               onClick={() => handleStartEditRecord(rec)}
                               className="text-slate-400 hover:text-[#C67C3E] p-1 rounded hover:bg-[#C67C3E]/5 transition-colors cursor-pointer inline-block"
                               title="Editar Registro"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                               onClick={() => handleDeleteRecord(rec.id)}
                               className="text-rose-400 hover:text-rose-700 p-1 rounded hover:bg-rose-50 transition-colors cursor-pointer inline-block"
                               title="Eliminar Registro"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {/* Totals Row */}
                  {filteredFinancialRecords.length > 0 && (
                    <tr className="bg-[#eef1f6] border-t-2 border-[#051125]/20 font-bold sticky bottom-0 z-20">
                      <td colSpan={3} className="py-2 px-1 md:px-3 text-right text-[11px] md:text-sm font-extrabold text-[#051125] uppercase tracking-wider bg-[#eef1f6]">
                        Totales de Filtro ({filteredFinancialRecords.length} reg)
                      </td>
                      <td className="py-2 px-1 md:px-3 text-right font-mono font-black text-[11px] text-[#051125] bg-[#eef1f6]">
                        {totalFinancialAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-1 md:px-3 text-right font-mono font-bold text-[11px] text-slate-600 bg-[#eef1f6]">
                        {totalFinancialCapital.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-1 md:px-3 text-right font-mono font-black text-[11px] text-emerald-800 bg-[#eef1f6]">
                        {totalFinancialProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-1 md:px-3 bg-[#eef1f6]"></td>
                      <td className="py-2 px-1 md:px-3 sticky right-0 bottom-0 z-30 bg-[#eef1f6]"></td>
                    </tr>
                  )}

                  {filteredFinancialRecords.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        Ningún registro de caja coincide con los filtros especificados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>

        </div>
      )}

      {/* LIVE INVENTORY CRUD TAB VIEW */}
      {activeTab === 'inventory' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
          
          {/* New product addition form (5 columns) */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl shadow-sm p-5">
            <h3 className="text-[13.8px] sm:text-sm font-extrabold text-slate-800 uppercase tracking-wider mb-4 border-b pb-2">Registrar Nuevo Soporte / Ítem</h3>
            <form onSubmit={handleAddProductSubmit} className="space-y-4">
              
              <div>
                <label className="block text-[11.5px] text-slate-500 font-bold uppercase mb-1">Nombre Comercial del Soporte</label>
                <input 
                  type="text" 
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  placeholder="Ej. Soporte Inclinable Universal"
                  className="w-full bg-slate-50 border p-2.5 text-[13.8px] rounded text-slate-800 focus:outline-[#051125]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11.5px] text-slate-500 font-bold uppercase mb-1">Código SKU</label>
                  <input 
                    type="text" 
                    value={newProdSku}
                    onChange={(e) => setNewProdSku(e.target.value)}
                    placeholder="Ej. SKU-A88"
                    className="w-full bg-slate-50 border p-2.5 text-[13.8px] rounded text-slate-800 focus:outline-[#051125]"
                  />
                </div>
                <div>
                  <label className="block text-[11.5px] text-slate-500 font-bold uppercase mb-1">Precio Oficial (Bs.)</label>
                  <input 
                    type="number" 
                    value={newProdPrice || ''}
                    onChange={(e) => setNewProdPrice(Math.max(0, parseInt(e.target.value) || 0))}
                    placeholder="Ej. 350"
                    className="w-full bg-slate-50 border p-2.5 text-[13.8px] rounded text-slate-800 font-mono focus:outline-[#051125]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[11.5px] text-slate-500 font-bold uppercase">Categoría</label>
                    <button
                      type="button"
                      onClick={() => setIsManagingCategories(!isManagingCategories)}
                      className="text-[13px] text-[#C67C3E] hover:underline font-extrabold uppercase"
                    >
                      {isManagingCategories ? 'Cerrar' : 'Editar'}
                    </button>
                  </div>
                  <select 
                    value={newProdCategory}
                    onChange={(e) => setNewProdCategory(e.target.value)}
                    className="w-full bg-slate-50 border p-2.5 text-[13.8px] rounded text-slate-800 cursor-pointer focus:outline-[#051125]"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>
                        {cat.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11.5px] text-slate-500 font-bold uppercase mb-1">Tipo</label>
                  <select 
                    value={newProdStock}
                    onChange={(e) => setNewProdStock(e.target.value as any)}
                    className="w-full bg-slate-50 border p-2.5 text-[13.8px] rounded text-slate-800 cursor-pointer"
                  >
                    <option value="Compra-Venta">Compra-Venta</option>
                    <option value="Modificado">Modificado</option>
                    <option value="Fabricado">Fabricado</option>
                  </select>
                </div>
              </div>

              {/* Panel de administración dinámica de categorías */}
              {isManagingCategories && (
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-left text-xs space-y-2">
                  <span className="block text-[12px] text-slate-500 font-bold uppercase tracking-wider">
                    Editar categorías disponibles:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {categories.map(cat => (
                      <span key={cat} className="inline-flex items-center gap-1 bg-white border border-slate-200 px-1.5 py-0.5 rounded text-[12px] font-mono font-medium text-slate-600">
                        {cat}
                        {cat !== 'articulado' && cat !== 'fijo' && cat !== 'techo' && cat !== 'pedestal' && cat !== 'climatizacion' && (
                          <button
                            type="button"
                            onClick={() => {
                              setCategories(categories.filter(c => c !== cat));
                              if (newProdCategory === cat) setNewProdCategory('articulado');
                            }}
                            className="text-rose-500 hover:text-rose-700 font-bold ml-1"
                            title="Eliminar"
                          >
                            &times;
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      placeholder="Ej. aire"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value.toLowerCase().replace(/[^a-z0-9 ]/g, ''))}
                      className="flex-1 bg-white border px-2 py-1 text-[13px] rounded focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const tr = newCategoryName.trim();
                        if (tr && !categories.includes(tr)) {
                          setCategories([...categories, tr]);
                          setNewCategoryName('');
                        }
                      }}
                      className="bg-[#051125] text-white px-2 py-1 rounded text-[13px] font-bold"
                    >
                      Añadir
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11.5px] text-slate-500 font-bold uppercase mb-1">Carga Máxima (Kg)</label>
                  <input 
                    type="number" 
                    value={newProdMaxLoad || ''}
                    onChange={(e) => setNewProdMaxLoad(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-slate-50 border p-2.5 text-[13.8px] rounded text-slate-800"
                    disabled={newProdCategory === 'climatizacion'}
                    placeholder={newProdCategory === 'climatizacion' ? 'N/A' : 'Ej. 50'}
                  />
                </div>
                <div>
                  <label className="block text-[11.5px] text-slate-500 font-bold uppercase mb-1">Rango Pantallas</label>
                  <input 
                    type="text" 
                    value={newProdSizes}
                    onChange={(e) => setNewProdSizes(e.target.value)}
                    placeholder='Ej. 42" - 80"'
                    className="w-full bg-slate-50 border p-2.5 text-[13.8px] rounded text-slate-800"
                    disabled={newProdCategory === 'climatizacion'}
                  />
                </div>
              </div>

              {/* Casilla de BTU para Aires Acondicionados */}
              <div>
                <label className="block text-[11.5px] text-slate-500 font-bold uppercase mb-1">Capacidad del Aire Acondicionado (BTU)</label>
                <input 
                  type="number" 
                  value={newProdBtu}
                  onChange={(e) => setNewProdBtu(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="Ej. 12000 o 18000"
                  className="w-full bg-slate-50 border p-2.5 text-[13.8px] rounded text-slate-800 font-mono focus:outline-[#051125]"
                />
              </div>

              {/* Descripción y Especificaciones Personalizadas */}
              <div className="space-y-4 pt-1 border-t border-dashed border-slate-200">
                <div>
                  <label className="block text-[11.5px] text-slate-500 font-bold uppercase mb-1">Descripción Personalizada</label>
                  <textarea
                    rows={3}
                    value={newProdDescription}
                    onChange={(e) => setNewProdDescription(e.target.value)}
                    placeholder="Ej. Limpieza profunda externa e interna de aires acondicionados split y de ventana, diagnóstico de consumo amperaje..."
                    className="w-full bg-slate-50 border p-2.5 text-[13.8px] rounded text-slate-800 focus:outline-[#051125] resize-y min-h-[85px]"
                  />
                  <span className="text-[10.5px] text-slate-400 block mt-1">Si se deja vacío, usará el texto predeterminado según la categoría.</span>
                </div>
                <div>
                  <label className="block text-[11.5px] text-slate-500 font-bold uppercase mb-1">Material / Especificación / Detalles del Servicio</label>
                  <textarea
                    rows={2}
                    value={newProdMaterial}
                    onChange={(e) => setNewProdMaterial(e.target.value)}
                    placeholder="Ej. Incluye hidrolavado, químicos biodegradables, revisión de fugas y garantía de 3 meses."
                    className="w-full bg-slate-50 border p-2.5 text-[13.8px] rounded text-slate-800 focus:outline-[#051125] resize-y min-h-[65px]"
                  />
                  <span className="text-[10.5px] text-slate-400 block mt-1">Si se deja vacío, se utilizará la especificación técnica general.</span>
                </div>
              </div>

              <div className="border-t pt-3 mt-1 space-y-2.5 font-sans text-left">
                <label className="block text-[11.5px] text-slate-500 font-bold uppercase">Imágenes del Producto (Hasta 3 imágenes)</label>
                
                {/* 3 Interactive Slots */}
                <div className="grid grid-cols-3 gap-2.5 mb-1.5">
                  {[0, 1, 2].map((idx) => {
                    const isSelected = activeImageSlot === idx;
                    const imgUrl = newProdImages[idx];
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveImageSlot(idx)}
                        className={`relative aspect-square rounded-lg border-2 flex flex-col items-center justify-center p-1.5 overflow-hidden transition-all text-left bg-slate-50 cursor-pointer ${
                          isSelected 
                            ? 'border-[#C67C3E] bg-[#C67C3E]/5 ring-1 ring-[#C67C3E]' 
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {imgUrl ? (
                          <img referrerPolicy="no-referrer" src={imgUrl} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover rounded" />
                        ) : (
                          <div className="text-center p-1 text-slate-400">
                            <span className="block text-base leading-none font-bold">+</span>
                            <span className="text-[8px] uppercase font-mono tracking-tighter">Foto {idx + 1}</span>
                          </div>
                        )}
                        <div className="absolute top-1 left-1 bg-black/60 text-white text-[8px] px-1 py-0.2 rounded font-mono">
                          {idx === 0 ? 'P' : `S${idx}`}
                        </div>
                        {imgUrl && (
                          <button
                            type="button"
                            onClick={(ev) => {
                              ev.stopPropagation();
                              setNewProdImageAt(idx, '');
                            }}
                            className="absolute bottom-1 right-1 bg-rose-600 hover:bg-rose-700 text-white rounded p-0.5 text-[8px] leading-none font-bold"
                            title="Eliminar esta foto"
                          >
                            &times;
                          </button>
                        )}
                      </button>
                    );
                  })}
                </div>

                <p className="text-[13px] text-[#C67C3E] leading-normal font-bold">
                  * Foto {activeImageSlot + 1} seleccionada. Medida recomendada: 600x600 px (Relación de aspecto 1:1, formato cuadrado) para una visualización perfecta en las tarjetas de catálogo e inicio.
                </p>
                
                {/* Tabs selection */}
                <div className="grid grid-cols-3 gap-1 bg-slate-100 p-0.5 rounded-lg text-[11.5px] mt-2">
                  <button
                    type="button"
                    onClick={() => setNewImageSource('preset')}
                    className={`py-1.5 rounded font-medium text-center transition-all ${newImageSource === 'preset' ? 'bg-white text-[#051125] shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    Galería
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewImageSource('upload')}
                    className={`py-1.5 rounded font-medium text-center transition-all ${newImageSource === 'upload' ? 'bg-white text-[#051125] shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    Subir Archivo
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewImageSource('url')}
                    className={`py-1.5 rounded font-medium text-center transition-all ${newImageSource === 'url' ? 'bg-white text-[#051125] shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    URL Web
                  </button>
                </div>

                {/* Preset image list */}
                {newImageSource === 'preset' && (
                  <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-sans">
                    <label className="block text-[10.5px] text-slate-400 font-bold uppercase">Selecciona de la Galería para Foto {activeImageSlot + 1}:</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setNewProdImageAt(activeImageSlot, 'https://lh3.googleusercontent.com/aida-public/AB6AXuDAP_Hywg0z1xV-NVCc_OM_E5YeujMPk0L2DNlLp7axI3oMsHgCZF-gi1kUErfuRimptCHdHe5-2m7oMuSQVWl89mPKqJwyEJebOlKoAlU9Mlt0T99O7JbkEg-W2yMVsmZprewJ6ZN7ZiMPjn-FGsYTfVcflAn5pNUW0t9AEIjRI6h94syj-RAWVE71JMHY3DMi6d-bLeM-U_s2SsZ3N4qbja8tKY3Nr1HJ2fZmzTJOEBqtvqfy6S147PXL5nXYBnq3Rlxb8EeB6L1w')}
                        className={`p-1 border rounded-lg bg-white overflow-hidden transition-all ${newProdImages[activeImageSlot] === 'https://lh3.googleusercontent.com/aida-public/AB6AXuDAP_Hywg0z1xV-NVCc_OM_E5YeujMPk0L2DNlLp7axI3oMsHgCZF-gi1kUErfuRimptCHdHe5-2m7oMuSQVWl89mPKqJwyEJebOlKoAlU9Mlt0T99O7JbkEg-W2yMVsmZprewJ6ZN7ZiMPjn-FGsYTfVcflAn5pNUW0t9AEIjRI6h94syj-RAWVE71JMHY3DMi6d-bLeM-U_s2SsZ3N4qbja8tKY3Nr1HJ2fZmzTJOEBqtvqfy6S147PXL5nXYBnq3Rlxb8EeB6L1w' ? 'border-[#C67C3E] ring-1 ring-[#C67C3E]' : 'border-slate-200'}`}
                        title="Articulado"
                      >
                        <img referrerPolicy="no-referrer" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDAP_Hywg0z1xV-NVCc_OM_E5YeujMPk0L2DNlLp7axI3oMsHgCZF-gi1kUErfuRimptCHdHe5-2m7oMuSQVWl89mPKqJwyEJebOlKoAlU9Mlt0T99O7JbkEg-W2yMVsmZprewJ6ZN7ZiMPjn-FGsYTfVcflAn5pNUW0t9AEIjRI6h94syj-RAWVE71JMHY3DMi6d-bLeM-U_s2SsZ3N4qbja8tKY3Nr1HJ2fZmzTJOEBqtvqfy6S147PXL5nXYBnq3Rlxb8EeB6L1w" alt="Articulado" className="w-full h-8 object-contain" />
                        <span className="text-[12px] font-medium text-slate-500 block text-center truncate mt-0.5">Articulado</span>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setNewProdImageAt(activeImageSlot, 'https://lh3.googleusercontent.com/aida-public/AB6AXuAxHGBcnjogHfbNwYKglyaCRDQH0EiPpu7vOgKF0HC2VKU0wC3bPmcmDnnEV1eBXBjrj9EADLpw6FkrDIog6RoCWJUzhhr1qlGqEVa2zY_fAS1R-yawbVLj81Sz1Kki4tPdLYbc6tgN-MkVqLIAU5UTfm7Hz0JjGosmwzPfdM-4uGOxIFOGQ20saEzC7J_Owzd89O0v83OashnfupSTazMqsAZ21K_EV5tAs7pSPgfE0754QEoJfkJooeYMzzWqFp0IQCe8e5Zi-6ef')}
                        className={`p-1 border rounded-lg bg-white overflow-hidden transition-all ${newProdImages[activeImageSlot] === 'https://lh3.googleusercontent.com/aida-public/AB6AXuAxHGBcnjogHfbNwYKglyaCRDQH0EiPpu7vOgKF0HC2VKU0wC3bPmcmDnnEV1eBXBjrj9EADLpw6FkrDIog6RoCWJUzhhr1qlGqEVa2zY_fAS1R-yawbVLj81Sz1Kki4tPdLYbc6tgN-MkVqLIAU5UTfm7Hz0JjGosmwzPfdM-4uGOxIFOGQ20saEzC7J_Owzd89O0v83OashnfupSTazMqsAZ21K_EV5tAs7pSPgfE0754QEoJfkJooeYMzzWqFp0IQCe8e5Zi-6ef' ? 'border-[#C67C3E] ring-1 ring-[#C67C3E]' : 'border-slate-200'}`}
                        title="Fijo de pared"
                      >
                        <img referrerPolicy="no-referrer" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAxHGBcnjogHfbNwYKglyaCRDQH0EiPpu7vOgKF0HC2VKU0wC3bPmcmDnnEV1eBXBjrj9EADLpw6FkrDIog6RoCWJUzhhr1qlGqEVa2zY_fAS1R-yawbVLj81Sz1Kki4tPdLYbc6tgN-MkVqLIAU5UTfm7Hz0JjGosmwzPfdM-4uGOxIFOGQ20saEzC7J_Owzd89O0v83OashnfupSTazMqsAZ21K_EV5tAs7pSPgfE0754QEoJfkJooeYMzzWqFp0IQCe8e5Zi-6ef" alt="Fijo" className="w-full h-8 object-contain" />
                        <span className="text-[12px] font-medium text-slate-500 block text-center truncate mt-0.5">Fijo</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setNewProdImageAt(activeImageSlot, 'https://lh3.googleusercontent.com/aida-public/AB6AXuCSgEMFcohBrYDQ1yAr2bB5jh6EUadFlLLCxPKmfgE2QLHTSg4Z7ThpiVdK5kfP4wwIfWMjY9nQHs8knAWPqC486-YT5a82sg_ov7jl5RiPnbQyuayNJFnZyVsi2vPJ4vwrJIJWcSpETWv9b3xm7Zwq0BM8KjM2_8F0Zb5wdf_FcQtN7N1eYs6N1KUel3QTuVUJqS8JfyDRUP_-YKyFWJnyJdZgs2nr0cBFkup0UOqUK4-9rVBfLL8I9PwUDe9UUclf86F5WH7vhIyY')}
                        className={`p-1 border rounded-lg bg-white overflow-hidden transition-all ${newProdImages[activeImageSlot] === 'https://lh3.googleusercontent.com/aida-public/AB6AXuCSgEMFcohBrYDQ1yAr2bB5jh6EUadFlLLCxPKmfgE2QLHTSg4Z7ThpiVdK5kfP4wwIfWMjY9nQHs8knAWPqC486-YT5a82sg_ov7jl5RiPnbQyuayNJFnZyVsi2vPJ4vwrJIJWcSpETWv9b3xm7Zwq0BM8KjM2_8F0Zb5wdf_FcQtN7N1eYs6N1KUel3QTuVUJqS8JfyDRUP_-YKyFWJnyJdZgs2nr0cBFkup0UOqUK4-9rVBfLL8I9PwUDe9UUclf86F5WH7vhIyY' ? 'border-[#C67C3E] ring-1 ring-[#C67C3E]' : 'border-slate-200'}`}
                        title="Telescópico Techo"
                      >
                        <img referrerPolicy="no-referrer" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCSgEMFcohBrYDQ1yAr2bB5jh6EUadFlLLCxPKmfgE2QLHTSg4Z7ThpiVdK5kfP4wwIfWMjY9nQHs8knAWPqC486-YT5a82sg_ov7jl5RiPnbQyuayNJFnZyVsi2vPJ4vwrJIJWcSpETWv9b3xm7Zwq0BM8KjM2_8F0Zb5wdf_FcQtN7N1eYs6N1KUel3QTuVUJqS8JfyDRUP_-YKyFWJnyJdZgs2nr0cBFkup0UOqUK4-9rVBfLL8I9PwUDe9UUclf86F5WH7vhIyY" alt="Techo" className="w-full h-8 object-contain" />
                        <span className="text-[12px] font-medium text-slate-500 block text-center truncate mt-0.5">Techo</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setNewProdImageAt(activeImageSlot, 'https://lh3.googleusercontent.com/aida-public/AB6AXuAg-fu33tVovoVPAy8Annw3-DjhvRZlxospMeSg5rN7iNZBc81HB4xCrpEC9KqeXALX4SnFVTBCHkvdtRZ6ijL7Yg0xj8HpghguLWiplbtD990sVfyHKWugiBx6RBGdmmDxI_mmcGe-i2oVLBq1aFtxM9D_dWYPNZh1znR_6YTASCf3BEFv1UdRQJSiwPD5on2BJxhSDq-4L-jiYaM5n5TzMvzI8E3XYHZoVkO5oc1vha7npXcOf-vlVQvJI-sTu49QiH6it9mI0KbF')}
                        className={`p-1 border rounded-lg bg-white overflow-hidden transition-all ${newProdImages[activeImageSlot] === 'https://lh3.googleusercontent.com/aida-public/AB6AXuAg-fu33tVovoVPAy8Annw3-DjhvRZlxospMeSg5rN7iNZBc81HB4xCrpEC9KqeXALX4SnFVTBCHkvdtRZ6ijL7Yg0xj8HpghguLWiplbtD990sVfyHKWugiBx6RBGdmmDxI_mmcGe-i2oVLBq1aFtxM9D_dWYPNZh1znR_6YTASCf3BEFv1UdRQJSiwPD5on2BJxhSDq-4L-jiYaM5n5TzMvzI8E3XYHZoVkO5oc1vha7npXcOf-vlVQvJI-sTu49QiH6it9mI0KbF' ? 'border-[#C67C3E] ring-1 ring-[#C67C3E]' : 'border-slate-200'}`}
                        title="Pedestal de Piso"
                      >
                        <img referrerPolicy="no-referrer" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAg-fu33tVovoVPAy8Annw3-DjhvRZlxospMeSg5rN7iNZBc81HB4xCrpEC9KqeXALX4SnFVTBCHkvdtRZ6ijL7Yg0xj8HpghguLWiplbtD990sVfyHKWugiBx6RBGdmmDxI_mmcGe-i2oVLBq1aFtxM9D_dWYPNZh1znR_6YTASCf3BEFv1UdRQJSiwPD5on2BJxhSDq-4L-jiYaM5n5TzMvzI8E3XYHZoVkO5oc1vha7npXcOf-vlVQvJI-sTu49QiH6it9mI0KbF" alt="Pedestal" className="w-full h-8 object-contain" />
                        <span className="text-[12px] font-medium text-slate-500 block text-center truncate mt-0.5">Pedestal</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Upload Area */}
                {newImageSource === 'upload' && (
                  <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <label className="block text-[10.5px] text-slate-400 font-bold uppercase">Cargar Imagen para Foto {activeImageSlot + 1} (Drag & Drop / Clíc):</label>
                    <div className="flex items-center gap-3">
                      {newProdImages[activeImageSlot] && (
                        <img
                          src={newProdImages[activeImageSlot]}
                          alt="Previsualización"
                          className="w-12 h-12 rounded object-cover border border-slate-200 bg-white"
                        />
                      )}
                      <div className="flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const r = new FileReader();
                              r.onload = (evt) => {
                                setNewProdImageAt(activeImageSlot, evt.target?.result as string);
                              };
                              r.readAsDataURL(file);
                            }
                          }}
                          className="w-full text-[11.5px] text-slate-500 rounded border border-dashed border-slate-300 p-2 bg-white cursor-pointer hover:bg-slate-100 transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Custom Web URL info */}
                {newImageSource === 'url' && (
                  <div className="space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-sans">
                    <label className="block text-[10.5px] text-slate-400 font-bold uppercase">Dirección URL de la Imagen para Foto {activeImageSlot + 1}:</label>
                    <input
                      type="url"
                      value={newProdImages[activeImageSlot] || ''}
                      onChange={(e) => setNewProdImageAt(activeImageSlot, e.target.value)}
                      placeholder="https://ejemplo.com/imagen.jpg"
                      className="w-full bg-white border p-1.5 text-[11.5px] rounded focus:outline-[#051125]"
                    />
                  </div>
                )}
              </div>

              <button 
                type="submit"
                className="w-full bg-[#051125] hover:bg-slate-800 text-white font-bold py-2.5 sm:py-3 rounded-lg text-[13.8px] cursor-pointer transition-colors"
              >
                Inscribir Nuevo Soporte
              </button>

            </form>
          </div>

          {/* Product list manager with direct Actions (7 columns) */}
          <div className="lg:col-span-7 bg-white border-t-4 border-t-[#C67C3E] border border-slate-200/80 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Planilla de Productos para Venta</h3>
            </div>
            
            <div className="overflow-auto max-h-[350px] border border-slate-200 rounded-lg">
              <table className="w-full text-left text-[11px] border-collapse divide-y divide-slate-200">
                <thead className="bg-[#051125] text-slate-200 sticky top-0 z-20 shadow-xs">
                  <tr className="uppercase tracking-wider text-[11px] border-b border-slate-200/20 font-extrabold">
                    <th className="py-1.5 px-2.5 font-bold text-white/95">SKU / Modelo</th>
                    <th className="py-1.5 px-2.5 font-bold text-white/95">Categoría</th>
                    <th className="py-1.5 px-2.5 text-right font-bold text-white/95">Precio unit.</th>
                    <th className="py-1.5 px-2.5 text-center font-bold text-white/95">Tipo</th>
                    <th className="py-1.5 px-2.5 text-right font-bold text-white/95">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans text-slate-700 bg-white">
                  {products.map(prod => (
                    <tr key={prod.id} className="hover:bg-[#C67C3E]/5 transition-all duration-200 border-b border-slate-100">
                      <td className="py-1.5 px-2.5">
                        <div className="font-mono font-bold text-[#051125] text-xs leading-none">{prod.sku}</div>
                        <div className="text-slate-500 text-[11px] line-clamp-1 font-medium mt-0.5">{prod.name}</div>
                      </td>
                      <td className="py-1.5 px-2.5 capitalize font-semibold text-slate-600">{prod.category}</td>
                      <td className="py-1.5 px-2.5 text-right font-mono text-[#051125] font-bold">Bs. {prod.price}</td>
                      <td className="py-1.5 px-2.5 text-center">
                        <span className={`text-[10.5px] px-1.5 py-0.2 rounded-full font-bold border ${
                          prod.stockLevel === 'Compra-Venta' ? 'bg-cyan-50 text-cyan-700 border-cyan-200' :
                          prod.stockLevel === 'Modificado' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          prod.stockLevel === 'Fabricado' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                          prod.stockLevel === 'In Stock' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          prod.stockLevel === 'Low Stock' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {prod.stockLevel === 'Compra-Venta' ? 'Compra-Venta' :
                           prod.stockLevel === 'Modificado' ? 'Modificado' :
                           prod.stockLevel === 'Fabricado' ? 'Fabricado' :
                           prod.stockLevel === 'In Stock' ? 'Ok' : 
                           prod.stockLevel === 'Low Stock' ? 'Bajo' : 'S/S'}
                        </span>
                      </td>
                      <td className="py-1.5 px-2.5 text-right space-x-1.5 whitespace-nowrap">
                        <button 
                          onClick={() => {
                            initiateEditProduct(prod);
                          }}
                          className="text-slate-400 hover:text-[#C67C3E] p-1 rounded hover:bg-[#C67C3E]/5 transition-colors inline-block cursor-pointer"
                          title="Editar Producto / Modelo"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => {
                            if (confirm(`¿Confirmas remover el modelo ${prod.sku} (${prod.name}) del catálogo permanentemente?`)) {
                              onDeleteProduct(prod.id);
                            }
                          }}
                          className="text-rose-400 hover:text-rose-700 p-1 rounded hover:bg-rose-50 transition-colors inline-block cursor-pointer"
                          title="Eliminar de la venta"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>

        </div>
      )}

      {/* OPERATORS & LOGISTICS SCHEDULER VIEW (GESTION DE USUARIOS UNIFICADO) */}
      {activeTab === 'techs' && (
        <div className="space-y-8 animate-fade-in text-xs">
          
          {/* Header Banner */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div>
              <h3 className="text-lg font-bold text-[#051125] flex items-center gap-2">
                <Users className="w-5 h-5 text-[#C67C3E]" />
                Gestión de Usuarios y Roles
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Módulo unificado para administrar las credenciales de usuarios y roles operativos de la plataforma.
              </p>
            </div>
          </div>

          {/* SECCIÓN USUARIOS CON ACCESO A LA PLATAFORMA */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b pb-2">
              <ShieldCheck className="w-5 h-5 text-[#C67C3E]" />
              <h4 className="text-sm font-bold text-[#051125] uppercase tracking-wider">Usuarios con Acceso al Sistema y Roles</h4>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Form Column */}
              <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-1.5 border-b pb-2 mb-2">
                  <UserPlus className="w-4 h-4 text-[#C67C3E]" />
                  <h5 className="font-bold text-slate-800 uppercase tracking-widest text-[14px]">Registrar Nuevo Usuario</h5>
                </div>
                
                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div>
                    <label className="block text-[13px] text-slate-500 font-bold uppercase mb-1">Nombre Completo:</label>
                    <input 
                      type="text" 
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      placeholder="Ej. Ing. René Choque"
                      required
                      className="w-full bg-slate-50 border p-2 text-xs rounded text-slate-800 focus:outline-[#051125]"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] text-slate-500 font-bold uppercase mb-1">Rol Operativo en Sistema:</label>
                    <select
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value)}
                      className="w-full bg-slate-50 border p-2 text-xs rounded text-slate-800 cursor-pointer focus:outline-[#051125]"
                    >
                      <option value="Admin">Admin (Control Total)</option>
                      <option value="Empleado (Ventas)">Empleado (Ventas & Caja)</option>
                      <option value="Empleado (Logística)">Empleado (Logística & Despacho)</option>
                      <option value="Empleado (Técnico)">Empleado (Soporte Técnico)</option>
                    </select>
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-[#051125] hover:bg-slate-800 text-white font-bold py-2.5 rounded-lg text-xs cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Asignar Rol & Crear Acceso
                  </button>
                </form>
              </div>

              {/* Table Column */}
              <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col justify-between">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <h5 className="font-bold text-slate-800 uppercase tracking-widest text-[14px]">Personal Autenticado & Estado</h5>
                    <p className="text-[13px] text-slate-400">Control de privilegios y accesos de usuarios Torre Forte</p>
                  </div>

                  {/* Search users */}
                  <div className="relative flex items-center bg-white border border-slate-300 rounded-lg text-xs w-full sm:w-48 shadow-xs">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5" />
                    <input
                      type="text"
                      value={userSearchText}
                      onChange={(e) => setUserSearchText(e.target.value)}
                      placeholder="Filtrar por nombre..."
                      className="pl-8 pr-2 py-1.5 rounded-lg border-none bg-transparent w-full focus:outline-none focus:ring-0 text-xs text-slate-700"
                    />
                  </div>
                </div>

                <div className="overflow-auto max-h-[350px] border border-slate-200/60 rounded-lg">
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead className="bg-[#051125] text-slate-200 sticky top-0 z-20 shadow-xs">
                      <tr className="uppercase tracking-wider text-[11px] font-extrabold border-b border-slate-200/20">
                        <th className="py-1.5 px-2.5 font-bold text-white/95">Nombre del Usuario</th>
                        <th className="py-1.5 px-2.5 font-bold text-white/95">Rol del Sistema</th>
                        <th className="py-1.5 px-2.5 font-bold text-white/95">Último Acceso</th>
                        <th className="py-1.5 px-2.5 text-center font-bold text-white/95">Estado Oficial</th>
                        <th className="py-1.5 px-2.5 text-right font-bold text-white/95">Opciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-sans text-slate-700 bg-white">
                      {usersList
                        .filter(usr => usr.name.toLowerCase().includes(userSearchText.toLowerCase()))
                        .map(usr => {
                          const isEditing = editingUserId === usr.id;
                          return (
                            <tr key={usr.id} className="hover:bg-[#C67C3E]/5 transition-all duration-200">
                              <td className="py-1 px-2.5 font-bold text-[#051125] flex items-center gap-1.5">
                                {isEditing ? (
                                  <input 
                                    type="text" 
                                    value={editUserName}
                                    onChange={(e) => setEditUserName(e.target.value)}
                                    className="bg-slate-50 border p-1 rounded text-xs text-slate-800 focus:outline-[#051125] min-w-[124px] w-full"
                                    required
                                  />
                                ) : (
                                  <>
                                    <div className="w-6 h-6 rounded bg-[#051125] text-[#C67C3E] flex items-center justify-center font-black text-[10px] border border-[#C67C3E]/20">
                                      {usr.name.charAt(0)}
                                    </div>
                                    <span className="text-[11.5px]">{usr.name}</span>
                                  </>
                                )}
                              </td>
                              <td className="py-1 px-2.5 text-slate-500 font-mono font-semibold text-[11px]">
                                {isEditing ? (
                                  <select
                                    value={editUserRole}
                                    onChange={(e) => setEditUserRole(e.target.value)}
                                    className="bg-slate-50 border p-1 rounded text-[11px] text-slate-800 cursor-pointer focus:outline-[#051125]"
                                  >
                                    <option value="Admin">Admin</option>
                                    <option value="Empleado (Ventas)">Empleado (Ventas & Caja)</option>
                                    <option value="Empleado (Logística)">Empleado (Logística & Despacho)</option>
                                    <option value="Empleado (Técnico)">Empleado (Soporte Técnico)</option>
                                  </select>
                                ) : (
                                  usr.role
                                )}
                              </td>
                              <td className="py-1 px-2.5 text-slate-400 font-mono text-[11px]">{usr.lastAccess}</td>
                              <td className="py-1 px-2.5 text-center text-[10px]">
                                {isEditing ? (
                                  <select 
                                    onChange={(e) => setEditUserStatus(e.target.value as any)}
                                    value={editUserStatus}
                                    className="bg-slate-50 border border-slate-200 rounded p-1 text-[11px] text-slate-700 focus:outline-[#051125] cursor-pointer inline-block"
                                    title="Modificar Estado del Usuario"
                                  >
                                    <option value="Activo">Activo</option>
                                    <option value="Offline">Offline</option>
                                    <option value="Suspendido">Suspendido</option>
                                  </select>
                                ) : (
                                  <span className={`inline-block px-1.5 py-0.2 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                    usr.status === 'Activo' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                                    usr.status === 'Offline' ? 'bg-slate-50 text-slate-500 border border-slate-200' :
                                    'bg-red-50 text-red-700 border border-red-200'
                                  }`}>
                                    {usr.status}
                                  </span>
                                )}
                              </td>
                              <td className="py-1 px-2.5 text-right space-x-0.5 whitespace-nowrap">
                                {isEditing ? (
                                  <div className="inline-flex gap-1">
                                    <button 
                                      onClick={handleUpdateUser}
                                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10.5px] font-bold py-0.5 px-2 rounded transition-all cursor-pointer"
                                    >
                                      Guardar
                                    </button>
                                    <button 
                                      onClick={() => setEditingUserId(null)}
                                      className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10.5px] font-bold py-0.5 px-2 rounded transition-all cursor-pointer"
                                    >
                                      Cancelar
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <button 
                                      onClick={() => handleStartEditUser(usr)}
                                      className="text-amber-600 hover:text-amber-800 p-1 rounded hover:bg-amber-50 transition-colors inline-block cursor-pointer"
                                      title="Editar Usuario"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteUser(usr.id)}
                                      className="text-rose-400 hover:text-rose-700 p-1 rounded hover:bg-rose-50 transition-colors inline-block cursor-pointer"
                                      title="Revocar Acceso del Usuario"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* EDICION INICIO TAB VIEW */}
      {activeTab === 'edicion_inicio' && (
        <div className="space-y-6 animate-fade-in text-xs">
          
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <h3 className="text-lg font-bold text-[#051125] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#C67C3E]" />
                Edición de Inicio (Landing Page)
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Modifique dinámicamente los textos, títulos, métricas y secciones informativas de la página de inicio. Los cambios se guardarán automáticamente en memoria local.
              </p>
            </div>
            <div>
              <button
                onClick={() => {
                  if (onUpdateLandingConfigs) {
                    onUpdateLandingConfigs({
                      heroBgImage: localHeroBgImage,
                      heroTag: localHeroTag,
                      heroTitle: localHeroTitle,
                      heroDescription: localHeroDescription,
                      metric1Val: localMetric1Val,
                      metric1Label: localMetric1Label,
                      metric2Val: localMetric2Val,
                      metric2Label: localMetric2Label,
                      metric3Val: localMetric3Val,
                      metric3Label: localMetric3Label,

                      servicesTitle: localServicesTitle,
                      servicesSubtitle: localServicesSubtitle,
                      service1Title: localService1Title,
                      service1Desc: localService1Desc,
                      service2Title: localService2Title,
                      service2Desc: localService2Desc,
                      service3Title: localService3Title,
                      service3Desc: localService3Desc,

                      aboutTitle: localAboutTitle,
                      aboutLocationTitle: localAboutLocationTitle,
                      aboutLocationDesc: localAboutLocationDesc,
                      aboutHoursTitle: localAboutHoursTitle,
                      aboutHoursDesc: localAboutHoursDesc,
                      aboutContactTitle: localAboutContactTitle,
                      aboutContactDesc: localAboutContactDesc,

                      service1Bullet1: localService1Bullet1,
                      service1Bullet2: localService1Bullet2,
                      service1Bullet3: localService1Bullet3,
                      service2Bullet1: localService2Bullet1,
                      service2Bullet2: localService2Bullet2,
                      service2Bullet3: localService2Bullet3,
                      service3Bullet1: localService3Bullet1,
                      service3Bullet2: localService3Bullet2,
                      service3Bullet3: localService3Bullet3,

                      matrizTitle: localMatrizTitle,
                      matrizOpt1Title: localMatrizOpt1Title,
                      matrizOpt1Desc: localMatrizOpt1Desc,
                      matrizOpt2Title: localMatrizOpt2Title,
                      matrizOpt2Desc: localMatrizOpt2Desc,

                      deliveryTitle: localDeliveryTitle,
                      deliveryCity1Name: localDeliveryCity1Name,
                      deliveryCity1Time: localDeliveryCity1Time,
                      deliveryCity2Name: localDeliveryCity2Name,
                      deliveryCity2Time: localDeliveryCity2Time,
                      deliveryCity3Name: localDeliveryCity3Name,
                      deliveryCity3Time: localDeliveryCity3Time,
                    });
                    setShowSaveToast(true);
                    setTimeout(() => setShowSaveToast(false), 3500);
                  }
                }}
                className="flex items-center gap-1.5 bg-[#C67C3E] hover:bg-[#b06c32] text-white font-bold px-5 py-3 rounded-lg transition-all text-xs uppercase tracking-wider cursor-pointer shadow-md"
              >
                <Check className="w-4 h-4" />
                Guardar Cambios
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* HEROS & METRICS SECTION */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h4 className="text-sm font-extrabold text-[#051125] border-b pb-2 flex items-center gap-2 uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                Sección Hero & Métricas
              </h4>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-[14px] font-bold text-slate-700 mb-1">Imagen de Fondo del Hero (URL o Ruta Local)</label>
                  <input 
                    type="text" 
                    value={localHeroBgImage} 
                    onChange={(e) => setLocalHeroBgImage(e.target.value)} 
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-2 text-slate-800 focus:outline-none focus:border-[#C67C3E]"
                    placeholder="Ej: /assets/hero-bg.png o una URL de imagen propia"
                  />
                  <p className="text-[13px] text-slate-400 mt-0.5">Tip: Para usar tu propia imagen, puedes subir tu archivo como "hero-bg.jpg" o "hero-bg.png" directamente en la carpeta <strong>/assets</strong> usando el explorador de archivos, luego pon aquí <em>/assets/hero-bg.jpg</em> para cargarla de forma inmediata.</p>
                </div>

                <div>
                  <label className="block text-[14px] font-bold text-slate-700 mb-1">Etiqueta Pequeña (Tag)</label>
                  <input 
                    type="text" 
                    value={localHeroTag} 
                    onChange={(e) => setLocalHeroTag(e.target.value)} 
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-2 text-slate-800 focus:outline-none focus:border-[#C67C3E]"
                  />
                </div>
                
                <div>
                  <label className="block text-[14px] font-bold text-slate-700 mb-1">Título Principal (Hero Title)</label>
                  <textarea 
                    rows={3}
                    value={localHeroTitle} 
                    onChange={(e) => setLocalHeroTitle(e.target.value)} 
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-2 text-slate-800 focus:outline-none focus:border-[#C67C3E]"
                    placeholder="Escriba el título. Use corchetes [ ] para marcar texto amarillo"
                  />
                  <p className="text-[13px] text-slate-400 mt-0.5">Tip: El texto dentro de corchetes, ej: [climatización], se mostrará resaltado en color oro/amarillo.</p>
                </div>

                <div>
                  <label className="block text-[14px] font-bold text-slate-700 mb-1">Descripción del Hero</label>
                  <textarea 
                    rows={3}
                    value={localHeroDescription} 
                    onChange={(e) => setLocalHeroDescription(e.target.value)} 
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-2 text-slate-800 focus:outline-none focus:border-[#C67C3E]"
                  />
                </div>

                <div>
                  <label className="block text-[14px] font-bold text-slate-700 mb-1">URL de la Imagen de Fondo (Hero Background Image)</label>
                  <input 
                    type="text" 
                    value={localHeroBgImage} 
                    onChange={(e) => setLocalHeroBgImage(e.target.value)} 
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-2 text-slate-800 focus:outline-none focus:border-[#C67C3E]"
                    placeholder="Escriba o pegue la URL de la imagen de fondo (Unsplash, etc.)"
                  />
                  <p className="text-[13px] text-slate-400 mt-0.5">Tip: Introduzca cualquier URL de imagen válida para cambiar instantáneamente la portada principal.</p>
                </div>

                <div className="border-t pt-2 mt-4">
                  <span className="block text-[14px] font-bold text-[#051125] mb-2 uppercase">Métricas de Rendimiento</span>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[12px] font-bold text-slate-500 mb-0.5">Métrica 1 Valor</label>
                      <input 
                        type="text" 
                        value={localMetric1Val} 
                        onChange={(e) => setLocalMetric1Val(e.target.value)} 
                        className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-slate-800 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] font-bold text-slate-500 mb-0.5">Métrica 2 Valor</label>
                      <input 
                        type="text" 
                        value={localMetric2Val} 
                        onChange={(e) => setLocalMetric2Val(e.target.value)} 
                        className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-slate-800 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] font-bold text-slate-500 mb-0.5">Métrica 3 Valor</label>
                      <input 
                        type="text" 
                        value={localMetric3Val} 
                        onChange={(e) => setLocalMetric3Val(e.target.value)} 
                        className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-slate-800 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 mt-2">
                    <div>
                      <label className="block text-[12px] font-bold text-slate-500">Métrica 1 Etiqueta</label>
                      <input 
                        type="text" 
                        value={localMetric1Label} 
                        onChange={(e) => setLocalMetric1Label(e.target.value)} 
                        className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-800 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] font-bold text-slate-500">Métrica 2 Etiqueta</label>
                      <input 
                        type="text" 
                        value={localMetric2Label} 
                        onChange={(e) => setLocalMetric2Label(e.target.value)} 
                        className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-800 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] font-bold text-slate-500">Métrica 3 Etiqueta</label>
                      <input 
                        type="text" 
                        value={localMetric3Label} 
                        onChange={(e) => setLocalMetric3Label(e.target.value)} 
                        className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-800 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* SERVICES SECTION */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h4 className="text-sm font-extrabold text-[#051125] border-b pb-2 flex items-center gap-2 uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-[#C67C3E]"></span>
                Sección Servicios Técnicos
              </h4>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-[14px] font-bold text-slate-700 mb-1">Título de Sección</label>
                  <input 
                    type="text" 
                    value={localServicesTitle} 
                    onChange={(e) => setLocalServicesTitle(e.target.value)} 
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-2 text-slate-800 focus:outline-none focus:border-[#C67C3E]"
                  />
                </div>

                <div>
                  <label className="block text-[14px] font-bold text-slate-700 mb-1">Subtítulo de Sección</label>
                  <textarea 
                    rows={2}
                    value={localServicesSubtitle} 
                    onChange={(e) => setLocalServicesSubtitle(e.target.value)} 
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-2 text-slate-800 focus:outline-none"
                  />
                </div>

                <div className="border-t pt-3 space-y-3">
                  <span className="block text-[14px] font-bold text-[#051125] uppercase">Tarjetas de Servicio (Título & Descripción)</span>
                  
                  <div className="p-2.5 bg-slate-50 rounded border border-slate-150 space-y-2">
                    <span className="block text-[13px] font-extrabold text-sky-700">SERVICIO 1 (HVAC)</span>
                    <input 
                      type="text" 
                      value={localService1Title} 
                      onChange={(e) => setLocalService1Title(e.target.value)} 
                      className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-slate-800 focus:outline-none focus:border-[#C67C3E]"
                    />
                    <textarea 
                      rows={2}
                      value={localService1Desc} 
                      onChange={(e) => setLocalService1Desc(e.target.value)} 
                      className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-slate-800 text-[14px] focus:outline-none"
                    />
                    <div className="space-y-1.5 pt-1.5 border-t border-slate-100">
                      <span className="block text-[12px] font-bold text-slate-500 uppercase">Viñetas / Atributos:</span>
                      <input 
                        type="text" 
                        value={localService1Bullet1} 
                        onChange={(e) => setLocalService1Bullet1(e.target.value)} 
                        placeholder="Atributo 1"
                        className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-[14px] focus:outline-none focus:border-[#C67C3E]"
                      />
                      <input 
                        type="text" 
                        value={localService1Bullet2} 
                        onChange={(e) => setLocalService1Bullet2(e.target.value)} 
                        placeholder="Atributo 2"
                        className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-[14px] focus:outline-none focus:border-[#C67C3E]"
                      />
                      <input 
                        type="text" 
                        value={localService1Bullet3} 
                        onChange={(e) => setLocalService1Bullet3(e.target.value)} 
                        placeholder="Atributo 3"
                        className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-[14px] focus:outline-none focus:border-[#C67C3E]"
                      />
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded border border-slate-150 space-y-2">
                    <span className="block text-[13px] font-extrabold text-[#C67C3E]">SERVICIO 2 (SOPORTES)</span>
                    <input 
                      type="text" 
                      value={localService2Title} 
                      onChange={(e) => setLocalService2Title(e.target.value)} 
                      className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-slate-800 focus:outline-none"
                    />
                    <textarea 
                      rows={2}
                      value={localService2Desc} 
                      onChange={(e) => setLocalService2Desc(e.target.value)} 
                      className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-slate-800 text-[14px] focus:outline-none"
                    />
                    <div className="space-y-1.5 pt-1.5 border-t border-slate-100">
                      <span className="block text-[12px] font-bold text-slate-500 uppercase">Viñetas / Atributos:</span>
                      <input 
                        type="text" 
                        value={localService2Bullet1} 
                        onChange={(e) => setLocalService2Bullet1(e.target.value)} 
                        placeholder="Atributo 1"
                        className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-[14px] focus:outline-none"
                      />
                      <input 
                        type="text" 
                        value={localService2Bullet2} 
                        onChange={(e) => setLocalService2Bullet2(e.target.value)} 
                        placeholder="Atributo 2"
                        className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-[14px] focus:outline-none"
                      />
                      <input 
                        type="text" 
                        value={localService2Bullet3} 
                        onChange={(e) => setLocalService2Bullet3(e.target.value)} 
                        placeholder="Atributo 3"
                        className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-[14px] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded border border-slate-150 space-y-2">
                    <span className="block text-[13px] font-extrabold text-slate-600">SERVICIO 3 (LOGÍSTICA)</span>
                    <input 
                      type="text" 
                      value={localService3Title} 
                      onChange={(e) => setLocalService3Title(e.target.value)} 
                      className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-slate-800 focus:outline-none"
                    />
                    <textarea 
                      rows={2}
                      value={localService3Desc} 
                      onChange={(e) => setLocalService3Desc(e.target.value)} 
                      className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-slate-800 text-[14px] focus:outline-none"
                    />
                    <div className="space-y-1.5 pt-1.5 border-t border-slate-100">
                      <span className="block text-[12px] font-bold text-slate-500 uppercase">Viñetas / Atributos:</span>
                      <input 
                        type="text" 
                        value={localService3Bullet1} 
                        onChange={(e) => setLocalService3Bullet1(e.target.value)} 
                        placeholder="Atributo 1"
                        className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-[14px] focus:outline-none"
                      />
                      <input 
                        type="text" 
                        value={localService3Bullet2} 
                        onChange={(e) => setLocalService3Bullet2(e.target.value)} 
                        placeholder="Atributo 2"
                        className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-[14px] focus:outline-none"
                      />
                      <input 
                        type="text" 
                        value={localService3Bullet3} 
                        onChange={(e) => setLocalService3Bullet3(e.target.value)} 
                        placeholder="Atributo 3"
                        className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-[14px] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* ABOUT US & CONTACT SECTION */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h4 className="text-sm font-extrabold text-[#051125] border-b pb-2 flex items-center gap-2 uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Sección Sobre Nosotros & Info
              </h4>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-[14px] font-bold text-slate-700 mb-1">Título Principal de Sección</label>
                  <input 
                    type="text" 
                    value={localAboutTitle} 
                    onChange={(e) => setLocalAboutTitle(e.target.value)} 
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-2 text-slate-800 focus:outline-none"
                  />
                </div>

                <div className="border-t pt-3 space-y-3">
                  <div>
                    <label className="block text-[14px] font-bold text-slate-700 mb-1">Título Ubicación Central</label>
                    <input 
                      type="text" 
                      value={localAboutLocationTitle} 
                      onChange={(e) => setLocalAboutLocationTitle(e.target.value)} 
                      className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 focus:outline-none font-bold"
                    />
                    <label className="block text-[12px] font-semibold text-slate-400 mt-1">Dirección Completa</label>
                    <textarea 
                      rows={2}
                      value={localAboutLocationDesc} 
                      onChange={(e) => setLocalAboutLocationDesc(e.target.value)} 
                      className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 focus:outline-none text-[14px] mt-0.5"
                    />
                  </div>

                  <div>
                    <label className="block text-[14px] font-bold text-slate-700 mb-1">Título de Horarios</label>
                    <input 
                      type="text" 
                      value={localAboutHoursTitle} 
                      onChange={(e) => setLocalAboutHoursTitle(e.target.value)} 
                      className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 focus:outline-none font-bold"
                    />
                    <label className="block text-[12px] font-semibold text-slate-400 mt-1">Horas de Atención (use líneas para saltos)</label>
                    <textarea 
                      rows={2}
                      value={localAboutHoursDesc} 
                      onChange={(e) => setLocalAboutHoursDesc(e.target.value)} 
                      className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 focus:outline-none text-[14px] mt-0.5"
                    />
                  </div>

                  <div>
                    <label className="block text-[14px] font-bold text-slate-700 mb-1">Título de Contacto</label>
                    <input 
                      type="text" 
                      value={localAboutContactTitle} 
                      onChange={(e) => setLocalAboutContactTitle(e.target.value)} 
                      className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 focus:outline-none font-bold"
                    />
                    <label className="block text-[12px] font-semibold text-slate-400 mt-1">Datos de Contacto (use líneas para saltos)</label>
                    <textarea 
                      rows={2}
                      value={localAboutContactDesc} 
                      onChange={(e) => setLocalAboutContactDesc(e.target.value)} 
                      className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 focus:outline-none text-[14px] mt-0.5"
                    />
                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* SECCIÓN MATRIZ DE CARGA DE PARED Y ANCLAJES RECOMENDADOS */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h4 className="text-sm font-extrabold text-[#051125] border-b pb-2 flex items-center gap-2 uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              Personalización de Matriz de Carga de Pared (Consejos de Pared)
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <div>
                  <label className="block text-[14px] font-bold text-slate-700 mb-1">Título de la Matriz/Consejos</label>
                  <input 
                    type="text" 
                    value={localMatrizTitle} 
                    onChange={(e) => setLocalMatrizTitle(e.target.value)} 
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-2 text-slate-800 focus:outline-none focus:border-[#C67C3E]"
                  />
                </div>
              </div>

              <div className="space-y-3 p-4 bg-slate-50 rounded border border-slate-150">
                <span className="block text-[13px] font-extrabold text-[#051125] uppercase">Opción 1: Pared de Ladrillo / Hormigón</span>
                <div>
                  <label className="block text-[12px] font-bold text-slate-500 mb-0.5">Título Opción 1</label>
                  <input 
                    type="text" 
                    value={localMatrizOpt1Title} 
                    onChange={(e) => setLocalMatrizOpt1Title(e.target.value)} 
                    className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-slate-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-slate-500 mb-0.5">Descripción Opción 1</label>
                  <textarea 
                    rows={3}
                    value={localMatrizOpt1Desc} 
                    onChange={(e) => setLocalMatrizOpt1Desc(e.target.value)} 
                    className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-slate-800 text-[14px] focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-3 p-4 bg-amber-50/20 rounded border border-amber-150">
                <span className="block text-[13px] font-extrabold text-amber-800 uppercase">Opción 2: Tabiquería Drywall / Yeso</span>
                <div>
                  <label className="block text-[12px] font-bold text-slate-500 mb-0.5">Título Opción 2</label>
                  <input 
                    type="text" 
                    value={localMatrizOpt2Title} 
                    onChange={(e) => setLocalMatrizOpt2Title(e.target.value)} 
                    className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-slate-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-slate-500 mb-0.5">Descripción Opción 2</label>
                  <textarea 
                    rows={3}
                    value={localMatrizOpt2Desc} 
                    onChange={(e) => setLocalMatrizOpt2Desc(e.target.value)} 
                    className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-slate-800 text-[14px] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECCIÓN TIEMPOS DE ENTREGA Y DESPACHOS */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h4 className="text-sm font-extrabold text-[#051125] border-b pb-2 flex items-center gap-2 uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-[#C67C3E]"></span>
              Personalización de Tiempos y Frecuencia de Despachos (Entregas)
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-3">
                <div>
                  <label className="block text-[14px] font-bold text-slate-700 mb-1">Título de la Sección Despachos</label>
                  <input 
                    type="text" 
                    value={localDeliveryTitle} 
                    onChange={(e) => setLocalDeliveryTitle(e.target.value)} 
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-2 text-slate-800 focus:outline-[#C67C3E] focus:border-[#C67C3E]"
                  />
                </div>
              </div>

              <div className="space-y-3 p-4 bg-slate-50 rounded border border-slate-150">
                <span className="block text-[13px] font-extrabold text-[#051125] uppercase">Ciudad 1</span>
                <div>
                  <label className="block text-[12px] font-bold text-slate-500 mb-0.5">Nombre Ciudad / Zona</label>
                  <input 
                    type="text" 
                    value={localDeliveryCity1Name} 
                    onChange={(e) => setLocalDeliveryCity1Name(e.target.value)} 
                    className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-slate-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-slate-500 mb-0.5">Rango de Entrega / Tiempo</label>
                  <input 
                    type="text" 
                    value={localDeliveryCity1Time} 
                    onChange={(e) => setLocalDeliveryCity1Time(e.target.value)} 
                    className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-3 p-4 bg-slate-50 rounded border border-slate-150">
                <span className="block text-[13px] font-extrabold text-[#051125] uppercase">Ciudad 2</span>
                <div>
                  <label className="block text-[12px] font-bold text-slate-500 mb-0.5">Nombre Ciudad / Zona</label>
                  <input 
                    type="text" 
                    value={localDeliveryCity2Name} 
                    onChange={(e) => setLocalDeliveryCity2Name(e.target.value)} 
                    className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-slate-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-slate-500 mb-0.5">Rango de Entrega / Tiempo</label>
                  <input 
                    type="text" 
                    value={localDeliveryCity2Time} 
                    onChange={(e) => setLocalDeliveryCity2Time(e.target.value)} 
                    className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-3 p-4 bg-slate-50 rounded border border-slate-150">
                <span className="block text-[13px] font-extrabold text-[#051125] uppercase">Ciudad 3</span>
                <div>
                  <label className="block text-[12px] font-bold text-slate-500 mb-0.5">Nombre Ciudad / Zona</label>
                  <input 
                    type="text" 
                    value={localDeliveryCity3Name} 
                    onChange={(e) => setLocalDeliveryCity3Name(e.target.value)} 
                    className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-slate-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-slate-500 mb-0.5">Rango de Entrega / Tiempo</label>
                  <input 
                    type="text" 
                    value={localDeliveryCity3Time} 
                    onChange={(e) => setLocalDeliveryCity3Time(e.target.value)} 
                    className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-slate-800 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end p-2 bg-slate-50 rounded-xl border border-dashed border-slate-200 mt-4">
            <button
              onClick={() => {
                if (onUpdateLandingConfigs) {
                  onUpdateLandingConfigs({
                    heroBgImage: localHeroBgImage,
                    heroTag: localHeroTag,
                    heroTitle: localHeroTitle,
                    heroDescription: localHeroDescription,
                    metric1Val: localMetric1Val,
                    metric1Label: localMetric1Label,
                    metric2Val: localMetric2Val,
                    metric2Label: localMetric2Label,
                    metric3Val: localMetric3Val,
                    metric3Label: localMetric3Label,

                    servicesTitle: localServicesTitle,
                    servicesSubtitle: localServicesSubtitle,
                    service1Title: localService1Title,
                    service1Desc: localService1Desc,
                    service2Title: localService2Title,
                    service2Desc: localService2Desc,
                    service3Title: localService3Title,
                    service3Desc: localService3Desc,

                    aboutTitle: localAboutTitle,
                    aboutLocationTitle: localAboutLocationTitle,
                    aboutLocationDesc: localAboutLocationDesc,
                    aboutHoursTitle: localAboutHoursTitle,
                    aboutHoursDesc: localAboutHoursDesc,
                    aboutContactTitle: localAboutContactTitle,
                    aboutContactDesc: localAboutContactDesc,

                    service1Bullet1: localService1Bullet1,
                    service1Bullet2: localService1Bullet2,
                    service1Bullet3: localService1Bullet3,
                    service2Bullet1: localService2Bullet1,
                    service2Bullet2: localService2Bullet2,
                    service2Bullet3: localService2Bullet3,
                    service3Bullet1: localService3Bullet1,
                    service3Bullet2: localService3Bullet2,
                    service3Bullet3: localService3Bullet3,

                    matrizTitle: localMatrizTitle,
                    matrizOpt1Title: localMatrizOpt1Title,
                    matrizOpt1Desc: localMatrizOpt1Desc,
                    matrizOpt2Title: localMatrizOpt2Title,
                    matrizOpt2Desc: localMatrizOpt2Desc,

                    deliveryTitle: localDeliveryTitle,
                    deliveryCity1Name: localDeliveryCity1Name,
                    deliveryCity1Time: localDeliveryCity1Time,
                    deliveryCity2Name: localDeliveryCity2Name,
                    deliveryCity2Time: localDeliveryCity2Time,
                    deliveryCity3Name: localDeliveryCity3Name,
                    deliveryCity3Time: localDeliveryCity3Time,
                  });
                  setShowSaveToast(true);
                  setTimeout(() => setShowSaveToast(false), 3500);
                }
              }}
              className="flex items-center gap-2 bg-[#C67C3E] hover:bg-[#b06c32] text-white font-[#C67C3E] font-extrabold px-6 py-3.5 rounded-xl transition-all text-xs uppercase tracking-wider cursor-pointer shadow-md"
            >
              <Check className="w-4 h-4" />
              Guardar Todos los Cambios de Texto
            </button>
          </div>

        </div>
      )}

      {/* SETTINGS AND MANAGEMENT TAB VIEW */}
      {activeTab === 'settings' && (
        <div className="space-y-6 animate-fade-in text-xs">
          
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <h3 className="text-lg font-bold text-[#051125] flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#C67C3E]" />
                Configuración de Plataforma & Auditoria
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Gestione las integraciones del sistema, roles de accesos, sincronización en la nube y audite la actividad de la plataforma en tiempo real.
              </p>
            </div>
            <div>
              <button
                onClick={() => setIsAdminRegisterOpen(true)}
                className="flex items-center gap-1.5 bg-[#C67C3E] hover:bg-[#b06c32] text-white font-bold px-4 py-2.5 rounded-lg transition-all text-xs uppercase tracking-wider cursor-pointer shadow-sm group whitespace-nowrap"
                title="Registrar Administrador con Acceso Total al Panel de Registros"
              >
                <ShieldCheck className="w-4 h-4 text-white group-hover:text-amber-200 transition-colors" />
                <span>Registrar Admin Total</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* LEFT COLUMN (8 cols): Sincronización & Usuarios */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              
              {/* Google Sheets & Firebase Sync Configuration */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b pb-2">
                  <RefreshCw className="w-4 h-4 text-sky-600 animate-spin-slow" />
                  Configuración de Sincronización en la Nube
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Google Sheets Sync Card */}
                  <form onSubmit={handleUpdateSheetsIds} className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-slate-700 flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-emerald-600" />
                          Google Sheets Setup
                        </span>
                        <span className="text-[12px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">
                          Conectado
                        </span>
                      </div>
                      <p className="text-[13px] text-slate-400 mb-2">Configure los IDs de sus plantillas corporativas.</p>
                      
                      <div className="space-y-2">
                        <div>
                          <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-1">Ventas & Cotizaciones (ID Hoja)</label>
                          <input 
                            type="text"
                            value={sheetsSalesId}
                            onChange={(e) => setSheetsSalesId(e.target.value)}
                            className="w-full bg-white border p-2 text-xs rounded text-slate-800 font-mono focus:outline-[#051125]"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-1">Inventario & Catálogo (ID Hoja)</label>
                          <input 
                            type="text"
                            value={sheetsInvId}
                            onChange={(e) => setSheetsInventoryId(e.target.value)}
                            className="w-full bg-white border p-2 text-xs rounded text-slate-800 font-mono focus:outline-[#051125]"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <button 
                      type="submit"
                      className="w-full bg-slate-800 hover:bg-[#051125] text-white font-bold py-1.5 rounded transition-colors text-center text-[13px] uppercase tracking-wider cursor-pointer"
                    >
                      Actualizar Hojas de Cálculo
                    </button>
                  </form>

                  {/* Firebase Database Sync Card */}
                  <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-slate-700 flex items-center gap-1.5">
                          <Building2 className="w-4 h-4 text-amber-500" />
                          Base de Datos (Firebase)
                        </span>
                        <span className="text-[12px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">
                          Activo
                        </span>
                      </div>
                      <p className="text-[13px] text-slate-400 mb-4">Estado del servicio en tiempo real para cotizaciones móviles y portal web.</p>
                      
                      <div className="space-y-2 border-t pt-2 text-[14px] text-slate-600">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Última sincronía:</span>
                          <span className="font-bold text-slate-700">{firebaseLastSync}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Operaciones DB (Hoy):</span>
                          <span className="font-semibold text-slate-700">{firebaseOpsToday} queries</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Tiempo de Ingress de Base:</span>
                          <span className="font-mono text-emerald-600 font-bold">12ms (Excelente)</span>
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={handleFirebaseSync}
                      disabled={isFirebaseSyncing}
                      className={`w-full text-white font-bold py-1.5 rounded transition-colors text-[13px] uppercase tracking-wider cursor-pointer flex justify-center items-center gap-1.5 ${isFirebaseSyncing ? 'bg-amber-400 text-amber-900 cursor-not-allowed' : 'bg-[#051125] hover:bg-slate-800'}`}
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isFirebaseSyncing ? 'animate-spin' : ''}`} />
                      {isFirebaseSyncing ? 'Sincronizando...' : 'Forzar Sincronía Firebase'}
                    </button>
                  </div>

                </div>
              </div>

            </div>

            {/* RIGHT COLUMN (4 cols): Audit log y control de ediciones */}
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl shadow-sm p-4 flex flex-col justify-between space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b pb-2 mb-3">
                  <Clock className="w-4 h-4 text-[#C67C3E]" />
                  Planilla de Auditoría & Control de Ediciones
                </h4>
                <p className="text-[13px] text-slate-400 mb-4">Registro en vivo e inalterable de operaciones realizadas sobre la base de datos.</p>

                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {auditLogs.map(log => (
                    <div key={log.id} className="p-3 border border-slate-100 rounded-xl bg-slate-50 hover:border-[#C67C3E]/30 transition-all text-xs space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-[13px] font-mono font-bold text-[#C67C3E]">{log.time}</span>
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                          log.type === 'Modificación' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          log.type === 'Creación' ? 'bg-emerald-50 text-emerald-700 border border-emerald-250' :
                          log.type === 'Eliminación' ? 'bg-red-50 text-red-700 border border-red-200' :
                          'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {log.type}
                        </span>
                      </div>
                      <p className="text-[14px] font-semibold text-slate-700 tracking-tight leading-relaxed">{log.description}</p>
                      <div className="text-[12px] text-slate-500 font-bold flex items-center gap-1">
                        <UserPlus className="w-3 h-3 text-slate-400" />
                        {log.user === 'Sistema' ? '⚙️ Sistema de Sincronía' : `Operador: ${log.user}`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-center border-t pt-3">
                <button 
                  onClick={() => alert(`Control de ediciones exportado con éxito. Se detectaron ${auditLogs.length} acciones válidas de auditoría`)}
                  className="text-[13px] uppercase tracking-wider font-extrabold text-[#C67C3E] hover:text-[#051125] transition-colors"
                >
                  Descargar Reporte Completo (Excel/PDF)
                </button>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* GASTOS TAB VIEW */}
      {activeTab === 'expenses' && (
        <div className="space-y-3.5 md:space-y-6 animate-fade-in text-xs">
          
          <div className="hidden md:flex bg-white p-4 md:p-6 rounded-xl border border-slate-200 shadow-sm flex-col md:flex-row justify-between items-start md:items-center gap-2 md:gap-4 font-sans">
            <div>
              <h3 className="text-base md:text-lg font-bold text-[#051125] flex items-center gap-1.5 md:gap-2">
                <Plus className="w-4 h-4 md:w-5 md:h-5 text-rose-600 animate-pulse" />
                Control de Gastos Operacionales
              </h3>
              <p className="text-[11px] md:text-xs text-slate-500 mt-1 leading-normal">
                Monitoree los costos operacionales quincenales, egresos fijos y variables incurridos en la administración de Torre Forte.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <button
                onClick={() => setIsExpenseModalOpen(true)}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 px-4 rounded-lg text-xs cursor-pointer flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Registrar Gasto Operacional
              </button>
            </div>
          </div>

          {/* Metric Cards Row */}
          <div className="grid grid-cols-2 md:grid-cols-2 gap-2 md:gap-6">
            {/* Gastos Operativos Card */}
            <div className="bg-rose-50/70 md:bg-white border border-rose-100/85 md:border-slate-200 rounded-xl p-3 md:p-5 shadow-xs md:shadow-sm flex flex-col justify-between">
              <span className="text-[10px] md:text-[13px] text-rose-700 md:text-slate-400 font-extrabold md:font-bold uppercase tracking-tight md:tracking-wider block">Gastos Operativos MTD</span>
              <div className="flex items-end justify-between mt-1 md:mt-2">
                <span className="text-[13px] md:text-xl font-mono font-black md:font-bold text-rose-900 md:text-[#051125]">
                  Bs. {expenseRecords.reduce((acc, exp) => acc + exp.amount, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-[8px] md:text-[13px] font-black md:font-bold text-rose-850 md:text-red-600 bg-rose-100/50 md:bg-red-50 border border-rose-200 md:border-red-200 px-1.5 py-0.2 md:py-0.5 rounded-full">
                  Normal
                </span>
              </div>
            </div>

            {/* Fondo de Caja Disponible Card */}
            <div className="bg-emerald-50/75 md:bg-white border border-emerald-100/85 md:border-slate-200 rounded-xl p-3 md:p-5 shadow-xs md:shadow-sm flex flex-col justify-between">
              <span className="text-[10px] md:text-[13px] text-emerald-700 md:text-slate-400 font-extrabold md:font-bold uppercase tracking-tight md:tracking-wider block">
                <span className="md:hidden">Fondo de Caja</span>
                <span className="hidden md:inline">Fondo de Caja Disponible (Ref)</span>
              </span>
              <div className="flex items-end justify-between mt-1 md:mt-2">
                <span className="text-[13px] md:text-xl font-mono font-black md:font-bold text-[#051125] md:text-emerald-700">
                  Bs. {(112050.00 - expenseRecords.reduce((acc, exp) => acc + exp.amount, 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-[8px] md:text-[13px] font-black md:font-bold text-emerald-800 md:text-emerald-700 bg-emerald-100/50 md:bg-emerald-50 border border-emerald-250 md:border-emerald-200 px-1.5 py-0.2 md:py-0.5 rounded-full">
                  Suficiente
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8">
            {/* List Table */}
            <div className="bg-white border-t-4 border-t-rose-650 border border-slate-200/80 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Planilla de Egresos & Compras Recientes</h4>
                    <p className="text-[13px] text-slate-400 font-mono">Últimas transacciones de gastos registradas en Torre Forte</p>
                  </div>
                  
                  {/* Search Bar */}
                  <div className="relative flex items-center bg-white border border-slate-400 rounded-lg text-xs w-full md:w-64 shadow-xs">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5" />
                    <input
                      type="text"
                      value={expSearchFilter}
                      onChange={(e) => setExpSearchFilter(e.target.value)}
                      placeholder="Buscar por glosa, categoría o usuario..."
                      className="pl-8 pr-2 py-1.5 rounded-lg border-none bg-transparent w-full focus:outline-none focus:ring-0 text-xs text-slate-700"
                    />
                  </div>
                </div>

                {/* Advanced Filter Row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-200/50">
                  {/* Filter by Category */}
                  <div className="space-y-1 col-span-2 lg:col-span-1">
                    <span className="block text-[12px] md:text-[14px] font-bold text-slate-400 uppercase tracking-widest">Categoría:</span>
                    <select
                      value={expCategoryFilter}
                      onChange={(e) => setExpCategoryFilter(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg text-xs px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#C67C3E] text-slate-600 cursor-pointer"
                    >
                      <option value="all">📂 Todas las Categorías</option>
                      {expenseCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Filter by Operator */}
                  <div className="space-y-1 col-span-1">
                    <span className="block text-[12px] md:text-[14px] font-bold text-slate-400 uppercase tracking-widest truncate">
                      <span className="md:hidden">Cargado Por:</span>
                      <span className="hidden md:inline">Cargado Por (Usuario):</span>
                    </span>
                    <select
                      value={expOperatorFilter}
                      onChange={(e) => setExpOperatorFilter(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg text-xs px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#C67C3E] text-slate-600 cursor-pointer text-ellipsis text-[11px] md:text-xs"
                    >
                      <option value="all">👤 Todos los Usuarios</option>
                      {usersList.map(u => (
                        <option key={u.id} value={u.name}>👤 {u.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Filter by Period */}
                  <div className="space-y-1 col-span-1">
                    <span className="block text-[12px] md:text-[14px] font-bold text-slate-400 uppercase tracking-widest truncate">
                      Periodo:
                    </span>
                    <select
                      value={expTimePeriodFilter}
                      onChange={(e) => {
                        const val = e.target.value as any;
                        setExpTimePeriodFilter(val);
                        const availableWeeks = (Array.from(new Set(expenseRecords.map(r => {
                          const d = new Date(r.date);
                          if (isNaN(d.getTime())) return null;
                          const sun = new Date(d);
                          sun.setDate(d.getDate() - d.getDay());
                          return sun.toISOString().split('T')[0];
                        }).filter(Boolean))) as string[]).sort((a, b) => b.localeCompare(a));

                        if (val === 'week' && availableWeeks.length > 0 && expSelectedWeekStart === 'all') {
                          setExpSelectedWeekStart(availableWeeks[0]);
                        }
                      }}
                      className="w-full bg-white border border-slate-200 rounded-lg text-xs px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#C67C3E] text-slate-600 cursor-pointer text-ellipsis text-[11px] md:text-xs"
                    >
                      <option value="all">📅 Mostrar Todo</option>
                      <option value="last_week">📅 Última Semana Registrada</option>
                      <option value="week">📅 Ver de Semana Específica</option>
                      <option value="month">📅 Ver de Mes Específico</option>
                      <option value="year">📅 Ver de Año Específico</option>
                    </select>
                  </div>

                  {/* Dynamic sub-filters depending on period */}
                  <div className="space-y-1 col-span-2 lg:col-span-1">
                    {(() => {
                      const availableYears = (Array.from(new Set(expenseRecords.map(r => {
                        const d = new Date(r.date);
                        return isNaN(d.getTime()) ? 2026 : d.getFullYear();
                      }))) as number[]).sort((a, b) => b - a);

                      const availableWeeks = (Array.from(new Set(expenseRecords.map(r => {
                        const d = new Date(r.date);
                        if (isNaN(d.getTime())) return null;
                        const sun = new Date(d);
                        sun.setDate(d.getDate() - d.getDay());
                        return sun.toISOString().split('T')[0];
                      }).filter(Boolean))) as string[]).sort((a, b) => b.localeCompare(a));

                      const getWeekLabel = (sundayStr: string) => {
                        if (!sundayStr) return '';
                        const d = new Date(sundayStr);
                        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
                        return `Semana del ${d.getDate()} de ${months[d.getMonth()]} (${d.getFullYear()})`;
                      };

                      if (expTimePeriodFilter === 'year') {
                        return (
                          <>
                            <span className="block text-[12px] font-bold text-slate-400 uppercase tracking-widest">Seleccione Año:</span>
                            <select
                              value={expSelectedYear}
                              onChange={(e) => setExpSelectedYear(parseInt(e.target.value) || 2026)}
                              className="w-full bg-amber-50/50 border border-amber-200 rounded-lg text-xs px-2.5 py-1.5 focus:outline-none text-amber-950 cursor-pointer"
                            >
                              {availableYears.map(yr => (
                                <option key={yr} value={yr}>Año {yr}</option>
                              ))}
                            </select>
                          </>
                        );
                      }

                      if (expTimePeriodFilter === 'month') {
                        return (
                          <div className="grid grid-cols-2 gap-1.5">
                            <div>
                              <span className="block text-[12px] font-bold text-slate-400 uppercase tracking-widest">Año:</span>
                              <select
                                value={expSelectedYear}
                                onChange={(e) => setExpSelectedYear(parseInt(e.target.value) || 2026)}
                                className="w-full bg-amber-50/50 border border-amber-200 rounded-lg text-xs px-1.5 py-1.5 focus:outline-none text-amber-950 cursor-pointer"
                              >
                                {availableYears.map(yr => (
                                  <option key={yr} value={yr}>{yr}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <span className="block text-[12px] font-bold text-slate-400 uppercase tracking-widest">Mes:</span>
                              <select
                                value={expSelectedMonth}
                                onChange={(e) => setExpSelectedMonth(parseInt(e.target.value) || 0)}
                                className="w-full bg-amber-50/50 border border-amber-200 rounded-lg text-xs px-1.5 py-1.5 focus:outline-none text-amber-950 cursor-pointer"
                              >
                                <option value={0}>Ene</option>
                                <option value={1}>Feb</option>
                                <option value={2}>Mar</option>
                                <option value={3}>Abr</option>
                                <option value={4}>May</option>
                                <option value={5}>Jun</option>
                                <option value={6}>Jul</option>
                                <option value={7}>Ago</option>
                                <option value={8}>Sep</option>
                                <option value={9}>Oct</option>
                                <option value={10}>Nov</option>
                                <option value={11}>Dic</option>
                              </select>
                            </div>
                          </div>
                        );
                      }

                      if (expTimePeriodFilter === 'week') {
                        return (
                          <>
                            <span className="block text-[12px] font-bold text-slate-400 uppercase tracking-widest">Seleccione Semana:</span>
                            <select
                              value={expSelectedWeekStart}
                              onChange={(e) => setExpSelectedWeekStart(e.target.value)}
                              className="w-full bg-amber-50/50 border border-amber-200 rounded-lg text-xs px-2.5 py-1.5 focus:outline-none text-amber-950 cursor-pointer"
                            >
                              <option value="all">Todas las semanas</option>
                              {availableWeeks.map(wkStr => (
                                <option key={wkStr} value={wkStr}>{getWeekLabel(wkStr)}</option>
                              ))}
                            </select>
                          </>
                        );
                      }

                      if (expTimePeriodFilter === 'last_week') {
                        return (
                          <div className="pt-3 text-center">
                            <span className="inline-block px-2.5 py-0.5 bg-amber-50 text-amber-700 text-[12px] font-bold rounded uppercase tracking-wider font-mono border border-amber-200/50">
                              Última Semana con Datos
                            </span>
                          </div>
                        );
                      }

                      return (
                        <div className="bg-sky-50 text-sky-800 border border-sky-100 p-2.5 rounded-lg flex items-center gap-2 select-none">
                          <Info className="w-4 h-4 text-sky-500 shrink-0" />
                          <div className="text-left font-sans text-[10.5px]">
                            <span className="block font-black text-sky-950 uppercase tracking-wide text-[9.5px]">Historial Completo</span>
                            <span className="block text-sky-600 font-semibold leading-tight">Planilla general sin filtros temporales aplicados.</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
              
              <p className="sm:hidden text-[11px] text-slate-400 font-semibold flex items-center gap-1 px-1 mb-1.5">
                👉 Desliza la tabla hacia los lados para ver todas las columnas
              </p>
              <div className="overflow-auto max-h-[350px] border border-slate-200 rounded-lg">
                <table className="w-full min-w-[500px] md:min-w-[820px] text-left text-[11px] md:text-xs border-collapse divide-y divide-slate-200">
                  <thead className="bg-[#051125] text-slate-200 sticky top-0 z-20 shadow-xs">
                    <tr className="uppercase tracking-wider text-[11px] font-extrabold border-b border-slate-200/20">
                      <th className="py-1.5 px-1 md:px-3 font-bold text-white/95 text-[11px]">Fecha de Pago</th>
                      <th className="py-1.5 px-1 md:px-3 font-bold text-white/95 text-[11px]">Registrado Por</th>
                      <th className="py-1.5 px-1 md:px-3 font-bold text-white/95">Categoría de Gasto</th>
                      <th className="py-1.5 px-1 md:px-3 font-bold text-white/95">Glosa o Descripción</th>
                      <th className="py-1.5 px-1 md:px-3 text-right font-bold text-white/95">Monto Neto</th>
                      <th className="py-1.5 px-1 md:px-3 text-center font-bold text-white/95">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-sans bg-white pb-0">
                    {filteredExpenseRecords.map(exp => {
                      return (
                        <tr key={exp.id} className="hover:bg-[#C67C3E]/5 transition-all duration-200 border-b border-slate-100">
                          <td className="py-1 px-1 md:px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                            {exp.date}
                          </td>
                          <td className="py-1 px-1 md:px-3 font-mono font-semibold text-[#051125] whitespace-nowrap">
                            <span className="bg-slate-100 border border-slate-200 text-slate-705 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold">
                              👤 {exp.operator || 'Carlos Mendoza'}
                            </span>
                          </td>
                          <td className="py-1 px-1 md:px-3">
                            <span className="bg-amber-50 border border-amber-200 text-amber-800 px-1.5 py-0.2 rounded text-[10px] font-bold">
                              {exp.category}
                            </span>
                          </td>
                          <td className="py-1 px-1 md:px-3 font-bold text-slate-800">
                            <div className="text-[11.5px] md:text-xs leading-tight">{exp.description}</div>
                          </td>
                          <td className="py-1 px-1 md:px-3 text-right font-mono font-bold text-slate-900">
                            Bs. {exp.amount.toFixed(2)}
                          </td>
                          <td className="py-1 px-1 md:px-3 text-center">
                            <div className="flex justify-center gap-1">
                              <button 
                                onClick={() => handleStartEditExpense(exp)}
                                className="text-amber-600 hover:text-amber-800 p-1 rounded hover:bg-amber-50 transition-colors inline-block cursor-pointer"
                                title="Editar Gasto"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => {
                                  if (confirm(`¿Estás seguro de anular el gasto registrado "${exp.id}"?`)) {
                                    setExpenseRecords(prev => prev.filter(e => e.id !== exp.id));
                                    addAuditLog('Eliminación', `Gasto operacional anulado: "${exp.description}" de Bs. ${exp.amount}`, exp.operator || 'Carlos Mendoza');
                                  }
                                }}
                                className="text-rose-400 hover:text-rose-700 p-1 rounded hover:bg-rose-50 transition-colors cursor-pointer inline-block"
                                title="Anular Gasto"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {/* Totals Row */}
                    {filteredExpenseRecords.length > 0 && (
                      <tr className="bg-[#051125]/5 border-t-2 border-[#051125]/20 font-bold">
                        <td colSpan={4} className="py-1.5 px-1 md:px-3 text-right text-[11px] md:text-xs font-extrabold text-[#051125] uppercase tracking-wider">
                          Monto Total Filtrado ({filteredExpenseRecords.length} reg)
                        </td>
                        <td className="py-1.5 px-1 md:px-3 text-right font-mono font-black text-[11.5px] md:text-sm text-rose-700">
                          Bs. {totalExpenseAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td colSpan={1} className="py-1.5 px-1 md:px-3"></td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Floating Action Button (FAB) for Registering Expenses (only on mobile) */}
          <button
            onClick={() => setIsExpenseModalOpen(true)}
            title="Registrar Gasto"
            className="fixed bottom-6 right-6 z-50 md:hidden bg-[#e11d48] hover:bg-[#be123c] text-white font-bold w-12 h-12 rounded-full cursor-pointer flex items-center justify-center gap-0.5 transition-all scale-100 hover:scale-105 active:scale-95 shadow-xl hover:shadow-2xl hover:shadow-[#e11d48]/30 border-2 border-white select-none"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span className="text-[11px] font-black tracking-tight shrink-0 text-white">RG</span>
          </button>

        </div>
      )}

      {/* INVERSIONES DE CAPITAL TAB VIEW */}
      {activeTab === 'capital' && (
        <div className="space-y-2.5 animate-fade-in text-xs">
          
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
            <div>
              <h3 className="text-sm font-black text-[#051125] flex items-center gap-1.5 leading-tight">
                <TrendingUp className="w-4 h-4 text-[#C67C3E]" />
                Inversiones de Capital & Activos Fijos
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                Control analítico de depreciación y adquisiciones de activos corporativos.
              </p>
            </div>
          </div>

          {/* Floating Action Button (FAB) for Registering Capital Asset */}
          <button
            onClick={() => setIsCapitalModalOpen(true)}
            title="Registrar Activo de Capital"
            className="fixed bottom-6 right-6 z-50 bg-[#C67C3E] hover:bg-[#b06c32] text-white font-bold w-12 h-12 rounded-full cursor-pointer flex items-center justify-center gap-0.5 transition-all scale-100 hover:scale-105 active:scale-95 shadow-xl hover:shadow-2xl hover:shadow-[#C67C3E]/30 border-2 border-white select-none"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span className="text-[11px] font-black tracking-tight shrink-0 text-white leading-none">RC</span>
          </button>

          {/* Metric Cards Row redesigned: Card 2 and Card 3 in the same row on mobile, stacked column on desktop */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
            {/* Card 1: Inversiones de Capital MTD */}
            <div className="bg-[#051125] text-white rounded-xl p-4 flex flex-col justify-between shadow-xs relative overflow-hidden min-h-[96px]">
              <span className="text-[11px] text-slate-300 font-bold uppercase tracking-wider block">Inversiones de Capital MTD</span>
              <div className="flex items-end justify-between mt-2">
                <span className="text-[20px] font-mono font-extrabold text-[#C67C3E] leading-none">
                  Bs. {capitalInvestments.reduce((acc, inv) => acc + inv.initialCost, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-[11px] font-bold text-white bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-full">
                  {capitalInvestments.length} Activos
                </span>
              </div>
            </div>

            {/* Side-by-side grid on mobile, stacked vertical list on desktop/tablet */}
            <div className="grid grid-cols-2 md:flex md:flex-col gap-1.5 md:gap-1">
              {/* Card 2: Desgaste/Amortizado Acumulado */}
              <div className="bg-emerald-50 text-emerald-950 border border-emerald-100 rounded-xl p-3 flex flex-col justify-between shadow-xs min-h-[88px] md:min-h-0 md:flex-row md:items-center">
                <div>
                  <span className="text-[10px] text-emerald-700 font-extrabold uppercase tracking-tight block">Amortizado Acumulado</span>
                  <span className="text-[14px] md:text-[16px] font-mono font-extrabold text-emerald-800 leading-none block mt-1">
                    Bs. {capitalInvestments.reduce((acc, inv) => acc + inv.recovered, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <span className="hidden md:inline-block text-[10px] font-extrabold text-emerald-700 bg-emerald-100/50 border border-emerald-200/50 px-2 py-0.5 rounded-full select-none">
                  Recuperado
                </span>
              </div>

              {/* Card 3: Valor Neto Remanente en Libros */}
              <div className="bg-amber-50 text-amber-950 border border-amber-100 rounded-xl p-3 flex flex-col justify-between shadow-xs min-h-[88px] md:min-h-0 md:flex-row md:items-center">
                <div>
                  <span className="text-[10px] text-amber-700 font-extrabold uppercase tracking-tight block">Valor Neto Remanente</span>
                  <span className="text-[14px] md:text-[16px] font-mono font-extrabold text-amber-800 leading-none block mt-1">
                    Bs. {capitalInvestments.reduce((acc, inv) => acc + (inv.initialCost - inv.recovered), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <span className="hidden md:inline-block text-[10px] font-extrabold text-amber-700 bg-amber-100/50 border border-amber-200/50 px-2 py-0.5 rounded-full select-none">
                  Libros
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* LEFT COLUMN: Table matching Planilla de Egresos layout and visual order! */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              
              <div className="bg-white border-t-4 border-t-[#C67C3E] border border-slate-200/80 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Planilla de Inversiones & Activos de Capital</h4>
                      <p className="text-[11.5px] text-slate-500">Maquinaria, Flota Pesada e Infraestructura registrada</p>
                    </div>

                    {/* Search Bar */}
                    <div className="relative flex items-center bg-white border border-slate-400 rounded-lg text-xs w-full md:w-64 shadow-xs">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5" />
                      <input
                        type="text"
                        value={capSearchFilter}
                        onChange={(e) => setCapSearchFilter(e.target.value)}
                        placeholder="Buscar por descripción, responsable, etc..."
                        className="pl-8 pr-2 py-1.5 rounded-lg border-none bg-transparent w-full focus:outline-none focus:ring-0 text-xs text-slate-700"
                      />
                    </div>
                  </div>

                  {/* Advanced Filter Row matching Planilla de Egresos layout */}
                  <div className="flex flex-col gap-3 pt-2 border-t border-slate-200/50">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Filter by Category/Type */}
                      <div className="space-y-1">
                        <span className="block text-[12px] font-bold text-slate-400 uppercase tracking-widest">Tipo de Activo:</span>
                        <select
                          value={capTypeFilter}
                          onChange={(e) => setCapTypeFilter(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg text-xs px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#C67C3E] text-slate-600 cursor-pointer"
                        >
                          <option value="all">🏢 Todos los Activos</option>
                          <option value="Heavy Machinery">⚙️ Maquinaria Pesada</option>
                          <option value="Fleet Vehicle">🚗 Vehículo / Flota</option>
                          <option value="IT Infrastructure">💻 Infraestructura IT</option>
                          <option value="Real Estate">🏢 Bienes Raíces / Local</option>
                        </select>
                      </div>

                      {/* Dynamic sub-filters */}
                      <div className="space-y-1">
                        {(() => {
                          const availableYears = (Array.from(new Set(capitalInvestments.map(r => {
                            const d = new Date(r.date);
                            return isNaN(d.getTime()) ? 2026 : d.getFullYear();
                          }))) as number[]).sort((a, b) => b - a);

                          const availableWeeks = (Array.from(new Set(capitalInvestments.map(r => {
                            const d = new Date(r.date);
                            if (isNaN(d.getTime())) return null;
                            const sun = new Date(d);
                            sun.setDate(d.getDate() - d.getDay());
                            return sun.toISOString().split('T')[0];
                          }).filter(Boolean))) as string[]).sort((a, b) => b.localeCompare(a));

                          const getWeekLabel = (sundayStr: string) => {
                            if (!sundayStr) return '';
                            const d = new Date(sundayStr);
                            const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
                            return `Semana del ${d.getDate()} de ${months[d.getMonth()]} (${d.getFullYear()})`;
                          };

                          if (capTimePeriodFilter === 'year') {
                            return (
                              <>
                                <span className="block text-[12px] font-bold text-slate-400 uppercase tracking-widest">Seleccione Año:</span>
                                <select
                                  value={capSelectedYear}
                                  onChange={(e) => setCapSelectedYear(parseInt(e.target.value) || 2026)}
                                  className="w-full bg-amber-50/50 border border-amber-200 rounded-lg text-xs px-2.5 py-1.5 focus:outline-none text-amber-950 cursor-pointer"
                                >
                                  {availableYears.map(yr => (
                                    <option key={yr} value={yr}>Año {yr}</option>
                                  ))}
                                </select>
                              </>
                            );
                          }

                          if (capTimePeriodFilter === 'month') {
                            return (
                              <div className="grid grid-cols-2 gap-1.5">
                                <div>
                                  <span className="block text-[12px] font-bold text-slate-400 uppercase tracking-widest">Año:</span>
                                  <select
                                    value={capSelectedYear}
                                    onChange={(e) => setCapSelectedYear(parseInt(e.target.value) || 2026)}
                                    className="w-full bg-amber-50/50 border border-amber-200 rounded-lg text-xs px-1.5 py-1.5 focus:outline-none text-amber-950 cursor-pointer"
                                  >
                                    {availableYears.map(yr => (
                                      <option key={yr} value={yr}>{yr}</option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <span className="block text-[12px] font-bold text-slate-400 uppercase tracking-widest">Mes:</span>
                                  <select
                                    value={capSelectedMonth}
                                    onChange={(e) => setCapSelectedMonth(parseInt(e.target.value) || 0)}
                                    className="w-full bg-amber-50/50 border border-amber-200 rounded-lg text-xs px-1.5 py-1.5 focus:outline-none text-amber-950 cursor-pointer"
                                  >
                                    <option value={0}>Ene</option>
                                    <option value={1}>Feb</option>
                                    <option value={2}>Mar</option>
                                    <option value={3}>Abr</option>
                                    <option value={4}>May</option>
                                    <option value={5}>Jun</option>
                                    <option value={6}>Jul</option>
                                    <option value={7}>Ago</option>
                                    <option value={8}>Sep</option>
                                    <option value={9}>Oct</option>
                                    <option value={10}>Nov</option>
                                    <option value={11}>Dic</option>
                                  </select>
                                </div>
                              </div>
                            );
                          }

                          if (capTimePeriodFilter === 'week') {
                            return (
                              <>
                                <span className="block text-[12px] font-bold text-slate-400 uppercase tracking-widest">Seleccione Semana:</span>
                                <select
                                  value={capSelectedWeekStart}
                                  onChange={(e) => setCapSelectedWeekStart(e.target.value)}
                                  className="w-full bg-amber-50/50 border border-amber-200 rounded-lg text-xs px-2.5 py-1.5 focus:outline-none text-amber-950 cursor-pointer"
                                >
                                  <option value="all">Todas las semanas</option>
                                  {availableWeeks.map(wkStr => (
                                    <option key={wkStr} value={wkStr}>{getWeekLabel(wkStr)}</option>
                                  ))}
                                </select>
                              </>
                            );
                          }

                          if (capTimePeriodFilter === 'last_week') {
                            return (
                              <div className="pt-3 text-center">
                                <span className="inline-block px-2.5 py-0.5 bg-amber-50 text-amber-700 text-[12px] font-bold rounded uppercase tracking-wider font-mono border border-amber-200/50">
                                  Última Semana
                                </span>
                              </div>
                            );
                          }

                          return (
                            <div className="bg-sky-50 text-sky-800 border border-sky-100 p-2.5 rounded-lg flex items-center gap-2 select-none">
                              <Info className="w-4 h-4 text-sky-500 shrink-0" />
                              <div className="text-left font-sans text-[10.5px]">
                                <span className="block font-black text-sky-950 uppercase tracking-wide text-[9.5px]">Historial Completo</span>
                                <span className="block text-sky-600 font-semibold leading-tight">Planilla general sin filtros temporales aplicados.</span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Responsable & Periodo Temporal in EXACTLY the same row */}
                    <div className="grid grid-cols-2 gap-3">
                      {/* Filter by Operator */}
                      <div className="space-y-1">
                        <span className="block text-[12px] font-bold text-slate-400 uppercase tracking-widest">Responsable:</span>
                        <select
                          value={capOperatorFilter}
                          onChange={(e) => setCapOperatorFilter(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg text-xs px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#C67C3E] text-slate-600 cursor-pointer"
                        >
                          <option value="all">👤 Todos los Usuarios</option>
                          {usersList.map(u => (
                            <option key={u.id} value={u.name}>👤 {u.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Filter by Period */}
                      <div className="space-y-1">
                        <span className="block text-[12px] font-bold text-slate-400 uppercase tracking-widest">Periodo:</span>
                        <select
                          value={capTimePeriodFilter}
                          onChange={(e) => {
                            const val = e.target.value as any;
                            setCapTimePeriodFilter(val);
                            const availableWeeks = (Array.from(new Set(capitalInvestments.map(r => {
                              const d = new Date(r.date);
                              if (isNaN(d.getTime())) return null;
                              const sun = new Date(d);
                              sun.setDate(d.getDate() - d.getDay());
                              return sun.toISOString().split('T')[0];
                            }).filter(Boolean))) as string[]).sort((a, b) => b.localeCompare(a));

                            if (val === 'week' && availableWeeks.length > 0 && capSelectedWeekStart === 'all') {
                              setCapSelectedWeekStart(availableWeeks[0]);
                            }
                          }}
                          className="w-full bg-white border border-slate-200 rounded-lg text-xs px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#C67C3E] text-slate-600 cursor-pointer text-xs"
                        >
                          <option value="all">📅 Mostrar Todo</option>
                          <option value="last_week">📅 Última Semana Registrada</option>
                          <option value="week">📅 Ver de Semana Específica</option>
                          <option value="month">📅 Ver de Mes Específico</option>
                          <option value="year">📅 Ver de Año Específico</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
                
                <p className="sm:hidden text-[11px] text-slate-400 font-semibold flex items-center gap-1 px-1 mb-1.5">
                  👉 Desliza la tabla hacia los lados para ver todas las columnas
                </p>
                <div className="overflow-auto max-h-[350px] border border-slate-200 rounded-lg">
                  <table className="w-full min-w-[500px] md:min-w-[820px] text-left text-[11px] md:text-xs border-collapse divide-y divide-slate-200">
                    <thead className="bg-[#051125] text-slate-200 sticky top-0 z-20 shadow-xs">
                      <tr className="uppercase tracking-wider text-[11px] font-extrabold border-b border-slate-200/20">
                        <th className="py-1.5 px-1 md:px-3 font-bold text-white/95">Registrado Por</th>
                        <th className="py-1.5 px-1 md:px-3 font-bold text-white/95 font-mono">Fecha Adquisición</th>
                        <th className="py-1.5 px-1 md:px-3 font-bold text-white/95 justify-start">Categoría o Tipo</th>
                        <th className="py-1.5 px-1 md:px-3 font-bold text-white/95">Glosa o Descripción</th>
                        <th className="py-1.5 px-1 md:px-3 text-right font-bold text-white/95">Inversión Inicial</th>
                        <th className="py-1.5 px-1 md:px-3 text-center font-bold text-white/95">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-sans bg-white">
                      {filteredCapitalInvestments.map((inv, idx) => (
                        <tr key={inv.id} className="hover:bg-[#C67C3E]/5 transition-all duration-200 border-b border-slate-100">
                          <td className="py-1.5 px-1 md:px-3 font-mono font-semibold text-[#051125] whitespace-nowrap">
                            <span className="bg-slate-100 border border-slate-200 text-slate-705 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold">
                              👤 {inv.operator || 'Carlos Mendoza'}
                            </span>
                          </td>
                          <td className="py-1.5 px-1 md:px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">{inv.date}</td>
                          <td className="py-1.5 px-1 md:px-3">
                            <span className="bg-amber-50 border border-amber-200 text-amber-800 px-1.5 py-0.2 rounded text-[10.5px] font-bold whitespace-nowrap">
                              {inv.type === 'Fleet Vehicle' ? '🚗 Vehículo' : inv.type === 'Heavy Machinery' ? '⚙️ Maquinaria' : inv.type === 'IT Infrastructure' ? '💻 Infraestructura' : '🏢 Inmueble'}
                            </span>
                          </td>
                          <td className="py-1.5 px-1 md:px-3 font-bold text-slate-800">
                            <div className="text-[11.5px] md:text-xs">{inv.name}</div>
                          </td>
                          <td className="py-1.5 px-1 md:px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">{inv.initialCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td className="py-1.5 px-1 md:px-3">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => {
                                  setSelectedDepreciationIndex(idx);
                                  setIsDepreciationModalOpen(true);
                                }}
                                className="text-[#C67C3E] hover:text-[#051125] p-1 rounded hover:bg-amber-50 transition-colors cursor-pointer"
                                title="Ver Ficha Analítica de Depreciación"
                              >
                                <FileText className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => {
                                  if (confirm(`¿Estás seguro de anular la inversión de capital registrada "${inv.name}"?`)) {
                                    setCapitalInvestments(prev => prev.filter(e => e.id !== inv.id));
                                    addAuditLog('Eliminación', `Inversión de capital anulada: "${inv.name}" de Bs. ${inv.initialCost}`, inv.operator || 'Carlos Mendoza');
                                  }
                                }}
                                className="text-rose-400 hover:text-rose-700 p-1 rounded hover:bg-rose-50 transition-all cursor-pointer"
                                title="Anular Activo Fijo"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}

                      {/* Totals Row */}
                      {filteredCapitalInvestments.length > 0 && (
                        <tr className="bg-[#051125]/5 border-t-2 border-[#051125]/20 font-bold">
                          <td colSpan={4} className="py-1.5 px-1 md:px-3 text-right text-[11px] md:text-xs font-extrabold text-[#051125] uppercase tracking-wider">
                            Inversión Total Filtrada ({filteredCapitalInvestments.length} activos)
                          </td>
                          <td className="py-1.5 px-1 md:px-3 text-right font-mono font-black text-[11px] md:text-sm text-[#051125] whitespace-nowrap">
                            {totalCapitalInitialCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-1.5 px-1 md:px-3"></td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: Capital Asset ROI amortizaciones */}
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl shadow-sm p-4 flex flex-col justify-between space-y-4 font-sans">
              <div>
                <h4 className="text-[13.8px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b pb-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-[#C67C3E]" />
                  Retorno de Inversión Corporativo (ROI)
                </h4>
                <p className="text-[11.5px] text-slate-400 mb-4 font-sans">Estimación del progreso de amortización y recuperación monetaria acumulada sobre los activos de Torre Forte.</p>
                
                <div className="space-y-5">
                  {filteredCapitalInvestments.map((inv, idx) => {
                    const progressPct = inv.initialCost > 0 ? Math.min(100, Math.round((inv.recovered / inv.initialCost) * 100)) : 0;
                    return (
                      <div key={inv.id} className="p-3 border border-slate-100 rounded-xl bg-slate-50 space-y-2">
                        <div className="flex justify-between items-center text-[12.65px] font-semibold text-[#051125]">
                          <div>
                            <span className="cursor-pointer hover:underline" onClick={() => { setSelectedDepreciationIndex(idx); setIsDepreciationModalOpen(true); }}>{inv.name}</span>
                            <div className="text-[10.35px] text-[#C67C3E] font-medium leading-tight font-mono mt-0.5">Responsable: {inv.operator || 'Carlos Mendoza'}</div>
                          </div>
                          <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[10.35px] font-mono font-bold">
                            {progressPct}% Recuperado
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden flex">
                          <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${progressPct}%` }}></div>
                        </div>
                        <div className="flex justify-between items-center text-[10.35px] text-slate-400 font-mono pt-1">
                          <span>Inversión: Bs. {inv.initialCost.toLocaleString()}</span>
                          <span className="font-bold text-slate-500">Recup: Bs. {inv.recovered.toLocaleString()}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="text-center border-t pt-3">
                <button 
                  onClick={() => {
                    setSelectedDepreciationIndex(0);
                    setIsDepreciationModalOpen(true);
                  }}
                  className="w-full bg-[#C67C3E] hover:bg-[#b06c32] text-white font-bold py-2 rounded transition-colors text-center text-[13px] uppercase tracking-wider cursor-pointer"
                >
                  Ver Fichas de Depreciación →
                </button>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* CALCULADORA DE COSTOS TAB VIEW */}
      {activeTab === 'calculator' && (
        <CostCalculator />
      )}

        </div> {/* closing lg:col-span-9 space-y-6 */}
      </div> {/* closing grid grid-cols-1 lg:grid-cols-12 gap-8 items-start */}

      {/* MODAL RECORD CREATOR OVERLAY */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 bg-[#051125]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col animate-fade-in border-t-4 border-t-[#C67C3E]">

            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 bg-slate-50 border-b border-slate-200 shrink-0">
              <div>
                <h3 className="text-sm font-bold text-[#051125]">
                  {recType === 'sale' ? 'Registrar Nueva Venta Directa' : 'Registrar Nueva Cotización / Proforma'}
                </h3>
                <p className="text-[13px] text-slate-500 mt-1">
                  {recType === 'sale' ? 'Registra una venta directa de soporte en caja.' : 'Registra una orden técnica de proforma o cotización.'}
                </p>
              </div>
              <button
                onClick={() => setIsRecordModalOpen(false)}
                className="h-7 w-7 rounded-full flex items-center justify-center hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors"
                type="button"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleAddFinancialRecord} className="flex flex-col flex-1 min-h-0">
              <div className="p-5 space-y-4 overflow-y-auto flex-1 min-h-0">

              {/* Client input */}
              <div>
                <label className="block text-[13px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Cliente Relacionado:</label>
                <input 
                  type="text" 
                  value={recClient}
                  onChange={(e) => setRecClient(e.target.value)}
                  placeholder="Ej. Apex Logistics Corp. o Nombre del Cliente (Opcional)"
                  className="w-full bg-slate-50 border p-2 text-xs rounded text-slate-800 focus:outline-[#051125] focus:ring-1 focus:ring-[#051125]"
                />
              </div>

              {/* Notes input */}
              <div>
                <label className="block text-[13px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Notas:</label>
                <textarea 
                  value={recNotes}
                  onChange={(e) => setRecNotes(e.target.value)}
                  placeholder="Notas adicionales o detalles sobre el registro..."
                  rows={2}
                  className="w-full bg-slate-50 border p-2 text-xs rounded text-slate-800 focus:outline-[#051125] focus:ring-1 focus:ring-[#051125]"
                />
              </div>

              {/* Información Adicional de Facturación/Proforma (Estilo Wodexo) */}
              {recType === 'quote' && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 space-y-3 animate-fade-in">
                  <span className="block text-[13px] font-bold text-slate-500 uppercase tracking-widest border-b pb-1 font-mono">Detalles Adicionales de Cotización (Opcional):</span>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[12px] font-bold text-slate-400 uppercase tracking-wide mb-1">Teléfono Cliente:</label>
                      <input 
                        type="text" 
                        value={recClientPhone}
                        onChange={(e) => setRecClientPhone(e.target.value)}
                        placeholder="Ej. +591 77300000"
                        className="w-full bg-white border p-1.5 text-xs rounded text-slate-800 focus:outline-[#051125]"
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] font-bold text-slate-400 uppercase tracking-wide mb-1">Número de NIT del Cliente:</label>
                      <input 
                        type="text" 
                        value={recClientNit}
                        onChange={(e) => setRecClientNit(e.target.value)}
                        placeholder="Ej. 349812024"
                        className="w-full bg-white border p-1.5 text-xs rounded text-slate-800 focus:outline-[#051125]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[12px] font-bold text-slate-400 uppercase tracking-wide mb-1">Cargo / Rol del Cliente:</label>
                      <input 
                        type="text" 
                        value={recClientRole}
                        onChange={(e) => setRecClientRole(e.target.value)}
                        placeholder="Ej. Director, Particular"
                        className="w-full bg-white border p-1.5 text-xs rounded text-slate-800 focus:outline-[#051125]"
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] font-bold text-slate-400 uppercase tracking-wide mb-1">Correo Cliente:</label>
                      <input 
                        type="email" 
                        value={recClientEmail}
                        onChange={(e) => setRecClientEmail(e.target.value)}
                        placeholder="Ej. cliente@gmail.com"
                        className="w-full bg-white border p-1.5 text-xs rounded text-slate-800 focus:outline-[#051125]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[12px] font-bold text-slate-400 uppercase tracking-wide mb-1">Dirección Cliente:</label>
                      <input 
                        type="text" 
                        value={recClientAddress}
                        onChange={(e) => setRecClientAddress(e.target.value)}
                        placeholder="Ej. Av. Banzer 4to Anillo"
                        className="w-full bg-white border p-1.5 text-xs rounded text-slate-800 focus:outline-[#051125]"
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] font-bold text-slate-400 uppercase tracking-wide mb-1">Validez / Vencimiento:</label>
                      <input 
                        type="date" 
                        value={recDueDate}
                        onChange={(e) => setRecDueDate(e.target.value)}
                        className="w-full bg-white border p-1.5 text-xs rounded text-slate-800 focus:outline-[#051125]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[12px] font-bold text-slate-400 uppercase tracking-wide mb-1">Impuesto / IVA (%):</label>
                      <input 
                        type="number" 
                        min="0"
                        max="100"
                        value={recTaxRate || ''}
                        onChange={(e) => setRecTaxRate(Math.max(0, parseFloat(e.target.value) || 0))}
                        placeholder="Por defecto 0%"
                        className="w-full bg-white border p-1.5 text-xs rounded text-slate-800 focus:outline-[#051125] font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Product selector(s): one or more line items per quote/sale */}
              <div>
                <label className="block text-[13px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-mono">Productos / Servicios:</label>
                <LineItemsEditor lines={recLineItems} setLines={setRecLineItems} dynamicItemOptions={dynamicItemOptions} />
              </div>

              {/* Overall discount across all line items */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 text-red-500">Descuento Ofrecido (%):</label>
                  <input
                    type="number"
                    value={recDiscount || ''}
                    onChange={(e) => setRecDiscount(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                    placeholder="Ninguno (0%)"
                    className="w-full bg-slate-50 border p-2 text-xs rounded text-slate-800 font-mono focus:outline-[#051125]"
                  />
                </div>
              </div>

              {/* Capital Override Input */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-bold text-[#C67C3E] uppercase tracking-widest mb-1.5 font-mono">Inversión / Capital Fijo (Bs.):</label>
                  <input 
                    type="number" 
                    value={recCapital !== null ? recCapital : ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setRecCapital(val === '' ? null : Math.max(0, parseFloat(val) || 0));
                    }}
                    placeholder="Auto (60% del precio)"
                    className="w-full bg-[#C67C3E]/5 border border-[#C67C3E]/25 p-2 text-xs rounded text-slate-800 focus:outline-[#C67C3E] font-mono placeholder:text-slate-400"
                  />
                </div>
                <div className="flex items-center pt-5">
                  <p className="text-[12px] text-slate-400 leading-tight">
                    Define manualmente el **capital de costo** para calcular la ganancia real. Si queda vacío, se calculará automáticamente al **60%** del precio.
                  </p>
                </div>
              </div>

              {/* Status and Payment option */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Método de Facturación:</label>
                  <select 
                    value={recPayMethod}
                    onChange={(e) => setRecPayMethod(e.target.value)}
                    className="w-full bg-slate-50 border p-2 text-xs rounded text-slate-800 cursor-pointer"
                  >
                    <option value="transfer">📱 Transferencia Bancaria</option>
                    <option value="cash">💵 Efectivo Físico</option>
                    <option value="card">💳 Tarjeta Crédito/Débito</option>
                    <option value="qr">📱 Pago Simple QR</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Estado Operativo:</label>
                  {recType === 'sale' ? (
                    <select 
                       value={recStatus}
                       onChange={(e) => setRecStatus(e.target.value as any)}
                       className="w-full bg-emerald-50 text-emerald-800 border p-2 text-xs rounded font-bold cursor-pointer"
                    >
                      <option value="Paid">Paid (Cobrado con éxito)</option>
                      <option value="Enviada">Proforma Enviada (Por Cobrar)</option>
                      <option value="Aceptada">Aceptada / Por Liquidar</option>
                    </select>
                  ) : (
                    <input 
                      type="text" 
                      value="Borrador (Editable)" 
                      disabled 
                      className="w-full bg-slate-100 border p-2 text-xs rounded text-slate-400 font-semibold cursor-not-allowed"
                    />
                  )}
                </div>
              </div>

              {/* Dynamic Operator / Registered user selection */}
              <div>
                <label className="block text-[13px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Usuario de Registro (Responsable):</label>
                <select 
                  value={recOperator}
                  onChange={(e) => setRecOperator(e.target.value)}
                  className="w-full bg-slate-50 border p-2 text-xs rounded text-slate-800 focus:outline-[#051125] cursor-pointer"
                >
                  {usersList.map(u => (
                    <option key={u.id} value={u.name}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Live Price Calculation Display */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/50 flex justify-between items-center text-xs">
                <div className="space-y-0.5 text-slate-500">
                  <p>Productos: {recLineItems.length}</p>
                  <p>Caja Base: Bs. {recLineItems.reduce((sum, line) => sum + (line.customAmount !== null ? line.customAmount : (dynamicItemOptions[line.itemKey]?.price || 0)) * line.qty, 0).toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <span className="text-[13px] uppercase font-bold text-[#C67C3E] block tracking-wider">Caja Neta Liquidada</span>
                  <span className="text-base font-mono font-bold text-[#051125] block">
                    Bs. {
                      (recLineItems.reduce((sum, line) => sum + (line.customAmount !== null ? line.customAmount : (dynamicItemOptions[line.itemKey]?.price || 0)) * line.qty, 0) * (1 - recDiscount / 100)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    }
                  </span>
                </div>
              </div>

              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end p-4 border-t text-xs shrink-0 bg-white">
                <button
                  onClick={() => setIsRecordModalOpen(false)}
                  type="button"
                  className="bg-slate-100 hover:bg-slate-250 text-slate-700 font-bold py-2 px-4 rounded-lg cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-[#051125] hover:bg-slate-800 text-white font-extrabold py-2 px-5 rounded-lg cursor-pointer flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Check className="w-4 h-4 text-emerald-500" />
                  Guardar Flujo
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL EXPENSE REGISTRATION OVERLAY */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 bg-[#051125]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col animate-fade-in border-t-4 border-t-rose-600">

            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 bg-slate-50 border-b border-slate-200 shrink-0">
              <div>
                <h3 className="text-sm font-bold text-[#051125] flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-slate-500" />
                  {editingExpenseId ? "Editar Gasto Operacional" : "Registrar Gasto Operacional"}
                </h3>
                <p className="text-[13px] text-slate-500 mt-1">
                  {editingExpenseId ? "Modifica los datos del egreso operativo seleccionado." : "Registra un egreso operativo, pago o compra directa en la planilla de caja."}
                </p>
              </div>
              <button
                onClick={handleCloseExpenseModal}
                className="h-7 w-7 rounded-full flex items-center justify-center hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors"
                type="button"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={editingExpenseId ? handleUpdateExpense : handleAddExpense} className="flex flex-col flex-1 min-h-0">
              <div className="p-5 space-y-4 overflow-y-auto flex-1 min-h-0">

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Fecha de Egreso:</label>
                  <input 
                    type="date"
                    value={expFormDate}
                    onChange={(e) => setExpFormDate(e.target.value)}
                    className="w-full bg-slate-50 border p-2 text-xs rounded text-slate-800 focus:outline-[#051125] focus:ring-1 focus:ring-[#051125]"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Categoría:</label>
                  <select
                    value={expFormCategory}
                    onChange={(e) => setExpFormCategory(e.target.value)}
                    className="w-full bg-slate-50 border p-2 text-xs rounded text-slate-800 cursor-pointer focus:outline-[#051125] focus:ring-1 focus:ring-[#051125]"
                  >
                    {expenseCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>

                  <div className="flex justify-between items-center mt-1">
                    <button
                      type="button"
                      onClick={() => setIsManagingExpenseCategories(!isManagingExpenseCategories)}
                      className="text-[12px] text-[#C67C3E] hover:underline hover:text-amber-700 cursor-pointer flex items-center gap-1 font-bold"
                    >
                      {isManagingExpenseCategories ? "✕ Cerrar Edición" : "⚙️ Editar Listado / Categorías"}
                    </button>
                  </div>
                  
                  {/* Manage Categories Section */}
                  {isManagingExpenseCategories && (
                    <div className="mt-2 bg-slate-50 p-2 rounded border border-slate-200 animate-fade-in text-[13px]">
                      <span className="block text-[12px] font-bold text-slate-400 uppercase tracking-wide mb-1">Gestionar Categorías:</span>
                      <div className="flex flex-wrap gap-1 mb-2 max-h-20 overflow-y-auto">
                        {expenseCategories.map(cat => (
                          <span key={cat} className="inline-flex items-center gap-1 bg-white border border-slate-200 text-[12px] text-slate-600 px-1.5 py-0.5 rounded font-medium">
                            {cat}
                            <button 
                              type="button" 
                              onClick={() => {
                                if (expenseCategories.length <= 1) {
                                  alert("Debes tener al menos una categoría.");
                                  return;
                                }
                                const updated = expenseCategories.filter(c => c !== cat);
                                setExpenseCategories(updated);
                                if (expFormCategory === cat) {
                                  setExpFormCategory(updated[0]);
                                }
                              }}
                              className="text-slate-400 hover:text-rose-600 font-bold ml-0.5 text-[13px] focus:outline-none cursor-pointer"
                              title="Eliminar opción"
                            >
                              &times;
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-1">
                        <input 
                          type="text" 
                          placeholder="Nueva cat..." 
                          id="new-expense-cat"
                          className="bg-white border px-1.5 py-1 text-[12px] rounded flex-grow focus:outline-none text-slate-800"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const val = (e.target as HTMLInputElement).value.trim();
                              if (val && !expenseCategories.includes(val)) {
                                setExpenseCategories([...expenseCategories, val]);
                                setExpFormCategory(val);
                                (e.target as HTMLInputElement).value = '';
                              }
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const input = document.getElementById('new-expense-cat') as HTMLInputElement;
                            const val = input?.value.trim();
                            if (val && !expenseCategories.includes(val)) {
                              setExpenseCategories([...expenseCategories, val]);
                              setExpFormCategory(val);
                              input.value = '';
                            }
                          }}
                          className="bg-[#C67C3E] text-white px-2 py-1 text-[12px] font-bold rounded hover:bg-amber-700 transition-colors cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Concepto / Glosa de Pago:</label>
                <input 
                  type="text"
                  value={expFormDescription}
                  onChange={(e) => setExpFormDescription(e.target.value)}
                  placeholder="Ej. Soportes articulados reforzados - Lote 12"
                  required
                  className="w-full bg-slate-50 border p-2 text-xs rounded text-slate-800 focus:outline-[#051125] focus:ring-1 focus:ring-[#051125]"
                />
              </div>

              <div>
                <label className="block text-[13px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Importe en Bolivianos (Bs.):</label>
                <input 
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={expFormAmount}
                  onChange={(e) => setExpFormAmount(e.target.value)}
                  placeholder="0.00 Bs."
                  required
                  className="w-full bg-slate-50 border p-2 text-xs rounded text-slate-800 font-mono focus:outline-[#051125] focus:ring-1 focus:ring-[#051125]"
                />
              </div>

              <div>
                <label className="block text-[13px] font-bold text-[#C67C3E] uppercase tracking-widest mb-1.5">Usuario de Registro (Responsable):</label>
                <select
                  value={expOperator}
                  onChange={(e) => setExpOperator(e.target.value)}
                  className="w-full bg-slate-50 border p-2 text-xs rounded text-slate-800 cursor-pointer focus:outline-[#051125] focus:ring-1 focus:ring-[#051125]"
                >
                  {usersList.map(u => (
                    <option key={u.id} value={u.name}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>

              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end p-4 border-t text-xs shrink-0 bg-white">
                <button
                  onClick={handleCloseExpenseModal}
                  type="button"
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-4 rounded-lg cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-[#051125] hover:bg-slate-800 text-white font-extrabold py-2 px-5 rounded-lg cursor-pointer flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Check className="w-4 h-4 text-emerald-500" />
                  {editingExpenseId ? "Guardar Cambios" : "Guardar Gasto"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL CAPITAL INVESTMENT REGISTRATION OVERLAY */}
      {isCapitalModalOpen && (
        <div className="fixed inset-0 bg-[#051125]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-fade-in border-t-4 border-t-[#C67C3E]">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 bg-slate-50 border-b border-slate-200">
              <div>
                <h3 className="text-sm font-bold text-[#051125] flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-[#C67C3E]" />
                  Registrar Activo de Capital
                </h3>
                <p className="text-[13px] text-slate-500 mt-1">
                  Registra la adquisición de maquinaria, herramientas o flota pesada amortizable.
                </p>
              </div>
              <button 
                onClick={() => setIsCapitalModalOpen(false)}
                className="h-7 w-7 rounded-full flex items-center justify-center hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors"
                type="button"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleAddInvestment} className="p-5 space-y-4">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Fecha Adquisición:</label>
                  <input 
                    type="date"
                    value={invFormDate}
                    onChange={(e) => setInvFormDate(e.target.value)}
                    className="w-full bg-slate-50 border p-2 text-xs rounded text-slate-800 focus:outline-[#051125] focus:ring-1 focus:ring-[#051125]"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Tipo de Activo:</label>
                  <select
                    value={invFormType}
                    onChange={(e) => setInvFormType(e.target.value)}
                    className="w-full bg-slate-50 border p-2 text-xs rounded text-slate-800 cursor-pointer focus:outline-[#051125] focus:ring-1 focus:ring-[#051125]"
                  >
                    {investmentTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>

                  <div className="flex justify-between items-center mt-1">
                    <button
                      type="button"
                      onClick={() => setIsManagingInvestmentTypes(!isManagingInvestmentTypes)}
                      className="text-[12px] text-[#C67C3E] hover:underline hover:text-amber-700 cursor-pointer flex items-center gap-1 font-bold"
                    >
                      {isManagingInvestmentTypes ? "✕ Cerrar Edición" : "⚙️ Editar Listado / Activos"}
                    </button>
                  </div>
                  
                  {/* Manage Investment Types Section */}
                  {isManagingInvestmentTypes && (
                    <div className="mt-2 bg-slate-50 p-2 rounded border border-slate-200 animate-fade-in text-[13px]">
                      <span className="block text-[12px] font-bold text-slate-400 uppercase tracking-wide mb-1">Gestionar Tipos:</span>
                      <div className="flex flex-wrap gap-1 mb-2 max-h-20 overflow-y-auto">
                        {investmentTypes.map(type => (
                          <span key={type} className="inline-flex items-center gap-1 bg-white border border-slate-200 text-[12px] text-slate-600 px-1.5 py-0.5 rounded font-medium">
                            {type}
                            <button 
                              type="button" 
                              onClick={() => {
                                if (investmentTypes.length <= 1) {
                                  alert("Debes tener al menos un tipo de activo.");
                                  return;
                                }
                                const updated = investmentTypes.filter(t => t !== type);
                                setInvestmentTypes(updated);
                                if (invFormType === type) {
                                  setInvFormType(updated[0]);
                                }
                              }}
                              className="text-slate-400 hover:text-rose-600 font-bold ml-0.5 text-[13px] focus:outline-none cursor-pointer"
                              title="Eliminar opción"
                            >
                              &times;
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-1">
                        <input 
                          type="text" 
                          placeholder="Nuevo tipo..." 
                          id="new-investment-type"
                          className="bg-white border px-1.5 py-1 text-[12px] rounded flex-grow focus:outline-none text-slate-800"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const val = (e.target as HTMLInputElement).value.trim();
                              if (val && !investmentTypes.includes(val)) {
                                setInvestmentTypes([...investmentTypes, val]);
                                setInvFormType(val);
                                (e.target as HTMLInputElement).value = '';
                              }
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const input = document.getElementById('new-investment-type') as HTMLInputElement;
                            const val = input?.value.trim();
                            if (val && !investmentTypes.includes(val)) {
                              setInvestmentTypes([...investmentTypes, val]);
                              setInvFormType(val);
                              input.value = '';
                            }
                          }}
                          className="bg-[#C67C3E] text-white px-2 py-1 text-[12px] font-bold rounded hover:bg-amber-700 transition-colors cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Nombre del Activo / SKU Identificador:</label>
                <input 
                  type="text"
                  value={invFormName}
                  onChange={(e) => setInvFormName(e.target.value)}
                  placeholder="Ej. Furgón de Reparto Chevrolet N300"
                  required
                  className="w-full bg-slate-50 border p-2 text-xs rounded text-slate-800 focus:outline-[#051125] focus:ring-1 focus:ring-[#051125]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Costo Histórico (Bs.):</label>
                  <input 
                    type="number"
                    step="0.01"
                    min="1"
                    value={invFormCost}
                    onChange={(e) => setInvFormCost(e.target.value)}
                    placeholder="0.00 Bs."
                    required
                    className="w-full bg-slate-50 border p-2 text-xs rounded text-slate-800 font-mono focus:outline-[#051125] focus:ring-1 focus:ring-[#051125]"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Vida Útil (Años):</label>
                  <input 
                    type="number"
                    min="1"
                    value={invFormLifespan}
                    onChange={(e) => setInvFormLifespan(e.target.value)}
                    placeholder="Ej. 5"
                    required
                    className="w-full bg-slate-50 border p-2 text-xs rounded text-slate-800 font-mono focus:outline-[#051125] focus:ring-1 focus:ring-[#051125]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-bold text-[#C67C3E] uppercase tracking-widest mb-1.5">Usuario de Registro (Responsable):</label>
                <select
                  value={invOperator}
                  onChange={(e) => setInvOperator(e.target.value)}
                  className="w-full bg-slate-50 border p-2 text-xs rounded text-slate-800 cursor-pointer focus:outline-[#051125] focus:ring-1 focus:ring-[#051125]"
                >
                  {usersList.map(u => (
                    <option key={u.id} value={u.name}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end pt-3 border-t text-xs">
                <button 
                  onClick={() => setIsCapitalModalOpen(false)}
                  type="button"
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-4 rounded-lg cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="bg-[#C67C3E] hover:bg-[#b06c32] text-white font-extrabold py-2 px-5 rounded-lg cursor-pointer flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Check className="w-4 h-4 text-emerald-500" />
                  Dar de Alta Activo
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL DE FICHAS DE DEPRECIACIÓN */}
      {isDepreciationModalOpen && (
        <div className="fixed inset-0 bg-[#051125]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-4xl h-[85vh] overflow-hidden flex flex-col animate-fade-in border-t-4 border-t-[#C67C3E]">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 bg-slate-50 border-b border-slate-200">
              <div>
                <h3 className="text-sm font-bold text-[#051125] flex items-center gap-1.5 font-sans">
                  <FileText className="w-4 h-4 text-[#C67C3E]" />
                  Fichas de Depreciación & Amortización de Activos
                </h3>
                <p className="text-[13px] text-slate-500 mt-1 font-sans">
                  Documento analítico detallado del desgaste, vida útil y cuotas estimadas de amortización de activos fijos de Torre Forte.
                </p>
              </div>
              <button 
                onClick={() => setIsDepreciationModalOpen(false)}
                className="h-7 w-7 rounded-full flex items-center justify-center hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                type="button"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            {capitalInvestments.length === 0 ? (
              <div className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-4 font-sans">
                <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center text-amber-500">
                  <AlertCircle className="w-10 h-10" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#051125]">No se encontraron activos de capital</h4>
                  <p className="text-xs text-slate-500 max-w-sm mt-1">
                    Para visualizar las Fichas de Depreciación, primero debe registrar un Activo de Capital en el módulo de gastos.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsDepreciationModalOpen(false);
                    setIsCapitalModalOpen(true);
                  }}
                  className="bg-[#C67C3E] hover:bg-[#b06c32] text-white font-bold py-2 px-4 rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Registrar Primer Activo
                </button>
              </div>
            ) : (() => {
              const activeAsset = capitalInvestments[selectedDepreciationIndex] || capitalInvestments[0];
              // calculations
              const originalCost = activeAsset.initialCost || 0;
              const years = activeAsset.lifespanYears || 1;
              const annualDep = originalCost / years;
              const recoveredSofar = activeAsset.recovered || 0;
              const calcProgressPct = originalCost > 0 ? Math.min(100, Math.round((recoveredSofar / originalCost) * 100)) : 0;
              const remainingVal = Math.max(0, originalCost - recoveredSofar);

              return (
                <div className="flex-1 flex flex-col md:flex-row overflow-hidden font-sans">
                  
                  {/* Left Sidebar: Assets list */}
                  <div className="w-full md:w-1/3 bg-slate-50 border-r border-slate-200 overflow-y-auto p-3 space-y-2 flex-shrink-0">
                    <span className="block text-[12px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-2 font-mono">Activos Corporativos</span>
                    {capitalInvestments.map((inv, idx) => {
                      const isActive = idx === selectedDepreciationIndex;
                      const assetProgress = inv.initialCost > 0 ? Math.min(100, Math.round((inv.recovered / inv.initialCost) * 100)) : 0;
                      return (
                        <button
                          key={inv.id}
                          type="button"
                          onClick={() => setSelectedDepreciationIndex(idx)}
                          className={`w-full text-left p-2.5 rounded-lg border text-xs cursor-pointer transition-all flex flex-col space-y-1 ${
                            isActive 
                              ? 'bg-[#051125] text-white border-[#051125] shadow-sm' 
                              : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          <div className="flex justify-between items-start gap-1">
                            <span className="font-bold truncate text-[14px] leading-tight flex-1">{inv.name}</span>
                            <span className={`text-[9.5px] font-mono font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${
                              isActive ? 'bg-white/20 text-white' : 'bg-slate-105 text-slate-600 border border-slate-200'
                            }`}>
                              {inv.id}
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-center text-[9.5px]">
                            <span className={isActive ? 'text-slate-300' : 'text-slate-500'}>
                              {inv.type === 'Fleet Vehicle' ? '🚗 Vehículo' : inv.type === 'Heavy Machinery' ? '⚙️ Maquinaria' : inv.type === 'IT Infrastructure' ? '💻 IT / Servidor' : '🏢 Inmueble'}
                            </span>
                            <span className={`font-semibold ${isActive ? 'text-emerald-400' : 'text-emerald-600'}`}>
                              {assetProgress}% amortizado
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Right Content Pane: Selected asset sheet */}
                  <div className="flex-1 p-5 overflow-y-auto space-y-4">
                    
                    {/* Header Details */}
                    <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-[#051125]">{activeAsset.name}</h4>
                          <span className="bg-[#C67C3E]/10 text-[#C67C3E] border border-[#C67C3E]/20 text-[13px] font-mono font-bold px-2 py-0.5 rounded-full">
                            {activeAsset.id}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[14px] text-slate-500 mt-1">
                          <span className="flex items-center gap-1">💻 Categoría: <strong>{activeAsset.type}</strong></span>
                          <span>• Adquisición: <strong>{activeAsset.date}</strong></span>
                          <span>• Responsable: <strong>{activeAsset.operator || 'Carlos Mendoza'}</strong></span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-start sm:items-end sm:text-right">
                        <span className="text-[12px] uppercase tracking-wider font-bold text-slate-400 font-mono">Estado de Amortización</span>
                        <span className={`text-[13px] font-bold px-2 py-0.5 rounded-full mt-1 ${
                          calcProgressPct >= 100 
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-250' 
                            : 'bg-amber-100 text-amber-800 border border-amber-250'
                        }`}>
                          {calcProgressPct >= 100 ? '✓ Totalmente Amortizado' : '⚙️ En Proceso de Depreciación'}
                        </span>
                      </div>
                    </div>

                    {/* Financial KPI Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      
                      <div className="bg-[#051125]/5 border border-slate-200 rounded-xl p-3.5 space-y-1">
                        <span className="block text-[12px] font-bold text-slate-500 uppercase tracking-widest font-mono">Inversión Inicial</span>
                        <div className="text-xs font-bold font-mono text-[#051125]">Bs. {originalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        <div className="text-[13px] text-slate-400">Valor original de compra</div>
                      </div>

                      <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3.5 space-y-1">
                        <span className="block text-[12px] font-bold text-emerald-700 uppercase tracking-widest font-mono">Desgaste Acumulado</span>
                        <div className="text-xs font-bold font-mono text-emerald-800">Bs. {recoveredSofar.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        <div className="text-[13px] text-emerald-600/90 font-medium">Recuperado ({calcProgressPct}%) del activo</div>
                      </div>

                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
                        <span className="block text-[12px] font-bold text-slate-500 uppercase tracking-widest font-mono">Valor Neto en Libros</span>
                        <div className="text-xs font-bold font-mono text-slate-800">Bs. {remainingVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        <div className="text-[13px] text-slate-400">Valor contable remanente</div>
                      </div>

                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                      <div className="flex justify-between items-center text-[10.5px]">
                        <span className="font-semibold text-slate-600">Representación Visual de Pérdida de Valor</span>
                        <span className="font-bold text-slate-700">{calcProgressPct}%</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden flex">
                        <div className="bg-emerald-600 h-full rounded-full transition-all duration-500" style={{ width: `${calcProgressPct}%` }}></div>
                      </div>
                    </div>

                    {/* Detailed Straight Line Depreciation Schedule */}
                    <div className="space-y-2">
                      <h5 className="text-[11.5px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                        <Clock className="w-3.5 h-3.5 text-[#C67C3E]" />
                        Tabla Estimada por Año (Método de Línea Recta)
                      </h5>
                      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-[#051125] text-slate-200 text-[9.5px] uppercase tracking-wider font-mono">
                            <tr>
                              <th className="py-2.5 px-3 font-bold">Año Calendario</th>
                              <th className="py-2.5 px-3 font-bold text-right">Depreciación Anual</th>
                              <th className="py-2.5 px-3 font-bold text-right">Depreciación Acumulada</th>
                              <th className="py-2.5 px-3 font-bold text-right">Valor Neto en Libros</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-[14px] font-mono">
                            {Array.from({ length: years }).map((_, i) => {
                              const yearNum = i + 1;
                              const stepAnnual = annualDep;
                              const stepAccumulated = annualDep * yearNum;
                              const stepBookValue = Math.max(0, originalCost - stepAccumulated);
                              
                              const isAmortizedYear = recoveredSofar >= stepAccumulated;

                              return (
                                <tr key={i} className={`hover:bg-slate-50/50 ${isAmortizedYear ? 'bg-slate-50/30 text-slate-400' : 'text-slate-700'}`}>
                                  <td className="py-2 px-3 font-bold text-slate-800">
                                    Año {yearNum}
                                    {isAmortizedYear && <span className="ml-1.5 text-[12px] font-sans font-semibold text-emerald-600 px-1 py-0.2 bg-emerald-50 rounded">Amortizado</span>}
                                  </td>
                                  <td className="py-2 px-3 text-right">Bs. {stepAnnual.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                  <td className="py-2 px-3 text-right">Bs. {stepAccumulated.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                  <td className="py-2 px-3 text-right font-semibold text-[#051125]">Bs. {stepBookValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Explanatory notes */}
                    <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-lg text-[10.5px] leading-relaxed text-slate-500 font-sans">
                      <strong className="block text-[#051125] font-semibold mb-1">💡 Nota sobre el Método Directo de Línea Recta:</strong>
                      La vida estimada para este activo móvil o tecnológico está presupuestada en <strong className="text-slate-700">{years} años</strong>. Cada año fiscal se le resta un valor de desgaste correspondiente a <strong className="text-slate-700">Bs. {annualDep.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong> de forma directa. La amortización real actual sumada por la administración asciende a <strong className="text-slate-700">Bs. {recoveredSofar.toLocaleString()}</strong>, con lo cual restan exactamente <strong className="text-slate-700">Bs. {remainingVal.toLocaleString()}</strong> para su depreciación definitiva.
                    </div>

                  </div>

                </div>
              );
            })()}

            {/* Modal Footer */}
            <div className="bg-slate-50 border-t border-slate-200 p-3 flex justify-end font-sans">
              <button
                onClick={() => setIsDepreciationModalOpen(false)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-2 px-5 rounded-lg text-xs cursor-pointer transition-colors shadow-sm"
              >
                Cerrar Planilla Analítica
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL REGISTRO DE ADMINISTRADORES CON ACCESO TOTAL */}
      {/* MODAL EXITOSO DESPUÉS DE GUARDAR REGISTRO */}
      {showSuccessModal && newlyCreatedRecord && (
        <div className="fixed inset-0 bg-[#051125]/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col border-t-4 border-t-emerald-500 animate-scale-in">

            {/* Modal Body */}
            <div className="p-6 text-center space-y-4 overflow-y-auto">
              {/* Check Icon with Animation */}
              <div className="w-16 h-16 bg-emerald-50 text-emerald-500 border border-emerald-100 rounded-full flex items-center justify-center mx-auto shadow-inner animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              
              <div>
                <h3 className="text-lg font-bold text-[#051125] leading-tight">¡Registro Guardado con Éxito!</h3>
                <p className="text-xs text-slate-500 mt-1">El nuevo flujo de caja se ha guardado de forma permanente.</p>
              </div>

              {/* Record Summary Card */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-left text-xs space-y-2.5 font-sans">
                <div className="flex justify-between border-b pb-1.5 border-slate-200/50">
                  <span className="text-slate-400 font-medium">Código:</span>
                  <span className="font-mono font-bold text-[#051125]">{newlyCreatedRecord.id}</span>
                </div>
                <div className="flex justify-between border-b pb-1.5 border-slate-200/50">
                  <span className="text-slate-400 font-medium">Cliente:</span>
                  <span className="font-semibold text-slate-800">{newlyCreatedRecord.client || 'Público General'}</span>
                </div>
                <div className="flex justify-between border-b pb-1.5 border-slate-200/50">
                  <span className="text-slate-400 font-medium">Servicio/Ítem:</span>
                  <span className="font-medium text-slate-700 truncate max-w-[200px]" title={newlyCreatedRecord.item}>{newlyCreatedRecord.item}</span>
                </div>
                <div className="flex justify-between border-b pb-1.5 border-slate-200/50">
                  <span className="text-slate-400 font-medium">Total Neto:</span>
                  <span className="font-mono font-bold text-[#051125]">Bs. {newlyCreatedRecord.amount.toFixed(2)}</span>
                </div>
                {newlyCreatedRecord.notes && (
                  <div className="text-[14px] bg-white p-2 rounded border border-slate-100 mt-1 text-slate-500 italic text-left">
                    <span className="font-bold text-slate-400 not-italic block text-[12px] uppercase tracking-wide">Notas:</span>
                    {newlyCreatedRecord.notes}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 pt-2 text-xs">
                
                {/* Send via WhatsApp PDF */}
                <button
                  onClick={handleShareWhatsApp}
                  type="button"
                  className="w-full bg-[#25D366] hover:bg-[#20ba59] text-white font-extrabold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer hover:shadow-lg text-sm"
                >
                  <Send className="w-4 h-4 text-white" />
                  Enviar por WhatsApp (PDF)
                </button>

                {/* Download PDF */}
                <button
                  onClick={handleDownloadPDF}
                  type="button"
                  className="w-full bg-[#051125] hover:bg-slate-800 text-white font-extrabold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer hover:shadow-lg text-sm"
                >
                  <FileText className="w-4 h-4 text-[#C67C3E]" />
                  Descargar PDF Elegante
                </button>
                
                {/* Close Button */}
                <button
                  onClick={() => {
                    setShowSuccessModal(false);
                    setNewlyCreatedRecord(null);
                  }}
                  type="button"
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl transition-colors cursor-pointer mt-1"
                >
                  Volver al Panel
                </button>

              </div>

            </div>

          </div>
        </div>
      )}

      {isAdminRegisterOpen && (
        <div className="fixed inset-0 bg-[#051125]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col border-t-4 border-t-[#C67C3E]">

            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 bg-slate-50 border-b border-slate-200 shrink-0">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#C67C3E] animate-pulse" />
                <div>
                  <h3 className="text-sm font-bold text-[#051125] text-left">Registrar Administrador General</h3>
                  <p className="text-[13px] text-slate-500 mt-0.5 text-left font-sans">Asignar accesos de nivel total para control del panel registros y auditoría.</p>
                </div>
              </div>
              <button
                onClick={() => setIsAdminRegisterOpen(false)}
                className="h-7 w-7 rounded-full flex items-center justify-center hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors"
                type="button"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleRegisterAdminSubmit} className="flex flex-col flex-1 min-h-0">
              <div className="p-5 space-y-4 text-xs overflow-y-auto flex-1 min-h-0">

              <div className="bg-amber-50 border border-amber-200 text-[#b5733d] p-3 rounded-lg flex gap-2 text-[13px] leading-relaxed text-left">
                <Lock className="w-4 h-4 shrink-0 mt-0.5 text-[#C67C3E]" />
                <div>
                  <span className="font-bold block text-slate-700">Privilegios Corporativos Concedidos</span>
                  Este formulario genera un perfil de nivel <strong className="text-[#051125]">Admin (Superusuario)</strong> con permisos inalterables para editar inventario, modificar finanzas, y auditar registros de caja.
                </div>
              </div>

              {/* Name field */}
              <div className="text-left">
                <label className="block text-[13px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 font-mono">Nombre Completo del Administrador:</label>
                <input 
                  type="text" 
                  value={adminRegName}
                  onChange={(e) => setAdminRegName(e.target.value)}
                  placeholder="Ej. Ing. René Choque (Supervisión)"
                  required
                  className="w-full bg-slate-50 border p-2 text-xs rounded text-slate-800 focus:outline-[#051125] font-sans"
                />
              </div>

              {/* Email field */}
              <div className="text-left">
                <label className="block text-[13px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 font-mono">Correo Corporativo / Usuario:</label>
                <input 
                  type="email" 
                  value={adminRegEmail}
                  onChange={(e) => setAdminRegEmail(e.target.value)}
                  placeholder="r.choque@torreforte.bo"
                  required
                  className="w-full bg-slate-50 border p-2 text-xs rounded text-slate-800 focus:outline-[#051125] font-sans"
                />
              </div>

              {/* Department Option */}
              <div className="text-left">
                <label className="block text-[13px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 font-mono">Departamento / Oficina Asignada:</label>
                <select 
                  value={adminRegDept}
                  onChange={(e) => setAdminRegDept(e.target.value)}
                  className="w-full bg-slate-50 border p-2 text-xs rounded text-slate-800 cursor-pointer"
                >
                  <option value="Gerencia General">Gerencia General / Dirección</option>
                  <option value="Auditoría Financiera">Contabilidad y Auditoría Financiera</option>
                  <option value="Ingeniería y Proyectos">Jefatura de Ingeniería & Proyectos</option>
                  <option value="Logística General">Supervisión Técnica & Logística</option>
                </select>
              </div>

              {/* Security PIN and password code */}
              <div className="grid grid-cols-2 gap-3 text-left">
                <div>
                  <label className="block text-[13px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 font-mono text-rose-500">PIN de Seguridad (4+ dígitos):</label>
                  <input 
                    type="password" 
                    value={adminRegPin}
                    onChange={(e) => setAdminRegPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="****"
                    maxLength={8}
                    required
                    className="w-full bg-slate-50 border p-2 text-xs rounded text-slate-800 font-mono text-center focus:outline-[#051125]"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-mono">Contraseña Temporal:</label>
                  <input 
                    type="text" 
                    value={adminRegPassword}
                    onChange={(e) => setAdminRegPassword(e.target.value)}
                    placeholder="AutoPwd2026"
                    className="w-full bg-slate-100 border p-2 text-xs rounded text-slate-500 font-mono focus:outline-none"
                  />
                </div>
              </div>

              </div>

              {/* Footer Buttons */}
              <div className="flex gap-3 justify-end p-4 border-t text-xs shrink-0 bg-white">
                <button
                  onClick={() => setIsAdminRegisterOpen(false)}
                  type="button"
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-4 rounded-lg cursor-pointer transition-colors"
                >
                  Regresar
                </button>
                <button
                  type="submit"
                  className="bg-[#051125] hover:bg-slate-800 text-white font-extrabold py-2 px-5 rounded-lg cursor-pointer flex items-center gap-1.5 transition-colors shadow-sm animate-pulse"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  Autorizar Acceso Total
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* MODAL EDICIóN DE PRODUCTO / MODELO */}
      {editingProduct && (
        <div className="fixed inset-0 bg-[#051125]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col border-t-4 border-t-[#C67C3E]">

            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 bg-slate-50 border-b border-slate-200 shrink-0">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-[#C67C3E]" />
                <div>
                  <h3 className="text-sm font-bold text-[#051125] text-left">Editar Modelo de Producto</h3>
                  <p className="text-[13px] text-slate-500 mt-0.5 text-left font-sans">Modifica las especificaciones y precios de este soporte en el catálogo.</p>
                </div>
              </div>
              <button
                onClick={() => setEditingProduct(null)}
                className="h-7 w-7 rounded-full flex items-center justify-center hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors"
                type="button"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleEditProductSubmit} className="flex flex-col flex-1 min-h-0">
              <div className="p-5 space-y-4 text-xs font-sans overflow-y-auto flex-1 min-h-0">

              {/* Product SKU and Name fields */}
              <div className="grid grid-cols-3 gap-3 text-left">
                <div className="col-span-1">
                  <label className="block text-[13px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 font-mono">Código / SKU:</label>
                  <input 
                    type="text" 
                    value={editProdSku}
                    onChange={(e) => setEditProdSku(e.target.value)}
                    required
                    placeholder="Ej. T-80"
                    className="w-full bg-slate-50 border p-2 text-xs rounded text-slate-800 font-mono focus:outline-[#051125] uppercase"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-[13px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 font-mono">Nombre / Descripción:</label>
                  <input 
                    type="text" 
                    value={editProdName}
                    onChange={(e) => setEditProdName(e.target.value)}
                    required
                    placeholder="Ej. Soporte Fijo de Alta Seguridad"
                    className="w-full bg-slate-50 border p-2 text-xs rounded text-slate-800 focus:outline-[#051125]"
                  />
                </div>
              </div>

              {/* Price and Category selection */}
              <div className="grid grid-cols-2 gap-3 text-left">
                <div>
                  <label className="block text-[13px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 font-mono">Precio Unitario (Bs.):</label>
                  <input 
                    type="number" 
                    value={editProdPrice || ''}
                    onChange={(e) => setEditProdPrice(parseFloat(e.target.value) || 0)}
                    required
                    min={1}
                    className="w-full bg-slate-50 border p-2 text-xs rounded text-slate-800 font-mono focus:outline-[#051125]"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 font-mono">Categoría de Catálogo:</label>
                  <select 
                    value={editProdCategory}
                    onChange={(e) => setEditProdCategory(e.target.value)}
                    className="w-full bg-slate-50 border p-2 text-xs rounded text-slate-800 cursor-pointer focus:outline-[#051125] capitalize"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Stock Status and target TV sizes */}
              <div className="grid grid-cols-2 gap-3 text-left">
                <div>
                  <label className="block text-[13px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 font-mono">Tipo:</label>
                  <select 
                    value={editProdStock}
                    onChange={(e) => setEditProdStock(e.target.value as any)}
                    className="w-full bg-slate-50 border p-2 text-xs rounded text-slate-800 cursor-pointer focus:outline-[#051125]"
                  >
                    <option value="Compra-Venta">Compra-Venta</option>
                    <option value="Modificado">Modificado</option>
                    <option value="Fabricado">Fabricado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 font-mono">Pantallas Soportadas:</label>
                  <input 
                    type="text" 
                    value={editProdSizes}
                    onChange={(e) => setEditProdSizes(e.target.value)}
                    placeholder='Ej. de 32" a 65"'
                    className="w-full bg-slate-50 border p-2 text-xs rounded text-slate-800 focus:outline-[#051125]"
                    disabled={editProdCategory === 'climatizacion'}
                  />
                </div>
              </div>

              {/* Max Load and BTU dynamic specs fields */}
              <div className="grid grid-cols-2 gap-3 text-left">
                <div>
                  <label className="block text-[13px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 font-mono">Carga Máxima de Soporte:</label>
                  <input 
                    type="text" 
                    value={editProdMaxLoad}
                    onChange={(e) => setEditProdMaxLoad(e.target.value)}
                    placeholder="Ej. Hasta 45 kg"
                    className="w-full bg-slate-50 border p-2 text-xs rounded text-[#051125] focus:outline-[#051125]"
                    disabled={editProdCategory === 'climatizacion'}
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 font-mono">Capacidad (BTU):</label>
                  <input 
                    type="number" 
                    value={editProdBtu}
                    onChange={(e) => setEditProdBtu(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))}
                    placeholder="Ej. 12000"
                    className="w-full bg-slate-50 border p-2 text-xs rounded text-[#051125] font-mono focus:outline-[#051125]"
                  />
                </div>
              </div>

              {/* Descripción y Especificaciones Personalizadas (Edición) */}
              <div className="space-y-3 pt-1 border-t border-dashed border-slate-200 text-left">
                <div>
                  <label className="block text-[13px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 font-mono">Descripción del Producto o Servicio:</label>
                  <textarea
                    rows={2}
                    value={editProdDescription}
                    onChange={(e) => setEditProdDescription(e.target.value)}
                    placeholder="Ej. Limpieza completa externa e interna de aires split..."
                    className="w-full bg-slate-50 border p-2 text-xs rounded text-slate-800 focus:outline-[#051125] resize-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 font-mono">Especificación / Material / Detalles del Servicio:</label>
                  <input
                    type="text"
                    value={editProdMaterial}
                    onChange={(e) => setEditProdMaterial(e.target.value)}
                    placeholder="Ej. Incluye hidrolavado, químicos biodegradables, revisión de fugas..."
                    className="w-full bg-slate-50 border p-2 text-xs rounded text-slate-800 focus:outline-[#051125]"
                    required
                  />
                </div>
              </div>

               {/* Configuración de Imagen (Edición) */}
              <div className="text-left border-t pt-3 mt-1 space-y-2.5 font-sans">
                <label className="block text-[13px] font-bold text-slate-500 uppercase tracking-widest font-mono">Imágenes del Producto (Hasta 3 imágenes):</label>
                
                {/* 3 Interactive Slots */}
                <div className="grid grid-cols-3 gap-2.5 mb-1.5">
                  {[0, 1, 2].map((idx) => {
                    const isSelected = activeEditImageSlot === idx;
                    const imgUrl = editProdImages[idx];
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveEditImageSlot(idx)}
                        className={`relative aspect-square rounded-lg border-2 flex flex-col items-center justify-center p-1.5 overflow-hidden transition-all text-left bg-slate-50 cursor-pointer ${
                          isSelected 
                            ? 'border-[#C67C3E] bg-[#C67C3E]/5 ring-1 ring-[#C67C3E]' 
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {imgUrl ? (
                          <img referrerPolicy="no-referrer" src={imgUrl} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover rounded" />
                        ) : (
                          <div className="text-center p-1 text-slate-400">
                            <span className="block text-base leading-none font-bold">+</span>
                            <span className="text-[8px] uppercase font-mono tracking-tighter">Foto {idx + 1}</span>
                          </div>
                        )}
                        <div className="absolute top-1 left-1 bg-black/60 text-white text-[8px] px-1 py-0.2 rounded font-mono">
                          {idx === 0 ? 'P' : `S${idx}`}
                        </div>
                        {imgUrl && (
                          <button
                            type="button"
                            onClick={(ev) => {
                              ev.stopPropagation();
                              setEditProdImageAt(idx, '');
                            }}
                            className="absolute bottom-1 right-1 bg-rose-600 hover:bg-rose-700 text-white rounded p-0.5 text-[8px] leading-none font-bold"
                            title="Eliminar esta foto"
                          >
                            &times;
                          </button>
                        )}
                      </button>
                    );
                  })}
                </div>

                <p className="text-[13px] text-[#C67C3E] leading-normal font-bold">
                  * Foto {activeEditImageSlot + 1} seleccionada para edición. Medida recomendada: 600x600 px (Relación de aspecto 1:1, formato cuadrado) para una visualización perfecta en las tarjetas de catálogo e inicio.
                </p>

                {/* Source Selection Tabs */}
                <div className="grid grid-cols-3 gap-1 bg-slate-100 p-0.5 rounded-lg text-[13px] mt-2">
                  <button
                    type="button"
                    onClick={() => setEditImageSource('preset')}
                    className={`py-1 rounded font-medium text-center transition-all ${editImageSource === 'preset' ? 'bg-white text-[#051125] shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    Galería
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditImageSource('upload')}
                    className={`py-1 rounded font-medium text-center transition-all ${editImageSource === 'upload' ? 'bg-white text-[#051125] shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    Subir Archivo
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditImageSource('url')}
                    className={`py-1 rounded font-medium text-center transition-all ${editImageSource === 'url' ? 'bg-white text-[#051125] shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    URL Web
                  </button>
                </div>

                {/* Preset Options */}
                {editImageSource === 'preset' && (
                  <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <label className="block text-[12px] text-slate-400 font-bold uppercase">Selecciona imagen de la Galería para Foto {activeEditImageSlot + 1}:</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setEditProdImageAt(activeEditImageSlot, 'https://lh3.googleusercontent.com/aida-public/AB6AXuDAP_Hywg0z1xV-NVCc_OM_E5YeujMPk0L2DNlLp7axI3oMsHgCZF-gi1kUErfuRimptCHdHe5-2m7oMuSQVWl89mPKqJwyEJebOlKoAlU9Mlt0T99O7JbkEg-W2yMVsmZprewJ6ZN7ZiMPjn-FGsYTfVcflAn5pNUW0t9AEIjRI6h94syj-RAWVE71JMHY3DMi6d-bLeM-U_s2SsZ3N4qbja8tKY3Nr1HJ2fZmzTJOEBqtvqfy6S147PXL5nXYBnq3Rlxb8EeB6L1w')}
                        className={`p-1 border rounded bg-white overflow-hidden transition-all ${editProdImages[activeEditImageSlot] === 'https://lh3.googleusercontent.com/aida-public/AB6AXuDAP_Hywg0z1xV-NVCc_OM_E5YeujMPk0L2DNlLp7axI3oMsHgCZF-gi1kUErfuRimptCHdHe5-2m7oMuSQVWl89mPKqJwyEJebOlKoAlU9Mlt0T99O7JbkEg-W2yMVsmZprewJ6ZN7ZiMPjn-FGsYTfVcflAn5pNUW0t9AEIjRI6h94syj-RAWVE71JMHY3DMi6d-bLeM-U_s2SsZ3N4qbja8tKY3Nr1HJ2fZmzTJOEBqtvqfy6S147PXL5nXYBnq3Rlxb8EeB6L1w' ? 'border-[#C67C3E] ring-1 ring-[#C67C3E]' : 'border-slate-200'}`}
                        title="Articulado"
                      >
                        <img referrerPolicy="no-referrer" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDAP_Hywg0z1xV-NVCc_OM_E5YeujMPk0L2DNlLp7axI3oMsHgCZF-gi1kUErfuRimptCHdHe5-2m7oMuSQVWl89mPKqJwyEJebOlKoAlU9Mlt0T99O7JbkEg-W2yMVsmZprewJ6ZN7ZiMPjn-FGsYTfVcflAn5pNUW0t9AEIjRI6h94syj-RAWVE71JMHY3DMi6d-bLeM-U_s2SsZ3N4qbja8tKY3Nr1HJ2fZmzTJOEBqtvqfy6S147PXL5nXYBnq3Rlxb8EeB6L1w" alt="Articulado" className="w-full h-8 object-contain" />
                        <span className="text-[8px] font-medium text-slate-500 block text-center truncate mt-0.5">Articulado</span>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setEditProdImageAt(activeEditImageSlot, 'https://lh3.googleusercontent.com/aida-public/AB6AXuAxHGBcnjogHfbNwYKglyaCRDQH0EiPpu7vOgKF0HC2VKU0wC3bPmcmDnnEV1eBXBjrj9EADLpw6FkrDIog6RoCWJUzhhr1qlGqEVa2zY_fAS1R-yawbVLj81Sz1Kki4tPdLYbc6tgN-MkVqLIAU5UTfm7Hz0JjGosmwzPfdM-4uGOxIFOGQ20saEzC7J_Owzd89O0v83OashnfupSTazMqsAZ21K_EV5tAs7pSPgfE0754QEoJfkJooeYMzzWqFp0IQCe8e5Zi-6ef')}
                        className={`p-1 border rounded bg-white overflow-hidden transition-all ${editProdImages[activeEditImageSlot] === 'https://lh3.googleusercontent.com/aida-public/AB6AXuAxHGBcnjogHfbNwYKglyaCRDQH0EiPpu7vOgKF0HC2VKU0wC3bPmcmDnnEV1eBXBjrj9EADLpw6FkrDIog6RoCWJUzhhr1qlGqEVa2zY_fAS1R-yawbVLj81Sz1Kki4tPdLYbc6tgN-MkVqLIAU5UTfm7Hz0JjGosmwzPfdM-4uGOxIFOGQ20saEzC7J_Owzd89O0v83OashnfupSTazMqsAZ21K_EV5tAs7pSPgfE0754QEoJfkJooeYMzzWqFp0IQCe8e5Zi-6ef' ? 'border-[#C67C3E] ring-1 ring-[#C67C3E]' : 'border-slate-200'}`}
                        title="Fijo de pared"
                      >
                        <img referrerPolicy="no-referrer" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAxHGBcnjogHfbNwYKglyaCRDQH0EiPpu7vOgKF0HC2VKU0wC3bPmcmDnnEV1eBXBjrj9EADLpw6FkrDIog6RoCWJUzhhr1qlGqEVa2zY_fAS1R-yawbVLj81Sz1Kki4tPdLYbc6tgN-MkVqLIAU5UTfm7Hz0JjGosmwzPfdM-4uGOxIFOGQ20saEzC7J_Owzd89O0v83OashnfupSTazMqsAZ21K_EV5tAs7pSPgfE0754QEoJfkJooeYMzzWqFp0IQCe8e5Zi-6ef" alt="Fijo" className="w-full h-8 object-contain" />
                        <span className="text-[8px] font-medium text-slate-500 block text-center truncate mt-0.5">Fijo</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setEditProdImageAt(activeEditImageSlot, 'https://lh3.googleusercontent.com/aida-public/AB6AXuCSgEMFcohBrYDQ1yAr2bB5jh6EUadFlLLCxPKmfgE2QLHTSg4Z7ThpiVdK5kfP4wwIfWMjY9nQHs8knAWPqC486-YT5a82sg_ov7jl5RiPnbQyuayNJFnZyVsi2vPJ4vwrJIJWcSpETWv9b3xm7Zwq0BM8KjM2_8F0Zb5wdf_FcQtN7N1eYs6N1KUel3QTuVUJqS8JfyDRUP_-YKyFWJnyJdZgs2nr0cBFkup0UOqUK4-9rVBfLL8I9PwUDe9UUclf86F5WH7vhIyY')}
                        className={`p-1 border rounded bg-white overflow-hidden transition-all ${editProdImages[activeEditImageSlot] === 'https://lh3.googleusercontent.com/aida-public/AB6AXuCSgEMFcohBrYDQ1yAr2bB5jh6EUadFlLLCxPKmfgE2QLHTSg4Z7ThpiVdK5kfP4wwIfWMjY9nQHs8knAWPqC486-YT5a82sg_ov7jl5RiPnbQyuayNJFnZyVsi2vPJ4vwrJIJWcSpETWv9b3xm7Zwq0BM8KjM2_8F0Zb5wdf_FcQtN7N1eYs6N1KUel3QTuVUJqS8JfyDRUP_-YKyFWJnyJdZgs2nr0cBFkup0UOqUK4-9rVBfLL8I9PwUDe9UUclf86F5WH7vhIyY' ? 'border-[#C67C3E] ring-1 ring-[#C67C3E]' : 'border-slate-200'}`}
                        title="Telescópico Techo"
                      >
                        <img referrerPolicy="no-referrer" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCSgEMFcohBrYDQ1yAr2bB5jh6EUadFlLLCxPKmfgE2QLHTSg4Z7ThpiVdK5kfP4wwIfWMjY9nQHs8knAWPqC486-YT5a82sg_ov7jl5RiPnbQyuayNJFnZyVsi2vPJ4vwrJIJWcSpETWv9b3xm7Zwq0BM8KjM2_8F0Zb5wdf_FcQtN7N1eYs6N1KUel3QTuVUJqS8JfyDRUP_-YKyFWJnyJdZgs2nr0cBFkup0UOqUK4-9rVBfLL8I9PwUDe9UUclf86F5WH7vhIyY" alt="Techo" className="w-full h-8 object-contain" />
                        <span className="text-[8px] font-medium text-slate-500 block text-center truncate mt-0.5">Techo</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setEditProdImageAt(activeEditImageSlot, 'https://lh3.googleusercontent.com/aida-public/AB6AXuAg-fu33tVovoVPAy8Annw3-DjhvRZlxospMeSg5rN7iNZBc81HB4xCrpEC9KqeXALX4SnFVTBCHkvdtRZ6ijL7Yg0xj8HpghguLWiplbtD990sVfyHKWugiBx6RBGdmmDxI_mmcGe-i2oVLBq1aFtxM9D_dWYPNZh1znR_6YTASCf3BEFv1UdRQJSiwPD5on2BJxhSDq-4L-jiYaM5n5TzMvzI8E3XYHZoVkO5oc1vha7npXcOf-vlVQvJI-sTu49QiH6it9mI0KbF')}
                        className={`p-1 border rounded bg-white overflow-hidden transition-all ${editProdImages[activeEditImageSlot] === 'https://lh3.googleusercontent.com/aida-public/AB6AXuAg-fu33tVovoVPAy8Annw3-DjhvRZlxospMeSg5rN7iNZBc81HB4xCrpEC9KqeXALX4SnFVTBCHkvdtRZ6ijL7Yg0xj8HpghguLWiplbtD990sVfyHKWugiBx6RBGdmmDxI_mmcGe-i2oVLBq1aFtxM9D_dWYPNZh1znR_6YTASCf3BEFv1UdRQJSiwPD5on2BJxhSDq-4L-jiYaM5n5TzMvzI8E3XYHZoVkO5oc1vha7npXcOf-vlVQvJI-sTu49QiH6it9mI0KbF' ? 'border-[#C67C3E] ring-1 ring-[#C67C3E]' : 'border-slate-200'}`}
                        title="Pedestal de Piso"
                      >
                        <img referrerPolicy="no-referrer" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAg-fu33tVovoVPAy8Annw3-DjhvRZlxospMeSg5rN7iNZBc81HB4xCrpEC9KqeXALX4SnFVTBCHkvdtRZ6ijL7Yg0xj8HpghguLWiplbtD990sVfyHKWugiBx6RBGdmmDxI_mmcGe-i2oVLBq1aFtxM9D_dWYPNZh1znR_6YTASCf3BEFv1UdRQJSiwPD5on2BJxhSDq-4L-jiYaM5n5TzMvzI8E3XYHZoVkO5oc1vha7npXcOf-vlVQvJI-sTu49QiH6it9mI0KbF" alt="Pedestal" className="w-full h-8 object-contain" />
                        <span className="text-[8px] font-medium text-slate-500 block text-center truncate mt-0.5">Pedestal</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Upload Option */}
                {editImageSource === 'upload' && (
                  <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <label className="block text-[12px] text-slate-400 font-bold uppercase">Cargar Imagen para Foto {activeEditImageSlot + 1} (Drag & Drop / Clíc):</label>
                    <div className="flex items-center gap-3">
                      {editProdImages[activeEditImageSlot] && (
                        <img
                          src={editProdImages[activeEditImageSlot]}
                          alt="Previsualización"
                          className="w-12 h-12 rounded object-cover border border-slate-200 bg-white"
                        />
                      )}
                      <div className="flex-1 relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const r = new FileReader();
                              r.onload = (evt) => {
                                setEditProdImageAt(activeEditImageSlot, evt.target?.result as string);
                              };
                              r.readAsDataURL(file);
                            }
                          }}
                          className="w-full text-[13px] text-slate-500 rounded border border-dashed border-slate-300 p-2 bg-white cursor-pointer hover:bg-slate-100 transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Custom URL Option */}
                {editImageSource === 'url' && (
                  <div className="space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-sans">
                    <label className="block text-[12px] text-[#051125] font-bold uppercase">Dirección URL para Foto {activeEditImageSlot + 1}:</label>
                    <input
                      type="url"
                      value={editProdImages[activeEditImageSlot] || ''}
                      onChange={(e) => setEditProdImageAt(activeEditImageSlot, e.target.value)}
                      placeholder="https://ejemplo.com/imagen.jpg"
                      className="w-full bg-white border p-1.5 text-[13px] rounded focus:outline-[#051125]"
                    />
                  </div>
                )}
              </div>

              </div>

              {/* Footer Buttons */}
              <div className="flex gap-3 justify-end p-4 border-t text-xs shrink-0 bg-white">
                <button
                  onClick={() => setEditingProduct(null)}
                  type="button"
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-4 rounded-lg cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-[#051125] hover:bg-slate-800 text-white font-extrabold py-2 px-5 rounded-lg cursor-pointer flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Check className="w-4 h-4 text-emerald-500" />
                  Guardar Cambios
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* MODAL EDIT RECORD OVERLAY */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-[#051125]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col animate-fade-in border-t-4 border-t-[#C67C3E]">

            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 bg-slate-50 border-b border-slate-200 shrink-0">
              <div>
                <h3 className="text-sm font-bold text-[#051125]">
                  {editRecType === 'sale' ? 'Editar Venta Directa' : 'Editar Cotización / Proforma'}
                </h3>
                <p className="text-[13px] text-slate-500 mt-1">
                  Modifica los datos del registro {editRecId}.
                </p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="h-7 w-7 rounded-full flex items-center justify-center hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors"
                type="button"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveEditRecord} className="flex flex-col flex-1 min-h-0">
              <div className="p-5 space-y-4 overflow-y-auto flex-1 min-h-0">

              {/* Client input */}
              <div>
                <label className="block text-[13px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Cliente Relacionado:</label>
                <input 
                  type="text" 
                  value={editRecClient}
                  onChange={(e) => setEditRecClient(e.target.value)}
                  placeholder="Ej. Apex Logistics Corp. o Nombre del Cliente (Opcional)"
                  className="w-full bg-slate-50 border p-2 text-xs rounded text-slate-800 focus:outline-[#051125] focus:ring-1 focus:ring-[#051125]"
                />
              </div>

              {/* Notes input */}
              <div>
                <label className="block text-[13px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Notas:</label>
                <textarea 
                  value={editRecNotes}
                  onChange={(e) => setEditRecNotes(e.target.value)}
                  placeholder="Notas adicionales o detalles sobre el registro..."
                  rows={2}
                  className="w-full bg-slate-50 border p-2 text-xs rounded text-slate-800 focus:outline-[#051125] focus:ring-1 focus:ring-[#051125]"
                />
              </div>

              {/* Información Adicional de Facturación/Proforma (Estilo Wodexo) */}
              {editRecType === 'quote' && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 space-y-3 animate-fade-in">
                  <span className="block text-[13px] font-bold text-slate-500 uppercase tracking-widest border-b pb-1 font-mono">Detalles Adicionales de Cotización (Opcional):</span>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[12px] font-bold text-slate-400 uppercase tracking-wide mb-1">Teléfono Cliente:</label>
                      <input 
                        type="text" 
                        value={editRecClientPhone}
                        onChange={(e) => setEditRecClientPhone(e.target.value)}
                        placeholder="Ej. +591 77300000"
                        className="w-full bg-white border p-1.5 text-xs rounded text-slate-800 focus:outline-[#051125]"
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] font-bold text-slate-400 uppercase tracking-wide mb-1">Número de NIT del Cliente:</label>
                      <input 
                        type="text" 
                        value={editRecClientNit}
                        onChange={(e) => setEditRecClientNit(e.target.value)}
                        placeholder="Ej. 349812024"
                        className="w-full bg-white border p-1.5 text-xs rounded text-slate-800 focus:outline-[#051125]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[12px] font-bold text-slate-400 uppercase tracking-wide mb-1">Cargo / Rol del Cliente:</label>
                      <input 
                        type="text" 
                        value={editRecClientRole}
                        onChange={(e) => setEditRecClientRole(e.target.value)}
                        placeholder="Ej. Director, Particular"
                        className="w-full bg-white border p-1.5 text-xs rounded text-slate-800 focus:outline-[#051125]"
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] font-bold text-slate-400 uppercase tracking-wide mb-1">Correo Cliente:</label>
                      <input 
                        type="email" 
                        value={editRecClientEmail}
                        onChange={(e) => setEditRecClientEmail(e.target.value)}
                        placeholder="Ej. cliente@gmail.com"
                        className="w-full bg-white border p-1.5 text-xs rounded text-slate-800 focus:outline-[#051125]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[12px] font-bold text-slate-400 uppercase tracking-wide mb-1">Dirección Cliente:</label>
                      <input 
                        type="text" 
                        value={editRecClientAddress}
                        onChange={(e) => setEditRecClientAddress(e.target.value)}
                        placeholder="Ej. Av. Banzer 4to Anillo"
                        className="w-full bg-white border p-1.5 text-xs rounded text-slate-800 focus:outline-[#051125]"
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] font-bold text-slate-400 uppercase tracking-wide mb-1">Validez / Vencimiento:</label>
                      <input 
                        type="date" 
                        value={editRecDueDate}
                        onChange={(e) => setEditRecDueDate(e.target.value)}
                        className="w-full bg-white border p-1.5 text-xs rounded text-slate-800 focus:outline-[#051125]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[12px] font-bold text-slate-400 uppercase tracking-wide mb-1">Impuesto / IVA (%):</label>
                      <input 
                        type="number" 
                        min="0"
                        max="100"
                        value={editRecTaxRate || ''}
                        onChange={(e) => setEditRecTaxRate(Math.max(0, parseFloat(e.target.value) || 0))}
                        placeholder="Por defecto 0%"
                        className="w-full bg-white border p-1.5 text-xs rounded text-slate-800 focus:outline-[#051125] font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Product selector(s): one or more line items per quote/sale */}
              <div>
                <label className="block text-[13px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-mono">Productos / Servicios:</label>
                <LineItemsEditor lines={editRecLineItems} setLines={setEditRecLineItems} dynamicItemOptions={dynamicItemOptions} />
              </div>

              {/* Overall discount across all line items */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 text-red-500">Descuento Ofrecido (%):</label>
                  <input
                    type="number"
                    value={editRecDiscount || ''}
                    onChange={(e) => setEditRecDiscount(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                    placeholder="Ninguno (0%)"
                    className="w-full bg-slate-50 border p-2 text-xs rounded text-slate-800 font-mono focus:outline-[#051125]"
                  />
                </div>
              </div>

              {/* Capital Override Input */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-bold text-[#C67C3E] uppercase tracking-widest mb-1.5 font-mono">Inversión / Capital Fijo (Bs.):</label>
                  <input 
                    type="number" 
                    value={editRecCapital !== null ? editRecCapital : ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditRecCapital(val === '' ? null : Math.max(0, parseFloat(val) || 0));
                    }}
                    placeholder="Auto (60% del precio)"
                    className="w-full bg-[#C67C3E]/5 border border-[#C67C3E]/25 p-2 text-xs rounded text-slate-800 focus:outline-[#C67C3E] font-mono placeholder:text-slate-400"
                  />
                </div>
                <div className="flex items-center pt-5">
                  <p className="text-[12px] text-slate-400 leading-tight">
                    Modifica manualmente el **capital de costo** de este registro. Si se deja vacío, se calculará al **60%** del total.
                  </p>
                </div>
              </div>

              {/* Status and Payment option */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Método de Facturación:</label>
                  <select 
                    value={editRecPayMethod}
                    onChange={(e) => setEditRecPayMethod(e.target.value)}
                    className="w-full bg-slate-50 border p-2 text-xs rounded text-slate-800 cursor-pointer"
                  >
                    <option value="transfer">📱 Transferencia Bancaria</option>
                    <option value="cash">💵 Efectivo Físico</option>
                    <option value="card">💳 Tarjeta Crédito/Débito</option>
                    <option value="qr">📱 Pago Simple QR</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Estado Operativo:</label>
                  {editRecType === 'sale' ? (
                    <select 
                      value={editRecStatus}
                      onChange={(e) => setEditRecStatus(e.target.value as any)}
                      className="w-full bg-emerald-50 text-emerald-800 border p-2 text-xs rounded font-bold cursor-pointer"
                    >
                      <option value="Paid">Paid (Cobrado con éxito)</option>
                      <option value="Enviada">Proforma Enviada (Por Cobrar)</option>
                      <option value="Aceptada">Aceptada / Por Liquidar</option>
                    </select>
                  ) : (
                    <select 
                      value={editRecStatus}
                      onChange={(e) => setEditRecStatus(e.target.value as any)}
                      className="w-full bg-amber-50 text-amber-800 border p-2 text-xs rounded font-bold cursor-pointer"
                    >
                      <option value="Borrador">Borrador (Editable)</option>
                      <option value="Enviada">Proforma Enviada</option>
                      <option value="Aceptada">Aceptada / Por Liquidar</option>
                      <option value="Paid">Paid (Cobrado)</option>
                    </select>
                  )}
                </div>
              </div>

              {/* Dynamic Operator / Registered user selection */}
              <div>
                <label className="block text-[13px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Usuario de Registro (Responsable):</label>
                <select 
                  value={editRecOperator}
                  onChange={(e) => setEditRecOperator(e.target.value)}
                  className="w-full bg-slate-50 border p-2 text-xs rounded text-slate-800 focus:outline-[#051125] cursor-pointer"
                >
                  {usersList.map(u => (
                    <option key={u.id} value={u.name}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Live Price Calculation Display */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/50 flex justify-between items-center text-xs">
                <div className="space-y-0.5 text-slate-500">
                  <p>Productos: {editRecLineItems.length}</p>
                  <p>Caja Base: Bs. {editRecLineItems.reduce((sum, line) => sum + (line.customAmount !== null ? line.customAmount : (dynamicItemOptions[line.itemKey]?.price || 0)) * line.qty, 0).toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <span className="text-[13px] uppercase font-bold text-[#C67C3E] block tracking-wider">Caja Neta Liquidada</span>
                  <span className="text-base font-mono font-bold text-[#051125] block">
                    Bs. {
                      (editRecLineItems.reduce((sum, line) => sum + (line.customAmount !== null ? line.customAmount : (dynamicItemOptions[line.itemKey]?.price || 0)) * line.qty, 0) * (1 - editRecDiscount / 100)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    }
                  </span>
                </div>
              </div>

              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end p-4 border-t text-xs shrink-0 bg-white">
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  type="button"
                  className="bg-slate-100 hover:bg-slate-250 text-slate-700 font-bold py-2 px-4 rounded-lg cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-[#051125] hover:bg-slate-800 text-white font-extrabold py-2 px-5 rounded-lg cursor-pointer flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Check className="w-4 h-4 text-emerald-500" />
                  Guardar Cambios
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL EDIT INCOMING QUOTE OVERLAY */}
      {isEditQuoteModalOpen && (
        <div className="fixed inset-0 bg-[#051125]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col animate-fade-in border-t-4 border-t-[#C67C3E]">

            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 bg-slate-50 border-b border-slate-200 shrink-0">
              <div>
                <h3 className="text-sm font-bold text-[#051125]">Editar Cotización Recibida</h3>
                <p className="text-[13px] text-slate-500 mt-1">Código: {editQuoteId}</p>
              </div>
              <button
                onClick={() => setIsEditQuoteModalOpen(false)}
                className="h-7 w-7 rounded-full flex items-center justify-center hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors"
                type="button"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveEditQuote} className="flex flex-col flex-1 min-h-0">
              <div className="p-5 space-y-4 overflow-y-auto flex-1 min-h-0">

              {/* Name field */}
              <div>
                <label className="block text-[13px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Nombre del Cliente:</label>
                <input 
                  type="text" 
                  value={editQuoteFullName}
                  onChange={(e) => setEditQuoteFullName(e.target.value)}
                  required
                  className="w-full bg-slate-50 border p-2 text-xs rounded text-slate-800 focus:outline-[#051125]"
                />
              </div>

              {/* Phone and Email */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Teléfono:</label>
                  <input 
                    type="text" 
                    value={editQuotePhone}
                    onChange={(e) => setEditQuotePhone(e.target.value)}
                    required
                    className="w-full bg-slate-50 border p-2 text-xs rounded text-slate-800 focus:outline-[#051125]"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Correo:</label>
                  <input 
                    type="email" 
                    value={editQuoteEmail}
                    onChange={(e) => setEditQuoteEmail(e.target.value)}
                    required
                    className="w-full bg-slate-50 border p-2 text-xs rounded text-slate-800 focus:outline-[#051125]"
                  />
                </div>
              </div>

              {/* Service type and Message */}
              <div>
                <label className="block text-[13px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Tipo de Servicio:</label>
                <input 
                  type="text" 
                  value={editQuoteServiceType}
                  onChange={(e) => setEditQuoteServiceType(e.target.value)}
                  required
                  className="w-full bg-slate-50 border p-2 text-xs rounded text-slate-800 focus:outline-[#051125]"
                />
              </div>

              <div>
                <label className="block text-[13px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Requerimientos / Observaciones:</label>
                <textarea 
                  value={editQuoteMessage}
                  onChange={(e) => setEditQuoteMessage(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-50 border p-2 text-xs rounded text-slate-800 focus:outline-[#051125]"
                />
              </div>

              {/* Status and Technician Assignment */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Estado:</label>
                  <select 
                    value={editQuoteStatus}
                    onChange={(e) => setEditQuoteStatus(e.target.value as QuoteStatus)}
                    className="w-full bg-slate-50 border p-2 text-xs rounded text-slate-800 cursor-pointer"
                  >
                    <option value="Pendiente">Pendiente (Revisión preliminar)</option>
                    <option value="Aprobado">Aprobado (Presupuesto aceptado)</option>
                    <option value="Asignado">Asignado (Técnico despachado)</option>
                    <option value="Completado">Completado e Facturado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Técnico Asignado:</label>
                  <select 
                    value={editQuoteAssignedTechnician}
                    onChange={(e) => setEditQuoteAssignedTechnician(e.target.value)}
                    className="w-full bg-slate-50 border p-2 text-xs rounded text-slate-800 cursor-pointer"
                  >
                    <option value="">Sin Asignar</option>
                    {technicians.map(t => (
                      <option key={t.id} value={t.name}>{t.name} ({t.specialty.split(' ')[0]})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Instructions */}
              <div>
                <label className="block text-[13px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Instrucciones de Campo:</label>
                <textarea 
                  value={editQuoteTechnicianNotes}
                  onChange={(e) => setEditQuoteTechnicianNotes(e.target.value)}
                  placeholder="Detalles sobre drywall, soportes, etc..."
                  rows={2}
                  className="w-full bg-slate-50 border p-2 text-xs rounded text-slate-800 focus:outline-[#051125]"
                />
              </div>

              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end p-4 border-t text-xs shrink-0 bg-white">
                <button
                  onClick={() => setIsEditQuoteModalOpen(false)}
                  type="button"
                  className="bg-slate-100 hover:bg-slate-250 text-slate-700 font-bold py-2 px-4 rounded-lg cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-[#051125] hover:bg-slate-800 text-white font-extrabold py-2 px-5 rounded-lg cursor-pointer flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Check className="w-4 h-4 text-emerald-500" />
                  Guardar Cambios
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}

