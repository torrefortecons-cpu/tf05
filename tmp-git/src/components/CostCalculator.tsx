import React, { useState, useEffect } from 'react';
import { 
  Package, Wrench, Calculator, Plus, Trash2, Edit3, ChevronDown, ChevronRight, 
  Coins, Truck, Calendar, Building2, HelpCircle, FileText, Check, Sparkles, FolderPlus, Info, Save
} from 'lucide-react';

interface Material {
  id: number;
  nombre: string;
  tipo: string;
  cantidad: number;
  unidad: string;
  precio: number;
  ppu: number;
  proveedor: string;
  fecha: string;
  disponible: number;
}

interface LineaProducto {
  producto: string;
  matId: number;
  nombre: string;
  unidad: string;
  uso: number;
  ppu: number;
  costo: number;
}

interface CostosOperativos {
  mano: number;
  servicios: number;
  alquiler: number;
  transporte: number;
  otros: number;
  margen: number;
}

// Initial Mock Data
const INITIAL_MATERIALS: Material[] = [
  {
    id: 1,
    nombre: "Tubo de Acero Rectangular 40x40x1.2mm",
    tipo: "Metal",
    cantidad: 600,
    unidad: "m",
    precio: 3200,
    ppu: 3200 / 600, // 5.33 Bs/m
    proveedor: "Ferromás Bolivia",
    fecha: "2026-06-01",
    disponible: 450
  },
  {
    id: 2,
    nombre: "Pintura Electrostática Negra",
    tipo: "Químico",
    cantidad: 50,
    unidad: "litro",
    precio: 1250,
    ppu: 1250 / 50, // 25 Bs/L
    proveedor: "Pinturas Monopol",
    fecha: "2026-06-02",
    disponible: 42
  },
  {
    id: 3,
    nombre: "Pack Pernos de Anclaje 3/8 x 3\" (100u)",
    tipo: "Metal",
    cantidad: 50,
    unidad: "unidad",
    precio: 450,
    ppu: 450 / 50, // 9 Bs/u
    proveedor: "Pernos El Rey",
    fecha: "2026-06-03",
    disponible: 40
  },
  {
    id: 4,
    nombre: "Electrodos Lincoln 6011",
    tipo: "Otro",
    cantidad: 15,
    unidad: "kg",
    precio: 270,
    ppu: 270 / 15, // 18 Bs/kg
    proveedor: "Soldaduras Unidas",
    fecha: "2026-06-04",
    disponible: 12.5
  }
];

const INITIAL_LINEAS_PRODUCTO: LineaProducto[] = [
  // Soporte Pedestal Modelo P-80
  {
    producto: "Soporte Pedestal con Ruedas Modelo P-80",
    matId: 1,
    nombre: "Tubo de Acero Rectangular 40x40x1.2mm",
    unidad: "m",
    uso: 4.5,
    ppu: 5.33333,
    costo: 4.5 * 5.33333
  },
  {
    producto: "Soporte Pedestal con Ruedas Modelo P-80",
    matId: 2,
    nombre: "Pintura Electrostática Negra",
    unidad: "litro",
    uso: 0.5,
    ppu: 25,
    costo: 0.5 * 25
  },
  {
    producto: "Soporte Pedestal con Ruedas Modelo P-80",
    matId: 3,
    nombre: "Pack Pernos de Anclaje 3/8 x 3\" (100u)",
    unidad: "unidad",
    uso: 2,
    ppu: 9,
    costo: 2 * 9
  },
  {
    producto: "Soporte Pedestal con Ruedas Modelo P-80",
    matId: 4,
    nombre: "Electrodos Lincoln 6011",
    unidad: "kg",
    uso: 0.25,
    ppu: 18,
    costo: 0.25 * 18
  },

  // Soporte de Pared Articulado Pesado
  {
    producto: "Soporte de Pared Articulado Pesado",
    matId: 1,
    nombre: "Tubo de Acero Rectangular 40x40x1.2mm",
    unidad: "m",
    uso: 2.2,
    ppu: 5.33333,
    costo: 2.2 * 5.33333
  },
  {
    producto: "Soporte de Pared Articulado Pesado",
    matId: 2,
    nombre: "Pintura Electrostática Negra",
    unidad: "litro",
    uso: 0.3,
    ppu: 25,
    costo: 0.3 * 25
  },
  {
    producto: "Soporte de Pared Articulado Pesado",
    matId: 3,
    nombre: "Pack Pernos de Anclaje 3/8 x 3\" (100u)",
    unidad: "unidad",
    uso: 4,
    ppu: 9,
    costo: 4 * 9
  },
  {
    producto: "Soporte de Pared Articulado Pesado",
    matId: 4,
    nombre: "Electrodos Lincoln 6011",
    unidad: "kg",
    uso: 0.15,
    ppu: 18,
    costo: 0.15 * 18
  }
];

const INITIAL_COSTOS_POR_PRODUCTO: Record<string, CostosOperativos> = {
  "Soporte Pedestal con Ruedas Modelo P-80": {
    mano: 120,
    servicios: 15,
    alquiler: 10,
    transporte: 30,
    otros: 5,
    margen: 40
  },
  "Soporte de Pared Articulado Pesado": {
    mano: 75,
    servicios: 8,
    alquiler: 5,
    transporte: 20,
    otros: 2,
    margen: 35
  }
};

interface UnitOption {
  value: string;
  label: string;
  factor: number;
}

function getUnitOptions(baseUnit: string): UnitOption[] {
  if (!baseUnit) return [];
  const norm = baseUnit.toLowerCase().trim();
  
  if (norm === 'm' || norm === 'meter' || norm === 'meters' || norm === 'metro' || norm === 'metros' || norm === 'mt' || norm === 'mts') {
    return [
      { value: 'm', label: 'Metros (m)', factor: 1 },
      { value: 'cm', label: 'Centímetros (cm)', factor: 0.01 },
      { value: 'mm', label: 'Milímetros (mm)', factor: 0.001 },
      { value: 'pulgadas', label: 'Pulgadas (in)', factor: 0.0254 }
    ];
  }
  
  if (norm === 'kg' || norm === 'kilo' || norm === 'kilos' || norm === 'kilogramo' || norm === 'kilogramos') {
    return [
      { value: 'kg', label: 'Kilogramos (kg)', factor: 1 },
      { value: 'g', label: 'Gramos (g)', factor: 0.001 },
      { value: 'lb', label: 'Libras (lb)', factor: 0.45359237 }
    ];
  }

  if (norm === 'litro' || norm === 'litros' || norm === 'l' || norm === 'L' || norm === 'ml') {
    return [
      { value: 'litro', label: 'Litros (L)', factor: 1 },
      { value: 'ml', label: 'Mililitros (ml)', factor: 0.001 }
    ];
  }

  return [
    { value: baseUnit, label: `${baseUnit}`, factor: 1 }
  ];
}

export default function CostCalculator() {
  const [activeSubTab, setActiveSubTab] = useState<'materiales' | 'producto' | 'costos'>('materiales');

  // Load from localStorage or mock data
  const [materiales, setMateriales] = useState<Material[]>(() => {
    const saved = localStorage.getItem('tf_calc_materiales');
    return saved ? JSON.parse(saved) : INITIAL_MATERIALS;
  });

  const [lineasProducto, setLineasProducto] = useState<LineaProducto[]>(() => {
    const saved = localStorage.getItem('tf_calc_lineas');
    return saved ? JSON.parse(saved) : INITIAL_LINEAS_PRODUCTO;
  });

  const [costosPorProducto, setCostosPorProducto] = useState<Record<string, CostosOperativos>>(() => {
    const saved = localStorage.getItem('tf_calc_costos');
    return saved ? JSON.parse(saved) : INITIAL_COSTOS_POR_PRODUCTO;
  });

  // State to store real products from sales catalogue
  const [saleProducts, setSaleProducts] = useState<{ id: string; sku: string; name: string; stockLevel?: string }[]>(() => {
    const saved = localStorage.getItem('torre_forte_products');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (err) {
        return [];
      }
    }
    return [];
  });

  // Update real products from catalog whenever tab switches or mounts
  useEffect(() => {
    const saved = localStorage.getItem('torre_forte_products');
    if (saved) {
      try {
        setSaleProducts(JSON.parse(saved));
      } catch (err) {
        console.error("Error reading products:", err);
      }
    }
  }, [activeSubTab]);

  // UI state managers
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    "Soporte Pedestal con Ruedas Modelo P-80": true,
    "Soporte de Pared Articulado Pesado": false,
  });

  const [expandedCosts, setExpandedCosts] = useState<Record<string, boolean>>({
    "Soporte Pedestal con Ruedas Modelo P-80": true,
    "Soporte de Pared Articulado Pesado": true,
  });

  // Form states - Tab 1 (Material prima)
  const [matNombre, setMatNombre] = useState('');
  const [matTipo, setMatTipo] = useState('Metal');
  const [matCantidad, setMatCantidad] = useState('');
  const [matUnidad, setMatUnidad] = useState('m');
  const [matPrecio, setMatPrecio] = useState('');
  const [matProveedor, setMatProveedor] = useState('');
  const [matFecha, setMatFecha] = useState(() => new Date().toISOString().split('T')[0]);

  // States for editing general materials inventory
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [editTipo, setEditTipo] = useState('');
  const [editCantidad, setEditCantidad] = useState('');
  const [editDisponible, setEditDisponible] = useState('');
  const [editUnidad, setEditUnidad] = useState('');
  const [editPrecio, setEditPrecio] = useState('');
  const [editProveedor, setEditProveedor] = useState('');
  const [editFecha, setEditFecha] = useState('');

  // Form states - Tab 2 (Armar producto)
  const [prodNombre, setProdNombre] = useState('');
  const [prodMaterialId, setProdMaterialId] = useState<string>('');
  const [prodUso, setProdUso] = useState('');
  const [inputUnit, setInputUnit] = useState('');

  // Form states - Tab 3 (Costos y precio)
  const [opProdSel, setOpProdSel] = useState('');
  const [opMano, setOpMano] = useState('');
  const [opServicios, setOpServicios] = useState('');
  const [opAlquiler, setOpAlquiler] = useState('');
  const [opTransporte, setOpTransporte] = useState('');
  const [opOtros, setOpOtros] = useState('');
  const [opMargen, setOpMargen] = useState('30');

  // Trigger select material options effect
  useEffect(() => {
    if (materiales.length > 0 && !prodMaterialId) {
      setProdMaterialId(materiales[0].id.toString());
    }
  }, [materiales, prodMaterialId]);

  // Sync selected input unit when material changes
  useEffect(() => {
    const matObj = materiales.find(m => m.id === parseInt(prodMaterialId));
    if (matObj) {
      setInputUnit(matObj.unidad);
    } else {
      setInputUnit('');
    }
  }, [prodMaterialId, materiales]);

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem('tf_calc_materiales', JSON.stringify(materiales));
  }, [materiales]);

  useEffect(() => {
    localStorage.setItem('tf_calc_lineas', JSON.stringify(lineasProducto));
  }, [lineasProducto]);

  useEffect(() => {
    localStorage.setItem('tf_calc_costos', JSON.stringify(costosPorProducto));
  }, [costosPorProducto]);

  // Sync "Costos y precio" select whenever unique products change
  const uniqueProducts: string[] = Array.from(new Set(lineasProducto.map(l => l.producto)));
  useEffect(() => {
    if (uniqueProducts.length > 0 && !opProdSel) {
      setOpProdSel(uniqueProducts[0]);
    }
  }, [lineasProducto, opProdSel, uniqueProducts]);

  // Whenever product select changes, load existing costs
  useEffect(() => {
    if (opProdSel) {
      const existing = costosPorProducto[opProdSel];
      if (existing) {
        setOpMano(existing.mano > 0 ? existing.mano.toString() : '');
        setOpServicios(existing.servicios > 0 ? existing.servicios.toString() : '');
        setOpAlquiler(existing.alquiler > 0 ? existing.alquiler.toString() : '');
        setOpTransporte(existing.transporte > 0 ? existing.transporte.toString() : '');
        setOpOtros(existing.otros > 0 ? existing.otros.toString() : '');
        setOpMargen(existing.margen.toString());
      } else {
        setOpMano('');
        setOpServicios('');
        setOpAlquiler('');
        setOpTransporte('');
        setOpOtros('');
        setOpMargen('30');
      }
    }
  }, [opProdSel, costosPorProducto]);


  // Formatting helper
  const fmtBs = (val: number) => `Bs. ${parseFloat((val || 0).toFixed(2))}`;

  // Tab 1: Added Material Handler
  const handleAgregarMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Normalize commas to dots for robust decimal input processing (extremely important for Bolivian locale)
    const cleanCantStr = (matCantidad || '').trim().replace(/,/g, '.');
    const cleanPriceStr = (matPrecio || '').trim().replace(/,/g, '.');

    const cant = parseFloat(cleanCantStr);
    const price = parseFloat(cleanPriceStr);

    if (!matNombre.trim()) {
      alert('Introduzca el nombre del material.');
      return;
    }
    if (isNaN(cant) || cant <= 0) {
      alert(`Introduzca una cantidad de compra superior a 0 (recibido: "${matCantidad}").`);
      return;
    }
    if (isNaN(price) || price <= 0) {
      alert(`Introduzca un precio válido superior a 0 (recibido: "${matPrecio}").`);
      return;
    }

    const nextId = materiales.length > 0 ? Math.max(...materiales.map(m => m.id)) + 1 : 1;
    const newMat: Material = {
      id: nextId,
      nombre: matNombre.trim(),
      tipo: matTipo,
      cantidad: cant,
      unidad: matUnidad,
      precio: price,
      ppu: price / cant,
      proveedor: matProveedor.trim() || '—',
      fecha: matFecha || '—',
      disponible: cant
    };

    setMateriales(prev => [...prev, newMat]);
    setMatNombre('');
    setMatCantidad('');
    setMatPrecio('');
    setMatProveedor('');
    setMatFecha(new Date().toISOString().split('T')[0]);
  };

  const handleEliminarMaterial = (id: number) => {
    // Check if material is being used in any product
    const isUsed = lineasProducto.some(l => l.matId === id);
    if (isUsed) {
      alert('Este material no puede ser eliminado porque está asignado a un producto en el tab "Armar producto". Quítelo de allí primero.');
      return;
    }
    setMateriales(prev => prev.filter(m => m.id !== id));
  };

  const handleIniciarEdicion = (m: Material) => {
    setEditingMaterial(m);
    setEditNombre(m.nombre);
    setEditTipo(m.tipo);
    setEditCantidad(String(m.cantidad));
    setEditDisponible(String(m.disponible));
    setEditUnidad(m.unidad);
    setEditPrecio(String(m.precio));
    setEditProveedor(m.proveedor);
    setEditFecha(m.fecha);
  };

  const handleGuardarMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMaterial) return;

    const cleanCantStr = (editCantidad || '').trim().replace(/,/g, '.');
    const cleanPriceStr = (editPrecio || '').trim().replace(/,/g, '.');
    const cleanDispStr = (editDisponible || '').trim().replace(/,/g, '.');

    const cant = parseFloat(cleanCantStr);
    const price = parseFloat(cleanPriceStr);
    const disp = parseFloat(cleanDispStr);

    if (!editNombre.trim()) {
      alert('Introduzca el nombre del material.');
      return;
    }
    if (isNaN(cant) || cant <= 0) {
      alert('Introduzca una cantidad superior a 0.');
      return;
    }
    if (isNaN(price) || price <= 0) {
      alert('Introduzca un precio válido superior a 0.');
      return;
    }
    if (isNaN(disp) || disp < 0) {
      alert('Introduzca una cantidad disponible válida (mínimo 0).');
      return;
    }

    const nuevoPpu = price / cant;

    const updatedMateriales = materiales.map(m => {
      if (m.id === editingMaterial.id) {
        return {
          ...m,
          nombre: editNombre.trim(),
          tipo: editTipo,
          cantidad: cant,
          unidad: editUnidad,
          precio: price,
          ppu: nuevoPpu,
          proveedor: editProveedor.trim(),
          fecha: editFecha,
          disponible: disp
        };
      }
      return m;
    });

    setMateriales(updatedMateriales);

    const updatedLineas = lineasProducto.map(l => {
      if (l.matId === editingMaterial.id) {
        return {
          ...l,
          nombre: editNombre.trim(),
          unidad: editUnidad,
          ppu: nuevoPpu,
          costo: l.uso * nuevoPpu
        };
      }
      return l;
    });

    setLineasProducto(updatedLineas);

    // Save directly to localStorage for durability
    localStorage.setItem('tf_calc_materiales', JSON.stringify(updatedMateriales));
    localStorage.setItem('tf_calc_lineas', JSON.stringify(updatedLineas));

    setEditingMaterial(null);
    alert('¡Material actualizado con éxito! Se ha recalculado el precio de todos los productos vinculados de forma automática.');
  };


  // Tab 2: Assemble product materials handler
  const handleAgregarLineaProducto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodNombre.trim()) {
      alert('Escriba el nombre del producto.');
      return;
    }
    if (!prodMaterialId) {
      alert('Seleccione un material del inventario.');
      return;
    }

    const matIdNum = parseInt(prodMaterialId);
    const targetMat = materiales.find(m => m.id === matIdNum);
    const usoFloat = parseFloat(prodUso);

    if (!targetMat) {
      alert('Material seleccionado no válido.');
      return;
    }
    if (isNaN(usoFloat) || usoFloat <= 0) {
      alert('Establezca una cantidad de uso superior a 0.');
      return;
    }

    const options = getUnitOptions(targetMat.unidad);
    const opt = options.find(o => o.value === inputUnit) || { value: targetMat.unidad, factor: 1 };
    const usoEnBaseUnitNeeded = parseFloat((usoFloat * opt.factor).toFixed(4));

    if (usoEnBaseUnitNeeded > targetMat.disponible) {
      alert(`Stock insuficiente de este material. Requerido: ${usoEnBaseUnitNeeded.toFixed(4)} ${targetMat.unidad}, Disponible actual: ${targetMat.disponible.toFixed(2)} ${targetMat.unidad}`);
      return;
    }

    // Deduct available stock
    setMateriales(prev => prev.map(m => {
      if (m.id === matIdNum) {
        return { ...m, disponible: parseFloat((m.disponible - usoEnBaseUnitNeeded).toFixed(4)) };
      }
      return m;
    }));

    const newLine: LineaProducto = {
      producto: prodNombre.trim(),
      matId: matIdNum,
      nombre: targetMat.nombre,
      unidad: targetMat.unidad,
      uso: usoEnBaseUnitNeeded,
      ppu: targetMat.ppu,
      costo: usoEnBaseUnitNeeded * targetMat.ppu
    };

    setLineasProducto(prev => [...prev, newLine]);
    setProdUso('');

    // Auto-open this product card
    setExpandedGroups(prev => ({ ...prev, [prodNombre.trim()]: true }));
  };

  const handleQuitarLinea = (idx: number) => {
    const l = lineasProducto[idx];
    // Return back available stock
    setMateriales(prev => prev.map(m => {
      if (m.id === l.matId) {
        return { ...m, disponible: parseFloat((m.disponible + l.uso).toFixed(4)) };
      }
      return m;
    }));

    setLineasProducto(prev => prev.filter((_, i) => i !== idx));
  };


  // Tab 3: Save Operational Costs
  const handleGuardarCostos = (e: React.FormEvent) => {
    e.preventDefault();
    if (!opProdSel) {
      alert('Por favor seleccione un producto.');
      return;
    }

    const manoVal = parseFloat(opMano) || 0;
    const servVal = parseFloat(opServicios) || 0;
    const alqVal = parseFloat(opAlquiler) || 0;
    const transVal = parseFloat(opTransporte) || 0;
    const otVal = parseFloat(opOtros) || 0;
    const margVal = parseFloat(opMargen) || 0;

    const opCosts: CostosOperativos = {
      mano: manoVal,
      servicios: servVal,
      alquiler: alqVal,
      transporte: transVal,
      otros: otVal,
      margen: margVal
    };

    setCostosPorProducto(prev => ({
      ...prev,
      [opProdSel]: opCosts
    }));

    setExpandedCosts(prev => ({ ...prev, [opProdSel]: true }));
    alert(`Costos guardados correctamente para "${opProdSel}"`);
  };

  // Trigger editing a product's costs
  const handleEditarCostos = (prodName: string) => {
    setOpProdSel(prodName);
    const compElement = document.getElementById('costs-form-anchor');
    if (compElement) {
      compElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };


  // Grouping lines of assembled products
  const productGroups: Record<string, LineaProducto[]> = {};
  lineasProducto.forEach(l => {
    if (!productGroups[l.producto]) {
      productGroups[l.producto] = [];
    }
    productGroups[l.producto].push(l);
  });

  const totalLinesCount = lineasProducto.length;
  const totalGeneralMaterialCost = lineasProducto.reduce((sum, l) => sum + l.costo, 0);


  // Selected material price/unit breakdown indicator for tab 2
  const selectedMaterialObject = materiales.find(m => m.id === parseInt(prodMaterialId));
  const currentUnitsOptions = selectedMaterialObject ? getUnitOptions(selectedMaterialObject.unidad) : [];
  const selectedUnitOption = currentUnitsOptions.find(opt => opt.value === inputUnit) || { value: inputUnit, label: inputUnit, factor: 1 };
  const currentFactor = selectedUnitOption.factor;
  const usoFloat = parseFloat(prodUso) || 0;
  const usoEnBaseUnit = parseFloat((usoFloat * currentFactor).toFixed(4));

  const partialCosto = (selectedMaterialObject && parseFloat(prodUso) > 0) 
    ? (parseFloat(prodUso) * currentFactor) * selectedMaterialObject.ppu 
    : 0;

  return (
    <div className="space-y-3 text-slate-800">
      
      {/* Title Header Card */}
      <div className="bg-white p-4 py-2.5 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h3 className="text-lg font-extrabold text-[#051125] flex items-center gap-2">
            <Coins className="w-5.5 h-5.5 text-[#C67C3E]" />
            Sistema Integrado de Costeo y Fijación de Precios de Producción
          </h3>
          <p className="text-[12.5px] font-semibold text-slate-950 mt-0.5">
            Gestione el inventario de materias primas compradas, configure recetas específicas de fabricación de soportes/sistemas y calcule costos operativos con márgenes comerciales en tiempo real.
          </p>
        </div>
        <div className="flex gap-1.5 shrink-0">
          <div className="px-3 py-1 bg-[#051125]/5 rounded-xl border border-[#051125]/10 text-center">
            <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Materiales Reg.</div>
            <div className="text-sm font-extrabold text-[#051125]">{materiales.length}</div>
          </div>
          <div className="px-3 py-1 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
            <div className="text-[9px] text-emerald-600 font-bold uppercase tracking-wider font-sans">Soportes Costeados</div>
            <div className="text-sm font-extrabold text-[#051125]">{uniqueProducts.length}</div>
          </div>
        </div>
      </div>

      {/* Sub Tabs switcher */}
      <div className="flex border-b border-slate-200 bg-white/60 p-1 rounded-xl gap-1.5 w-fit">
        <button
          onClick={() => setActiveSubTab('materiales')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${
            activeSubTab === 'materiales'
              ? 'bg-[#051125] text-white shadow-sm'
              : 'text-slate-600 hover:text-[#051125] hover:bg-slate-100'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          Materia prima ({materiales.length})
        </button>
        <button
          onClick={() => setActiveSubTab('producto')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${
            activeSubTab === 'producto'
              ? 'bg-[#051125] text-white shadow-sm'
              : 'text-slate-600 hover:text-[#051125] hover:bg-slate-100'
          }`}
        >
          <Wrench className="w-3.5 h-3.5" />
          Armar producto ({uniqueProducts.length})
        </button>
        <button
          onClick={() => {
            setActiveSubTab('costos');
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${
            activeSubTab === 'costos'
              ? 'bg-[#051125] text-white shadow-sm'
              : 'text-slate-600 hover:text-[#051125] hover:bg-slate-100'
          }`}
        >
          <Calculator className="w-3.5 h-3.5" />
          Costos y precios sugeridos ({Object.keys(costosPorProducto).length})
        </button>
      </div>

      {/* TAB 1: MATERIA PRIMA */}
      {activeSubTab === 'materiales' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 animate-fade-in">
          
          {/* Add form */}
          <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2.5 h-fit">
            <h4 className="font-bold text-sm text-[#051125] pb-1.5 border-b flex items-center gap-1.5">
              <FolderPlus className="w-4.5 h-4.5 text-[#C67C3E]" />
              Registrar Compra de Materia Prima
            </h4>
            
            <div className="p-2 py-1.5 bg-blue-50/70 border border-blue-100 text-[10.5px] text-blue-700 rounded-lg leading-tight flex gap-1.5">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>Registra el material tal como lo compras. En <strong>Armar producto</strong> asignas uso exacto.</span>
            </div>

            <form onSubmit={handleAgregarMaterial} className="space-y-3 mt-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 font-sans">Nombre del Material:</label>
                <input 
                  type="text" 
                  value={matNombre}
                  onChange={(e) => setMatNombre(e.target.value)}
                  placeholder="Ej: Tubo de Acero 40x40x1.2 o Pernos 1/2"
                  className="w-full text-sm px-4 py-2.5 bg-white border-2 border-slate-400 hover:border-slate-500 rounded-lg text-slate-800 font-semibold focus:ring-4 focus:ring-[#C67C3E]/20 focus:border-[#C67C3E] focus:outline-none transition-all placeholder:text-slate-400 shadow-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11.5px] font-bold text-slate-700 uppercase tracking-wider mb-2 font-sans">Tipo de Material:</label>
                  <select
                    value={matTipo}
                    onChange={(e) => setMatTipo(e.target.value)}
                    className="w-full text-sm px-3 py-2.5 bg-white border-2 border-slate-400 hover:border-slate-500 rounded-lg text-slate-800 font-semibold focus:outline-none focus:border-[#C67C3E] focus:ring-4 focus:ring-[#C67C3E]/20 cursor-pointer shadow-sm"
                  >
                    <option value="Metal">🔩 Metal</option>
                    <option value="Madera">🪵 Madera</option>
                    <option value="Plástico">🔌 Plástico</option>
                    <option value="Tela">🧶 Tela</option>
                    <option value="Químico">🧪 Químico</option>
                    <option value="Otro">📦 Otro / Insumos</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11.5px] font-bold text-slate-700 uppercase tracking-wider mb-2 font-sans">Unidad de Medida:</label>
                  <select
                    value={matUnidad}
                    onChange={(e) => setMatUnidad(e.target.value)}
                    className="w-full text-sm px-3 py-2.5 bg-white border-2 border-slate-400 hover:border-slate-500 rounded-lg text-slate-800 font-semibold focus:outline-none focus:border-[#C67C3E] focus:ring-4 focus:ring-[#C67C3E]/20 cursor-pointer shadow-sm"
                  >
                    <option value="cm">cm (centímetros)</option>
                    <option value="m">m (metros)</option>
                    <option value="kg">kg (kilogramos)</option>
                    <option value="g">g (gramos)</option>
                    <option value="litro">litro (L)</option>
                    <option value="unidad">unidad (u)</option>
                    <option value="m²">m² (metros cuad.)</option>
                    <option value="pie">pie (ft)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11.5px] font-bold text-slate-700 uppercase tracking-wider mb-2 font-sans">Cantidad Comprada:</label>
                  <input 
                    type="text" 
                    inputMode="decimal"
                    value={matCantidad}
                    onChange={(e) => setMatCantidad(e.target.value)}
                    placeholder="Ej: 60"
                    className="w-full text-sm px-4 py-2.5 bg-white border-2 border-slate-400 hover:border-slate-500 rounded-lg text-slate-800 font-semibold focus:ring-4 focus:ring-[#C67C3E]/20 focus:border-[#C67C3E] focus:outline-none shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-[11.5px] font-extrabold text-[#C67C3E] uppercase tracking-wider mb-2 font-sans">Monto Compra (Bs):</label>
                  <input 
                    type="text" 
                    inputMode="decimal"
                    value={matPrecio}
                    onChange={(e) => setMatPrecio(e.target.value)}
                    placeholder="Ej: 320"
                    className="w-full text-sm px-4 py-2.5 bg-amber-50 border-2 border-amber-400 hover:border-amber-500 text-slate-900 font-black focus:ring-4 focus:ring-[#C67C3E]/20 focus:border-[#C67C3E] focus:outline-none rounded-lg shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11.5px] font-bold text-slate-700 uppercase tracking-wider mb-2 font-sans">Proveedor de Adquisición:</label>
                <input 
                  type="text" 
                  value={matProveedor}
                  onChange={(e) => setMatProveedor(e.target.value)}
                  placeholder="Ej: Ferretería Central Santa Cruz"
                  className="w-full text-sm px-4 py-2.5 bg-white border-2 border-slate-400 hover:border-slate-500 rounded-lg text-slate-800 font-semibold focus:ring-4 focus:ring-[#C67C3E]/20 focus:border-[#C67C3E] focus:outline-none shadow-sm"
                />
              </div>

              <div>
                <label className="block text-[11.5px] font-bold text-slate-700 uppercase tracking-wider mb-2 font-sans">Fecha de Compra:</label>
                <input 
                  type="date" 
                  value={matFecha}
                  onChange={(e) => setMatFecha(e.target.value)}
                  className="w-full text-sm px-4 py-2.5 bg-white border-2 border-slate-400 hover:border-slate-500 rounded-lg text-slate-800 font-semibold focus:ring-4 focus:ring-[#C67C3E]/20 focus:border-[#C67C3E] focus:outline-none shadow-sm"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#051125] text-white hover:bg-[#C67C3E] py-3.5 px-4 rounded-xl text-sm font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md mt-4 hover:shadow-lg active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
                Registrar compra del material
              </button>
            </form>
          </div>

          {/* List/Inventory of Materials */}
          <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h4 className="font-bold text-sm text-[#051125] pb-2 border-b flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Package className="w-4.5 h-4.5 text-[#051125]" />
                Inventario General de Materias Primas En Almacén
              </span>
              <span className="text-[11px] font-mono text-slate-400 font-normal">Sincronizado</span>
            </h4>

            {materiales.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Package className="w-12 h-12 stroke-1 mx-auto mb-3 opacity-60" />
                <p className="text-xs">No hay materias primas registradas en stock aún.</p>
                <p className="text-[10px] text-slate-400 mt-1">Utilice el formulario de la izquierda para registrar compras.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold tracking-wider text-slate-500 font-mono">
                      <th className="py-2.5 px-3">Insumo/Material</th>
                      <th className="py-2.5 px-3">Tipo</th>
                      <th className="py-2.5 px-3">Compra Total</th>
                      <th className="py-2.5 px-3">Disponible</th>
                      <th className="py-2.5 px-3">Costo Unit.</th>
                      <th className="py-2.5 px-3 text-right">Inversión</th>
                      <th className="py-2.5 px-3">Historial</th>
                      <th className="py-2.5 px-3 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {materiales.map((m) => {
                      const isLow = m.disponible <= m.cantidad * 0.15;
                      const isMid = m.disponible <= m.cantidad * 0.50 && m.disponible > m.cantidad * 0.15;
                      
                      let badgeBg = 'bg-emerald-50 text-emerald-700 border border-emerald-100';
                      if (m.disponible === 0) {
                        badgeBg = 'bg-rose-50 text-rose-700 border border-rose-100';
                      } else if (isLow) {
                        badgeBg = 'bg-red-50 text-red-700 border border-red-100 animate-pulse';
                      } else if (isMid) {
                        badgeBg = 'bg-amber-50 text-amber-700 border border-amber-100';
                      }

                      return (
                        <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 px-3 font-bold text-slate-950 text-[11px] leading-snug" title={m.nombre}>{m.nombre}</td>
                          <td className="py-3 px-3 text-slate-500">
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600">
                              {m.tipo}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-800 text-[11px]">
                            {m.cantidad.toFixed(2)} <span className="text-[9.5px] text-slate-500">{m.unidad}</span>
                          </td>
                          <td className="py-3 px-3">
                            <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full ${badgeBg}`}>
                              {m.disponible.toFixed(2)} <span className="text-[9px] opacity-80">{m.unidad}</span>
                            </span>
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-800 text-[11px]" title="Calculado en base a precio unitario">
                            {fmtBs(m.ppu)}<span className="text-[9.5px] text-slate-500">/{m.unidad}</span>
                          </td>
                          <td className="py-3 px-3 text-right font-extrabold font-mono text-slate-950 text-[11px]">
                            {fmtBs(m.precio)}
                          </td>
                          <td className="py-3 px-3">
                            <div className="text-[10px] text-slate-500 leading-none" title={`Proveedor: ${m.proveedor}`}>
                              {m.proveedor}
                            </div>
                            <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                              {m.fecha}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleIniciarEdicion(m)}
                                className="p-1 px-1.5 rounded hover:bg-amber-50 text-amber-600 hover:text-amber-800 transition-colors cursor-pointer"
                                title="Editar este material"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleEliminarMaterial(m.id)}
                                className="p-1 px-1.5 rounded hover:bg-rose-50 text-rose-500 hover:text-rose-700 transition-colors cursor-pointer"
                                title="Eliminar este material"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ARMAR PRODUCTO */}
      {activeSubTab === 'producto' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 animate-fade-in">
          
          {/* Add material row inside product */}
          <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2.5 h-fit">
            <h4 className="font-bold text-sm text-[#051125] pb-1.5 border-b flex items-center gap-1.5">
              <Wrench className="w-4.5 h-4.5 text-[#C67C3E]" />
              Estructurar Receta de Soporte
            </h4>
            
            <div className="p-2 py-1.5 bg-blue-50/70 border border-blue-100 text-[10.5px] text-blue-700 rounded-lg leading-tight flex gap-1.5">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>Agrega los insumos necesarios para fabricar un producto. Se agruparán por soporte.</span>
            </div>

            {materiales.length === 0 ? (
              <div className="p-4 border border-amber-100 bg-amber-50 rounded-xl text-center">
                <p className="text-xs font-bold text-amber-800">⚠️ No hay materias primas!</p>
                <p className="text-[10px] text-amber-700 mt-1">Primero registre la compra de al menos una materia prima en el primer tab para poder estructurar sus soportes.</p>
                <button 
                  onClick={() => setActiveSubTab('materiales')}
                  className="mt-3 text-xs bg-[#051125] text-white hover:bg-[#C67C3E] px-3 py-1 rounded-xl cursor-pointer font-bold inline-block"
                >
                  Ir a Compras
                </button>
              </div>
            ) : (
              <form onSubmit={handleAgregarLineaProducto} className="space-y-3 mt-1">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 font-sans">Nombre del Producto / Soporte:</label>
                  <select 
                    value={prodNombre}
                    onChange={(e) => setProdNombre(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-1 focus:ring-[#C67C3E] focus:outline-none font-semibold cursor-pointer"
                  >
                    <option value="">-- Seleccione SKU / Modelo del Inventario --</option>
                    {saleProducts.map((p) => {
                      const tipo = p.stockLevel === 'In Stock' ? 'Compra-Venta' :
                                   p.stockLevel === 'Low Stock' ? 'Modificado' :
                                   p.stockLevel === 'Out of Stock' ? 'Fabricado' :
                                   p.stockLevel || 'Sin Tipo';
                      return (
                        <option key={p.id} value={p.sku}>
                          {p.sku} — {tipo}
                        </option>
                      );
                    })}
                    {uniqueProducts.filter(up => !saleProducts.some(sp => sp.sku === up)).map((up, idx) => (
                      <option key={`existing-${idx}`} value={up}>
                        {up}
                      </option>
                    ))}
                  </select>
                  <p className="text-[9.5px] text-slate-400 mt-1 leading-snug">
                    * Enlazado con el catálogo de productos para venta de la Planilla (columna SKU/Tipo).
                  </p>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Insumo del Inventario:</label>
                  <select
                    value={prodMaterialId}
                    onChange={(e) => setProdMaterialId(e.target.value)}
                    className="w-full text-xs px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-[#C67C3E] cursor-pointer font-bold"
                  >
                    {materiales.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nombre} ({m.disponible.toFixed(2)} {m.unidad} disp.)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Cantidad a Usar por Unidad de Soporte:</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input 
                        type="number" 
                        step="any"
                        min="0.0001"
                        value={prodUso}
                        onChange={(e) => setProdUso(e.target.value)}
                        placeholder="Ej: 10 o 0.5"
                        className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-1 focus:ring-[#C67C3E] focus:outline-none"
                      />
                    </div>
                    {selectedMaterialObject && (
                      <select
                        value={inputUnit}
                        onChange={(e) => setInputUnit(e.target.value)}
                        className="bg-slate-50 border border-slate-200 text-xs rounded-lg px-2 text-slate-700 font-medium font-mono focus:ring-1 focus:ring-[#C67C3E] focus:outline-none cursor-pointer"
                      >
                        {getUnitOptions(selectedMaterialObject.unidad).map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.value}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  {selectedMaterialObject && selectedUnitOption.value !== selectedMaterialObject.unidad && parseFloat(prodUso) > 0 && (
                    <p className="text-[10px] text-[#C67C3E] mt-1 font-mono leading-none">
                      (Equivale a: {usoEnBaseUnit} {selectedMaterialObject.unidad} en base de inventario)
                    </p>
                  )}
                </div>

                {selectedMaterialObject && parseFloat(prodUso) > 0 && (
                  <div className="p-2.5 bg-slate-50/50 border border-slate-200/60 rounded-xl space-y-1 text-[11px] font-sans text-slate-600">
                    <div className="flex justify-between font-mono">
                      <span>Costo del Insumo:</span>
                      <span className="font-bold text-[#C67C3E]">{fmtBs(partialCosto)}</span>
                    </div>
                    <div className="flex justify-between font-mono text-[10px] text-slate-400">
                      <span>Precio Unit. Almacén:</span>
                      <span>{fmtBs(selectedMaterialObject.ppu)} / {selectedMaterialObject.unidad}</span>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-[#051125] text-white hover:bg-[#C67C3E] py-2.5 px-4 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md mt-2"
                >
                  <Plus className="w-4 h-4" />
                  Agregar componente al soporte
                </button>
              </form>
            )}
          </div>

          {/* Grouped view list by product */}
          <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h4 className="font-bold text-sm text-[#051125] pb-2 border-b flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-4.5 h-4.5 text-[#051125]" />
                Composición de Materiales de Soportes Registrados
              </span>
              <span className="text-[11px] font-mono text-slate-400 font-normal">Sincronizado</span>
            </h4>

            {lineasProducto.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Wrench className="w-12 h-12 stroke-1 mx-auto mb-3 opacity-60" />
                <p className="text-xs">No hay estructuras o recetas construidas aún.</p>
                <p className="text-[10px] text-slate-400 mt-1">Escriba el nombre de un soporte y agréguele componentes de almacén a la izquierda.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.keys(productGroups).map((prodName) => {
                  const items = productGroups[prodName];
                  const subTotalMaterials = items.reduce((sum, item) => sum + item.costo, 0);
                  const isOpened = !!expandedGroups[prodName];

                  return (
                    <div key={prodName} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm transition-all">
                      {/* Accordion header */}
                      <div 
                        onClick={() => setExpandedGroups(prev => ({ ...prev, [prodName]: !isOpened }))}
                        className="bg-slate-50 hover:bg-slate-100/70 p-3.5 px-4 flex items-center justify-between cursor-pointer select-none border-b border-slate-200 transition-all"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {isOpened ? <ChevronDown className="w-4 h-4 text-[#C67C3E] shrink-0" /> : <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />}
                          <span className="font-extrabold text-xs text-[#051125] truncate">{prodName}</span>
                          <span className="text-[10px] shrink-0 font-bold px-1.5 py-0.5 rounded-full bg-slate-200/70 text-slate-600 font-mono">
                            {items.length} insumos
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-right">
                          <span className="text-[10px] text-slate-500 font-mono">Suma Insumos:</span>
                          <span className="font-extrabold text-xs text-slate-800 font-mono">{fmtBs(subTotalMaterials)}</span>
                        </div>
                      </div>

                      {/* Accordion body table */}
                      {isOpened && (
                        <div className="p-3 bg-white">
                          <table className="w-full text-left font-sans text-xs">
                            <thead>
                              <tr className="border-b border-slate-100 text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                                <th className="py-2 px-2">Nombre del Insumo / Componente</th>
                                <th className="py-2 px-2 text-center">Cantidad Requerida</th>
                                <th className="py-2 px-2 text-right">Costo Unit. Almacén</th>
                                <th className="py-2 px-2 text-right">Costo Total Componente</th>
                                <th className="py-2 px-2 text-center">Acción</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                              {items.map((it) => {
                                // Find global index in raw flat array for deletion
                                const globalIdx = lineasProducto.findIndex(
                                  l => l.producto === it.producto && l.matId === it.matId && l.uso === it.uso
                                );

                                return (
                                  <tr key={`${it.matId}-${it.uso}`} className="hover:bg-slate-50/50">
                                    <td className="py-2.5 px-2 font-medium text-slate-800">{it.nombre}</td>
                                    <td className="py-2.5 px-2 text-center font-mono font-bold">
                                      {it.uso.toFixed(2)} <span className="text-[10px] text-slate-400">{it.unidad}</span>
                                    </td>
                                    <td className="py-2.5 px-2 text-right font-mono text-slate-600">{fmtBs(it.ppu)}</td>
                                    <td className="py-2.5 px-2 text-right font-bold font-mono text-slate-800">{fmtBs(it.costo)}</td>
                                    <td className="py-2.5 px-2 text-center">
                                      <button
                                        onClick={() => handleQuitarLinea(globalIdx)}
                                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-all cursor-pointer"
                                        title="Quitar este componente"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Bottom summary overview stats */}
                <div className="pt-4 border-t border-slate-200 flex flex-col md:flex-row md:items-center justify-between text-xs text-slate-500 gap-2 font-mono">
                  <div>
                    {Object.keys(productGroups).length} soportes estructurados · {totalLinesCount} componentes de recetas en total.
                  </div>
                  <div className="font-extrabold text-sm text-[#051125] font-sans flex items-center gap-1.5 bg-slate-50 p-2 px-3 rounded-lg border border-slate-100">
                    <span>Inversión Total en Materiales de Recetas:</span>
                    <span className="text-[#C67C3E] font-mono">{fmtBs(totalGeneralMaterialCost)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: COSTOS Y PRECIO SUGERIDO */}
      {activeSubTab === 'costos' && (
        <div className="space-y-3.5 animate-fade-in" id="costs-form-anchor">
          
          {/* Top Form to Edit / input Op costs */}
          <div className="bg-white p-3.5 px-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
            <h4 className="font-bold text-xs text-[#051125] pb-1 border-b flex items-center gap-1.5">
              <Calculator className="w-4 h-4 text-[#C67C3E]" />
              Configurar Costos Operativos y Margen de Utilidad
            </h4>
            
            <div className="p-2 px-3 bg-[#C67C3E]/5 border border-[#C67C3E]/10 text-[10px] text-slate-600 rounded-lg leading-snug flex gap-1.5">
              <Coins className="w-3.5 h-3.5 shrink-0 text-[#C67C3E] mt-0.5" />
              <span>Seleccione un soporte, complete la estimación de mano de obra y costos fijos indirectos por unidad para ver su ficha integrada de costos completos y el precio de venta sugerido legal con factura boliviano.</span>
            </div>

            {uniqueProducts.length === 0 ? (
              <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed text-slate-500">
                <Calculator className="w-8 h-8 mx-auto opacity-50 mb-1.5 stroke-1" />
                <p className="text-xs font-bold font-sans">No hay productos estructurados en "Armar producto".</p>
                <p className="text-[10px] mt-1">Estructure la composición física de los materiales de algún soporte primero para verlos y cotizar costos operativos.</p>
                <button 
                  onClick={() => setActiveSubTab('producto')}
                  className="mt-2.5 text-[11px] bg-[#051125] text-white hover:bg-[#C67C3E] px-3 py-1 rounded-lg cursor-pointer font-bold inline-block"
                >
                  Ir a Estructurar Soporte
                </button>
              </div>
            ) : (
              <form onSubmit={handleGuardarCostos} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-2 items-end">
                <div>
                  <label className="block text-[10px] font-extrabold text-[#020914] uppercase tracking-wider mb-1 font-mono">Seleccionar Soporte/Estructura:</label>
                  <select
                    value={opProdSel}
                    onChange={(e) => setOpProdSel(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-800 focus:outline-[#C67C3E] cursor-pointer font-extrabold"
                  >
                    {uniqueProducts.map((p, i) => (
                      <option key={i} value={p}>
                        {p} {costosPorProducto[p] ? '✓ (Costeado)' : '✖ (Pendiente)'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-800 uppercase tracking-wider mb-1 font-mono">Estimado Mano de Obra (Bs/u):</label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={opMano}
                    onChange={(e) => setOpMano(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-800 font-mono focus:ring-1 focus:ring-[#C67C3E]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-800 uppercase tracking-wider mb-1 font-mono">Luz, Agua, Gas / Consumibles (Bs/u):</label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={opServicios}
                    onChange={(e) => setOpServicios(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-800 font-mono focus:ring-1 focus:ring-[#C67C3E]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-800 uppercase tracking-wider mb-1 font-mono">Alquiler / Amortización Herram. (Bs/u):</label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={opAlquiler}
                    onChange={(e) => setOpAlquiler(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-800 font-mono focus:ring-1 focus:ring-[#C67C3E]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-800 uppercase tracking-wider mb-1 font-sans">Logística / Transporte / Flete (Bs/u):</label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={opTransporte}
                    onChange={(e) => setOpTransporte(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-800 font-mono focus:ring-1 focus:ring-[#C67C3E]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-800 uppercase tracking-wider mb-1 font-mono">Otros Gastos Indirectos (Bs/u):</label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={opOtros}
                    onChange={(e) => setOpOtros(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-800 font-mono focus:ring-1 focus:ring-[#C67C3E]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-[#9c5a22] uppercase tracking-wider mb-1 font-sans">Margen Utilidad Deseada (%):</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      min="1"
                      max="400"
                      placeholder="30"
                      value={opMargen}
                      onChange={(e) => setOpMargen(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 bg-amber-50/50 border border-amber-200 text-slate-800 font-bold font-mono focus:ring-1 focus:ring-[#C67C3E] rounded-md"
                    />
                    <span className="absolute right-2.5 top-1.5 text-xs text-[#C67C3E] font-bold font-sans">%</span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#051125] text-white hover:bg-[#C67C3E] py-1.5 px-3 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1 shadow h-[32px] mb-0.5"
                >
                  <Save className="w-4 h-4" />
                  Guardar costos y margen
                </button>
              </form>
            )}
          </div>

          {/* Cards for each single product breakdown cost sheet */}
          <div className="space-y-4">
            <h4 className="font-bold text-sm text-[#051125] pb-1 border-b flex items-center gap-1.5">
              <Coins className="w-4.5 h-4.5 text-[#051125]" />
              Fichas de Análisis Financiero de Costos y Precio Comercial
            </h4>

            {uniqueProducts.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center italic">Sin productos estructurados disponibles.</p>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {uniqueProducts.map((prodName: string) => {
                  const matLineas = lineasProducto.filter(l => l.producto === prodName);
                  const materialsCostSum = matLineas.reduce((s, l) => s + l.costo, 0);

                  const opConfig = costosPorProducto[prodName] || {
                    mano: 0, servicios: 0, alquiler: 0, transporte: 0, otros: 0, margen: 30
                  };

                  const opCostSum = opConfig.mano + opConfig.servicios + opConfig.alquiler + opConfig.transporte + opConfig.otros;
                  const totalProductionCost = materialsCostSum + opCostSum;
                  const profitAmt = totalProductionCost * (opConfig.margen / 100);
                  const suggestedSalePrice = totalProductionCost + profitAmt;

                  const isCostOpened = !!expandedCosts[prodName];

                  return (
                    <div key={prodName} className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-white transition-all">
                      {/* Card Header toggle */}
                      <div 
                        onClick={() => setExpandedCosts(prev => ({ ...prev, [prodName]: !isCostOpened }))}
                        className="p-4 px-5 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between cursor-pointer select-none gap-2 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {isCostOpened ? <ChevronDown className="w-4 h-4 text-[#C67C3E]" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                          <span className="font-extrabold text-[#051125] text-[13px] truncate">{prodName}</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs">
                          <span className="font-medium text-slate-500 font-mono text-[11px]">
                            Costo Total: {fmtBs(totalProductionCost)}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100 font-sans">
                            Sugerido: {fmtBs(suggestedSalePrice)}
                          </span>
                        </div>
                      </div>

                      {/* Card Body */}
                      {isCostOpened && (
                        <div className="p-5 space-y-4 font-sans text-xs">
                          
                          {/* Inner Table Materials */}
                          <div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-mono">
                              1. Estructura Física (Materiales usados):
                            </div>
                            <table className="w-full text-left font-sans text-[11px] border-collapse bg-slate-50/60 rounded-xl overflow-hidden">
                              <thead>
                                <tr className="border-b border-slate-200/60 bg-slate-100/50 text-[9px] uppercase font-bold text-slate-400">
                                  <th className="py-2 px-3">Material</th>
                                  <th className="py-2 px-2 text-center">Cantidad</th>
                                  <th className="py-2 px-2 text-right">Unitario</th>
                                  <th className="py-2 px-3 text-right">Total</th>
                                </tr>
                              </thead>
                              <tbody>
                                {matLineas.length === 0 ? (
                                  <tr>
                                    <td colSpan={4} className="py-3 px-3 text-center text-slate-400 italic">No tiene materiales cargados en "Armar producto".</td>
                                  </tr>
                                ) : (
                                  matLineas.map((linea, idx) => (
                                    <tr key={idx} className="border-b border-slate-100/40">
                                      <td className="py-1.5 px-3 font-medium text-slate-800">{linea.nombre}</td>
                                      <td className="py-1.5 px-2 text-center font-mono">{linea.uso.toFixed(2)} {linea.unidad}</td>
                                      <td className="py-1.5 px-2 text-right font-mono text-slate-500">{fmtBs(linea.ppu)}</td>
                                      <td className="py-1.5 px-3 text-right font-bold font-mono text-slate-700">{fmtBs(linea.costo)}</td>
                                    </tr>
                                  ))
                                )}
                                <tr className="font-extrabold text-slate-800 bg-slate-100/20">
                                  <td colSpan={3} className="py-2 px-3 text-right font-bold text-slate-500 text-[10px]">Subtotal Insumos de Producción:</td>
                                  <td className="py-2 px-3 text-right font-mono text-[#051125] font-extrabold">{fmtBs(materialsCostSum)}</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>

                          {/* Inner Table Operational Costs */}
                          <div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-mono">
                              2. Costos Operativos Fijos y Logísticos:
                            </div>
                            <div className="bg-slate-50/60 border border-slate-100 rounded-xl p-3 px-4 space-y-1.5 text-[11px] font-sans">
                              {opConfig.mano > 0 && (
                                <div className="flex justify-between">
                                  <span className="text-slate-500">Mano de Obra Metalúrgica</span>
                                  <span className="font-mono text-slate-700">{fmtBs(opConfig.mano)}</span>
                                </div>
                              )}
                              {opConfig.servicios > 0 && (
                                <div className="flex justify-between">
                                  <span className="text-slate-500">Energía Eléctrica / Agua / Insumos de Gas</span>
                                  <span className="font-mono text-slate-700">{fmtBs(opConfig.servicios)}</span>
                                </div>
                              )}
                              {opConfig.alquiler > 0 && (
                                <div className="flex justify-between">
                                  <span className="text-slate-500">Alquiler proporcional de Taller / Desgaste</span>
                                  <span className="font-mono text-slate-700">{fmtBs(opConfig.alquiler)}</span>
                                </div>
                              )}
                              {opConfig.transporte > 0 && (
                                <div className="flex justify-between">
                                  <span className="text-slate-500">Flete Logístico y Desplazamiento</span>
                                  <span className="font-mono text-slate-700">{fmtBs(opConfig.transporte)}</span>
                                </div>
                              )}
                              {opConfig.otros > 0 && (
                                <div className="flex justify-between">
                                  <span className="text-slate-500">Otros gastos y contingencia</span>
                                  <span className="font-mono text-slate-700">{fmtBs(opConfig.otros)}</span>
                                </div>
                              )}
                              {opCostSum === 0 ? (
                                <div className="text-slate-400 text-center italic text-[11px] py-1.5 leading-snug">
                                  Sin costos operativos fijados aún para este soporte.
                                </div>
                              ) : (
                                <div className="flex justify-between font-extrabold border-t border-slate-200/60 pt-1.5 text-slate-800">
                                  <span className="text-[10px] uppercase font-bold text-slate-500 font-mono">Subtotal Gastos Operativos:</span>
                                  <span className="font-mono font-extrabold">{fmtBs(opCostSum)}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Price Formula Summary */}
                          <div className="border-t border-dashed border-slate-200 pt-3.5 space-y-2.5">
                            <div className="flex justify-between text-xs items-center leading-none">
                              <span className="text-slate-600 font-medium">Costo Total de Producción (1 + 2):</span>
                              <span className="font-mono font-extrabold text-slate-900 text-sm">{fmtBs(totalProductionCost)}</span>
                            </div>

                            <div className="flex justify-between text-xs items-center leading-none">
                              <span className="text-slate-500">
                                Ganancia Comercial configurada (<span className="text-[#C67C3E] font-bold">{opConfig.margen}%</span>):
                              </span>
                              <span className="font-mono text-slate-600 font-bold">+{fmtBs(profitAmt)}</span>
                            </div>

                            <div className="flex justify-between text-base items-center bg-[#051125]/5 border border-[#051125]/10 rounded-2xl p-3 px-4 leading-none">
                              <span className="text-[#051125] font-extrabold font-sans">Precio de Venta Sugerido:</span>
                              <span className="font-extrabold text-base text-[#C67C3E] font-mono">{fmtBs(suggestedSalePrice)}</span>
                            </div>
                          </div>

                          {/* Edit Trigger */}
                          <div className="text-right pt-2 border-t border-slate-100">
                            <button
                              onClick={() => handleEditarCostos(prodName)}
                              className="text-[11px] font-bold text-[#051125] border border-slate-200 rounded-lg p-1 px-3 hover:bg-slate-50 hover:border-[#C67C3E] transition-all cursor-pointer flex items-center gap-1 ml-auto shrink-0"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              Cargar en formulario para editar
                            </button>
                          </div>

                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Global consolidated bottom card if multiple products exist to summarize */}
            {uniqueProducts.length > 1 && (() => {
              let sumMatGlobalNum = 0;
              let sumCostProdGlobalNum = 0;
              let sumSalePriceGlobalNum = 0;

              uniqueProducts.forEach((p: string) => {
                const matLineas = lineasProducto.filter(l => l.producto === p);
                const mats = matLineas.reduce((s, l) => s + l.costo, 0);

                const ops = costosPorProducto[p] || {
                  mano: 0, servicios: 0, alquiler: 0, transporte: 0, otros: 0, margen: 30
                };
                const opsSum = ops.mano + ops.servicios + ops.alquiler + ops.transporte + ops.otros;
                
                const costTot = mats + opsSum;
                const saleTot = costTot * (1 + ops.margen / 100);

                sumMatGlobalNum += mats;
                sumCostProdGlobalNum += costTot;
                sumSalePriceGlobalNum += saleTot;
              });

              return (
                <div className="p-5 rounded-2xl bg-[#051125] border border-white/5 text-slate-200 shadow-md space-y-4 mt-6">
                  <div>
                    <h5 className="font-extrabold text-sm text-[#C67C3E] flex items-center gap-1.5">
                      <Sparkles className="w-4.5 h-4.5" />
                      Consolidado Global de Operación Comercial (Ferretería & Climatización)
                    </h5>
                    <p className="text-[11px] text-slate-400">Totalización consolidada de producción unitada para los {uniqueProducts.length} soportes configurados.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Materias Primas</div>
                      <div className="text-sm font-extrabold font-mono text-white mt-1">{fmtBs(sumMatGlobalNum)}</div>
                    </div>

                    <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Costo Consolidado Producción</div>
                      <div className="text-sm font-extrabold font-mono text-white mt-1">{fmtBs(sumCostProdGlobalNum)}</div>
                    </div>

                    <div className="p-3 bg-amber-500/10 border border-[#C67C3E]/25 rounded-xl">
                      <div className="text-[10px] text-[#C67C3E] font-bold uppercase tracking-wider">Valor Esperado de Venta Sugerida</div>
                      <div className="text-sm font-extrabold font-mono text-[#C67C3E] mt-1">{fmtBs(sumSalePriceGlobalNum)}</div>
                    </div>
                  </div>
                </div>
              );
            })()}

          </div>

        </div>
      )}

      {/* MODAL DE EDICIÓN DE MATERIA PRIMA */}
      {editingMaterial && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border-2 border-slate-300 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative space-y-4 my-auto animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h4 className="font-extrabold text-base text-[#051125] flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-[#C67C3E]" />
                Editar Materia Prima
              </h4>
              <button 
                onClick={() => setEditingMaterial(null)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-[11.5px] rounded-xl leading-relaxed flex gap-2">
              <Info className="w-4.5 h-4.5 shrink-0 mt-0.5 text-[#C67C3E]" />
              <span>
                <strong>Atención:</strong> Cualquier cambio en el precio de compra o en la cantidad total actualizará automáticamente el costo unitario por unidad (Bs/{editUnidad}) e impactará de forma instantánea en cualquier producto de "Armar producto" que utilice este material, sincronizando el catálogo de precios de forma inmediata.
              </span>
            </div>

            <form onSubmit={handleGuardarMaterial} className="space-y-4">
              <div>
                <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-sans">
                  Nombre del Material:
                </label>
                <input 
                  type="text" 
                  value={editNombre}
                  onChange={(e) => setEditNombre(e.target.value)}
                  className="w-full text-sm px-4 py-2.5 bg-white border-2 border-slate-400 hover:border-slate-500 focus:border-[#C67C3E] focus:ring-4 focus:ring-[#C67C3E]/20 focus:outline-none rounded-lg text-slate-800 font-semibold transition-all shadow-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-sans">
                    Tipo de Material:
                  </label>
                  <select
                    value={editTipo}
                    onChange={(e) => setEditTipo(e.target.value)}
                    className="w-full text-sm px-3 py-2.5 bg-white border-2 border-slate-400 hover:border-slate-500 focus:border-[#C67C3E] focus:ring-4 focus:ring-[#C67C3E]/20 focus:outline-none rounded-lg text-slate-800 font-semibold cursor-pointer shadow-sm"
                  >
                    <option value="Metal">🔩 Metal</option>
                    <option value="Madera">🪵 Madera</option>
                    <option value="Pintura">🎨 Pintura</option>
                    <option value="Tornillería">🔩 Tornillería</option>
                    <option value="Electrónico">🔌 Electrónico</option>
                    <option value="Accesorios">⛓️ Accesorios</option>
                    <option value="Otros">📦 Otros</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-sans">
                    Unidad de Medida:
                  </label>
                  <select
                    value={editUnidad}
                    onChange={(e) => setEditUnidad(e.target.value)}
                    className="w-full text-sm px-3 py-2.5 bg-white border-2 border-slate-400 hover:border-slate-500 focus:border-[#C67C3E] focus:ring-4 focus:ring-[#C67C3E]/20 focus:outline-none rounded-lg text-slate-800 font-semibold cursor-pointer shadow-sm"
                  >
                    <option value="cm">cm (centímetros)</option>
                    <option value="m">m (metros)</option>
                    <option value="kg">kg (kilogramos)</option>
                    <option value="L">L (litros)</option>
                    <option value="u">u (unidades)</option>
                    <option value="Pto">Pto (puntos)</option>
                    <option value="Gl">Gl (galones)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-sans">
                    Cantidad Total:
                  </label>
                  <input 
                    type="text" 
                    inputMode="decimal"
                    value={editCantidad}
                    onChange={(e) => setEditCantidad(e.target.value)}
                    className="w-full text-sm px-3 py-2.5 bg-white border-2 border-slate-400 hover:border-slate-500 focus:border-[#C67C3E] focus:ring-4 focus:ring-[#C67C3E]/20 focus:outline-none rounded-lg text-slate-800 font-semibold shadow-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-sans">
                    Disponible:
                  </label>
                  <input 
                    type="text" 
                    inputMode="decimal"
                    value={editDisponible}
                    onChange={(e) => setEditDisponible(e.target.value)}
                    className="w-full text-sm px-3 py-2.5 bg-white border-2 border-slate-400 hover:border-slate-500 focus:border-[#C67C3E] focus:ring-4 focus:ring-[#C67C3E]/20 focus:outline-none rounded-lg text-slate-800 font-semibold shadow-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-[#C67C3E] uppercase tracking-wider mb-1.5 font-sans">
                    Precio Total (Bs):
                  </label>
                  <input 
                    type="text" 
                    inputMode="decimal"
                    value={editPrecio}
                    onChange={(e) => setEditPrecio(e.target.value)}
                    className="w-full text-sm px-3 py-2.5 bg-amber-50 border-2 border-amber-400 hover:border-amber-500 focus:border-[#C67C3E] focus:ring-4 focus:ring-[#C67C3E]/20 focus:outline-none rounded-lg text-slate-900 font-black shadow-sm"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-sans">
                    Proveedor:
                  </label>
                  <input 
                    type="text" 
                    value={editProveedor}
                    onChange={(e) => setEditProveedor(e.target.value)}
                    className="w-full text-sm px-4 py-2.5 bg-white border-2 border-slate-400 hover:border-slate-500 focus:border-[#C67C3E] focus:ring-4 focus:ring-[#C67C3E]/20 focus:outline-none rounded-lg text-slate-800 font-semibold shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-sans">
                    Fecha de Compra:
                  </label>
                  <input 
                    type="date" 
                    value={editFecha}
                    onChange={(e) => setEditFecha(e.target.value)}
                    className="w-full text-sm px-4 py-2.5 bg-white border-2 border-slate-400 hover:border-slate-500 focus:border-[#C67C3E] focus:ring-4 focus:ring-[#C67C3E]/20 focus:outline-none rounded-lg text-slate-800 font-semibold shadow-sm"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingMaterial(null)}
                  className="px-5 py-2.5 rounded-xl border-2 border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 text-sm font-bold transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#051125] text-white hover:bg-[#C67C3E] text-sm font-black transition-all cursor-pointer shadow-md hover:shadow-lg flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
