import React, { useState, useEffect } from 'react';
import { Product, CartItem, Quote } from '../types';
import { Mail, Phone, User, Type, MessageSquare, Send, CheckCircle2, Receipt, Printer, Trash } from 'lucide-react';
import TorreForteLogo from './TorreForteLogo';

interface QuoteFormProps {
  cart: CartItem[];
  onRemoveFromCart: (productId: string) => void;
  onClearCart: () => void;
  onSubmitQuote: (quoteData: { fullName: string; phone: string; email: string; serviceType: string; message: string; items: CartItem[] }) => void;
}

export default function QuoteForm({ cart, onRemoveFromCart, onClearCart, onSubmitQuote }: QuoteFormProps) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [serviceType, setServiceType] = useState('Compra de Soporte');
  const [message, setMessage] = useState('');
  
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [previewQuote, setPreviewQuote] = useState<Quote | null>(null);

  const buildWhatsAppMessage = (quote: Quote, total: number): string => {
    const itemsText = quote.items.length > 0
      ? quote.items.map(i => `  • ${i.product.name} x${i.quantity} — Bs. ${(i.product.price * i.quantity).toLocaleString('es-BO')}`).join('\n')
      : `  • ${quote.serviceType}`;

    return encodeURIComponent(
      `Hola Torre Forte 👋, acabo de generar la cotización *${quote.id}*:\n\n` +
      `👤 *${quote.fullName}*\n` +
      `📞 ${quote.phone}\n\n` +
      `🛒 *Productos/Servicios:*\n${itemsText}\n\n` +
      `💰 *Total estimado: Bs. ${total.toLocaleString('es-BO')}*\n\n` +
      `¿Pueden confirmar disponibilidad y fecha de instalación? Gracias.`
    );
  };

  // Auto-detect service type if cart has items
  useEffect(() => {
    if (cart.length > 0) {
      setServiceType('Compra de Soporte');
    }
  }, [cart]);

  const totalCost = cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim()) {
      alert('Por favor completa al menos tu nombre completo y teléfono de contacto.');
      return;
    }

    // Submit the data
    onSubmitQuote({
      fullName,
      phone,
      email: email || 'sin-correo@torreforte.bo',
      serviceType,
      message,
      items: [...cart]
    });

    // Save temporary preview quote to show in proforma invoice modal
    const generatedId = `COT-${Math.floor(Math.random() * 900) + 100}`;
    setPreviewQuote({
      id: generatedId,
      fullName,
      phone,
      email: email || 'cliente@torreforte.bo',
      serviceType,
      message,
      date: new Date().toISOString().split('T')[0],
      status: 'Pendiente',
      items: [...cart]
    });

    // Open success invoice preview modal
    setShowInvoiceModal(true);

    // Reset fields & clear cart
    setFullName('');
    setPhone('');
    setEmail('');
    setMessage('');
    onClearCart();
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 shadow-sm h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-2 mb-6">
          <Receipt className="w-5 h-5 text-safety-orange" />
          <h3 className="text-lg font-extrabold text-industrial-navy tracking-tight">Cotización Rápida</h3>
        </div>

        {/* Selected Products in Quote List */}
        {cart.length > 0 && (
          <div className="mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-3">Soportes Seleccionados</h4>
            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
              {cart.map(item => (
                <div key={item.product.id} className="flex justify-between items-center text-xs bg-white p-2 rounded border border-slate-100">
                  <div className="flex gap-2 items-center">
                    <span className="font-mono text-[9px] bg-slate-100 text-industrial-navy font-bold px-1.5 py-0.5 rounded">
                      {item.product.sku}
                    </span>
                    <span className="font-semibold text-slate-700 line-clamp-1">{item.product.name}</span>
                    <span className="text-slate-400 font-mono">(x{item.quantity})</span>
                  </div>
                  <div className="flex gap-3 items-center">
                    <span className="font-bold text-slate-800 font-mono">Bs. {item.product.price * item.quantity}</span>
                    <button 
                      onClick={() => onRemoveFromCart(item.product.id)}
                      className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                      title="Eliminar de mi cotización"
                    >
                      <Trash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Projected Total Cost Display */}
            <div className="flex justify-between items-center border-t border-slate-200 pt-3 mt-3 text-xs font-bold text-slate-800">
              <span>Costo Estimado de Equipamiento:</span>
              <span className="font-mono text-sm text-safety-orange">Bs. {totalCost}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Full Name field */}
            <div>
              <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Nombre Completo</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                  <User className="w-4.5 h-4.5" />
                </span>
                <input 
                  type="text" 
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-50/80 border border-slate-300 text-slate-800 text-sm rounded-lg pl-10 pr-3.5 py-3 hover:border-slate-400 hover:bg-slate-100/40 focus:border-safety-orange focus:bg-white focus:ring-4 focus:ring-safety-orange/10 focus:outline-none transition-all shadow-xs"
                  placeholder="Ej. Juan Pérez"
                />
              </div>
            </div>

            {/* Phone field */}
            <div>
              <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Teléfono</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                  <Phone className="w-4.5 h-4.5" />
                </span>
                <input 
                  type="tel" 
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50/80 border border-slate-300 text-slate-800 text-sm rounded-lg pl-10 pr-3.5 py-3 hover:border-slate-400 hover:bg-slate-100/40 focus:border-safety-orange focus:bg-white focus:ring-4 focus:ring-safety-orange/10 focus:outline-none transition-all shadow-xs"
                  placeholder="Ej. 70012345"
                />
              </div>
            </div>

          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Email field */}
            <div>
              <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Correo Electrónico (Opcional)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                  <Mail className="w-4.5 h-4.5" />
                </span>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50/80 border border-slate-300 text-slate-800 text-sm rounded-lg pl-10 pr-3.5 py-3 hover:border-slate-400 hover:bg-slate-100/40 focus:border-safety-orange focus:bg-white focus:ring-4 focus:ring-safety-orange/10 focus:outline-none transition-all shadow-xs"
                  placeholder="ejemplo@correo.com"
                />
              </div>
            </div>

            {/* Service Selection field */}
            <div>
              <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Tipo de Servicio</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                  <Type className="w-4.5 h-4.5" />
                </span>
                <select 
                  id="quote-service-select"
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  className="w-full bg-slate-50/80 border border-slate-300 text-slate-800 text-sm rounded-lg pl-10 pr-3.5 py-3 hover:border-slate-400 hover:bg-slate-100/40 focus:border-safety-orange focus:bg-white focus:ring-4 focus:ring-safety-orange/10 focus:outline-none transition-all appearance-none cursor-pointer shadow-xs"
                >
                  <option value="Compra de Soporte">Compra de Soporte (Solo Equipamiento)</option>
                  <option value="Instalación de Soportes">Instalación Profesional de Soporte</option>
                  <option value="Climatización HVAC">Climatización e Higiene HVAC</option>
                  <option value="Proyecto Industrial">Proyecto Estructural Especial</option>
                </select>
              </div>
            </div>

          </div>

          {/* Details field */}
          <div>
            <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Especificaciones del Trabajo</label>
            <div className="relative">
              <span className="absolute left-3.5 top-3.5 text-slate-500">
                <MessageSquare className="w-4.5 h-4.5" />
              </span>
              <textarea 
                id="quote-specifications-textarea"
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full bg-slate-50/80 border border-slate-300 text-slate-800 text-sm rounded-lg pl-10 pr-3.5 py-3.5 hover:border-slate-400 hover:bg-slate-100/40 focus:border-safety-orange focus:bg-white focus:ring-4 focus:ring-safety-orange/10 focus:outline-none transition-all shadow-xs"
                placeholder="Describa el lugar de montaje, tamaño de TV o requerimientos especiales de aire acondicionado..."
              />
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-industrial-navy hover:bg-opacity-95 text-white font-bold py-3.5 rounded-lg text-sm cursor-pointer transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <Send className="w-4 h-4" />
            Enviar Solicitud
          </button>
        </form>
      </div>

      {/* SUCCESS PROFORMA MODAL */}
      {showInvoiceModal && previewQuote && (() => {
        const subtotalVal = previewQuote.items.length > 0 
          ? previewQuote.items.reduce((acc, item) => acc + (item.product.price * item.quantity), 0)
          : 0;
        const taxVal = 0; // tax is included in Bolivian service or equipment base pricing
        const grandTotalVal = subtotalVal;
        
        // Ensure there is always dynamic content in the table format to make it look professional
        const itemsToRender = previewQuote.items.length > 0 ? previewQuote.items : [
          {
            product: {
              id: 'hvac-srv',
              sku: 'SRV-REF',
              name: `Servicio Especializado: ${previewQuote.serviceType}`,
              description: previewQuote.message || 'Evaluación de carga estructural, diagnóstico de caudal de aire acondicionado, y asesoramiento de montaje.',
              price: 0,
              image: '',
              category: 'Servicios',
              stockLevel: 'In Stock' as const,
              maxLoad: 0,
              tvSizes: '',
              material: 'Acero estructural y herrajes premium'
            },
            quantity: 1
          }
        ];

        return (
          <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-0 md:p-4 backdrop-blur-xs overflow-y-auto">
            
            {/* Custom local stylesheet for perfect Chrome printing behavior and high-fidelity proforma formatting */}
            <style>{`
              @media print {
                body {
                  background: white !important;
                }
                body > * {
                  display: none !important;
                }
                #print-modal-container {
                  display: block !important;
                  position: absolute;
                  left: 0;
                  top: 0;
                  width: 100%;
                  height: auto;
                  background: white !important;
                  padding: 0 !important;
                  margin: 0 !important;
                  box-shadow: none !important;
                  border: none !important;
                }
                #quotation-paper {
                  box-shadow: none !important;
                  border: none !important;
                  padding: 0 !important;
                  margin: 0 !important;
                  width: 100% !important;
                  max-width: 100% !important;
                  height: auto !important;
                  background: white !important;
                }
                .print\\:hidden {
                  display: none !important;
                }
              }
            `}</style>

            <div id="print-modal-container" className="bg-slate-100 max-w-4xl w-full rounded-none md:rounded-2xl shadow-2xl border border-slate-300/80 flex flex-col max-h-screen md:max-h-[94vh] overflow-hidden">
              
              {/* Toolbar header (Hidden when printing) */}
              <div className="px-5 py-4 bg-industrial-navy text-white flex justify-between items-center shrink-0 print:hidden border-b border-white/5">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <div className="flex flex-col">
                    <span className="text-xs uppercase tracking-widest font-mono text-safety-orange font-bold">Solicitud Registrada</span>
                    <h4 className="text-sm font-extrabold tracking-tight">Presupuesto en Formato Proforma Oficial</h4>
                  </div>
                </div>
                <button 
                  onClick={() => setShowInvoiceModal(false)}
                  className="text-white/60 hover:text-white font-extrabold text-2xl leading-none transition-all cursor-pointer p-1"
                >
                  &times;
                </button>
              </div>

              {/* Outer Viewport (Muted backgrounds on screen) */}
              <div className="overflow-y-auto flex-1 p-3 md:p-8 flex justify-center bg-slate-200/55 scrollbar-thin print:bg-white print:p-0 print:overflow-visible">
                
                {/* Physical Paper Sheet (Standard A4 ratio styling on screen, native on print) */}
                <div id="quotation-paper" className="bg-white w-full max-w-[210mm] shadow-xl border border-slate-300/40 p-8 sm:p-12 font-sans text-slate-950 relative flex flex-col justify-between min-h-[297mm] print:shadow-none print:border-none print:p-8 print:max-w-full print:min-h-0">

                  <div className="space-y-6">

                    {/* ENCABEZADO: Identidad Corporativa y Folio */}
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b pb-6 border-slate-200">

                      <div className="flex gap-4 items-start">
                        <div className="w-14 h-14 rounded-xl flex items-center justify-center font-extrabold text-white text-xl tracking-widest bg-[#051125] shadow">
                          TF
                        </div>
                        <div>
                          <h1 className="text-xl font-bold text-slate-900 leading-tight tracking-tight">
                            Torre Forte S.R.L.
                          </h1>
                          <span className="text-xs text-slate-500 block font-mono mt-0.5">
                            NIT 349812024
                          </span>
                          <div className="text-xs text-slate-600 space-y-0.5 mt-1">
                            <p>Calle Florida #350, Santa Cruz de la Sierra, Bolivia</p>
                            <p className="font-mono">+591 750-11223 · ventas@torreforte.bo</p>
                            <p className="font-mono text-slate-500">www.torreforte.bo</p>
                          </div>
                        </div>
                      </div>

                      <div className="text-left sm:text-right w-full sm:w-auto">
                        <span className="inline-block px-3 py-1 rounded text-xs font-bold text-white mb-2 uppercase tracking-wider bg-blue-600">
                          Solicitud de Cotización
                        </span>
                        <h2 className="text-2xl font-mono font-bold text-blue-600">
                          {previewQuote.id}
                        </h2>
                        <div className="text-xs text-slate-600 mt-2 space-y-1">
                          <div className="flex justify-between sm:justify-end gap-4">
                            <span className="text-slate-400">Fecha de Creación:</span>
                            <span className="font-semibold text-slate-800">{previewQuote.date}</span>
                          </div>
                          <div className="flex justify-between sm:justify-end gap-4">
                            <span className="text-slate-400">Validez hasta:</span>
                            <span className="font-semibold text-slate-800">3 días hábiles</span>
                          </div>
                          <div className="flex justify-between sm:justify-end gap-4">
                            <span className="text-slate-400">Divisa Oficial:</span>
                            <span className="font-bold text-slate-800 font-mono">BOB (Bs.)</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* PANELES: Emisor y Cliente */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/70 p-4 rounded-lg border border-slate-100">
                      <div className="text-xs space-y-1.5">
                        <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-400">
                          EMISOR DE PROPUESTA:
                        </span>
                        <p className="font-bold text-slate-800">Torre Forte S.R.L.</p>
                        <p className="text-slate-600">Contacto Directo: ventas@torreforte.bo</p>
                        <p className="text-slate-600">Línea de Atención: +591 750-11223</p>
                      </div>

                      <div className="text-xs space-y-1.5 border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-6 border-slate-200">
                        <span className="block text-[10px] uppercase font-bold tracking-wider text-blue-600">
                          DIRIGIDO A:
                        </span>
                        <p className="font-bold text-slate-900 text-sm">{previewQuote.fullName}</p>
                        <p className="text-slate-600 font-mono">NIT / CI: Particular (S/N)</p>
                        <div className="text-slate-700 space-y-0.5">
                          <p><span className="text-slate-400">Atención:</span> <strong className="text-slate-700">{previewQuote.serviceType}</strong></p>
                          <p><span className="text-slate-400">Medio:</span> {previewQuote.phone} · {previewQuote.email}</p>
                        </div>
                      </div>
                    </div>

                    {/* TABLA DE PRODUCTOS / SERVICIOS */}
                    <div className="mt-8">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="text-white font-semibold bg-blue-600 print:bg-slate-100 print:text-black">
                            <th className="py-2.5 px-3 rounded-l text-[10px] uppercase tracking-wider"># No.</th>
                            <th className="py-2.5 px-3 text-[10px] uppercase tracking-wider w-1/2">Concepto / Descripción</th>
                            <th className="py-2.5 px-3 text-[10px] uppercase tracking-wider text-center">Cant.</th>
                            <th className="py-2.5 px-3 text-[10px] uppercase tracking-wider text-right">Precio Unitario</th>
                            <th className="py-2.5 px-3 rounded-r text-[10px] uppercase tracking-wider text-right">Total Parcial</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-150">
                          {itemsToRender.map((item, idx) => {
                            const unitPrice = item.product.price;
                            const totalLine = unitPrice * item.quantity;
                            const specs = [];
                            if (item.product.tvSizes) specs.push(`Soporta TV: ${item.product.tvSizes}`);
                            if (item.product.maxLoad && item.product.maxLoad > 0) specs.push(`Carga Máx: ${item.product.maxLoad} Kg`);

                            return (
                              <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                <td className="py-3 px-3 font-mono text-slate-500 font-semibold">{String(idx + 1).padStart(2, '0')}</td>
                                <td className="py-3 px-3">
                                  <span className="font-bold text-slate-900 block">
                                    {item.product.name}{item.product.sku ? ` - ${item.product.sku}` : ''}
                                  </span>
                                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed max-w-xl">
                                    {specs.join(' · ') || item.product.description}
                                  </p>
                                </td>
                                <td className="py-3 px-3 text-center font-semibold text-slate-700">{item.quantity}</td>
                                <td className="py-3 px-3 text-right font-mono text-slate-700">
                                  {unitPrice > 0 ? `Bs. ${unitPrice.toFixed(2)}` : 'S/V'}
                                </td>
                                <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                                  {unitPrice > 0 ? `Bs. ${totalLine.toFixed(2)}` : 'Evaluación'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* CONDICIONES Y TOTALES */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-6 border-t border-slate-200">
                      <div className="md:col-span-7 text-[11px] text-slate-600 space-y-3">
                        <div>
                          <strong className="text-slate-800 uppercase text-[10px] tracking-wider block">
                            Condiciones de Recibo & Tiempos:
                          </strong>
                          <p className="mt-0.5 italic">
                            Cotización sujeta a confirmación de stock. Entrega inmediata o en un plazo de 48 horas según disponibilidad de almacén.
                          </p>
                        </div>
                        <div className="bg-slate-50 p-3 rounded border border-slate-100">
                          <strong className="text-slate-800 uppercase text-[10px] tracking-wider block">
                            Canales de Pago Habilitados:
                          </strong>
                          <p className="font-mono mt-0.5 text-slate-700 font-medium">
                            Banco Unión S.A. · Cuenta Corriente Bs. N° 1-28249015 (Titular: Torre Forte S.R.L.) · Tigo Money: +591 750-11223
                          </p>
                        </div>
                      </div>

                      <div className="md:col-span-5 text-xs text-slate-700 space-y-2">
                        <div className="flex justify-between">
                          <span>Subtotal:</span>
                          <span className="font-mono font-semibold text-slate-900">Bs. {subtotalVal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between pb-1 border-b">
                          <span>Impuestos (IVA):</span>
                          <span className="font-mono font-semibold text-slate-400">Incluido / S/E</span>
                        </div>
                        <div className="flex justify-between pt-1 items-center">
                          <span className="text-slate-900 font-bold text-sm">TOTAL ESTIMADO:</span>
                          <span className="font-mono text-lg font-bold text-blue-600 px-2 py-0.5 rounded bg-blue-50">
                            Bs. {grandTotalVal.toFixed(2)}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 text-right italic pt-1">
                          Valores expresados en Bolivianos (Bs.)
                        </div>
                      </div>
                    </div>

                    {/* NOTAS / OBSERVACIONES */}
                    <div className="text-[11px] text-slate-500 bg-slate-50/50 p-3 rounded border border-dashed border-slate-200 mt-4 leading-relaxed">
                      <strong className="text-slate-700">Observaciones Generales:</strong> {previewQuote.message || 'El presente documento proforma está sujeto a stock de almacén.'} Garantía de mano de obra: 6 meses. Garantía de productos: 12 meses con factura.
                    </div>

                    {/* BLOQUES DE FIRMA */}
                    <div className="pt-12 grid grid-cols-2 gap-12">
                      <div className="space-y-2 text-center max-w-[250px]">
                        <div className="h-16 border-b border-slate-200 flex items-end justify-center pb-1">
                          <span className="italic text-2xl text-blue-600">Torre Forte S.R.L.</span>
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-[11px] uppercase tracking-wide leading-none">
                            Representante Comercial
                          </p>
                          <p className="text-slate-400 text-[10px] mt-0.5">Torre Forte S.R.L.</p>
                        </div>
                      </div>

                      <div className="space-y-2 text-center ml-auto w-full max-w-[250px]">
                        <div className="h-16 border-b border-slate-200"></div>
                        <div>
                          <p className="font-bold text-slate-800 text-[11px] uppercase tracking-wide leading-none">
                            Aceptado por Cliente
                          </p>
                          <p className="text-slate-400 text-[10px] mt-0.5">Fecha de Firma y Sello Receptor</p>
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-2 mt-4 text-[10px] text-slate-400 text-center font-mono">
                      Firma y Sello Digital Autorizado de Torre Forte S.R.L. · Este documento no tiene valor de factura legal
                    </div>

                  </div>

                </div>

              </div>

              {/* Toolbar footer buttons */}
              <div className="px-5 py-4 bg-slate-100 border-t border-slate-300 flex justify-end gap-3 shrink-0 print:hidden">
                <button
                  onClick={() => window.print()}
                  className="bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-lg cursor-pointer transition-colors flex items-center gap-2 border border-slate-300 shadow-xs"
                >
                  <Printer className="w-4 h-4 text-safety-orange" />
                  Imprimir Proforma / Guardar PDF
                </button>
                <a
                  href={`https://wa.me/59171611090?text=${buildWhatsAppMessage(previewQuote, grandTotalVal)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#25D366] hover:bg-[#128C7E] text-white text-xs font-bold px-4 py-2.5 rounded-lg cursor-pointer transition-colors flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path d="M12.004 2C6.48 2 2 6.48 2 12c0 1.76.458 3.406 1.26 4.85l-1.34 4.9 5.02-1.32C8.36 21.21 9.94 21.64 12 21.64c5.52 0 10-4.48 10-10C22 6.48 17.52 2 12.004 2zm5.72 13.91c-.24.68-1.4 1.24-1.92 1.32-.48.08-.96.12-3.08-.72-2.72-1.08-4.44-3.84-4.56-4-.12-.16-.96-1.28-.96-2.44 0-1.16.6-1.72.84-1.96.24-.24.52-.36.72-.36.16 0 .32 0 .44.04.16.02.36-.06.56.42.2.48.68 1.64.74 1.76.06.12.1.26.02.42-.08.16-.18.28-.3.4a15.8 15.8 0 0 0-1.02.94c-.14.16-.28.32-.06.7.22.38.98 1.62 2.1 2.62 1.44 1.28 2.66 1.68 3.04 1.86.38.18.6.14.82-.1.22-.32.96-1.12 1.22-1.5.26-.38.52-.32.88-.18.36.14 2.28 1.08 2.38 1.14.1.06.16.12.12.24z"/>
                  </svg>
                  Enviar por WhatsApp
                </a>
                <button
                  onClick={() => setShowInvoiceModal(false)}
                  className="bg-industrial-navy hover:bg-opacity-95 text-white text-xs font-bold px-5 py-2.5 rounded-lg cursor-pointer transition-colors shadow-xs"
                >
                  Cerrar e Ir a Catálogo
                </button>
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
}
