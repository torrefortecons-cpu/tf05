const TESTIMONIALS = [
  {
    id: 1,
    name: 'Carlos Méndez',
    role: 'Propietario, Restaurante El Buen Sabor',
    location: 'Plan 3000, Santa Cruz',
    comment: 'Instalaron 4 soportes articulados en mi local. Trabajo limpio, rápido y el precio fue justo. Las pantallas quedaron perfectas.',
    rating: 5,
  },
  {
    id: 2,
    name: 'Patricia Vásquez',
    role: 'Gerente de Operaciones',
    location: 'Equipetrol, Santa Cruz',
    comment: 'Contratamos el servicio de climatización para nuestra oficina. Muy profesionales, llegaron a tiempo y el equipo quedó funcionando al 100%.',
    rating: 5,
  },
  {
    id: 3,
    name: 'Roberto Suárez',
    role: 'Cliente residencial',
    location: 'Urubó, Santa Cruz',
    comment: 'El soporte de techo para la habitación es excelente. Rotación perfecta, no hace ruido y aguanta sin problema mi TV de 65 pulgadas.',
    rating: 5,
  },
];

export default function Testimonials() {
  return (
    <section className="bg-industrial-navy text-white py-16">
      <div className="max-w-[1664px] mx-auto px-4 md:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black tracking-tight">Lo que dicen nuestros clientes</h2>
          <p className="text-sm text-slate-400 mt-2">Testimonios reales de clientes en Santa Cruz, Bolivia</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map(t => (
            <div
              key={t.id}
              className="relative bg-white/5 border border-white/10 rounded-xl p-6 overflow-hidden"
            >
              <span className="absolute -top-2 right-4 text-7xl font-black text-safety-orange/30 leading-none select-none">
                "
              </span>

              <div className="flex mb-3">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <span key={i} className="text-safety-orange">★</span>
                ))}
              </div>

              <p className="text-sm text-slate-200 leading-relaxed mb-5 relative z-10">{t.comment}</p>

              <div>
                <p className="text-white font-bold text-sm">{t.name}</p>
                <p className="text-slate-400 text-xs">{t.role}</p>
                <p className="text-slate-400 text-xs">{t.location}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
