import React from 'react';
import { ShoppingCart, LayoutDashboard, Menu, X, ArrowLeftRight } from 'lucide-react';
import { CartItem } from '../types';
import TorreForteLogo from './TorreForteLogo';

interface NavbarProps {
  cart: CartItem[];
  isAdmin: boolean;
  setIsAdmin: (value: boolean) => void;
  onRequestAdminAccess: () => void;
  adminTab: string;
  setAdminTab: (value: string) => void;
  onOpenCart: () => void;
  onNavigate: (section: string) => void;
}

export default function Navbar({ cart, isAdmin, setIsAdmin, onRequestAdminAccess, adminTab, setAdminTab, onOpenCart, onNavigate }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const handleLinkClick = (sectionId: string) => {
    setMobileMenuOpen(false);
    if (isAdmin) {
      setIsAdmin(false);
    }
    // Allow React coordinates or traditional element scrolling
    setTimeout(() => {
      onNavigate(sectionId);
    }, 50);
  };

  return (
    <nav className="bg-white w-full sticky top-0 border-b border-slate-200 z-50 shadow-sm">
      <div className="flex justify-between items-center max-w-[1664px] mx-auto px-4 md:px-8 h-16">
        
        {/* Brand Logo & Name */}
        <div 
          onClick={() => handleLinkClick('hero')} 
          className="flex items-center gap-2 cursor-pointer select-none group"
        >
          <div className="relative w-[64px] h-[54px] flex items-center justify-center">
            <TorreForteLogo className="absolute w-[100px] h-[100px] -translate-x-[30px] text-industrial-navy transition-transform group-hover:scale-110 group-hover:-translate-x-[30px] z-20 pointer-events-none drop-shadow-sm max-w-none" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-extrabold tracking-tight text-industrial-navy leading-none">Torre Forte</span>
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-0.5">Ingeniería</span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex gap-8 items-center">
          <button 
            onClick={() => handleLinkClick('hero')}
            className={`text-sm font-bold transition-colors py-2 border-b-2 hover:text-industrial-navy ${!isAdmin ? 'text-industrial-navy border-industrial-navy' : 'text-slate-500 border-transparent'}`}
          >
            Inicio
          </button>
          <button 
            onClick={() => handleLinkClick('products')}
            className="text-slate-500 hover:text-industrial-navy text-sm font-bold transition-colors py-2"
          >
            Catálogo
          </button>
          <button 
            onClick={() => handleLinkClick('services')}
            className="text-slate-500 hover:text-industrial-navy text-sm font-bold transition-colors py-2"
          >
            Servicios HVAC
          </button>
          <button 
            onClick={() => handleLinkClick('about')}
            className="text-slate-500 hover:text-industrial-navy text-sm font-bold transition-colors py-2"
          >
            Nosotros
          </button>
        </div>

        {/* Cart Counter & Admin Panel Login Button */}
        <div className="flex items-center gap-3">
          
          {/* Quote Cart Button */}
          <button 
            onClick={onOpenCart}
            className="relative p-2.5 rounded-full hover:bg-slate-100 text-slate-700 transition-all flex items-center justify-center cursor-pointer"
            title="Ver lista de cotización"
          >
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-safety-orange text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-bounce">
                {cartCount}
              </span>
            )}
          </button>

          {/* View Toggler / Access admin directly */}
          <button
            onClick={() => {
              if (isAdmin) {
                setIsAdmin(false);
              } else {
                onRequestAdminAccess();
              }
            }}
            className={`hidden sm:flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-lg transition-all cursor-pointer ${
              isAdmin 
                ? 'bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200' 
                : 'bg-industrial-navy text-white hover:bg-opacity-90 shadow-sm'
            }`}
          >
            {isAdmin ? (
              <>
                <ArrowLeftRight className="w-4 h-4" />
                Regresar al Sitio
              </>
            ) : (
              <>
                <LayoutDashboard className="w-4 h-4" />
                Acceder al Panel
              </>
            )}
          </button>

          {/* Mobile Menu Toggle Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-700 hover:bg-slate-100 rounded"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

        </div>
      </div>

      {/* Mobile Menu Draw-out */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-slate-200 py-4 px-6 space-y-4 shadow-inner">
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => handleLinkClick('hero')}
              className="text-left py-2 font-semibold text-slate-700 border-b border-slate-100"
            >
              Inicio
            </button>
            <button 
              onClick={() => handleLinkClick('products')}
              className="text-left py-2 font-semibold text-slate-700 border-b border-slate-100"
            >
              Catálogo de Soportes
            </button>
            <button 
              onClick={() => handleLinkClick('services')}
              className="text-left py-2 font-semibold text-slate-700 border-b border-slate-100"
            >
              Servicios HVAC
            </button>
            <button 
              onClick={() => handleLinkClick('about')}
              className="text-left py-2 font-semibold text-slate-700 border-b border-slate-100"
            >
              Ubicación y Contacto
            </button>

            {/* Admin Toggle on Mobile */}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                if (isAdmin) {
                  setIsAdmin(false);
                } else {
                  onRequestAdminAccess();
                }
              }}
              className="w-full flex items-center justify-center gap-2 text-xs font-semibold px-4 py-3 rounded mt-2 bg-industrial-navy text-white"
            >
              <LayoutDashboard className="w-4 h-4" />
              {isAdmin ? 'Ver Vista Cliente' : 'Acceder al Panel Admin'}
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
