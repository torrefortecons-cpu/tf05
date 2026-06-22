/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Product, CartItem, Quote, Technician, QuoteStatus, LandingConfigs } from './types';
import { INITIAL_PRODUCTS, INITIAL_QUOTES, INITIAL_TECHNICIANS, INITIAL_LANDING_CONFIGS } from './data';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Catalog from './components/Catalog';
import TvCalculator from './components/TvCalculator';
import Services from './components/Services';
import QuoteForm from './components/QuoteForm';
import AboutUs from './components/AboutUs';
import CartDrawer from './components/CartDrawer';
import AndroidAppShell from './components/AndroidAppShell';
import StructuralProjects from './components/StructuralProjects';
import Testimonials from './components/Testimonials';
import { ShieldCheck, ArrowUp, Snowflake, Info, PackageOpen, Monitor, Smartphone } from 'lucide-react';
import TorreForteLogo from './components/TorreForteLogo';
import AdminAuthModal from './components/AdminAuthModal';
import { hasActiveSession } from './utils/adminAuth';

const AdminPanel = lazy(() => import('./components/AdminPanel'));

export default function App() {
  // Shared States initialized with mock data or localStorage
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('torre_forte_products');
    const raw = saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
    return raw.map((p: any) => ({
      ...p,
      description: (p.description || '')
        .replace(/para pantallas de 32["”'] a 75["”']\.\s*brazo extensible dual con gestión de cables y sistema de nivelación de burbuja integrado\.?/gi, '')
        .trim()
    }));
  });

  const [quotes, setQuotes] = useState<Quote[]>(() => {
    const saved = localStorage.getItem('torre_forte_quotes');
    const raw = saved ? JSON.parse(saved) : INITIAL_QUOTES;
    return raw.map((q: any) => ({
      ...q,
      items: (q.items || []).map((it: any) => ({
        ...it,
        product: {
          ...it.product,
          description: (it.product.description || '')
            .replace(/para pantallas de 32["”'] a 75["”']\.\s*brazo extensible dual con gestión de cables y sistema de nivelación de burbuja integrado\.?/gi, '')
            .trim()
        }
      }))
    }));
  });

  const [technicians, setTechnicians] = useState<Technician[]>(() => {
    const saved = localStorage.getItem('torre_forte_technicians');
    return saved ? JSON.parse(saved) : INITIAL_TECHNICIANS;
  });

  const [cart, setCart] = useState<CartItem[]>([]);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [adminTab, setAdminTab] = useState<string>('metrics');
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);
  const [showAdminAuth, setShowAdminAuth] = useState<boolean>(false);

  // Gate admin panel access behind registration/login, unless this device already has an active session
  const requestAdminAccess = () => {
    if (hasActiveSession()) {
      setIsAdmin(true);
      setAdminTab('metrics');
    } else {
      setShowAdminAuth(true);
    }
  };

  const handleAdminAuthSuccess = () => {
    setShowAdminAuth(false);
    setIsAdmin(true);
    setAdminTab('metrics');
  };

  // View mode simulation and mobile auto-detection
  const [viewMode, setViewMode] = useState<'web' | 'android-app'>(() => {
    const isMobileSize = typeof window !== 'undefined' && window.innerWidth < 1024;
    const isMobileUA = typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    return (isMobileSize || isMobileUA) ? 'android-app' : 'web';
  });

  // Track if physical screen is mobile-sized to toggle mockup frames
  const [isPhysicalMobile, setIsPhysicalMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const isMobileSize = window.innerWidth < 1024;
      const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsPhysicalMobile(isMobileSize || isMobileUA);
      
      // Auto-switch viewMode to android-app on real mobile screens
      if (isMobileSize || isMobileUA) {
        setViewMode('android-app');
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [landingConfigs, setLandingConfigs] = useState<LandingConfigs>(() => {
    const saved = localStorage.getItem('torre_forte_landing_configs');
    if (!saved) return INITIAL_LANDING_CONFIGS;
    const parsed = JSON.parse(saved);
    // Migrate stale hero backgrounds saved before the default image was updated.
    const staleHeroBackgrounds = [
      '',
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=2070&auto=format&fit=crop',
    ];
    if (!parsed.heroBgImage || staleHeroBackgrounds.includes(parsed.heroBgImage)) {
      parsed.heroBgImage = INITIAL_LANDING_CONFIGS.heroBgImage;
    }
    return parsed;
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('torre_forte_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('torre_forte_quotes', JSON.stringify(quotes));
  }, [quotes]);

  useEffect(() => {
    localStorage.setItem('torre_forte_technicians', JSON.stringify(technicians));
  }, [technicians]);

  useEffect(() => {
    localStorage.setItem('torre_forte_landing_configs', JSON.stringify(landingConfigs));
  }, [landingConfigs]);

  // Monitor scroll for "back to top" button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // --- Handlers ---
  
  const handleAddToCart = (product: Product) => {
    setCart(prevCart => {
      const existingIndex = prevCart.findIndex(item => item.product.id === product.id);
      if (existingIndex > -1) {
        return prevCart.map((item, i) =>
          i === existingIndex ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { product, quantity: 1 }];
    });
    // Open cart drawer to give direct feedback and click satisfaction
    setIsCartOpen(true);
  };

  const handleDecreaseQuantity = (productId: string) => {
    setCart(prevCart => {
      const existingIndex = prevCart.findIndex(item => item.product.id === productId);
      if (existingIndex > -1) {
        const existingItem = prevCart[existingIndex];
        if (existingItem.quantity > 1) {
          return prevCart.map((item, i) =>
            i === existingIndex ? { ...item, quantity: item.quantity - 1 } : item
          );
        } else {
          return prevCart.filter(item => item.product.id !== productId);
        }
      }
      return prevCart;
    });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const handleNavigateToQuote = () => {
    const element = document.getElementById('about');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Callback to append quotes from quick form submission
  const handleSubmitQuote = (quoteData: { fullName: string; phone: string; email: string; serviceType: string; message: string; items: CartItem[] }) => {
    const newQuote: Quote = {
      id: `COT-${Math.floor(Math.random() * 900) + 100}`,
      fullName: quoteData.fullName,
      phone: quoteData.phone,
      email: quoteData.email || 'correo@torreforte.bo',
      serviceType: quoteData.serviceType,
      message: quoteData.message,
      date: new Date().toISOString().split('T')[0],
      status: 'Pendiente',
      items: quoteData.items
    };

    setQuotes(prevQuotes => [newQuote, ...prevQuotes]);
  };

  // Update Quote Status & Technicians detailed work
  const handleUpdateQuoteStatus = (quoteId: string, status: QuoteStatus, techNotes?: string, assignedTech?: string) => {
    setQuotes(prevQuotes => prevQuotes.map(q => {
      if (q.id === quoteId) {
        return {
          ...q,
          status,
          technicianNotes: techNotes,
          assignedTechnician: assignedTech
        };
      }
      return q;
    }));
  };

  const handleUpdateQuote = (updatedQuote: Quote) => {
    setQuotes(prevQuotes => prevQuotes.map(q => q.id === updatedQuote.id ? updatedQuote : q));
  };

  // Product Inventory management callbacks
  const handleAddProduct = (product: Product) => {
    const cleaned = {
      ...product,
      description: (product.description || '')
        .replace(/para pantallas de 32["”'] a 75["”']\.\s*brazo extensible dual con gestión de cables y sistema de nivelación de burbuja integrado\.?/gi, '')
        .trim()
    };
    setProducts(prevProducts => [...prevProducts, cleaned]);
  };

  const handleUpdateProduct = (product: Product) => {
    const cleaned = {
      ...product,
      description: (product.description || '')
        .replace(/para pantallas de 32["”'] a 75["”']\.\s*brazo extensible dual con gestión de cables y sistema de nivelación de burbuja integrado\.?/gi, '')
        .trim()
    };
    setProducts(prevProducts => prevProducts.map(p => p.id === cleaned.id ? cleaned : p));
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts(prevProducts => prevProducts.filter(p => p.id !== productId));
  };

  // Technician management callbacks
  const handleAddTechnician = (tech: Technician) => {
    setTechnicians(prevTechs => [...prevTechs, tech]);
  };

  const handleUpdateTechStatus = (techId: string, status: 'Disponible' | 'En Ruta' | 'Inactivo') => {
    setTechnicians(prevTechs => prevTechs.map(t => t.id === techId ? { ...t, status } : t));
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onNavigate = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-background text-slate-800 font-sans flex flex-col justify-between selection:bg-safety-orange/30 antialiased">
      
      {/* Adaptability Simulator Bar for Desktop Previewers */}
      {!isAdmin && !isPhysicalMobile && (
        <div className="bg-industrial-navy text-slate-200 text-xs py-2 px-4 flex flex-col sm:flex-row items-center justify-between border-b border-safety-orange/20 z-10 font-mono gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-bold">MOTOR BI-MODAL:</span>
            <span className="text-slate-400">Torre Forte adaptado para teléfonos Android</span>
          </div>
          <div className="flex bg-slate-805 bg-slate-800 rounded-lg p-0.5 border border-slate-700">
            <button
              onClick={() => setViewMode('web')}
              className={`px-3 py-1 rounded text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                viewMode === 'web' 
                  ? 'bg-safety-orange text-white shadow' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              Vista Web Tradicional
            </button>
            <button
              onClick={() => setViewMode('android-app')}
              className={`px-3 py-1 rounded text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                viewMode === 'android-app' 
                  ? 'bg-safety-orange text-white shadow' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              Vista App Android (Nativa)
            </button>
          </div>
        </div>
      )}

      {/* Header / Navbar (Drawn in standard web layout, or operator portal, or desktop testing mode) */}
      {(viewMode === 'web' || isAdmin || !isPhysicalMobile) && (
        <Navbar
          cart={cart}
          isAdmin={isAdmin}
          setIsAdmin={setIsAdmin}
          onRequestAdminAccess={requestAdminAccess}
          adminTab={adminTab}
          setAdminTab={setAdminTab}
          onOpenCart={() => setIsCartOpen(true)}
          onNavigate={onNavigate}
        />
      )}

      {/* Main Body */}
      <main className="flex-grow">
        {isAdmin ? (
          /* Admin / Operator Dashboard Portal */
          <div className="bg-slate-50 min-h-[calc(100vh-4rem)]">
            <Suspense fallback={
              <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] gap-3 text-slate-400">
                <svg className="animate-spin w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                <span className="text-sm font-mono">Cargando panel operador...</span>
              </div>
            }>
              <AdminPanel
                products={products}
                quotes={quotes}
                technicians={technicians}
                onUpdateQuoteStatus={handleUpdateQuoteStatus}
                onUpdateQuote={handleUpdateQuote}
                onAddProduct={handleAddProduct}
                onUpdateProduct={handleUpdateProduct}
                onDeleteProduct={handleDeleteProduct}
                onAddTechnician={handleAddTechnician}
                onUpdateTechStatus={handleUpdateTechStatus}
                defaultTab={adminTab}
                landingConfigs={landingConfigs}
                onUpdateLandingConfigs={setLandingConfigs}
              />
            </Suspense>
          </div>
        ) : viewMode === 'android-app' ? (
          /* Android App layout render */
          isPhysicalMobile ? (
            /* Direct Full-Screen native app wrapper on real cellphones */
            <div className="fixed inset-0 bg-[#121622] z-50 overflow-hidden">
              <AndroidAppShell 
                products={products}
                cart={cart}
                quotes={quotes}
                landingConfigs={landingConfigs}
                onAddToCart={handleAddToCart}
                onDecreaseQuantity={handleDecreaseQuantity}
                onRemoveFromCart={handleRemoveFromCart}
                onClearCart={handleClearCart}
                onSubmitQuote={handleSubmitQuote}
                isAdmin={isAdmin}
                setIsAdmin={setIsAdmin}
                onRequestAdminAccess={requestAdminAccess}
                setAdminTab={setAdminTab}
                isFullscreen
              />
            </div>
          ) : (
            /* Simulator presentation layout for Desktop Reviewers */
            <div className="bg-[#121622] min-h-[calc(100vh-4rem)] py-8 flex flex-col md:flex-row items-center justify-center gap-12 px-6">
              
              {/* Simulated Device Frame mockup */}
              <div className="relative w-[345px] h-[670px] bg-[#1e2333]/90 rounded-[44px] p-2 flex items-center justify-center shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] border-[3px] border-[#2e3344] ring-1 ring-white/10 flex-shrink-0">
                <div className="w-full h-full rounded-[38px] overflow-hidden bg-[#ebedf3]">
                  <AndroidAppShell 
                    products={products}
                    cart={cart}
                    quotes={quotes}
                    landingConfigs={landingConfigs}
                    onAddToCart={handleAddToCart}
                    onDecreaseQuantity={handleDecreaseQuantity}
                    onRemoveFromCart={handleRemoveFromCart}
                    onClearCart={handleClearCart}
                    onSubmitQuote={handleSubmitQuote}
                    isAdmin={isAdmin}
                    setIsAdmin={setIsAdmin}
                    onRequestAdminAccess={requestAdminAccess}
                    setAdminTab={setAdminTab}
                  />
                </div>
              </div>

              {/* Simulation explanatory cards (Right side) */}
              <div className="max-w-md text-left space-y-6 text-white p-2">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/10 text-[#ffb780] text-[10px] font-mono border border-orange-500/20 font-bold uppercase tracking-wider">
                    <Smartphone className="w-3.5 h-3.5" />
                    Android Standalone PWA Engine
                  </div>
                  <h2 className="text-2xl font-black tracking-tight font-sans">
                    Interfaz Móvil Auto-Adaptativa
                  </h2>
                  <p className="text-xs text-slate-300 leading-relaxed font-light">
                    Esta es la plantilla de aplicación móvil nativa con estándares de <strong>Material Design</strong>. Al abrir el enlace del sitio en cualquier celular o tablet Android, <strong>el sistema lo detecta de manera instantánea</strong> y lo despliega a pantalla completa ocultando las barras del navegador.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-mono uppercase tracking-widest text-slate-400 font-bold">Módulos Optimizados (Inicio):</h4>
                  
                  <div className="bg-white/5 border border-white/5 p-3.5 rounded-2xl flex items-start gap-3">
                    <span className="text-lg bg-safety-orange/10 text-safety-orange p-2 rounded-xl">📱</span>
                    <div>
                      <h5 className="text-[11.5px] font-bold">Carrusel Home & Bento-Grid</h5>
                      <p className="text-[10px] text-slate-400 leading-normal mt-0.5 font-sans">Navegación fluida de un toque para cotizar soportes de TV de manera rápida.</p>
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/5 p-3.5 rounded-2xl flex items-start gap-3">
                    <span className="text-lg bg-sky-500/10 text-sky-300 p-2 rounded-xl">📐</span>
                    <div>
                      <h5 className="text-[11.5px] font-bold">Asistente de Carga Mecánica</h5>
                      <p className="text-[10px] text-slate-400 leading-normal mt-0.5 font-sans">Calcula al instante la compatibilidad del soporte según las pulgadas y peso de tu TV.</p>
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/5 p-3.5 rounded-2xl flex items-start gap-3">
                    <span className="text-lg bg-emerald-500/10 text-emerald-300 p-2 rounded-xl">🧾</span>
                    <div>
                      <h5 className="text-[11.5px] font-bold">Rastreador de Cotización ID</h5>
                      <p className="text-[10px] text-slate-400 leading-normal mt-0.5 font-sans">Ingresa tu identificador COT y sigue en tiempo real el estado de tu pedido.</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                  <button 
                    onClick={() => setViewMode('web')}
                    className="bg-safety-orange hover:bg-opacity-90 text-white font-bold text-xs px-4.5 py-2.5 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5"
                  >
                    <Monitor className="w-4 h-4" />
                    <span>Probar Vista Web Tradicional</span>
                  </button>
                  
                  <span className="text-[9px] font-mono text-slate-400 font-semibold tracking-wider uppercase">
                    BOLIVIA 🇧🇴
                  </span>
                </div>
              </div>

            </div>
          )
        ) : (
          /* Client Landing Workspace */
          <div className="space-y-0 animate-fade-in">
            
            {/* Hero Cover */}
            <div id="hero">
              <Hero onNavigate={onNavigate} setIsAdmin={setIsAdmin} setAdminTab={setAdminTab} configs={landingConfigs} />
            </div>
 
            {/* Compatible TV Sizer Banner */}
            <div className="max-w-[1664px] mx-auto px-4 md:px-8 pt-12">
              <TvCalculator products={products} onAddToCart={handleAddToCart} />
            </div>
 
            {/* Catalogue Grid list */}
            <div id="products">
              <Catalog products={products} onAddToCart={handleAddToCart} />
            </div>

            {/* Proyectos Estructurales Section */}
            <StructuralProjects onNavigateToQuote={handleNavigateToQuote} />

            {/* Customer Testimonials */}
            <Testimonials />

            {/* Technical Services Section */}
            <div id="services">
              <Services configs={landingConfigs} />
            </div>
 
            {/* Cotización Rápida & Ubicación Map Grid */}
            <div className="py-16 bg-white border-b border-slate-200" id="about">
              <div className="max-w-[1664px] mx-auto px-4 md:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div id="quote-form-block">
                    <QuoteForm 
                      cart={cart}
                      onRemoveFromCart={handleRemoveFromCart}
                      onClearCart={handleClearCart}
                      onSubmitQuote={handleSubmitQuote}
                    />
                  </div>
                  <div id="about-us-block">
                    <AboutUs configs={landingConfigs} />
                  </div>
                </div>
              </div>
            </div>
 
          </div>
        )}
      </main>

      {/* Global standard sliding shopping drawer (Regular layout only) */}
      {viewMode === 'web' && !isAdmin && (
        <CartDrawer 
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          cart={cart}
          onAddToCart={handleAddToCart}
          onDecreaseQuantity={handleDecreaseQuantity}
          onRemoveFromCart={handleRemoveFromCart}
          onNavigateToQuote={handleNavigateToQuote}
        />
      )}

      {/* Admin Panel Registration / Login Gate */}
      {showAdminAuth && (
        <AdminAuthModal
          onSuccess={handleAdminAuthSuccess}
          onClose={() => setShowAdminAuth(false)}
        />
      )}

      {/* Quick Back-to-Top Floating toggle (Regular layout only) */}
      {viewMode === 'web' && !isAdmin && showScrollTop && (
        <button 
          onClick={scrollToTop}
          className="fixed bottom-22 right-6 p-3 bg-industrial-navy text-white hover:bg-safety-orange rounded-full shadow-lg hover:shadow-xl transition-all cursor-pointer z-45 animate-fade-in flex items-center justify-center border border-white/10"
          title="Subir al inicio"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      )}

      {/* Floating WhatsApp Action Pin (Regular layout only; native shell has its own shortcuts) */}
      {viewMode === 'web' && !isAdmin && (
        <a 
          href="https://wa.me/59171611090" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="fixed bottom-6 right-6 p-3 bg-[#25D366] text-white hover:bg-[#128C7E] rounded-full shadow-lg hover:shadow-wider hover:scale-110 active:scale-95 transition-all cursor-pointer z-45 animate-bounce flex items-center justify-center border-2 border-white/20"
          title="Contactar Soporte Técnico vía WhatsApp"
          id="floating-whatsapp-btn"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path d="M12.004 2C6.48 2 2 6.48 2 12c0 1.76.458 3.406 1.26 4.85l-1.34 4.9 5.02-1.32C8.36 21.21 9.94 21.64 12 21.64c5.52 0 10-4.48 10-10C22 6.48 17.52 2 12.004 2zm5.72 13.91c-.24.68-1.4 1.24-1.92 1.32-.48.08-.96.12-3.08-.72-2.72-1.08-4.44-3.84-4.56-4-.12-.16-.96-1.28-.96-2.44 0-1.16.6-1.72.84-1.96.24-.24.52-.36.72-.36.16 0 .32 0 .44.04.16.02.36-.06.56.42.2.48.68 1.64.74 1.76.06.12.1.26.02.42-.08.16-.18.28-.3.4a15.8 15.8 0 0 0-1.02.94c-.14.16-.28.32-.06.7.22.38.98 1.62 2.1 2.62 1.44 1.28 2.66 1.68 3.04 1.86.38.18.6.14.82-.1.22-.32.96-1.12 1.22-1.5.26-.38.52-.32.88-.18.36.14 2.28 1.08 2.38 1.14.1.06.16.12.12.24z"/>
          </svg>
        </a>
      )}

      {/* Footer matching guidelines (Only drawn if not mobile native standalone app) */}
      {(viewMode === 'web' || !isPhysicalMobile || isAdmin) && (
        isAdmin ? (
          <footer className="bg-industrial-navy text-white py-4 border-t border-white/5 shrink-0 select-none">
            <div className="max-w-[1664px] mx-auto px-4 flex items-center justify-center gap-2 bg-transparent">
              <div className="relative w-8 h-8 flex items-center justify-center">
                <TorreForteLogo className="w-8 h-8 text-white pointer-events-none drop-shadow-xs" />
              </div>
              <span className="text-[11px] font-bold text-slate-300 font-mono tracking-wider uppercase">
                Torre forte soportes y climatizacion - bolivia
              </span>
            </div>
          </footer>
        ) : (
          <footer className="bg-industrial-navy text-white py-12 border-t border-white/5 shrink-0">
            <div className="max-w-[1664px] mx-auto px-4 md:px-8">
              <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="relative w-[64px] h-[54px] flex items-center justify-center">
                    <TorreForteLogo className="absolute w-[100px] h-[100px] -translate-x-[30px] text-white transition-transform hover:scale-110 hover:-translate-x-[30px] z-20 pointer-events-none drop-shadow-sm max-w-none" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-base font-bold text-white tracking-wide font-sans">Torre Forte</span>
                    <span className="text-[10px] text-slate-400 font-mono tracking-wider">SOPORTES Y CLIMATIZACIÓN • BOLIVIA</span>
                  </div>
                </div>

                <p className="text-xs text-slate-400 font-mono text-center md:text-left">
                  &copy; {new Date().getFullYear()} Torre Forte S.R.L. Todos los valores expresados en Bolivianos (Bs.).
                </p>

                <div className="flex gap-6 text-xs text-slate-400">
                  <a href="#hero" className="hover:text-white transition-colors">Términos de Servicio</a>
                  <a href="#products" className="hover:text-white transition-colors">Política de Privacidad</a>
                  <a href="#about" className="hover:text-white transition-transparent">Soporte Técnico</a>
                </div>
              </div>
            </div>
          </footer>
        )
      )}

    </div>
  );
}
