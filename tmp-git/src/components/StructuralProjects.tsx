import React, { useState } from 'react';
import { MessageCircle, FileText, CheckCircle2, Shield, Settings, Activity, Compass, ArrowRight, Layers } from 'lucide-react';

interface StructuralProjectsProps {
  onNavigateToQuote?: () => void;
}

export default function StructuralProjects({ onNavigateToQuote }: StructuralProjectsProps) {
  const [activeProject, setActiveProject] = useState<'A' | 'B' | 'C'>('A');

  const scrollToQuote = () => {
    const element = document.getElementById('quote-form-block');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    } else if (onNavigateToQuote) {
      onNavigateToQuote();
    }
  };

  const projects = {
    A: {
      title: 'PROYECTO A: SOPORTE ARTICULADO REFORZADO',
      subtitle: 'Pantalla 85" y superiores (Carga Extrema)',
      desc: 'Diseñado para pantallas gigantes de alta gama. Cuenta con un brazo extensible dual amortiguado que soporta momentos flexionantes masivos sin ceder milímetro alguno.',
      specs: [
        { label: 'Material', value: 'Acero Laminado en Frío Q235 (Espesor 6mm)' },
        { label: 'Capacidad de Carga', value: 'Hasta 120 Kilogramos certificados' },
        { label: 'Mecánica', value: 'Sistema de pivote doble rodamiento blindado' },
        { label: 'Utilidad', value: 'Cableado integrado y pasacables de seguridad' }
      ],
      details: 'Ideal para muros residenciales de alta densidad, salas de directorio corporativo y pantallas de gran formato expuestas al viento o vibraciones.'
    },
    B: {
      title: 'PROYECTO B: SOPORTE TELESCÓPICO DE TECHO',
      subtitle: 'Montaje de Alta Seguridad con Altura Variable',
      desc: 'Soporte telescópico de acero estructural diseñado para suspender pantallas de TV desde techos altos, losas de concreto o vigas metálicas. Cuenta con un sistema interno de organización de cables que previene accidentes y mantiene una estética limpia.',
      specs: [
        { label: 'Estructura', value: 'Perfil tubular industrial de alta densidad y brida reforzada' },
        { label: 'Giro y Ajuste', value: 'Giro continuo horizontal de 360° con inclinación vertical de 15°' },
        { label: 'Telescopía', value: 'Regulación de altura variable asistida de 50 a 150 cm' },
        { label: 'Anclaje', value: 'Fijación de alta tracción mediante pernos de expansión de 3/8"' }
      ],
      details: 'Excelente opción para aeropuertos, clínicas, gimnasios, salas de espera de bancos, restaurantes y proyectos comerciales donde la instalación en muros no es viable.'
    },
    C: {
      title: 'PROYECTO C: SOPORTE MÓVIL VERTICAL (PORTRAIT)',
      subtitle: 'Estructura de Pedestal Pivotante de Alto Rango',
      desc: 'Estructura vertical reforzada autoportante montada sobre rodados. Permite rotar la pantalla 90° de manera rápida para señalización digital e interactiva.',
      specs: [
        { label: 'Movilidad', value: '4 ruedas de alta rodadura con bloqueo y freno' },
        { label: 'Ajuste', value: 'Regulación de altura neumática neumotécnica asistida' },
        { label: 'Rotación', value: 'Eje pivotante de 0° a 90° (Horizontal/Vertical)' },
        { label: 'Estructura', value: 'Perfil tubular con bandeja de soporte multimedia' }
      ],
      details: 'Diseñado específicamente para ferias comerciales, salas de exposiciones, lobbies corporativos, centros comerciales y puntos de información digital.'
    }
  };

  return (
    <section id="structural-projects" className="py-16 bg-[#F3F4FB] border-b border-slate-200 scroll-mt-20">
      <div className="max-w-[1664px] mx-auto px-4 md:px-8">
        
        {/* Header Section */}
        <div className="text-center md:text-left mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C67C3E]/10 text-[#C67C3E] text-xs font-mono font-bold uppercase tracking-wider mb-3">
            <Layers className="w-3.5 h-3.5" />
            Ingeniería & Modificaciones a Medida
          </div>
          <h2 className="text-3xl font-black text-[#051125] tracking-tight">Proyectos Estructurales de Soportes</h2>
          <p className="text-sm text-slate-500 mt-2 max-w-3xl leading-relaxed">
            Fabricamos y modificamos soportes para pantallas de TV de alta gama y sistemas especiales bajo exigencias mecánicas rigurosas. Aseguramos estructuras seguras para entornos residenciales complejos o grandes pantallas corporativas.
          </p>
        </div>

        {/* Blueprint Simulated Workspace Card */}
        <div className="bg-[#EAE6D9] border-4 border-[#2E3344] rounded-3xl overflow-hidden shadow-[0_20px_50px_-15px_rgba(5,17,37,0.15)] grid grid-cols-1 lg:grid-cols-12 font-sans relative">
          
          {/* Engineering blueprint tan matrix grid overlay lines */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.06]" 
               style={{ 
                 backgroundImage: 'radial-gradient(#2d3748 1px, transparent 1px), radial-gradient(#2d3748 1px, transparent 1px)',
                 backgroundSize: '20px 20px',
                 backgroundPosition: '0 0, 10px 10px'
               }} 
          />

          {/* Left Side: Technical Blueprint Drawings Panel (7 cols) */}
          <div className="lg:col-span-7 bg-[#E6E1CE] p-6 sm:p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#2E3344]/30 relative min-h-[400px] sm:min-h-[500px]">
            
            {/* Blueprint Header */}
            <div className="flex justify-between items-start border-b border-[#2E3344]/40 pb-4 z-10">
              <div>
                <span className="text-[10px] font-mono font-bold tracking-widest text-slate-500 uppercase">PLANO DE FABRICACIÓN • DETALLE TÉCNICO</span>
                <h3 className="font-mono text-base font-black text-slate-800 tracking-tight mt-0.5">TORRE FORTE S.R.L. • MECÁNICA DE SOPORTES</h3>
              </div>
              <div className="text-right font-mono text-[9px] text-slate-500 font-bold hidden sm:block">
                <div>ESCALA: 1:12</div>
                <div>ID: TFP-2026-REV2</div>
              </div>
            </div>

            {/* Dynamic Center Blueprint Graphic */}
            <div className="my-8 flex items-center justify-center relative flex-grow min-h-[240px]">
              
              {/* CAD drawing aesthetics (background concentric circles & measuring guides) */}
              <div className="absolute w-48 h-48 border border-dashed border-[#2E3344]/15 rounded-full animate-spin-slow pointer-events-none"></div>
              <div className="absolute w-64 h-64 border border-dashed border-[#2E3344]/10 rounded-full pointer-events-none"></div>

              {/* Render dynamic blueprint schematic based on selected project tab */}
              {activeProject === 'A' && (
                <div className="w-full max-w-[340px] text-[#2E3344] transition-all duration-300 transform scale-105 animate-fade-in">
                  {/* Heavy-duty Articulated bracket wireframe */}
                  <div className="relative mx-auto w-64 h-44 bg-white/20 border-2 border-[#2E3344] rounded-lg p-2 shadow-inner">
                    <div className="absolute top-2 left-2 text-[8px] font-mono text-slate-500 font-bold">TOP VIEW - EXTENDED</div>
                    
                    {/* Articulated Scissor Arm paths */}
                    <svg className="w-full h-full stroke-[#2E3344] stroke-2 fill-none" viewBox="0 0 100 80">
                      {/* Wall Plate */}
                      <path d="M 5,20 L 5,60 M 3,20 L 7,20 M 3,60 L 7,60" />
                      {/* Left Scissors Linkages */}
                      <line x1="5" y1="30" x2="45" y2="50" />
                      <line x1="5" y1="50" x2="45" y2="30" strokeDasharray="2,2" />
                      {/* Right Scissors Linkages */}
                      <line x1="45" y1="30" x2="85" y2="50" strokeDasharray="2,2" />
                      <line x1="45" y1="50" x2="85" y2="30" />
                      {/* Center pivot */}
                      <circle cx="45" cy="40" r="3" className="fill-[#E6E1CE]" />
                      <circle cx="5" cy="30" r="2" className="fill-[#2E3344]" />
                      <circle cx="5" cy="50" r="2" className="fill-[#2E3344]" />
                      <circle cx="85" cy="30" r="2" className="fill-[#2E3344]" />
                      <circle cx="85" cy="50" r="2" className="fill-[#2E3344]" />
                      {/* Display Mounting Plate */}
                      <path d="M 85,15 L 85,65 M 81,15 L 89,15 M 81,65 L 89,65" />
                      {/* Dual bracket hooks */}
                      <path d="M 83,25 L 94,25 L 94,55 L 83,55" strokeWidth="1.5" />
                      {/* Measurement dimension line */}
                      <path d="M 5,75 L 85,75" strokeWidth="1" strokeDasharray="1,1" />
                      <path d="M 5,72 L 5,78 M 85,72 L 85,78" strokeWidth="1" />
                    </svg>
                    
                    {/* Dimension annotation text */}
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-mono font-bold tracking-wider bg-[#E6E1CE]/90 px-1 border border-[#2E3344]/20 rounded">
                      MAX EXTENSION: 680 mm
                    </span>
                    <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[8px] font-mono font-bold text-[#C67C3E] rotate-90 origin-right">
                      CAP: 120 KG
                    </span>
                  </div>
                  <div className="text-center mt-3">
                    <span className="text-[10px] font-mono font-black border border-[#2E3344]/30 px-2 py-0.5 rounded bg-[#2E3344]/5">
                      SECCIÓN A-A: ACERO Q235 DE 6mm
                    </span>
                  </div>
                </div>
              )}

              {activeProject === 'B' && (
                <div className="w-full max-w-[340px] text-[#2E3344] transition-all duration-300 transform scale-105 animate-fade-in">
                  {/* Telescopic Ceiling Support wireframe */}
                  <div className="relative mx-auto w-64 h-44 bg-white/20 border-2 border-[#2E3344] rounded-lg p-2 shadow-inner">
                    <div className="absolute top-2 left-2 text-[8px] font-mono text-slate-500 font-bold">CEILING TELESCOPIC SECTION</div>
                    
                    <svg className="w-full h-full stroke-[#2E3344] stroke-2 fill-none" viewBox="0 0 100 80">
                      {/* Ceiling Solid Line */}
                      <path d="M 10,12 L 90,12" strokeWidth="2" strokeDasharray="3,1" />
                      
                      {/* Heavy Ceiling Flange / Base Mount */}
                      <path d="M 35,12 L 65,12" strokeWidth="4" />
                      {/* Expansion Anchor Bolts */}
                      <line x1="40" y1="6" x2="40" y2="16" strokeWidth="1.5" />
                      <line x1="60" y1="6" x2="60" y2="16" strokeWidth="1.5" />
                      
                      {/* Main Outer Tube */}
                      <rect x="47" y="12" width="6" height="24" className="fill-slate-400/10" />
                      {/* Cable routing internal paths */}
                      <path d="M 50,15 L 50,33" strokeDasharray="1,2" strokeWidth="1" />
                      
                      {/* Adjustable Collar Lock / Safety Pin */}
                      <rect x="45" y="32" width="10" height="4" className="fill-[#2E3344]" />
                      <line x1="42" y1="34" x2="58" y2="34" strokeWidth="1" />
                      
                      {/* Inner Extending Column */}
                      <rect x="48" y="36" width="4" height="20" className="fill-slate-300/20" />
                      
                      {/* Dynamic vertical movement arrows */}
                      <path d="M 38,24 L 38,44" strokeWidth="0.75" strokeDasharray="2,2" />
                      <path d="M 36,28 L 38,24 L 40,28 M 36,40 L 38,44 L 40,40" strokeWidth="1" />
                      
                      {/* Swivel / Tilting Joint Hub */}
                      <circle cx="50" cy="56" r="4" className="fill-[#E6E1CE]" />
                      
                      {/* TV Bracket Mounting plate on the back */}
                      <path d="M 44,56 L 68,50" strokeWidth="1.5" />
                      {/* TV representation displaying at tilted angle */}
                      <path d="M 64,28 L 74,68" strokeWidth="3" className="fill-slate-500/10" />
                      
                      {/* Angle rotation curved indicator */}
                      <path d="M 28,52 A 12,12 0 0,0 38,62" strokeWidth="1" strokeDasharray="2,2" />
                    </svg>
                    
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-mono font-bold bg-[#E6E1CE]/90 px-1 border border-[#2E3344]/20 rounded">
                      TELESCÓPICO: 500 - 1500 mm
                    </span>
                    <span className="absolute right-1 top-2 text-[8px] font-mono font-bold text-[#C67C3E]">
                      INCLINACIÓN: ±15°
                    </span>
                  </div>
                  <div className="text-center mt-3">
                    <span className="text-[10px] font-mono font-black border border-[#2E3344]/30 px-2 py-0.5 rounded bg-[#2E3344]/5">
                      SECCIÓN B-B: COLUMNA TELESCÓPICA SUSPENDIDA
                    </span>
                  </div>
                </div>
              )}

              {activeProject === 'C' && (
                <div className="w-full max-w-[340px] text-[#2E3344] transition-all duration-300 transform scale-105 animate-fade-in">
                  {/* Mobile Portrait stand wireframe */}
                  <div className="relative mx-auto w-64 h-44 bg-white/20 border-2 border-[#2E3344] rounded-lg p-2 shadow-inner">
                    <div className="absolute top-2 left-2 text-[8px] font-mono text-slate-500 font-bold">PORTRAIT / LANDSCAPE PEDESTAL</div>
                    
                    <svg className="w-full h-full stroke-[#2E3344] stroke-2 fill-none" viewBox="0 0 100 80">
                      {/* Heavy mobile Base */}
                      <path d="M 25,65 L 75,65 L 70,60 L 30,60 Z" strokeWidth="1.5" className="fill-slate-300/10" />
                      {/* Heavy duty Casters / Wheels with brake locks */}
                      <circle cx="30" cy="70" r="4" />
                      <line x1="26" y1="70" x2="34" y2="70" />
                      <circle cx="70" cy="70" r="4" />
                      <line x1="66" y1="70" x2="74" y2="70" />
                      {/* Main Dual Pillars */}
                      <line x1="45" y1="60" x2="45" y2="20" strokeWidth="3" />
                      <line x1="55" y1="60" x2="55" y2="20" strokeWidth="3" />
                      {/* AV Shelf */}
                      <rect x="35" y="42" width="30" height="4" className="fill-[#E6E1CE]" />
                      {/* Rotation mechanical hub */}
                      <circle cx="50" cy="30" r="6" className="fill-[#E6E1CE]" />
                      {/* Portrait Screen mount */}
                      <rect x="38" y="10" width="24" height="40" strokeWidth="1" className="fill-white/10" />
                      {/* Screen rotation arrow illustration */}
                      <path d="M 68,26 A 15,15 0 0,0 68,34" strokeWidth="1" />
                    </svg>
                    
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-mono font-bold bg-[#E6E1CE]/90 px-1 border border-[#2E3344]/20 rounded">
                      ALTURA REGULABLE: 1200 - 1800 mm
                    </span>
                    <span className="absolute right-2 top-2 text-[8px] font-mono font-bold text-[#C67C3E]">
                      GIRO 360° PORTRAIT
                    </span>
                  </div>
                  <div className="text-center mt-3">
                    <span className="text-[10px] font-mono font-black border border-[#2E3344]/30 px-2 py-0.5 rounded bg-[#2E3344]/5">
                      SECCIÓN C-C: PEDESTAL MODULAR DE EXPOSICIÓN
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Blueprint Bottom Metadata */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-4 border-t border-[#2E3344]/30 text-[9px] font-mono font-bold text-slate-500 z-10 uppercase">
              <div className="border-r border-[#2E3344]/20 pr-2">
                <span className="text-slate-400 block font-normal text-[8px] leading-none mb-1">CLIENTE:</span>
                <span className="text-slate-800 tracking-tight text-[10px] leading-tight">Varios / Corporativo</span>
              </div>
              <div className="md:border-r border-[#2E3344]/20 pr-2 md:pl-2">
                <span className="text-slate-400 block font-normal text-[8px] leading-none mb-1">PROYECTISTA:</span>
                <span className="text-slate-800 tracking-tight text-[10px] leading-tight">Ing. Carlos Mendoza</span>
              </div>
              <div className="border-r border-[#2E3344]/20 md:pl-2 pr-2">
                <span className="text-slate-400 block font-normal text-[8px] leading-none mb-1">MATERIAL:</span>
                <span className="text-[#C67C3E] tracking-tight text-[10px] leading-tight font-black">Acero Certificado</span>
              </div>
              <div className="pl-2">
                <span className="text-slate-400 block font-normal text-[8px] leading-none mb-1">APROBACIÓN:</span>
                <span className="text-emerald-700 tracking-tight text-[10px] leading-tight">Norma ASTM A36</span>
              </div>
            </div>
          </div>

          {/* Right Side: Tab selectors and detailed specifications (5 cols) */}
          <div className="lg:col-span-5 bg-[#0D1525] p-6 sm:p-8 text-white flex flex-col justify-between">
            <div className="space-y-6">
              
              {/* Module Header */}
              <div>
                <span className="text-[9px] font-mono tracking-widest text-[#FFC480]/80 uppercase font-black">SISTEMA SELECCIONADO</span>
                <h4 className="text-xl font-extrabold text-white mt-1">Soportes Especiales Activos</h4>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Haz clic en cualquiera de las siguientes tres pestañas de diseño estructural para explorar sus esquemas técnicos de fabricación avanzada y cotizar a medida.
                </p>
              </div>

              {/* Blueprint Tab Buttons selector */}
              <div className="grid grid-cols-3 bg-slate-900/60 p-1 rounded-xl gap-1 border border-white/5">
                <button
                  onClick={() => setActiveProject('A')}
                  className={`text-[10.5px] py-2 px-1.5 rounded-lg font-mono font-bold transition-all uppercase tracking-tighter ${
                    activeProject === 'A'
                      ? 'bg-[#C67C3E] text-white shadow font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Proyecto A
                </button>
                <button
                  onClick={() => setActiveProject('B')}
                  className={`text-[10.5px] py-2 px-1.5 rounded-lg font-mono font-bold transition-all uppercase tracking-tighter ${
                    activeProject === 'B'
                      ? 'bg-[#C67C3E] text-white shadow font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Proyecto B
                </button>
                <button
                  onClick={() => setActiveProject('C')}
                  className={`text-[10.5px] py-2 px-1.5 rounded-lg font-mono font-bold transition-all uppercase tracking-tighter ${
                    activeProject === 'C'
                      ? 'bg-[#C67C3E] text-white shadow font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Proyecto C
                </button>
              </div>

              {/* Dynamic Project Details Block */}
              <div className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-4">
                <div>
                  <h5 className="text-[12px] font-mono text-[#FFC480] uppercase tracking-wide font-black">
                    {projects[activeProject].title}
                  </h5>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                    {projects[activeProject].subtitle}
                  </p>
                  <p className="text-xs text-slate-300 mt-2.5 leading-relaxed">
                    {projects[activeProject].desc}
                  </p>
                </div>

                {/* Specs list with icons */}
                <div className="space-y-2 pt-2 border-t border-white/10">
                  {projects[activeProject].specs.map((spec, idx) => (
                    <div key={idx} className="flex justify-between items-center text-[11px] font-sans">
                      <span className="text-slate-400 font-medium">{spec.label}:</span>
                      <span className="text-white font-mono font-bold text-right ml-2">{spec.value}</span>
                    </div>
                  ))}
                </div>

                <p className="text-[10px] text-slate-400 italic bg-slate-900/40 p-2.5 rounded-lg border border-white/5 leading-relaxed">
                  <strong>Detalle de Aplicación:</strong> {projects[activeProject].details}
                </p>
              </div>
            </div>

            {/* Quick action buttons with WhatsApp and quote icons */}
            <div className="space-y-3 pt-6 border-t border-white/10">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                {/* Cotización Direct Action */}
                <button
                  onClick={scrollToQuote}
                  className="bg-[#C67C3E] hover:bg-[#b56e35] text-white py-3 px-4 rounded-xl text-xs font-black tracking-wide transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer group"
                >
                  <FileText className="w-4 h-4 text-white/90 group-hover:scale-110 transition-transform" />
                  <span>Cotizar Proyecto</span>
                </button>

                {/* WhatsApp Direct Action */}
                <a
                  href={`https://wa.me/59171611090?text=Hola%20Torre%20Forte%20S.R.L.%2C%20quisiera%20cotizar/consultar%20sobre%20los%20servicios%20de%20dise%C3%B1o%20e%20instalaci%C3%B3n%20para%20un%20${encodeURIComponent(projects[activeProject].title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#25D366] hover:bg-[#1fbc52] text-white py-3 px-4 rounded-xl text-xs font-black tracking-wide transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 fill-current" />
                  <span>Consultar WhatsApp</span>
                </a>
              </div>

              {/* Compliance Badges footer */}
              <div className="flex items-center justify-center gap-4 text-[9px] font-mono text-slate-500 font-bold uppercase tracking-widest pt-2">
                <span className="flex items-center gap-1 text-emerald-500/80">
                  <Shield className="w-3.5 h-3.5" />
                  Garantía Estructural
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-sky-400/80">
                  <Settings className="w-3.5 h-3.5" />
                  Montajes Pesados
                </span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
