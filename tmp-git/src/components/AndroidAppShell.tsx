import React, { useState, useEffect } from 'react';
import { 
  Home, 
  Package, 
  Calculator, 
  MapPin, 
  Menu, 
  ShoppingCart, 
  Wifi, 
  Battery, 
  Smartphone, 
  Flame, 
  Compass, 
  CheckCircle2, 
  MessageSquare, 
  Play, 
  ArrowRight, 
  User, 
  Search, 
  Info,
  Calendar,
  X,
  Plus,
  Minus,
  Sparkles,
  Award,
  ThumbsUp,
  Settings,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, CartItem, Quote, LandingConfigs } from '../types';
import TorreForteLogo from './TorreForteLogo';

interface AndroidAppShellProps {
  products: Product[];
  cart: CartItem[];
  quotes: Quote[];
  landingConfigs: LandingConfigs;
  onAddToCart: (product: Product) => void;
  onDecreaseQuantity: (productId: string) => void;
  onRemoveFromCart: (productId: string) => void;
  onClearCart: () => void;
  onSubmitQuote: (quoteData: any) => void;
  isAdmin: boolean;
  setIsAdmin: (value: boolean) => void;
  onRequestAdminAccess: () => void;
  setAdminTab: (tab: string) => void;
  isFullscreen?: boolean;
}

export default function AndroidAppShell({
  products,
  cart,
  quotes,
  landingConfigs,
  onAddToCart,
  onDecreaseQuantity,
  onRemoveFromCart,
  onClearCart,
  onSubmitQuote,
  isAdmin,
  setIsAdmin,
  onRequestAdminAccess,
  setAdminTab,
  isFullscreen = false
}: AndroidAppShellProps) {
  const [activeTab, setActiveTab] = useState<'inicio' | 'catalogo' | 'calcular' | 'soporte'>('inicio');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isNativeCartOpen, setIsNativeCartOpen] = useState(false);
  const [selectedNativeProduct, setSelectedNativeProduct] = useState<Product | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [systemTime, setSystemTime] = useState('03:35');
  
  // States for Calculator
  const [screenSize, setScreenSize] = useState<number>(55);
  const [tvWeight, setTvWeight] = useState<number>(25);
  const [mountStyle, setMountStyle] = useState<string>('any');

  // Contact tab state
  const [checkedQuoteId, setCheckedQuoteId] = useState('');
  const [trackedQuote, setTrackedQuote] = useState<Quote | null>(null);
  
  // Submit Quote variables
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientMessage, setClientMessage] = useState('');
  const [isQuoteSuccess, setIsQuoteSuccess] = useState(false);

  // Quantity selector for the product detail sheet
  const [detailQuantity, setDetailQuantity] = useState(1);

  // Toast feedback when an item is added to the quote list
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  useEffect(() => {
    if (!toastMessage) return;
    const timeout = setTimeout(() => setToastMessage(null), 1800);
    return () => clearTimeout(timeout);
  }, [toastMessage]);

  const handleAddWithToast = (product: Product) => {
    onAddToCart(product);
    setToastMessage(`Añadido: ${product.name}`);
  };

  const openProductDetail = (product: Product) => {
    setSelectedNativeProduct(product);
    setActiveImageIndex(0);
    setDetailQuantity(1);
  };

  // Update Android simulated system time in real time
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // hour '0' should be '12'
      setSystemTime(`${hours}:${minutes} ${ampm}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const totalCartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalCartPrice = cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);

  // Filter recommendations for calculation
  const recommendationList = products.filter(prod => {
    if (mountStyle !== 'any' && prod.category !== mountStyle) return false;
    if (tvWeight > prod.maxLoad) return false;

    const regex = /(\d+)\s*"\s*-\s*(\d+)/;
    const match = prod.tvSizes.replace(/\\"/g, '"').match(regex);
    if (match) {
      const minSize = parseInt(match[1]);
      const maxSize = parseInt(match[2]);
      if (screenSize < minSize - 5 || screenSize > maxSize + 5) {
        return false;
      }
    }
    return true;
  });

  const handleTrackQuote = (e: React.FormEvent) => {
    e.preventDefault();
    const match = quotes.find(q => q.id.toUpperCase() === checkedQuoteId.trim().toUpperCase());
    setTrackedQuote(match || null);
    if (!match) {
      // If not found in memory, alert gently
      alert(`No se encontró la cotización con código: ${checkedQuoteId}`);
    }
  };

  const handleNativeSubmitQuote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !clientPhone) {
      alert("Por favor ingresa tu nombre y número de teléfono.");
      return;
    }
    onSubmitQuote({
      fullName: clientName,
      phone: clientPhone,
      email: 'correo@torreforte.bo',
      serviceType: 'Soportes de TV',
      message: clientMessage || 'Cotización desde la App Android',
      items: cart
    });
    setIsQuoteSuccess(true);
    setClientName('');
    setClientPhone('');
    setClientMessage('');
    onClearCart();
    setTimeout(() => {
      setIsQuoteSuccess(false);
      setIsNativeCartOpen(false);
    }, 4000);
  };

  const categories = ['Todos', 'fijo', 'articulado', 'techo', 'pedestal'];

  const filteredProductsByCatAndSearch = products.filter(prod => {
    const matchesCat = selectedCategory === 'Todos' || prod.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch = prod.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          prod.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          prod.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="w-full h-full bg-[#121622] flex flex-col items-center justify-start text-slate-800 relative select-none overflow-hidden">
      
      {/* Simulation UI status bars / Outer shell */}
      <div className={`w-full h-full bg-[#F4F6FB] flex flex-col justify-between shadow-2xl relative overflow-hidden select-none ${isFullscreen ? '' : 'max-w-md rounded-[36px] border-[8px] border-[#1e2333]'}`}>
        
        {/* Android Punch Hole & Top Bezel Area */}
        <div className="absolute top-0 inset-x-0 h-8 bg-[#051125] z-50 flex items-center justify-between px-6 text-white text-[11px] font-medium font-mono select-none">
          <span className="text-[10px] tracking-tight">{systemTime}</span>
          
          {/* Simulated Punch Hole Camera */}
          <div className="absolute left-1/2 -translate-x-1/2 top-1.5 w-3.5 h-3.5 rounded-full bg-slate-900 border border-slate-800"></div>
          
          <div className="flex items-center gap-1.5">
            <Wifi className="w-3 h-3 text-slate-200" />
            <span className="text-[9px] font-bold leading-none">LTE</span>
            <div className="flex items-center gap-0.5">
              <span className="text-[9px]">94%</span>
              <Battery className="w-3.5 h-3.5 text-emerald-400 rotate-90 scale-90 -mr-0.5" />
            </div>
          </div>
        </div>

        {/* Android Native Top App Bar */}
        <header className="bg-[#051125] pt-9 pb-3.5 px-4 flex items-center justify-between shadow-md z-45 text-white">
          <div className="flex items-center gap-2.5">
            <button 
              onClick={() => setIsDrawerOpen(true)}
              className="p-1.5 rounded-full hover:bg-white/10 active:scale-90 transition-transform cursor-pointer"
            >
              <Menu className="w-5 h-5 text-[#ffb780]" />
            </button>
            <div className="flex flex-col">
              <span className="text-sm font-black tracking-wide bg-gradient-to-r from-white to-orange-100 bg-clip-text text-transparent">Torre Forte</span>
              <span className="text-[8.5px] text-slate-300 uppercase tracking-widest font-semibold font-mono">Soportes & HVAC App</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Quick search input or cart */}
            <button 
              onClick={() => {
                setActiveTab('catalogo');
                setSearchQuery('');
              }}
              className="p-1.5 rounded-full hover:bg-white/10 text-slate-200 cursor-pointer"
              title="Buscar en catálogo"
            >
              <Search className="w-4.5 h-4.5" />
            </button>
            
            {/* Native active cart budget triggers bottom sheet */}
            <button 
              onClick={() => setIsNativeCartOpen(true)}
              className="p-1.5 rounded-full hover:bg-white/10 text-[#ffb780] relative cursor-pointer"
            >
              <ShoppingCart className="w-4.5 h-4.5" />
              {totalCartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-[#C67C3E] text-white text-[8px] font-bold h-4 w-4 rounded-full flex items-center justify-center border border-[#051125] animate-pulse">
                  {totalCartCount}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Dynamic Android Drawer Menu */}
        <AnimatePresence>
          {isDrawerOpen && (
            <>
              {/* Overlay Backdrop */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsDrawerOpen(false)}
                className="absolute inset-0 bg-black z-50"
              />
              {/* Drawer Content */}
              <motion.div 
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                className="absolute left-0 top-0 bottom-0 w-[280px] bg-white z-50 flex flex-col justify-between shadow-2xl rounded-r-2xl overflow-hidden"
              >
                <div>
                  {/* Drawer Header (Material Style) */}
                  <div className="bg-[#051125] p-5 pt-10 text-white flex flex-col gap-3 relative border-b border-[#C67C3E]/20">
                    <button 
                      onClick={() => setIsDrawerOpen(false)}
                      className="absolute top-10 right-4 text-slate-400 hover:text-white p-1"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    
                    <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center p-2.5">
                      <TorreForteLogo className="w-full h-full text-white" />
                    </div>
                    <div>
                      <h4 className="text-base font-extrabold text-white">Torre Forte S.R.L.</h4>
                      <p className="text-[10px] text-slate-300 font-mono">APP MOVIL OFICIAL • BOLIVIA</p>
                    </div>
                  </div>

                  {/* Drawer Links */}
                  <div className="p-4 space-y-1">
                    <p className="text-[10px] text-slate-400 font-semibold tracking-wider px-3 uppercase mb-2">Servicios Clientes</p>
                    
                    <button 
                      onClick={() => { setActiveTab('inicio'); setIsDrawerOpen(false); }}
                      className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-lg text-xs font-semibold transition-all ${activeTab === 'inicio' ? 'bg-[#C67C3E]/10 text-[#C67C3E]' : 'text-slate-700 hover:bg-slate-50'}`}
                    >
                      <Home className="w-4.5 h-4.5" />
                      <span>Pantalla de Inicio</span>
                    </button>

                    <button 
                      onClick={() => { setActiveTab('catalogo'); setIsDrawerOpen(false); }}
                      className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-lg text-xs font-semibold transition-all ${activeTab === 'catalogo' ? 'bg-[#C67C3E]/10 text-[#C67C3E]' : 'text-slate-700 hover:bg-slate-50'}`}
                    >
                      <Package className="w-4.5 h-4.5" />
                      <span>Catálogo de Soportes</span>
                    </button>

                    <button 
                      onClick={() => { setActiveTab('calcular'); setIsDrawerOpen(false); }}
                      className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-lg text-xs font-semibold transition-all ${activeTab === 'calcular' ? 'bg-[#C67C3E]/10 text-[#C67C3E]' : 'text-slate-700 hover:bg-slate-50'}`}
                    >
                      <Calculator className="w-4.5 h-4.5" />
                      <span>Calculador de Soporte Ideal</span>
                    </button>

                    <button 
                      onClick={() => { setActiveTab('soporte'); setIsDrawerOpen(false); }}
                      className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-lg text-xs font-semibold transition-all ${activeTab === 'soporte' ? 'bg-[#C67C3E]/10 text-[#C67C3E]' : 'text-slate-700 hover:bg-slate-50'}`}
                    >
                      <MapPin className="w-4.5 h-4.5" />
                      <span>Contacto y Cotización ID</span>
                    </button>

                    <div className="h-px bg-slate-100 my-4" />

                    <p className="text-[10px] text-slate-400 font-semibold tracking-wider px-3 uppercase mb-2">Administración</p>
                    
                    <button
                      onClick={() => {
                        onRequestAdminAccess();
                        setIsDrawerOpen(false);
                      }}
                      className="w-full flex items-center gap-3.5 px-3.5 py-3 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      <Settings className="w-4.5 h-4.5 text-zinc-500" />
                      <span>Acceso Panel de Caja</span>
                    </button>
                  </div>
                </div>

                {/* Drawer Footer Information */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-500 font-mono">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="font-semibold text-slate-700">App Conectada (StandAlone)</span>
                  </div>
                  <span>v1.0.4 • © {new Date().getFullYear()} Torre Forte</span>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Scrollable Center Content Screen */}
        <div id="android-scroll-container" className="flex-grow overflow-y-auto no-scrollbar pb-6 bg-[#ebedf3] relative">
          
          <AnimatePresence mode="wait">
            
            {/* VIEW TAB 0: HOME INICIO */}
            {activeTab === 'inicio' && (
              <motion.div 
                key="tab-inicio"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
                className="space-y-4 pt-3.5 px-3.5"
              >
                {/* 1. Welcome Card Banner */}
                <div className="relative rounded-2xl bg-gradient-to-br from-[#1B263B] to-[#051125] p-5 text-white shadow-md overflow-hidden border border-white/5">
                  <div className="absolute right-[-15px] bottom-[-20px] opacity-10 pointer-events-none scale-150">
                    <TorreForteLogo className="w-32 h-32 text-white" />
                  </div>
                  
                  {/* Subtle Spark capsule */}
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#C67C3E]/20 text-[#ffb780] text-[9px] uppercase tracking-wider font-mono font-bold border border-[#C67C3E]/30 mb-2.5">
                    <Flame className="w-3 h-3 text-[#C67C3E] animate-pulse" />
                    Soportes Premium Bolivia
                  </div>
                  
                  <h3 className="text-base font-extrabold text-white leading-snug">
                    Ingeniería de Soportes para TV de Alta Resistencia
                  </h3>
                  
                  <p className="text-[11px] text-slate-300 mt-1.5 leading-relaxed font-light">
                    Fabricación boliviana en acero certificado. Garantía escrita de 5 años. Soporte express disponible.
                  </p>
                  
                  <div className="mt-4 flex items-center justify-between gap-2">
                    <button 
                      onClick={() => setActiveTab('catalogo')}
                      className="bg-[#C67C3E] hover:bg-[#b06a30] text-white font-bold text-[11px] px-3.5 py-1.5 rounded-lg shadow-sm transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                    >
                      <span>Ver Catálogo</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                    
                    <div className="flex items-center gap-1.5 font-mono text-[9px] text-[#ffb780] font-bold">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 inline" />
                      <span>Norma ASTM-A36</span>
                    </div>
                  </div>
                </div>

                {/* 2. Fast Navigation Bento Matrix (2 columns x 2 rows) */}
                <div className="grid grid-cols-2 gap-2.5">
                  {/* Action 1: TV Bracket Calculator */}
                  <div 
                    onClick={() => setActiveTab('calcular')}
                    className="p-3 bg-white hover:bg-slate-50 border border-slate-200/60 rounded-2xl shadow-sm cursor-pointer flex flex-col justify-between h-[96px] active:scale-98 transition-all"
                  >
                    <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#C67C3E]">
                      <Calculator className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <h4 className="text-[11.5px] font-bold text-slate-800">Calcular Pulgadas</h4>
                      <p className="text-[9px] text-slate-400 mt-0.5">Asistente de Peso y Altura</p>
                    </div>
                  </div>

                  {/* Action 2: Catalogo Soportes */}
                  <div 
                    onClick={() => setActiveTab('catalogo')}
                    className="p-3 bg-white hover:bg-slate-50 border border-slate-200/60 rounded-2xl shadow-sm cursor-pointer flex flex-col justify-between h-[96px] active:scale-98 transition-all"
                  >
                    <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
                      <Package className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <h4 className="text-[11.5px] font-bold text-slate-800">Catálogo de Soportes</h4>
                      <p className="text-[9px] text-slate-400 mt-0.5">{products.length} productos en stock</p>
                    </div>
                  </div>

                  {/* Action 3: Contacto / Coordenadas */}
                  <div 
                    onClick={() => setActiveTab('soporte')}
                    className="p-3 bg-white hover:bg-slate-50 border border-slate-200/60 rounded-2xl shadow-sm cursor-pointer flex flex-col justify-between h-[96px] active:scale-98 transition-all"
                  >
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                      <MapPin className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <h4 className="text-[11.5px] font-bold text-slate-800">Contacto / Tiendas</h4>
                      <p className="text-[9px] text-slate-400 mt-0.5">La Paz, SC, Cbba</p>
                    </div>
                  </div>

                  {/* Action 4: Soporte Tecnico WhatsApp */}
                  <a 
                    href="https://wa.me/59171611090"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-white hover:bg-slate-50 border border-slate-200/60 rounded-2xl shadow-sm cursor-pointer flex flex-col justify-between h-[96px] active:scale-98 transition-all"
                  >
                    <div className="w-8 h-8 rounded-xl bg-[#25D366]/10 border border-[#25D366]/20 flex items-center justify-center text-[#25D366]">
                      <MessageSquare className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <h4 className="text-[11.5px] font-bold text-slate-800">Soporte Técnico</h4>
                      <p className="text-[9px] text-slate-400 mt-0.5">Consultas Directas WhatsApp</p>
                    </div>
                  </a>
                </div>

                {/* 3. Metric highlights (capsules) */}
                <div className="bg-slate-100/80 rounded-2xl p-3 border border-slate-200/40 grid grid-cols-3 gap-2 text-center text-slate-700">
                  <div className="flex flex-col items-center border-r border-slate-200/60 last:border-0 pr-1">
                    <span className="text-[13px] font-black text-[#C67C3E] leading-shorter">12Mil+</span>
                    <span className="text-[8px] text-slate-500 uppercase tracking-widest font-mono font-medium">Instalados</span>
                  </div>
                  <div className="flex flex-col items-center border-r border-slate-200/60 last:border-0 px-1">
                    <span className="text-[13px] font-black text-sky-600 leading-shorter">ASTM-36</span>
                    <span className="text-[8px] text-slate-500 uppercase tracking-widest font-mono font-medium">Acero</span>
                  </div>
                  <div className="flex flex-col items-center last:border-0 pl-1">
                    <span className="text-[13px] font-black text-emerald-600 leading-shorter">5 Años</span>
                    <span className="text-[8px] text-slate-500 uppercase tracking-widest font-mono font-medium">Garantías</span>
                  </div>
                </div>

                {/* 4. Products Featured Slider Header */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <h4 className="text-[12.5px] font-extrabold text-slate-800 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#C67C3E]" />
                      Soportes Destacados
                    </h4>
                    <button 
                      onClick={() => setActiveTab('catalogo')}
                      className="text-[10px] text-[#C67C3E] hover:underline font-bold"
                    >
                      Ver Todo
                    </button>
                  </div>

                  {/* Horizontal Scroll Product List */}
                  <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1.5 px-0.5 snap-x">
                    {products.slice(0, 4).map(prod => (
                      <div 
                        key={prod.id}
                        onClick={() => openProductDetail(prod)}
                        className="bg-white border border-slate-200/70 p-2.5 rounded-2xl w-[136px] flex-shrink-0 snap-start shadow-sm hover:shadow-md transition-all cursor-pointer relative"
                      >
                        {/* Perfect Square Thumbnail constraint (avoid cropped top/bottom) */}
                        <div className="w-full aspect-square rounded-xl overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center">
                          <img 
                            src={prod.image} 
                            alt={prod.name} 
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        
                        <div className="mt-2 text-left space-y-0.5">
                          <span className="text-[8px] bg-sky-50 border border-sky-100/50 text-sky-700 px-1 py-0.2 rounded font-bold font-mono">
                            {prod.sku}
                          </span>
                          <h5 className="text-[10px] font-extrabold text-slate-800 truncate" title={prod.name}>
                            {prod.name}
                          </h5>
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[10px] font-black text-slate-900 font-mono">
                              Bs.{prod.price}
                            </span>
                            <span className="text-[8.5px] text-slate-400 font-bold">
                              {prod.tvSizes}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 5. App Promo Feature: Mobile App exclusive */}
                <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-100 rounded-2xl p-4 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-[#051125]">Envío Express y Facturación Gratis</h5>
                    <p className="text-[10px] text-slate-600 mt-0.5 leading-relaxed">
                      Todas tus cotizaciones enviadas a través de este módulo reciben atención prioritaria 24/7 y cálculo de flete sin costo para toda Bolivia.
                    </p>
                  </div>
                </div>

              </motion.div>
            )}

            {/* VIEW TAB 1: CATALOGO */}
            {activeTab === 'catalogo' && (
              <motion.div 
                key="tab-catalogo"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
                className="space-y-3 pt-3 px-3"
              >
                {/* Search Bar Capsule */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
                  <input 
                    type="text"
                    placeholder="Buscador por modelo o código SKU..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-full pl-10 pr-4 py-2 text-xs focus:ring-1 focus:ring-[#C67C3E] focus:outline-none focus:border-[#C67C3E] placeholder-slate-400 shadow-sm transition-all"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3.5 top-2 hover:bg-slate-100 text-slate-400 p-0.5 rounded-full"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Category tags horizontal carousel */}
                <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1 px-0.5">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`text-[10px] font-bold px-3 py-1.5 rounded-full whitespace-nowrap transition-all border cursor-pointer ${
                        selectedCategory === cat 
                          ? 'bg-[#051125] text-white border-[#051125]' 
                          : 'bg-white text-slate-600 border-slate-200/80 hover:bg-slate-50'
                      }`}
                    >
                      {cat === 'Todos' ? '⚙️ Todos' : cat.toUpperCase()}
                    </button>
                  ))}
                </div>

                {/* Inventory level title */}
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono font-bold px-1 uppercase tracking-wider">
                  <span>Productos Disponibles</span>
                  <span>{filteredProductsByCatAndSearch.length} Encontrados</span>
                </div>

                {/* Vertical Native List layout */}
                <div className="space-y-2.5">
                  {filteredProductsByCatAndSearch.length === 0 ? (
                    <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-slate-400 flex flex-col items-center gap-2">
                      <Info className="w-8 h-8 text-slate-300" />
                      <p className="text-xs font-bold font-sans">No se encontraron productos</p>
                      <button 
                        onClick={() => { setSelectedCategory('Todos'); setSearchQuery(''); }}
                        className="text-xs text-[#C67C3E] font-bold mt-1"
                      >
                        Limpiar filtros
                      </button>
                    </div>
                  ) : (
                    filteredProductsByCatAndSearch.map(prod => (
                      <div 
                        key={prod.id}
                        onClick={() => openProductDetail(prod)}
                        className="bg-white border border-slate-200/60 p-3 rounded-2xl flex gap-3 shadow-xs hover:shadow-sm hover:border-[#C67C3E]/30 transition-all cursor-pointer relative group active:scale-[0.99]"
                      >
                        {/* Thumbnail - Image perfect square constraint */}
                        <div className="w-[84px] h-[84px] rounded-xl overflow-hidden bg-slate-50 border border-slate-100 flex-shrink-0 flex items-center justify-center">
                          <img 
                            src={prod.image} 
                            alt={prod.name} 
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 animate-fade-in"
                          />
                        </div>

                        {/* Text Metadata summary */}
                        <div className="flex-grow flex flex-col justify-between text-left min-w-0">
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[8px] bg-zinc-100 border border-zinc-200 font-mono font-bold text-slate-600 px-1 py-0.2 rounded">
                                {prod.sku}
                              </span>
                              <span className="text-[8px] bg-amber-50 text-amber-700 font-bold uppercase tracking-wider px-1 py-0.2 rounded">
                                {prod.category}
                              </span>
                            </div>
                            <h4 className="text-[11.5px] font-extrabold text-slate-800 mt-1 lines-clamp-2 leading-snug">
                              {prod.name}
                            </h4>
                            <p className="text-[9.5px] text-slate-400 truncate mt-0.5" title={prod.description}>
                              {prod.description}
                            </p>
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <span className="text-xs font-black text-rose-700 font-mono">
                              Bs. {prod.price}
                            </span>
                            <span className="text-[9px] font-mono text-slate-500 font-bold bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                              🔩 {prod.tvSizes}
                            </span>
                          </div>
                        </div>

                        {/* Add to list trigger inside item card */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddWithToast(prod);
                          }}
                          type="button"
                          className="absolute right-3.5 top-3.5 bg-[#C67C3E] hover:bg-[#a6622b] text-white p-1 rounded-lg shadow-sm transition-colors cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

              </motion.div>
            )}

            {/* VIEW TAB 2: CALCULADORA */}
            {activeTab === 'calcular' && (
              <motion.div 
                key="tab-calcular"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
                className="space-y-4 pt-4 px-3"
              >
                {/* Android Native Sizer Panel */}
                <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-sm text-left">
                  <div className="flex items-center gap-1 text-[#ffb780] bg-[#051125] text-[9px] font-bold font-mono tracking-widest uppercase rounded-full px-2.5 py-1 inline-flex">
                    <Sparkles className="w-3 h-3 text-[#ffb780]" />
                    Compatibilidad Inteligente
                  </div>
                  
                  <h3 className="text-sm font-bold text-slate-800 mt-2">Calculadora de Soporte Ideal</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Modula las dimensiones de tu TV para calcular el nivel de resistencia del acero ASTM-A36 necesario.
                  </p>

                  <div className="mt-4 space-y-4">
                    {/* Size Slider element */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-bold">
                        <span className="text-slate-600">Tamaño del TV:</span>
                        <span className="text-[#C67C3E] font-mono font-extrabold">{screenSize} pulgadas (")</span>
                      </div>
                      <input 
                        type="range"
                        min="24"
                        max="98"
                        value={screenSize}
                        onChange={(e) => setScreenSize(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-orange-200 border border-orange-300/60 rounded-lg appearance-none cursor-pointer accent-[#C67C3E]"
                      />
                      <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                        <span>24" (Monitor)</span>
                        <span>55" (Mediano)</span>
                        <span>85"+ (Gigante)</span>
                      </div>
                    </div>

                    {/* Weight Slider element */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-bold">
                        <span className="text-slate-600">Peso de Montaje:</span>
                        <span className="text-sky-600 font-mono font-extrabold">{tvWeight} Kilogramos (Kg)</span>
                      </div>
                      <input 
                        type="range"
                        min="5"
                        max="90"
                        value={tvWeight}
                        onChange={(e) => setTvWeight(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-sky-200 border border-sky-300/60 rounded-lg appearance-none cursor-pointer accent-sky-500"
                      />
                      <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                        <span>5 kg (Liviana)</span>
                        <span>30 kg (Estándar)</span>
                        <span>80 kg (Pesada)</span>
                      </div>
                    </div>

                    {/* Format Filter Option */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600">Preferencia de Movimiento:</label>
                      <select 
                        value={mountStyle}
                        onChange={(e) => setMountStyle(e.target.value)}
                        className="w-full bg-[#ebedf3] border border-slate-200 text-slate-800 text-xs rounded-xl p-2 font-semibold focus:outline-none focus:border-[#C67C3E]"
                      >
                        <option value="any">Cualquier Tipo de Soporte</option>
                        <option value="articulado">Articulado (Giro e inclinación)</option>
                        <option value="fijo">Fijo (De pared plano)</option>
                        <option value="techo">De Techo (Suspensión)</option>
                        <option value="pedestal">Pedestal Móvil (Con ruedas)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Calculated Recommended items results */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1 px-1">
                    <span className="text-[11.5px] font-black text-[#051125] uppercase tracking-wide">
                      🎖️ Modelos Recomendados ({recommendationList.length})
                    </span>
                  </div>

                  <div className="space-y-2">
                    {recommendationList.length === 0 ? (
                      <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 text-center text-[11px] text-orange-900 leading-snug">
                        ⚠️ No disponemos de soportes estándar en stock para un peso superior a {tvWeight} Kg y tamaño {screenSize}". Considera contactar a nuestro equipo de diseño metalmecánico para un anclaje a medida.
                      </div>
                    ) : (
                      recommendationList.slice(0, 3).map(prod => (
                        <div 
                          key={prod.id}
                          onClick={() => openProductDetail(prod)}
                          className="bg-white border border-slate-200/60 p-2.5 rounded-2xl flex gap-3 shadow-xs items-center justify-between cursor-pointer active:scale-99 transition-transform"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-11 h-11 bg-slate-50 border border-slate-100 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center">
                              <img src={prod.image} alt={prod.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="text-left min-w-0">
                              <span className="text-[8px] bg-sky-50 text-sky-700 font-mono font-bold px-1 rounded">SKU: {prod.sku}</span>
                              <h4 className="text-[11px] font-bold text-slate-800 truncate leading-snug">{prod.name}</h4>
                              <p className="text-[9px] text-emerald-600 font-semibold font-mono">Carga Máxima: {prod.maxLoad} Kg (ASTM-A36)</p>
                            </div>
                          </div>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddWithToast(prod);
                            }}
                            className="bg-[#C67C3E] hover:bg-[#ab662e] text-white font-mono font-black text-[10px] px-2.5 py-1.5 rounded-lg whitespace-nowrap active:scale-95 cursor-pointer flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            Añadir Bs.{prod.price}
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </motion.div>
            )}

            {/* VIEW TAB 3: CONTACTO / TRACK Soportes */}
            {activeTab === 'soporte' && (
              <motion.div 
                key="tab-soporte"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
                className="space-y-4 pt-4 px-3"
              >
                {/* Form to query quote status */}
                <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm text-left">
                  <h4 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                    <span className="bg-[#C67C3E]/10 p-1 rounded text-[#C67C3E]">🧾</span>
                    Rastreador de Cotización
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-0.5 bg-slate-50 p-2 rounded">
                    Consulta el estado de tu cotización en tiempo real. Ingresa tu ID (ej: COT-101, COT-512, etc.) administrado por el operador.
                  </p>
                  
                  <form onSubmit={handleTrackQuote} className="mt-3.5 flex gap-2">
                    <input 
                      type="text"
                      placeholder="Ingresa código (ej: COT-101)"
                      value={checkedQuoteId}
                      onChange={(e) => setCheckedQuoteId(e.target.value)}
                      className="flex-grow bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:ring-1 focus:ring-[#C67C3E] focus:outline-none placeholder-slate-400 font-mono"
                    />
                    <button 
                      type="submit"
                      className="bg-[#051125] text-white font-bold text-xs px-3.5 py-1.5 rounded-xl hover:bg-slate-800 active:scale-95 cursor-pointer"
                    >
                      Buscar
                    </button>
                  </form>

                  {/* Tracking result */}
                  {trackedQuote && (
                    <div className="mt-4 p-3 bg-[#051125] text-white rounded-xl space-y-1.5 border border-white/5 font-sans">
                      <div className="flex justify-between items-center text-[10px] border-b border-white/10 pb-1">
                        <span className="font-bold text-[#ffb780] font-mono">ID: {trackedQuote.id}</span>
                        <span>{trackedQuote.date}</span>
                      </div>
                      <div className="text-xs font-medium">Cliente: <span className="font-bold">{trackedQuote.fullName}</span></div>
                      
                      <div className="flex items-center gap-1.5 py-0.5">
                        <span className="text-[10px] text-slate-400">Estado Petición:</span>
                        <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full ${
                          trackedQuote.status === 'Completado' 
                            ? 'bg-emerald-500/20 text-emerald-300' 
                            : trackedQuote.status === 'Asignado' 
                            ? 'bg-sky-500/20 text-sky-300' 
                            : 'bg-yellow-500/10 text-yellow-300'
                        }`}>
                          {trackedQuote.status}
                        </span>
                      </div>

                      {trackedQuote.assignedTechnician && (
                        <p className="text-[10px] text-slate-300 font-mono leading-tight bg-white/5 p-1.5 rounded">
                          👤 Técnico: {trackedQuote.assignedTechnician}
                        </p>
                      )}

                      {trackedQuote.technicianNotes && (
                        <p className="text-[10px] text-slate-300 leading-relaxed italic bg-white/5 p-1.5 rounded">
                          🗒️ Glosa: "{trackedQuote.technicianNotes}"
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Coordinate details of administrative centers */}
                <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-sm text-left space-y-3.5">
                  <h4 className="text-xs font-black text-[#051125] flex items-center gap-1 px-0.5 border-b border-slate-100 pb-1.5">
                    🏢 Centros Operativos & Matriz
                  </h4>

                  <div className="space-y-3">
                    <div className="flex items-start gap-2.5">
                      <MapPin className="w-4 h-4 text-[#C67C3E] flex-shrink-0 mt-0.5" />
                      <div>
                        <h5 className="text-[11.5px] font-bold text-slate-800">Oficina Principal (Santa Cruz)</h5>
                        <p className="text-[10px] text-slate-500 leading-normal mt-0.5">
                          {landingConfigs.aboutLocationDesc || 'Av. Banzer Km 8, Santa Cruz de la Sierra - Bolivia.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <Calendar className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h5 className="text-[11.5px] font-bold text-slate-800">Horarios de Atención Planta</h5>
                        <p className="text-[10px] text-slate-500 leading-normal mt-0.5">
                          {landingConfigs.aboutHoursDesc || 'Lunes a Viernes: 08:30 - 18:30 | Sábados: 09:00 - 13:00'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <Smartphone className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h5 className="text-[11.5px] font-bold text-slate-800">Líneas de Presupuestos Directos</h5>
                        <a
                          href="https://wa.me/59171611090"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] font-semibold text-emerald-700 font-mono mt-0.5 underline underline-offset-2 inline-block"
                        >
                          Cel/WhatsApp: +591 71611090
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Android Material Bottom Navigation Bar */}
        <nav className="bg-white border-t border-slate-200/80 py-1.5 px-3 flex justify-around items-center h-14 shadow-md z-40 select-none">
          <button 
            onClick={() => setActiveTab('inicio')}
            className={`flex flex-col items-center justify-center gap-1 py-1 w-14 transition-all relative cursor-pointer ${
              activeTab === 'inicio' ? 'text-[#C67C3E]' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[8px] font-bold tracking-tight">Inicio</span>
            {activeTab === 'inicio' && (
              <motion.span layoutId="activeDot" className="absolute bottom-0 w-1 h-1 bg-[#C67C3E] rounded-full"></motion.span>
            )}
          </button>

          <button 
            onClick={() => setActiveTab('catalogo')}
            className={`flex flex-col items-center justify-center gap-1 py-1 w-14 transition-all relative cursor-pointer ${
              activeTab === 'catalogo' ? 'text-[#C67C3E]' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Package className="w-5 h-5" />
            <span className="text-[8px] font-bold tracking-tight">Catálogo</span>
            {activeTab === 'catalogo' && (
              <motion.span layoutId="activeDot" className="absolute bottom-0 w-1 h-1 bg-[#C67C3E] rounded-full"></motion.span>
            )}
          </button>

          <button 
            onClick={() => setActiveTab('calcular')}
            className={`flex flex-col items-center justify-center gap-1 py-1 w-14 transition-all relative cursor-pointer ${
              activeTab === 'calcular' ? 'text-[#C67C3E]' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Calculator className="w-5 h-5" />
            <span className="text-[8px] font-bold tracking-tight">Calcular</span>
            {activeTab === 'calcular' && (
              <motion.span layoutId="activeDot" className="absolute bottom-0 w-1 h-1 bg-[#C67C3E] rounded-full"></motion.span>
            )}
          </button>

          <button 
            onClick={() => setActiveTab('soporte')}
            className={`flex flex-col items-center justify-center gap-1 py-1 w-14 transition-all relative cursor-pointer ${
              activeTab === 'soporte' ? 'text-[#C67C3E]' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <MapPin className="w-5 h-5" />
            <span className="text-[8px] font-bold tracking-tight">Contacto</span>
            {activeTab === 'soporte' && (
              <motion.span layoutId="activeDot" className="absolute bottom-0 w-1 h-1 bg-[#C67C3E] rounded-full"></motion.span>
            )}
          </button>
        </nav>

        {/* BOTTOM SHEET 1: Cart / Cotizar Checkout */}
        <AnimatePresence>
          {isNativeCartOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsNativeCartOpen(false)}
                className="absolute inset-0 bg-black z-50 rounded-[30px]"
              />
              <motion.div 
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 20, stiffness: 200 }}
                className="absolute bottom-0 inset-x-0 max-h-[85%] bg-white rounded-t-3xl shadow-2xl z-50 flex flex-col justify-between overflow-hidden"
              >
                {/* Header bottom sheet */}
                <div className="bg-[#051125] p-4 text-white flex justify-between items-center border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-[#ffb780]" />
                    <h4 className="text-xs font-extrabold">Ficha de Cotización ({totalCartCount})</h4>
                  </div>
                  <button 
                    onClick={() => setIsNativeCartOpen(false)}
                    className="p-1 rounded-full hover:bg-white/10 text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* List inside bottom sheet */}
                <div className="flex-grow p-4 overflow-y-auto space-y-4 text-slate-700">
                  {isQuoteSuccess ? (
                    <div className="py-8 text-center space-y-3">
                      <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto scale-110 animate-bounce">
                        <CheckCircle2 className="w-8 h-8" />
                      </div>
                      <h4 className="text-sm font-black text-[#051125]">¡Presupuesto Enviado Correctamente!</h4>
                      <p className="text-[11px] text-slate-500 leading-normal max-w-xs mx-auto">
                        Tu solicitud de cotización fue registrada por el sistema de planificación Torre Forte. En breves minutos te contactaremos vía telefónica o WhatsApp para agendar la instalación física.
                      </p>
                    </div>
                  ) : cart.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-2">
                      <ShoppingCart className="w-10 h-10 text-slate-300 animate-pulse" />
                      <p className="text-xs font-bold font-sans">Tu lista de presupuesto está vacía</p>
                      <button 
                        onClick={() => { setIsNativeCartOpen(false); setActiveTab('catalogo'); }}
                        className="text-xs text-[#C67C3E] font-extrabold underline mt-1"
                      >
                        Ir al catálogo de productos
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Products chosen */}
                      <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                        {cart.map(item => (
                          <div 
                            key={item.product.id}
                            className="bg-slate-50 border border-slate-200/50 p-2 rounded-xl flex justify-between items-center"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-9 h-9 rounded-lg bg-white border overflow-hidden flex items-center justify-center flex-shrink-0">
                                <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                              </div>
                              <div className="text-left min-w-0">
                                <h5 className="text-[10px] font-bold text-slate-800 truncate">{item.product.name}</h5>
                                <p className="text-[9px] text-[#C67C3E] font-bold font-mono">Bs. {item.product.price} c/u</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                              <button 
                                onClick={() => onDecreaseQuantity(item.product.id)}
                                className="w-5 h-5 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-50 font-bold font-mono text-xs cursor-pointer"
                              >
                                <Minus className="w-2.5 h-2.5" />
                              </button>
                              <span className="text-[10px] font-mono font-black text-slate-800 w-3 text-center">{item.quantity}</span>
                              <button 
                                onClick={() => onAddToCart(item.product)}
                                className="w-5 h-5 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-50 font-bold font-mono text-xs cursor-pointer"
                              >
                                <Plus className="w-2.5 h-2.5" />
                              </button>

                              <button 
                                onClick={() => onRemoveFromCart(item.product.id)}
                                className="ml-1 text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="h-px bg-slate-100 my-2" />

                      {/* Cumulative Pricing */}
                      <div className="bg-slate-100/60 p-3 rounded-xl border border-slate-200/50 flex justify-between items-center text-slate-800">
                        <span className="text-[11px] font-bold uppercase tracking-wide">Valor de Cotización:</span>
                        <span className="text-sm font-black text-rose-700 font-mono">Bs. {totalCartPrice.toLocaleString()}</span>
                      </div>

                      {/* Shipping / response time reassurance */}
                      <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-semibold rounded-xl p-2.5 flex items-center gap-2">
                        <span>🚚</span>
                        <span>Envío gratis a toda Bolivia. Te contactaremos en menos de 2 horas hábiles.</span>
                      </div>

                      {/* Continue shopping without losing the cart */}
                      <button
                        type="button"
                        onClick={() => { setIsNativeCartOpen(false); setActiveTab('catalogo'); }}
                        className="w-full text-xs text-[#C67C3E] font-extrabold underline text-center cursor-pointer"
                      >
                        Seguir Comprando
                      </button>

                      {/* User submission details form */}
                      <form onSubmit={handleNativeSubmitQuote} className="space-y-3.5 text-left pt-2">
                        <h5 className="text-[11px] font-black uppercase text-[#051125] border-b pb-1">📄 Registro del Solicitante</h5>
                        
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-600 uppercase">Nombre Completo *</label>
                          <input 
                            type="text"
                            required
                            placeholder="Nombre y Apellidos"
                            value={clientName}
                            onChange={(e) => setClientName(e.target.value)}
                            className="w-full bg-[#f4f6fb] border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:ring-1 focus:ring-[#C67C3E] focus:outline-none placeholder-slate-400"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-600 uppercase">Número telefónico / Celular *</label>
                          <input 
                            type="tel"
                            required
                            placeholder="Ej: +591 71611090"
                            value={clientPhone}
                            onChange={(e) => setClientPhone(e.target.value)}
                            className="w-full bg-[#f4f6fb] border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:ring-1 focus:ring-[#C67C3E] focus:outline-none placeholder-slate-400 font-mono"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-600 uppercase">Mensaje o Indicaciones de obra</label>
                          <textarea 
                            placeholder="Indicaciones adicionales de la pared (concreto, drywall, etc.)"
                            value={clientMessage}
                            rows={2}
                            onChange={(e) => setClientMessage(e.target.value)}
                            className="w-full bg-[#f4f6fb] border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:ring-1 focus:ring-[#C67C3E] focus:outline-none placeholder-slate-400 resize-none"
                          />
                        </div>

                        {/* Submit budget */}
                        <button 
                          type="submit"
                          className="w-full bg-[#C67C3E] hover:bg-[#ac652b] text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <span>Solicitar Presupuesto Directo</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </form>
                    </>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* BOTTOM SHEET 2: SPEC DETAILED SHEET FOR PRODUCTS */}
        <AnimatePresence>
          {selectedNativeProduct && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedNativeProduct(null)}
                className="absolute inset-0 bg-black z-50 rounded-[30px]"
              />
              <motion.div 
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 20, stiffness: 220 }}
                className="absolute bottom-0 inset-x-0 max-h-[90%] bg-white rounded-t-3xl shadow-2xl z-50 flex flex-col justify-between overflow-hidden text-slate-800"
              >
                {/* Header technical spec */}
                <div className="bg-[#051125] p-4 text-white flex justify-between items-center border-b border-[#C67C3E]/20">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] bg-sky-600 font-mono font-bold text-white px-2 py-0.5 rounded-sm">
                      {selectedNativeProduct.sku}
                    </span>
                    <h4 className="text-xs font-black">Ficha Técnica de Ingeniería</h4>
                  </div>
                  <button 
                    onClick={() => setSelectedNativeProduct(null)}
                    className="p-1 rounded-full hover:bg-white/10 text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Main scroll details */}
                <div className="flex-grow p-4 overflow-y-auto space-y-4 text-left">
                  {/* Photo slider with indicators */}
                  {(() => {
                    const imagesList = selectedNativeProduct.images?.filter(Boolean) || [];
                    const allImages = imagesList.length > 0 ? imagesList : [selectedNativeProduct.image];
                    const currentImg = allImages[activeImageIndex] || selectedNativeProduct.image;

                    return (
                      <div className="space-y-2">
                        {/* Perfect Square Container Constraint */}
                        <div className="w-full aspect-square border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 flex items-center justify-center">
                          <img 
                            referrerPolicy="no-referrer"
                            src={currentImg} 
                            alt={selectedNativeProduct.name} 
                            className="w-full h-full object-cover transition-all"
                          />
                        </div>

                        {/* Thumbnail buttons */}
                        {allImages.length > 1 && (
                          <div className="flex justify-center gap-1.5">
                            {allImages.map((imgUrl, index) => (
                              <button
                                key={index}
                                onClick={() => setActiveImageIndex(index)}
                                className={`w-10 h-10 rounded-lg overflow-hidden border cursor-pointer transition-all ${
                                  activeImageIndex === index 
                                    ? 'border-[#C67C3E] ring-1 ring-[#C67C3E]' 
                                    : 'border-slate-200 hover:border-slate-300'
                                }`}
                              >
                                <img src={imgUrl} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Title & Stats description */}
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-800 leading-tight">{selectedNativeProduct.name}</h3>
                    <p className="text-[10px] text-slate-400 mt-1 uppercase font-mono tracking-widest leading-none font-bold">
                      Categoría: {selectedNativeProduct.category}
                    </p>
                    <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
                      {selectedNativeProduct.description}
                    </p>
                  </div>

                  {/* High-Contrast Info Grid element */}
                  <div className="grid grid-cols-2 gap-2 text-slate-700">
                    <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl text-left">
                      <span className="text-[8.5px] text-slate-400 uppercase font-mono tracking-wider block font-bold">Rango Soporta:</span>
                      <span className="text-xs font-extrabold text-[#051125] block mt-0.5">{selectedNativeProduct.tvSizes}</span>
                    </div>

                    <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl text-left">
                      <span className="text-[8.5px] text-slate-400 uppercase font-mono tracking-wider block font-bold">Carga Certificada:</span>
                      <span className="text-xs font-extrabold text-emerald-600 block mt-0.5">{selectedNativeProduct.maxLoad > 0 ? `${selectedNativeProduct.maxLoad} Kg` : 'Proyectos'}</span>
                    </div>

                    <div className="bg-slate-50 border border-slate-100 col-span-2 p-2.5 rounded-xl text-left">
                      <span className="text-[8.5px] text-slate-400 uppercase font-mono tracking-wider block font-bold">Componentes:</span>
                      <span className="text-xs font-bold text-slate-700 block mt-0.5 truncate">{selectedNativeProduct.material}</span>
                    </div>
                  </div>

                  {/* Pricing capsule details */}
                  <div className="bg-slate-100/60 p-3 rounded-2xl border border-slate-200/50 flex justify-between items-center">
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Precio Oficial</span>
                      <span className="text-base font-black text-rose-700 font-mono">Bs. {selectedNativeProduct.price}</span>
                    </div>
                    <div className="text-[9px] text-slate-400 text-right">
                      <p className="font-bold underline text-[#C67C3E]">Impuestos Incluidos</p>
                      <p className="font-mono mt-0.5">Emitimos Factura de ley</p>
                    </div>
                  </div>

                  {/* Quantity selector */}
                  <div className="bg-white border border-slate-200 p-3 rounded-2xl flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-wide">Cantidad</span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setDetailQuantity(q => Math.max(1, q - 1))}
                        className="w-7 h-7 bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-200 active:scale-95 cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-sm font-black text-slate-800 font-mono w-5 text-center">{detailQuantity}</span>
                      <button
                        onClick={() => setDetailQuantity(q => q + 1)}
                        className="w-7 h-7 bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-200 active:scale-95 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Confirm additions */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
                  <button
                    onClick={() => {
                      for (let i = 0; i < detailQuantity; i++) {
                        onAddToCart(selectedNativeProduct);
                      }
                      setToastMessage(`Añadido: ${selectedNativeProduct.name} (x${detailQuantity})`);
                      setSelectedNativeProduct(null);
                    }}
                    className="flex-grow bg-[#C67C3E] hover:bg-[#ab652c] text-white text-xs font-bold py-2.5 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer text-center"
                  >
                    🛒 Añadir a Presupuesto
                  </button>
                  <button
                    onClick={() => setSelectedNativeProduct(null)}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-extrabold px-4 rounded-xl transition-all cursor-pointer whitespace-nowrap"
                  >
                    Volver al Catálogo
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Toast feedback for add-to-quote actions */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.2 }}
              className="absolute top-24 inset-x-0 z-[70] flex justify-center px-4 pointer-events-none"
            >
              <div className="bg-[#051125] text-white text-[11px] font-bold px-3.5 py-2 rounded-xl shadow-lg flex items-center gap-1.5 max-w-[90%]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span className="truncate">{toastMessage}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

    </div>
  );
}
