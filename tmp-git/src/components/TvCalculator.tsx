import React, { useState } from 'react';
import { Product } from '../types';
import { Sparkles, Check, AlertTriangle, HelpCircle, ArrowRight } from 'lucide-react';

interface TvCalculatorProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
}

export default function TvCalculator({ products, onAddToCart }: TvCalculatorProps) {
  const [screenSize, setScreenSize] = useState<number>(55);
  const [tvWeight, setTvWeight] = useState<number>(25);
  const [mountStyle, setMountStyle] = useState<string>('any');
  const [hasCalculated, setHasCalculated] = useState(true);

  // Filter products that fit the parameters
  const recommendations = products.filter(prod => {
    // Check style match
    if (mountStyle !== 'any' && prod.category !== mountStyle) {
      return false;
    }

    // Weight capacity check
    if (tvWeight > prod.maxLoad) {
      return false;
    }

    // parsing size limits e.g. "32\" - 75\"" -> 32 and 75
    const regex = /(\d+)\s*"\s*-\s*(\d+)/;
    const match = prod.tvSizes.replace(/\\"/g, '"').match(regex);
    if (match) {
      const minSize = parseInt(match[1]);
      const maxSize = parseInt(match[2]);
      if (screenSize < minSize - 5 || screenSize > maxSize + 5) {
        return false; // slightly tolerant (5 inches margin)
      }
    }
    return true;
  });

  return (
    <div className="bg-gradient-to-br from-steel-blue to-industrial-navy text-white rounded-xl p-6 md:p-8 shadow-xl border border-white/10 my-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-safety-orange/25 text-white text-[10px] uppercase tracking-widest font-mono font-bold px-2.5 py-1 rounded-full border border-safety-orange/45">
            <Sparkles className="w-3.5 h-3.5" />
            Asistente de Compatibilidad
          </div>
          <h3 className="text-xl font-bold font-sans mt-2">Calculadora de Soporte Ideal</h3>
          <p className="text-xs text-slate-300 mt-1">
            Ingresa los datos de tu TV para recomendarte el anclaje perfecto y seguro.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Input parameters panel (4 columns) */}
        <div className="lg:col-span-5 bg-white/5 rounded-lg p-5 border border-white/5 space-y-5">
          
          {/* TV Sizing input */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-300">Tamaño de Pantalla:</span>
              <span className="font-mono text-safety-orange font-black">{screenSize} pulgadas (")</span>
            </div>
            <input 
              type="range" 
              min="24" 
              max="98" 
              value={screenSize} 
              onChange={(e) => setScreenSize(parseInt(e.target.value))}
              className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-safety-orange"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
              <span>24" (Monitor)</span>
              <span>55" (Mediano)</span>
              <span>85"+ (Gigante)</span>
            </div>
          </div>

          {/* TV weight input */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-300">Peso Neto del Televisor:</span>
              <span className="font-mono text-sky-300 font-bold">{tvWeight} kg</span>
            </div>
            <input 
              type="range" 
              min="5" 
              max="90" 
              value={tvWeight} 
              onChange={(e) => setTvWeight(parseInt(e.target.value))}
              className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-sky-400"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
              <span>5 kg (Liviana)</span>
              <span>30 kg (Estándar)</span>
              <span>80 kg (Pesada)</span>
            </div>
          </div>

          {/* Mount Style selection */}
          <div>
            <label className="block text-xs text-slate-300 mb-1.5">Preferencia de Movimiento:</label>
            <select 
              value={mountStyle} 
              onChange={(e) => setMountStyle(e.target.value)}
              className="w-full bg-[#1B263B] text-white border border-white/10 rounded-md p-2 text-sm focus:border-sky-400 focus:outline-none transition-colors"
            >
              <option value="any">Cualquier Tipo de Soporte</option>
              <option value="articulado">Articulado (Giro e inclinación)</option>
              <option value="fijo">Fijo (De pared ultra plano)</option>
              <option value="techo">De Techo (Suspensión)</option>
              <option value="pedestal">Pedestal Móvil (Con ruedas)</option>
            </select>
          </div>

          <div className="p-3 bg-white/5 rounded text-[11px] text-slate-300 border-l-2 border-safety-orange">
            <p className="font-semibold text-safety-orange">¿Sabías qué?</p>
            <p className="mt-0.5">El anclaje de seguridad debe soportar al menos un 30% más del peso neto de tu televisor para prevenir fatiga estructural.</p>
          </div>
        </div>

        {/* Output recommendations panel (7 columns) */}
        <div className="lg:col-span-7 flex flex-col justify-between">
          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-300 border-b border-white/10 pb-2">
              Soportes Compatibles Certificados ({recommendations.length})
            </h4>

            {recommendations.length === 0 ? (
              <div className="p-8 text-center bg-white/5 border border-dashed border-white/10 rounded-lg">
                <AlertTriangle className="w-8 h-8 text-[#ffb780] mx-auto mb-2" />
                <p className="text-sm font-medium">No se encontraron soportes específicos</p>
                <p className="text-xs text-slate-400 mt-1">
                  Tu televisor supera un límite combinado de tamaño o peso configurado para esta categoría. Comunícate con nuestros ingenieros para un proyecto industrial a medida.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                {recommendations.map(prod => {
                  const safetyFactor = Math.round((prod.maxLoad / tvWeight) * 100);
                  
                  return (
                    <div 
                      key={prod.id}
                      className="bg-white/5 hover:bg-white/10 p-3 rounded-lg border border-white/10 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    >
                      <div className="flex gap-3 items-center">
                        <img 
                          src={prod.image} 
                          alt={prod.name} 
                          className="w-12 h-12 rounded object-cover border border-white/10 flex-shrink-0"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-white font-bold px-1.5 py-0.5 rounded bg-safety-orange/40">
                              {prod.sku}
                            </span>
                            <span className="text-xs text-teal-200 uppercase tracking-widest text-[9px] font-bold">
                              {prod.category}
                            </span>
                          </div>
                          <h5 className="text-xs font-bold font-sans text-white mt-1">{prod.name}</h5>
                          <p className="text-[10px] text-slate-300 mt-0.5">Soporta hasta {prod.maxLoad} kg (Márgen de Seguridad: {safetyFactor}%)</p>
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-end gap-2 sm:gap-1.5 w-full sm:w-auto justify-between border-t sm:border-t-0 border-white/10 pt-2 sm:pt-0">
                        <span className="text-xs font-mono font-bold text-white">Bs. {prod.price}</span>
                        <button
                          onClick={() => onAddToCart(prod)}
                          className="bg-safety-orange hover:bg-opacity-90 text-white text-[10px] font-semibold px-2.5 py-1 rounded flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          Elegir Soporte
                          <Check className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-400" />
              Técnicos Especialistas de Torre Forte Co.
            </span>
            <button 
              onClick={(e) => {
                e.preventDefault();
                const element = document.getElementById('quote-form-block');
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth' });
                  
                  // Auto-fill service type select
                  const selectEl = document.getElementById('quote-service-select') as HTMLSelectElement;
                  if (selectEl) {
                    selectEl.value = 'Instalación de Soportes';
                    const selectEvent = new Event('change', { bubbles: true });
                    selectEl.dispatchEvent(selectEvent);
                  }

                  // Auto-fill specifications message text area
                  const textEl = document.getElementById('quote-specifications-textarea') as HTMLTextAreaElement;
                  if (textEl) {
                    textEl.value = `Deseo agendar un técnico profesional para la instalación de mi televisor de ${screenSize} pulgadas (peso aprox. ${tvWeight} kg).`;
                    const textEvent = new Event('input', { bubbles: true });
                    textEl.dispatchEvent(textEvent);
                  }
                }
              }} 
              className="text-sky-300 hover:text-sky-200 hover:underline flex items-center gap-1 font-semibold bg-transparent border-none p-0 cursor-pointer"
            >
              Agendar técnico
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
