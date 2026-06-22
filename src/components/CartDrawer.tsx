import React from 'react';
import { CartItem, Product } from '../types';
import { X, Trash, Plus, Minus, FileText, ArrowRight } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onAddToCart: (product: Product) => void;
  onDecreaseQuantity: (productId: string) => void;
  onRemoveFromCart: (productId: string) => void;
  onNavigateToQuote: () => void;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cart,
  onAddToCart,
  onDecreaseQuantity,
  onRemoveFromCart,
  onNavigateToQuote
}: CartDrawerProps) {
  if (!isOpen) return null;

  const totalCost = cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  const totalQty = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop overlay */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between">
          
          {/* Header */}
          <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#C67C3E]" />
              <h2 className="text-base font-extrabold text-[#051125] tracking-tight">Presupuesto de Compra ({totalQty})</h2>
            </div>
            <button 
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* List content */}
          <div className="flex-grow p-4 overflow-y-auto space-y-4">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center text-slate-400">
                <Trash className="w-10 h-10 mb-2 stroke-1" />
                <p className="text-sm font-medium">Tu cotización se encuentra vacía</p>
                <p className="text-xs text-slate-400 mt-1">Explora nuestro catálogo para añadir soportes de alta resistencia.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {cart.map(item => (
                  <div key={item.product.id} className="py-4 flex gap-3 items-center justify-between">
                    <img 
                      src={item.product.image} 
                      alt={item.product.name}
                      className="w-16 h-16 rounded object-cover border border-slate-200 flex-shrink-0"
                    />
                    
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-mono font-bold bg-[#051125] text-white px-1 py-0.5 rounded">
                          {item.product.sku}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-800 line-clamp-1 mt-1">{item.product.name}</h4>
                      <p className="text-[11px] text-[#C67C3E] font-mono font-semibold mt-0.5">Bs. {item.product.price} c/u</p>
                    </div>

                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      {/* Quantity selector */}
                      <div className="flex items-center border border-slate-200 rounded overflow-hidden bg-slate-50">
                        <button 
                          onClick={() => onDecreaseQuantity(item.product.id)}
                          className="p-1 hover:bg-slate-100 text-slate-500 cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2.5 font-mono text-xs font-bold text-slate-800">{item.quantity}</span>
                        <button 
                          onClick={() => onAddToCart(item.product.image ? item.product : item.product)}
                          className="p-1 hover:bg-slate-100 text-slate-500 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button 
                        onClick={() => onRemoveFromCart(item.product.id)}
                        className="text-xs text-rose-500 hover:text-rose-700 flex items-center gap-0.5 mt-1 transition-colors cursor-pointer"
                      >
                        Remover
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bottom Total & Trigger */}
          <div className="p-5 border-t border-slate-200 bg-slate-50">
            <div className="flex justify-between items-center mb-4 text-slate-800 font-bold text-sm">
              <span>Costo Equipamiento Proyectado:</span>
              <span className="font-mono text-base text-[#C67C3E]">Bs. {totalCost}</span>
            </div>

            {cart.length > 0 ? (
              <button
                onClick={() => {
                  onClose();
                  onNavigateToQuote();
                }}
                className="w-full bg-[#051125] hover:bg-slate-800 text-white font-semibold py-3 rounded-lg text-xs cursor-pointer transition-colors flex items-center justify-center gap-2"
              >
                Continuar a Cotización Rápida
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={onClose}
                className="w-full bg-slate-300 text-slate-500 py-3 rounded-lg text-xs font-semibold cursor-not-allowed"
                disabled
              >
                Añadir soportes primero
              </button>
            )}
            <p className="text-[10px] text-slate-400 text-center mt-2">
              * El servicio de instalación y materiales adicionales se calcularán en la proforma final.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
