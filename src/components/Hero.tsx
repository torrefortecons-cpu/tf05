import React from 'react';
import { ShieldCheck, ArrowRight, Hammer, Flame, LayoutDashboard } from 'lucide-react';
import { LandingConfigs } from '../types';

interface HeroProps {
  onNavigate: (section: string) => void;
  setIsAdmin: (value: boolean) => void;
  setAdminTab?: (value: string) => void;
  configs?: LandingConfigs;
}

export default function Hero({ onNavigate, setIsAdmin, setAdminTab, configs }: HeroProps) {
  // Simple helper to highlight key terms if they are in the title
  const renderTitle = (titleText: string) => {
    const parts = titleText.split(/(Soportes|Climatización)/gi);
    return parts.map((part, index) => {
      if (part.toLowerCase() === 'soportes') {
        return <span key={index} className="text-safety-orange">{part}</span>;
      }
      if (part.toLowerCase() === 'climatización') {
        return <span key={index} className="text-teal-cyan">{part}</span>;
      }
      return part;
    });
  };

  const tagText = configs?.heroTag || 'INGENIERÍA INDUSTRIAL • BOLIVIA';
  const titleText = configs?.heroTitle || 'Torre Forte: Ingeniería en Soportes y Climatización';
  const descText = configs?.heroDescription || 'Fabricación y montaje de soportes para pantallas de TV de alta resistencia, y servicios técnicos corporativos en HVAC para toda Bolivia. Precisión milimétrica, acero certificado y durabilidad garantizada.';

  // Automatically convert Google Drive & Dropbox sharing links into direct image URLs
  const resolveHeroImage = (url: string | undefined) => {
    const defaultUrl = '/assets/hero-bg.png';
    if (!url) return defaultUrl;

    const trimmed = url.trim();
    if (!trimmed) return defaultUrl;

    // Google Drive sharing links
    const driveRegex = /(?:drive\.google\.com\/file\/d\/|drive\.google\.com\/open\?id=|docs\.google\.com\/file\/d\/)([a-zA-Z0-9_-]+)/;
    const driveMatch = trimmed.match(driveRegex);
    if (driveMatch && driveMatch[1]) {
      return `https://drive.google.com/uc?export=download&id=${driveMatch[1]}`;
    }

    // Dropbox links
    if (trimmed.includes('dropbox.com')) {
      return trimmed.replace('www.dropbox.com', 'dl.dropboxusercontent.com').replace('?dl=0', '?raw=1').replace('&dl=0', '&raw=1');
    }

    return trimmed;
  };

  const currentHeroBg = resolveHeroImage(configs?.heroBgImage);
  const isCustomBg = configs?.heroBgImage && configs.heroBgImage.trim() !== '' && configs.heroBgImage !== '/assets/hero-bg.png';

  return (
    <section className="relative w-full h-[620px] flex items-center bg-[#0c0d12] overflow-hidden">
      {/* Background showing video wall pedestal mount construction */}
      <div className="absolute inset-0 z-0">
        <div 
          className={`w-full h-full bg-cover bg-center transition-transform duration-10000 hover:scale-105 ${
            isCustomBg ? 'opacity-60 grayscale-0' : 'opacity-45 mix-blend-luminosity'
          }`} 
          style={{ 
            backgroundImage: `url('${currentHeroBg}')` 
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0c0d12] via-[#0c0d12]/92 to-transparent"></div>
      </div>

      <div className="relative z-10 max-w-[1664px] mx-auto px-4 md:px-8 w-full">
        <div className="max-w-2xl">
          {/* Tag badge with construct icon */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-safety-orange font-mono text-xs tracking-wider mb-6 backdrop-blur-md">
            <Hammer className="w-3.5 h-3.5 text-safety-orange animate-pulse" />
            <span className="font-semibold uppercase tracking-widest text-[10px]">{tagText}</span>
          </div>

          {/* Heading */}
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white mb-6 leading-tight">
            {renderTitle(titleText)}
          </h1>

          {/* Description paragraph */}
          <p className="text-base md:text-lg text-slate-300 mb-8 leading-relaxed font-light">
            {descText}
          </p>

          {/* Primary call-to-actions */}
          <div className="flex flex-wrap items-center gap-3 mb-8">
            <button
              onClick={() => onNavigate('products')}
              className="flex items-center gap-2 px-5 py-3 bg-safety-orange hover:bg-[#b06c32] text-white text-sm font-bold rounded-lg transition-colors cursor-pointer"
            >
              Ver Catálogo
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('about')}
              className="flex items-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-bold rounded-lg transition-colors cursor-pointer backdrop-blur-md"
            >
              Cotizar Ahora
            </button>
          </div>

          {/* Inline metrics */}
          <div className="grid grid-cols-3 gap-6 pt-6 border-t border-white/10 max-w-lg">
            <div>
              <p className="text-sm font-mono text-safety-orange font-bold">{configs?.metric1Val || '12K+'}</p>
              <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">{configs?.metric1Label || 'Instalaciones'}</p>
            </div>
            <div>
              <p className="text-sm font-mono text-teal-cyan font-bold">{configs?.metric2Val || '100%'}</p>
              <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">{configs?.metric2Label || 'Acero al Carbono'}</p>
            </div>
            <div>
              <p className="text-sm font-mono text-emerald-400 font-bold">{configs?.metric3Val || '5 años'}</p>
              <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">{configs?.metric3Label || 'Garantía'}</p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
