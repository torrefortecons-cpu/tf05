import React from 'react';
import { MapPin, Clock, Phone, Share2, ThumbsUp, ShieldCheck } from 'lucide-react';
import { LandingConfigs } from '../types';

interface AboutUsProps {
  configs?: LandingConfigs;
}

export default function AboutUs({ configs }: AboutUsProps) {
  const [likes, setLikes] = React.useState<number>(() => {
    const saved = localStorage.getItem('torre_forte_likes');
    return saved ? JSON.parse(saved) : 0;
  });
  const [hasLiked, setHasLiked] = React.useState<boolean>(() => {
    return localStorage.getItem('torre_forte_has_liked') === 'true';
  });

  React.useEffect(() => {
    localStorage.setItem('torre_forte_likes', JSON.stringify(likes));
    localStorage.setItem('torre_forte_has_liked', String(hasLiked));
  }, [likes, hasLiked]);

  const handleLike = () => {
    if (!hasLiked) {
      setLikes(likes + 1);
      setHasLiked(true);
    } else {
      setLikes(likes - 1);
      setHasLiked(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Enlace de Torre Forte copiado al portapapeles. ¡Compártelo con tus contactos!');
  };

  const renderMultiLine = (text: string) => {
    return text.split('\n').map((line, idx) => (
      <React.Fragment key={idx}>
        {line}
        {idx < text.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  };

  const aboutTitle = configs?.aboutTitle || 'Sobre Torre Forte';
  
  const locTitle = configs?.aboutLocationTitle || 'Ubicación Central';
  const locDesc = configs?.aboutLocationDesc || 'Av. Banzer Km 5, Parque Industrial, Santa Cruz de la Sierra, Bolivia.';

  const hoursTitle = configs?.aboutHoursTitle || 'Horario de Atención';
  const hoursDesc = configs?.aboutHoursDesc || 'Lunes - Viernes: 08:00 a 18:00\nSábados: 08:00 a 12:00';

  const contactTitle = configs?.aboutContactTitle || 'Contacto Directo';
  const contactDesc = configs?.aboutContactDesc || 'Celular: +591 700-12345\nCorreo: info@torreforte.com.bo';

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-xl p-6 md:p-8 shadow-sm">
      <h3 className="text-lg font-extrabold text-industrial-navy tracking-tight mb-4">{aboutTitle}</h3>
      
      {/* Map visual section matching mockup map location */}
      <div className="flex-grow rounded-lg overflow-hidden border border-slate-200 mb-6 bg-slate-100 relative h-64 min-h-[220px]">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform hover:scale-102" 
          style={{ 
            backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBa7Utgk9IwhcFtuiv635YmPvS3B9fMnAV8PY4M1t7zCGyW62_5PgxL6khQf4H6owhy9TWHvoiTMfKVjeJwXNfMdxtoVzpy0KCObQyslAU-fAfYQ6DXjC4Fhthu9BKO6TGck0duck1tJkfGa8GunDsyC_ZWT9oBE2uwutJBG1GKZ6_m8jVxeiLRkWmvFbRdMbc4s8SKiZeYCMWUb52ZMT4XEnBHqCTsEhEcxoJ75GorBoUzeL1T_kV26tgNFp5elgHynqt8Ajqpt9rJ')" 
          }}
        />
        <div className="absolute inset-0 bg-[#051125]/5 mix-blend-multiply"></div>
        {/* Animated Location Pins */}
        <div className="absolute top-[48%] left-[52%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
          <div className="relative flex h-5 w-5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-safety-orange opacity-75"></span>
            <span className="relative inline-flex rounded-full h-5 w-5 bg-safety-orange border-2 border-white flex items-center justify-center">
              <ShieldCheck className="w-2.5 h-2.5 text-white" />
            </span>
          </div>
          <span className="bg-industrial-navy text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow-md mt-1 font-sans">
            Torre Forte HQ
          </span>
        </div>
      </div>

      {/* Grid details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        
        {/* Ubicación */}
        <div className="flex items-start gap-3">
          <div className="bg-safety-orange/10 p-2 rounded text-safety-orange flex-shrink-0">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800">{locTitle}</h4>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              {renderMultiLine(locDesc)}
            </p>
          </div>
        </div>

        {/* Horarios */}
        <div className="flex items-start gap-3">
          <div className="bg-safety-orange/10 p-2 rounded text-safety-orange flex-shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800">{hoursTitle}</h4>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              {renderMultiLine(hoursDesc)}
            </p>
          </div>
        </div>

        {/* Contacto */}
        <div className="flex items-start gap-3">
          <div className="bg-safety-orange/10 p-2 rounded text-safety-orange flex-shrink-0">
            <Phone className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800">{contactTitle}</h4>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              {renderMultiLine(contactDesc)}
            </p>
          </div>
        </div>

        {/* Redes */}
        <div className="flex items-start gap-3">
          <div className="bg-safety-orange/10 p-2 rounded text-safety-orange flex-shrink-0">
            <ThumbsUp className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800">Redes Sociales</h4>
            <div className="flex gap-2 mt-1.5">
              <button 
                onClick={handleShare}
                className="w-7 h-7 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors flex items-center justify-center cursor-pointer"
                title="Copiar link"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={handleLike}
                className={`px-2.5 h-7 rounded text-[10px] font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
                  hasLiked 
                    ? 'bg-safety-orange text-white' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                <ThumbsUp className="w-3 h-3" />
                <span>{likes}</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
