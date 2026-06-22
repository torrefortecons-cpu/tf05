import React, { useState } from 'react';
import { Product } from '../types';
import { ShoppingCart, Eye, Tv, Wind, HelpCircle, HardHat } from 'lucide-react';

interface CatalogProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
}

const FILTERS = [
  { key: 'todos',      label: 'Todos' },
  { key: 'articulado', label: 'Articulado' },
  { key: 'fijo',       label: 'Fijo de Pared' },
  { key: 'techo',      label: 'De Techo' },
  { key: 'pedestal',   label: 'Pedestal' },
  { key: 'climatizacion', label: 'Climatización' },
  { key: 'proyectos estruct', label: 'Proyectos' },
];

export default function Catalog({ products, onAddToCart }: CatalogProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [activeFilter, setActiveFilter] = useState<string>('todos');

  const handleOpenProductDetails = (prod: Product) => {
    setSelectedProduct(prod);
    setActiveImageIndex(0);
  };

  // Separamos los productos en dos listados para las dos filas visuales:
  // Fila Superior: Solo soportes de televisión y pedestales móviles
  let tvProducts = products.filter(prod => {
    const isHvacOrStructural =
      prod.category?.toLowerCase() === 'climatizacion' ||
      prod.category?.toLowerCase() === 'proyectos estruct' ||
      prod.btu !== undefined ||
      prod.sku?.toLowerCase().includes('hvac') ||
      prod.name?.toLowerCase().includes('aire') ||
      prod.name?.toLowerCase().includes('split') ||
      prod.name?.toLowerCase().includes('climatiz') ||
      prod.name?.toLowerCase().includes('estructura modular');
    return !isHvacOrStructural;
  });

  // Fila Inferior: Climatización (aires acondicionados) y proyectos estructurales
  let hvacAndStructuresProducts = products.filter(prod => {
    const isHvacOrStructural =
      prod.category?.toLowerCase() === 'climatizacion' ||
      prod.category?.toLowerCase() === 'proyectos estruct' ||
      prod.btu !== undefined ||
      prod.sku?.toLowerCase().includes('hvac') ||
      prod.name?.toLowerCase().includes('aire') ||
      prod.name?.toLowerCase().includes('split') ||
      prod.name?.toLowerCase().includes('climatiz') ||
      prod.name?.toLowerCase().includes('estructura modular');
    return isHvacOrStructural;
  });

  if (activeFilter !== 'todos') {
    tvProducts = tvProducts.filter(prod => prod.category?.toLowerCase() === activeFilter);
    hvacAndStructuresProducts = hvacAndStructuresProducts.filter(prod => prod.category?.toLowerCase() === activeFilter);
  }

  const getCategoryLabel = (cat: string) => {
    if (!cat) return 'General';
    const mapping: Record<string, string> = {
      articulado: 'Articulado',
      fijo: 'Fijo de Pared',
      techo: 'De Techo',
      pedestal: 'Pedestal',
      climatizacion: 'Climatización',
      'proyectos estruct': 'Proyectos Estruct.'
    };
    return mapping[cat.toLowerCase()] || cat.charAt(0).toUpperCase() + cat.slice(1);
  };

  return (
    <section className="py-16 max-w-[1664px] mx-auto px-4 md:px-8 border-t border-slate-200/50" id="products">
      
      {/* Catalog Title Header matching mockup */}
      <div className="text-center md:text-left mb-12">
        <h2 className="text-3xl font-black text-industrial-navy tracking-tight">Catálogo de Productos & Proyectos Estructurales</h2>
        <p className="text-sm text-slate-500 mt-2 max-w-2xl leading-relaxed">
          Explora nuestra oferta de productos y servicios organizada en dos líneas de especialización técnica: Fabricación de Soportes y Sistema de climatización convencional
        </p>
      </div>

      {/* Chips de filtro por categoría */}
      <div className="flex flex-wrap gap-2 mb-10">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
              activeFilter === f.key
                ? 'bg-industrial-navy text-white border-industrial-navy'
                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* FILA SUPERIOR: SOPORTES DE TELEVISIÓN */}
      {tvProducts.length > 0 && (
      <div className="mb-14">
        <div className="flex items-center gap-2 mb-6 border-b pb-3 border-slate-100">
          <div className="h-8 w-8 rounded-lg bg-industrial-navy/10 flex items-center justify-center text-industrial-navy">
            <Tv className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-industrial-navy">Soportes y Pedestales de Televisión</h3>
            <p className="text-xs text-slate-400 mt-0.5">Soportes ultra resistentes fabricados con acero al carbono reforzado.</p>
          </div>
        </div>

        {tvProducts.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed text-slate-400 text-xs">
            No hay soportes de televisión registrados en el catálogo.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {tvProducts.map(prod => (
              <div 
                key={prod.id}
                className="bg-white border border-slate-200/80 rounded-xl overflow-hidden group hover:border-safety-orange hover:shadow-md transition-all duration-300 flex flex-col h-full relative"
              >
                {/* Image section */}
                <div className="h-44 bg-slate-50 relative overflow-hidden flex items-center justify-center">
                  <img 
                    referrerPolicy="no-referrer"
                    src={prod.image} 
                    alt={prod.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-2.5 right-2.5 bg-industrial-navy text-white px-2.5 py-0.5 rounded text-[9px] font-mono font-bold tracking-wider">
                    {prod.sku}
                  </div>

                  {/* Quick details trigger */}
                  <button 
                    onClick={() => handleOpenProductDetails(prod)}
                    className="absolute left-2 bottom-2 bg-black/50 hover:bg-black/80 text-white rounded p-1.5 transition-colors cursor-pointer flex items-center justify-center"
                    title="Ver especificaciones técnicas"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Content section */}
                <div className="p-4 flex flex-col flex-grow text-left">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">{getCategoryLabel(prod.category)}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      prod.stockLevel === 'Compra-Venta'
                        ? 'bg-cyan-50 text-cyan-700'
                        : prod.stockLevel === 'Modificado'
                        ? 'bg-amber-50 text-amber-700'
                        : prod.stockLevel === 'Fabricado'
                        ? 'bg-indigo-50 text-indigo-700'
                        : prod.stockLevel === 'In Stock' 
                        ? 'bg-emerald-50 text-emerald-700' 
                        : prod.stockLevel === 'Low Stock' 
                        ? 'bg-amber-50 text-amber-700' 
                        : 'bg-rose-50 text-rose-700'
                    }`}>
                      {prod.stockLevel === 'Compra-Venta' ? 'Compra-Venta' :
                       prod.stockLevel === 'Modificado' ? 'Modificado' :
                       prod.stockLevel === 'Fabricado' ? 'Fabricado' :
                       prod.stockLevel === 'In Stock' ? 'En Stock' : 
                       prod.stockLevel === 'Low Stock' ? 'Bajo Stock' : 'Agotado'}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-800 line-clamp-1 mb-1">{prod.name}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed flex-grow">
                    {prod.description}
                  </p>

                  {/* Technical key info line */}
                  <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 bg-slate-50 p-2 rounded mb-4 font-mono">
                    <div>
                      <span className="block text-slate-400">PANTALLA:</span>
                      <span className="font-semibold text-slate-700">{prod.tvSizes || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="block text-slate-400">CARGA MÁX:</span>
                      <span className="font-semibold text-rose-600">{prod.maxLoad} kg</span>
                    </div>
                  </div>

                  {/* Bottom Price and Add */}
                  <div className="flex justify-between items-center border-t border-slate-100 pt-3 mt-auto">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400 font-mono">Precio Unitario</span>
                      <span className="text-sm font-bold font-mono text-slate-900">Bs. {prod.price}</span>
                    </div>
                    <button 
                      onClick={() => onAddToCart(prod)}
                      className="bg-safety-orange/10 text-safety-orange hover:bg-safety-orange hover:text-white p-2 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
                      title="Añadir a mi cotización"
                    >
                      <ShoppingCart className="w-4 h-4" />
                    </button>
                  </div>

                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      )}

      {/* FILA INFERIOR: CLIMATIZACIÓN Y PROYECTOS ESTRUCTURALES */}
      {hvacAndStructuresProducts.length > 0 && (
      <div>
        <div className="flex items-center gap-2 mb-6 border-b pb-3 border-slate-100">
          <div className="h-8 w-8 rounded-lg bg-[#E31C1C]/10 flex items-center justify-center text-[#E31C1C]">
            <Wind className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-industrial-navy">Climatización y Aires Acondicionados</h3>
            <p className="text-xs text-slate-400 mt-0.5">Soluciones avanzadas de climatización con capacidades BTU detalladas y soporte estructural de calidad.</p>
          </div>
        </div>

        {hvacAndStructuresProducts.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed text-slate-400 text-xs">
            No hay servicios de climatización o proyectos registrados en el catálogo.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {hvacAndStructuresProducts.map(prod => (
              <div 
                key={prod.id}
                className="bg-white border border-slate-200/80 rounded-xl overflow-hidden group hover:border-safety-orange hover:shadow-md transition-all duration-300 flex flex-col h-full relative"
              >
                {/* Image section */}
                <div className="h-44 bg-slate-50 relative overflow-hidden flex items-center justify-center">
                  <img 
                    referrerPolicy="no-referrer"
                    src={prod.image} 
                    alt={prod.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-2.5 right-2.5 bg-industrial-navy text-white px-2.5 py-0.5 rounded text-[9px] font-mono font-bold tracking-wider">
                    {prod.sku}
                  </div>

                  {/* Quick details trigger */}
                  <button 
                    onClick={() => handleOpenProductDetails(prod)}
                    className="absolute left-2 bottom-2 bg-black/50 hover:bg-black/80 text-white rounded p-1.5 transition-colors cursor-pointer flex items-center justify-center"
                    title="Ver especificaciones técnicas"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Content section */}
                <div className="p-4 flex flex-col flex-grow text-left">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">{getCategoryLabel(prod.category)}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      prod.stockLevel === 'Compra-Venta'
                        ? 'bg-cyan-50 text-cyan-700'
                        : prod.stockLevel === 'Modificado'
                        ? 'bg-amber-50 text-amber-700'
                        : prod.stockLevel === 'Fabricado'
                        ? 'bg-indigo-50 text-indigo-700'
                        : prod.stockLevel === 'In Stock' 
                        ? 'bg-emerald-50 text-emerald-700' 
                        : prod.stockLevel === 'Low Stock' 
                        ? 'bg-amber-50 text-amber-700' 
                        : 'bg-rose-50 text-rose-700'
                    }`}>
                      {prod.stockLevel === 'Compra-Venta' ? 'Compra-Venta' :
                       prod.stockLevel === 'Modificado' ? 'Modificado' :
                       prod.stockLevel === 'Fabricado' ? 'Fabricado' :
                       prod.stockLevel === 'In Stock' ? 'En Stock' : 
                       prod.stockLevel === 'Low Stock' ? 'Bajo Stock' : 'Agotado'}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-800 line-clamp-1 mb-1">{prod.name}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed flex-grow">
                    {prod.description}
                  </p>

                  {/* Technical key info line */}
                  <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 bg-slate-50 p-2 rounded mb-4 font-mono">
                    {prod.btu ? (
                      <>
                        <div>
                          <span className="block text-slate-400">CAPACIDAD (BTU):</span>
                          <span className="font-extrabold text-sky-600 text-[11px]">{prod.btu.toLocaleString()} BTU</span>
                        </div>
                        <div>
                          <span className="block text-slate-400">EFICIENCIA:</span>
                          <span className="font-semibold text-slate-700">Inverter</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <span className="block text-slate-400">PROYECTO:</span>
                          <span className="font-semibold text-industrial-navy">{prod.tvSizes || 'Especial'}</span>
                        </div>
                        <div>
                          <span className="block text-slate-400">SOPORTE MÁX:</span>
                          <span className="font-semibold text-safety-orange">{prod.maxLoad > 0 ? `${prod.maxLoad} kg` : 'Certificado'}</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Bottom Price and Add */}
                  <div className="flex justify-between items-center border-t border-slate-100 pt-3 mt-auto">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400 font-mono">Precio Unitario</span>
                      <span className="text-sm font-bold font-mono text-slate-900">Bs. {prod.price}</span>
                    </div>
                    <button 
                      onClick={() => onAddToCart(prod)}
                      className="bg-safety-orange/10 text-safety-orange hover:bg-safety-orange hover:text-white p-2 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
                      title="Añadir a mi cotización"
                    >
                      <ShoppingCart className="w-4 h-4" />
                    </button>
                  </div>

                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      )}

      {/* Technical Spec Sheet Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 bg-industrial-navy text-white rounded">
                  {selectedProduct.sku}
                </span>
                <h4 className="text-sm font-extrabold text-slate-800">Ficha Técnica</h4>
              </div>
              <button 
                onClick={() => setSelectedProduct(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg leading-none cursor-pointer p-1"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4">
              {(() => {
                const productImagesList = selectedProduct.images && selectedProduct.images.filter(Boolean).length > 0 
                  ? selectedProduct.images.filter(Boolean)
                  : [selectedProduct.image];
                const currentImageUrl = productImagesList[activeImageIndex] || selectedProduct.image;

                return (
                  <div className="space-y-2">
                    <img 
                      referrerPolicy="no-referrer"
                      src={currentImageUrl} 
                      alt={selectedProduct.name} 
                      className="w-full aspect-square object-cover rounded-lg border transition-all duration-300 bg-slate-50"
                    />
                    {productImagesList.length > 1 && (
                      <div className="flex gap-1.5 justify-center">
                        {productImagesList.map((imgUrl, idx) => (
                          <button
                            key={idx}
                            onClick={() => setActiveImageIndex(idx)}
                            type="button"
                            className={`w-10 h-10 rounded border overflow-hidden cursor-pointer transition-all ${
                              activeImageIndex === idx 
                                ? 'border-safety-orange ring-1 ring-safety-orange' 
                                : 'border-slate-200 hover:border-slate-400'
                            }`}
                          >
                            <img
                              src={imgUrl}
                              alt={`Miniatura ${idx + 1}`}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
              <div className="text-left">
                <h5 className="text-base font-bold text-slate-800">{selectedProduct.name}</h5>
                <p className="text-xs text-slate-500 mt-1">{selectedProduct.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs border-t pt-4 text-left">
                {selectedProduct.btu ? (
                  <div className="bg-slate-50 p-2.5 rounded col-span-2">
                    <span className="block text-[10px] text-slate-400">Capacidad Térmica</span>
                    <span className="font-bold text-sky-600 text-sm font-mono">{selectedProduct.btu.toLocaleString()} BTU</span>
                  </div>
                ) : (
                  <div className="bg-slate-50 p-2.5 rounded">
                    <span className="block text-[10px] text-slate-400">Rango de Pantallas</span>
                    <span className="font-semibold text-slate-700">{selectedProduct.tvSizes || 'N/A'}</span>
                  </div>
                )}
                
                <div className="bg-slate-50 p-2.5 rounded">
                  <span className="block text-[10px] text-slate-400">Especificaciones</span>
                  <span className="font-semibold text-slate-700 break-words">{selectedProduct.material}</span>
                </div>

                {!selectedProduct.btu && (
                  <div className="bg-slate-50 p-2.5 rounded">
                    <span className="block text-[10px] text-slate-400">Carga Certificada</span>
                    <span className="font-semibold text-emerald-600">{selectedProduct.maxLoad > 0 ? `${selectedProduct.maxLoad} Kg` : 'Proyectos'}</span>
                  </div>
                )}

                <div className="bg-slate-50 p-2.5 rounded">
                  <span className="block text-[10px] text-slate-400">Precio Oficial</span>
                  <span className="font-semibold text-safety-orange font-mono">Bs. {selectedProduct.price}</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
              <button 
                onClick={() => {
                  onAddToCart(selectedProduct);
                  setSelectedProduct(null);
                }}
                className="flex-1 bg-safety-orange hover:bg-opacity-90 text-white text-xs font-semibold py-2 rounded-lg cursor-pointer transition-colors"
              >
                Añadir a Cotización
              </button>
              <button 
                onClick={() => setSelectedProduct(null)}
                className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold py-2 rounded-lg cursor-pointer transition-colors"
              >
                Salir
              </button>
            </div>
          </div>
        </div>
      )}

    </section>
  );
}
