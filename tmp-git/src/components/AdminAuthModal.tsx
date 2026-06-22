import React, { useState } from 'react';
import { LayoutDashboard, Lock, User, X } from 'lucide-react';
import { registerAdmin, loginAdmin, getRegisteredAdminName, hasRegisteredAdmin } from '../utils/adminAuth';

interface AdminAuthModalProps {
  onSuccess: () => void;
  onClose: () => void;
}

export default function AdminAuthModal({ onSuccess, onClose }: AdminAuthModalProps) {
  const isRegisterMode = !hasRegisteredAdmin();
  const registeredName = getRegisteredAdminName();

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isRegisterMode) {
      if (!name.trim()) {
        setError('Ingresa tu nombre.');
        return;
      }
      if (password.length < 4) {
        setError('La contraseña debe tener al menos 4 caracteres.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Las contraseñas no coinciden.');
        return;
      }
      setIsSubmitting(true);
      await registerAdmin(name.trim(), password);
      setIsSubmitting(false);
      onSuccess();
    } else {
      if (!password) {
        setError('Ingresa tu contraseña.');
        return;
      }
      setIsSubmitting(true);
      const ok = await loginAdmin(password);
      setIsSubmitting(false);
      if (!ok) {
        setError('Contraseña incorrecta.');
        return;
      }
      onSuccess();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border-t-4 border-t-[#C67C3E]">
        <div className="p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-1">
            <div className="bg-[#051125] text-white p-2.5 rounded-xl">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-[#051125] leading-tight">
                {isRegisterMode ? 'Crear acceso al Panel' : 'Acceder al Panel'}
              </h2>
              <p className="text-xs text-slate-500">
                {isRegisterMode
                  ? 'Primer ingreso: registra tu nombre y contraseña.'
                  : `Bienvenido de nuevo${registeredName ? ', ' + registeredName : ''}.`}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-3">
            {isRegisterMode && (
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Nombre</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-[#C67C3E]"
                    placeholder="Ej: Carlos Mendoza"
                    autoFocus
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Contraseña</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-[#C67C3E]"
                  placeholder="••••••"
                  autoFocus={!isRegisterMode}
                />
              </div>
            </div>

            {isRegisterMode && (
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Confirmar Contraseña</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-[#C67C3E]"
                    placeholder="••••••"
                  />
                </div>
              </div>
            )}

            {error && <p className="text-xs text-rose-600 font-semibold">{error}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#051125] hover:bg-[#0a1a35] text-white font-bold text-sm py-2.5 rounded-lg transition-colors cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? 'Procesando...' : isRegisterMode ? 'Registrar y Entrar' : 'Entrar'}
            </button>

            <p className="text-[11px] text-slate-400 text-center pt-1">
              {isRegisterMode
                ? 'Este será el único acceso al panel. La próxima vez que ingreses desde este mismo dispositivo, no se te pedirá contraseña.'
                : 'Una vez dentro, este dispositivo quedará recordado y no volverá a pedir contraseña.'}
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
