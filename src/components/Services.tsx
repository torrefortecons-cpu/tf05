import React, { useState } from 'react';
import { Snowflake, Tv, Truck, ShieldAlert, Sparkles, AlertCircle } from 'lucide-react';
import { LandingConfigs } from '../types';

interface ServicesProps {
  configs?: LandingConfigs;
}

export default function Services({ configs }: ServicesProps) {
  const [activeSimulator, setActiveSimulator] = useState<string | null>(null);
  
  // HVAC Calculator variables
  const [roomArea, setRoomArea] = useState<number>(20); // in m2
  const [sunExposure, setSunExposure] = useState<string>('normal');

  // Calculate recommended cool load (BTU)
  const calculatedBTU = Math.round(roomArea * (sunExposure === 'high' ? 800 : 600));

  const sectionTitle = configs?.servicesTitle || 'Servicios Técnicos y Climatización';
  const sectionSubtitle = configs?.servicesSubtitle || 'Soluciones de alta ingeniería ejecutadas por personal certificado bajo estrictas normas de seguridad industrial y civil.';

  const s1Title = configs?.service1Title || 'Climatización HVAC';
  const s1Desc = configs?.service1Desc || 'Instalación certificada, mantenimiento preventivo y correctivo de aires acondicionados tipo Split, Cassette, Ducto y paquetes industriales.';

  const s2Title = configs?.service2Title || 'Instalación de Soportes';
  const s2Desc = configs?.service2Desc || 'Montaje profesional de televisores y monitores pesados en cualquier superficie (drywall, ladrillo, hormigón block), asegurando nivelación óptica perfecta.';

  const s3Title = configs?.service3Title || 'Logística & Proyecto';
  const s3Desc = configs?.service3Desc || 'Fletes integrales, envíos y distribución nacional de lotes corporativos de soportes y equipos de refrigeración industrial directa de fábrica.';

  const s1b1 = configs?.service1Bullet1 || 'Carga controlada de gas ecológico (R410A / R32)';
  const s1b2 = configs?.service1Bullet2 || 'Higienización profunda de serpentinas y turbinas';
  const s1b3 = configs?.service1Bullet3 || 'Corrección de fugas y reubicación de condensadores';

  const s2b1 = configs?.service2Bullet1 || 'Anclajes expansivos de seguridad anti-sismo';
  const s2b2 = configs?.service2Bullet2 || 'Canaletas estéticas para ocultamiento de cableado';
  const s2b3 = configs?.service2Bullet3 || 'Sistemas articulados para salas de junta corporativas';

  const s3b1 = configs?.service3Bullet1 || 'Vehículos equipados con sujeción amortiguada';
  const s3b2 = configs?.service3Bullet2 || 'Despachos a Santa Cruz, La Paz, Cochabamba y Beni';
  const s3b3 = configs?.service3Bullet3 || 'Monitoreo satelital y seguro integral de carga';

  const matrizTitle = configs?.matrizTitle || 'Matriz de Carga de Pared y Anclajes Recomendados';
  const matrizOpt1Title = configs?.matrizOpt1Title || '1. Pared de Ladrillo Macizo u Hormigón:';
  const matrizOpt1Desc = configs?.matrizOpt1Desc || 'Soporta cualquier peso. Recomendamos el anclaje expansivo metálico de 5/16 incluído libre en nuestro catálogo.';
  const matrizOpt2Title = configs?.matrizOpt2Title || '2. Tabiquería de Drywall (Placa de Yeso):';
  const matrizOpt2Desc = configs?.matrizOpt2Desc || 'No soporta pesos altos de forma directa. Requiere ubicar los perfiles metálicos estruturales internos (parantes) cada 40 cm y fijar el soporte allí mediante tornillos tirafondo autoperforantes o anclajes toggler.';

  const deliveryTitle = configs?.deliveryTitle || 'Tiempos y Frecuencia de Despachos';
  const deliveryCity1Name = configs?.deliveryCity1Name || 'Santa Cruz';
  const deliveryCity1Time = configs?.deliveryCity1Time || 'Mismo Día (Express)';
  const deliveryCity2Name = configs?.deliveryCity2Name || 'La Paz/Caba';
  const deliveryCity2Time = configs?.deliveryCity2Time || '24 a 48 Horas';
  const deliveryCity3Name = configs?.deliveryCity3Name || 'Sucre/Tarija';
  const deliveryCity3Time = configs?.deliveryCity3Time || '48 a 72 Horas';

  return (
    <section className="bg-slate-50 border-y border-slate-200 py-16" id="services">
      <div className="max-w-[1664px] mx-auto px-4 md:px-8">
        
        {/* Title & Sub */}
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#051125] tracking-tight">{sectionTitle}</h2>
          <p className="text-sm text-slate-500 max-w-2xl mx-auto mt-2 leading-relaxed">
            {sectionSubtitle}
          </p>
        </div>

        {/* 3 cards grid layout matching mockup */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          
          {/* Card 1: HVAC */}
          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
            <div>
              <div className="w-12 h-12 rounded bg-sky-50 text-sky-700 flex items-center justify-center mb-4">
                <Snowflake className="w-6 h-6 animate-spin" style={{ animationDuration: '8s' }} />
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-2">{s1Title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                {s1Desc}
              </p>
              <ul className="text-xs text-slate-600 space-y-2 mb-4">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C67C3E]"></span>
                  {s1b1}
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C67C3E]"></span>
                  {s1b2}
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C67C3E]"></span>
                  {s1b3}
                </li>
              </ul>
            </div>
            <button 
              onClick={() => setActiveSimulator(activeSimulator === 'hvac' ? null : 'hvac')}
              className="w-full text-center bg-slate-100 hover:bg-slate-200 text-[#051125] text-xs font-semibold py-2 rounded transition-colors cursor-pointer"
            >
              {activeSimulator === 'hvac' ? 'Cerrar Estimador' : 'Calcular BTU Necesario'}
            </button>
          </div>

          {/* Card 2: Montajes */}
          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
            <div>
              <div className="w-12 h-12 rounded bg-[#C67C3E]/10 text-[#C67C3E] flex items-center justify-center mb-4">
                <Tv className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-2">{s2Title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                {s2Desc}
              </p>
              <ul className="text-xs text-slate-600 space-y-2 mb-4">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-600"></span>
                  {s2b1}
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-600"></span>
                  {s2b2}
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-600"></span>
                  {s2b3}
                </li>
              </ul>
            </div>
            <button 
              onClick={() => setActiveSimulator(activeSimulator === 'install' ? null : 'install')}
              className="w-full text-center bg-slate-100 hover:bg-slate-200 text-[#051125] text-xs font-semibold py-2 rounded transition-colors cursor-pointer"
            >
              {activeSimulator === 'install' ? 'Cerrar Recomendaciones' : 'Ver Consejos de Pared'}
            </button>
          </div>

          {/* Card 3: Logística */}
          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
            <div>
              <div className="w-12 h-12 rounded bg-slate-100 text-slate-700 flex items-center justify-center mb-4">
                <Truck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-2">{s3Title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                {s3Desc}
              </p>
              <ul className="text-xs text-slate-600 space-y-2 mb-4">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
                  {s3b1}
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
                  {s3b2}
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
                  {s3b3}
                </li>
              </ul>
            </div>
            <button 
              onClick={() => setActiveSimulator(activeSimulator === 'delivery' ? null : 'delivery')}
              className="w-full text-center bg-slate-100 hover:bg-slate-200 text-[#051125] text-xs font-semibold py-2 rounded transition-colors cursor-pointer"
            >
              {activeSimulator === 'delivery' ? 'Cerrar Tarifario' : 'Revisar Tiempos de Entrega'}
            </button>
          </div>

        </div>

        {/* Dynamic Simuladores drawers */}
        {activeSimulator === 'hvac' && (
          <div className="p-6 bg-white border border-slate-200 rounded-xl max-w-xl mx-auto space-y-4 shadow-sm animate-fade-in mb-8">
            <div className="flex items-center gap-2 text-slate-800 font-bold border-b pb-2">
              <Sparkles className="w-4 h-4 text-[#C67C3E]" />
              <h4>Calculadora de Capacidad Térmica HVAC</h4>
            </div>
            <p className="text-xs text-slate-500">
              Inserta las dimensiones del espacio a aclimatar para sugerirte el tamaño del equipo correcto.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Área del Recinto (M²):</label>
                <input 
                  type="number" 
                  value={roomArea} 
                  onChange={(e) => setRoomArea(Math.max(1, parseInt(e.target.value) || 0))} 
                  className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Exposición Solar Directa:</label>
                <select 
                  value={sunExposure} 
                  onChange={(e) => setSunExposure(e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-800"
                >
                  <option value="normal">Normal / Sombra Parcial</option>
                  <option value="high">Alta / Techo de calamina o ventanas amplias</option>
                </select>
              </div>
            </div>
            <div className="p-4 bg-sky-50 rounded border-l-4 border-sky-400 mt-2 text-xs">
              <span className="font-bold text-sky-800 uppercase block mb-1">Cálculo Estimado:</span>
              Tu habitación requiere un aire acondicionado con una capacidad mínima de: <strong className="text-sky-900 font-mono text-sm">{calculatedBTU} BTU/h</strong>. Un equipo estándar de <strong className="text-sky-900 font-mono text-sm">12,000 BTU (1 Tonelada)</strong> es ideal para ambientes medianos de hasta 20 M².
            </div>
          </div>
        )}

        {activeSimulator === 'install' && (
          <div className="p-6 bg-white border border-slate-200 rounded-xl max-w-xl mx-auto space-y-4 shadow-sm animate-fade-in mb-8">
            <div className="flex items-center gap-2 text-slate-800 font-bold border-b pb-2">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              <h4>{matrizTitle}</h4>
            </div>
            <div className="space-y-3 text-xs text-slate-600">
              <div className="p-2.5 bg-slate-50 rounded">
                <h5 className="font-bold text-slate-700">{matrizOpt1Title}</h5>
                <p className="mt-0.5">{matrizOpt1Desc}</p>
              </div>
              <div className="p-2.5 bg-amber-50/50 rounded">
                <h5 className="font-bold text-amber-800 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {matrizOpt2Title}
                </h5>
                <p className="mt-0.5 text-slate-600">{matrizOpt2Desc}</p>
              </div>
            </div>
          </div>
        )}

        {activeSimulator === 'delivery' && (
          <div className="p-6 bg-white border border-slate-200 rounded-xl max-w-xl mx-auto space-y-4 shadow-sm animate-fade-in mb-8">
            <div className="flex items-center gap-2 text-slate-800 font-bold border-b pb-2">
              <Truck className="w-4 h-4 text-[#C67C3E]" />
              <h4>{deliveryTitle}</h4>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 bg-slate-50 rounded">
                <span className="block font-bold text-[#051125]">{deliveryCity1Name}</span>
                <span className="text-slate-500">{deliveryCity1Time}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded">
                <span className="block font-bold text-[#051125]">{deliveryCity2Name}</span>
                <span className="text-slate-500">{deliveryCity2Time}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded">
                <span className="block font-bold text-[#051125]">{deliveryCity3Name}</span>
                <span className="text-slate-500">{deliveryCity3Time}</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
