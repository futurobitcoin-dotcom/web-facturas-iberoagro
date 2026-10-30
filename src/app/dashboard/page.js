'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import Link from 'next/link';
import { 
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function Dashboard() {
  const [datosTorta, setDatosTorta] = useState([]);
  const [datosBarras, setDatosBarras] = useState([]);
  const [datosComprobantes, setDatosComprobantes] = useState([]);
  const [topProveedores, setTopProveedores] = useState([]);
  const [resumen, setResumen] = useState({ totalGastado: 0, cantidadFacturas: 0, promedio: 0 });
  const [cargando, setCargando] = useState(true);
  
  // Nuevo estado para el filtro de año
  const [anioSeleccionado, setAnioSeleccionado] = useState(new Date().getFullYear().toString());
  const [aniosDisponibles, setAniosDisponibles] = useState([]);

  useEffect(() => {
    async function cargarDatos() {
      const { data: detalles } = await supabase.from('facturas_detalle').select('cuenta_contable_id, monto');
      const { data: encabezados } = await supabase.from('facturas_encabezado').select('fecha_emision, total, razon_social, tipo_comprobante');

      if (detalles && encabezados) {
        // --- 1. DATOS PARA TORTA (Categorías) ---
        const agrupadoCategorias = detalles.reduce((acc, curr) => {
          const cat = curr.cuenta_contable_id || 'OTRO';
          acc[cat] = (acc[cat] || 0) + curr.monto;
          return acc;
        }, {});
        const arrayTorta = Object.keys(agrupadoCategorias).map(key => ({
          name: key.split(' - ')[0], 
          value: agrupadoCategorias[key]
        })).sort((a, b) => b.value - a.value);
        setDatosTorta(arrayTorta);

        // --- 2. DATOS PARA TOP PROVEEDORES ---
        const agrupadoProveedores = encabezados.reduce((acc, curr) => {
          const prov = curr.razon_social || 'Sin Nombre';
          acc[prov] = (acc[prov] || 0) + curr.total;
          return acc;
        }, {});
        const arrayProveedores = Object.keys(agrupadoProveedores).map(key => ({
          nombre: key,
          total: agrupadoProveedores[key]
        })).sort((a, b) => b.total - a.total).slice(0, 5);
        setTopProveedores(arrayProveedores);

        // --- 3. DATOS PARA TIPO DE COMPROBANTE (NUEVO) ---
        const agrupadoComprobantes = encabezados.reduce((acc, curr) => {
          const tipo = curr.tipo_comprobante || 'Otro';
          acc[tipo] = (acc[tipo] || 0) + curr.total;
          return acc;
        }, {});
        const arrayComprobantes = Object.keys(agrupadoComprobantes).map(key => ({
          name: key,
          value: agrupadoComprobantes[key]
        }));
        setDatosComprobantes(arrayComprobantes);

        // --- 4. OBTENER AÑOS DISPONIBLES (Para el selector) ---
        const anios = [...new Set(encabezados.map(e => e.fecha_emision ? e.fecha_emision.substring(0, 4) : null).filter(Boolean))];
        setAniosDisponibles(anios.sort().reverse());
        if(anios.length > 0 && !anios.includes(anioSeleccionado)) {
            setAnioSeleccionado(anios[0]);
        }

        // --- 5. RESUMEN GENERAL ---
        const totalGastado = encabezados.reduce((sum, f) => sum + (f.total || 0), 0);
        const cantidadFacturas = encabezados.length;
        const promedio = cantidadFacturas > 0 ? totalGastado / cantidadFacturas : 0;
        setResumen({ totalGastado, cantidadFacturas, promedio });
      }
      setCargando(false);
    }
    cargarDatos();
  }, []);

  // Efecto separado para recalcular las barras cuando cambia el año seleccionado
  useEffect(() => {
    async function actualizarBarras() {
        const { data: encabezados } = await supabase.from('facturas_encabezado').select('fecha_emision, total');
        if (encabezados) {
            const agrupadoMeses = encabezados
                .filter(e => e.fecha_emision && e.fecha_emision.startsWith(anioSeleccionado))
                .reduce((acc, curr) => {
                    const mes = curr.fecha_emision.substring(5, 7); // Extrae "MM"
                    acc[mes] = (acc[mes] || 0) + curr.total;
                    return acc;
                }, {});

            const arrayBarras = Object.keys(agrupadoMeses).map(key => ({
                mes: key,
                total: agrupadoMeses[key]
            })).sort((a, b) => a.mes.localeCompare(b.mes));
            
            setDatosBarras(arrayBarras);
        }
    }
    if(!cargando) actualizarBarras();
  }, [anioSeleccionado, cargando]);

  if (cargando) return <div className="p-10 text-center text-slate-500 font-medium">Cargando inteligencia de datos...</div>;

  return (
    <main className="p-8 font-sans bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        
        {/* Encabezado */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Dashboard Financiero</h1>
            <p className="text-slate-500 mt-1">Resumen estratégico de tus gastos</p>
          </div>
          <Link href="/" className="bg-slate-800 text-white px-6 py-2.5 rounded-lg shadow hover:bg-slate-900 transition font-medium">
            ← Volver al Panel
          </Link>
        </div>

        {/* Tarjetas de Resumen (KPIs) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-emerald-500">
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Total Gastado (Histórico)</p>
            <p className="text-3xl font-extrabold text-slate-800">${resumen.totalGastado.toLocaleString('es-AR')}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-blue-500">
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Facturas Cargadas</p>
            <p className="text-3xl font-extrabold text-slate-800">{resumen.cantidadFacturas} <span className="text-lg text-slate-400 font-normal">comprobantes</span></p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-purple-500">
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Promedio por Factura</p>
            <p className="text-3xl font-extrabold text-slate-800">${resumen.promedio.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          
          {/* Gráfico de Torta: Categorías */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 lg:col-span-2">
            <h2 className="text-lg font-bold text-slate-700 mb-6">Distribución por Categoría</h2>
            {datosTorta.length > 0 ? (
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={datosTorta} cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={3} dataKey="value">
                      {datosTorta.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(value) => `$${value.toLocaleString('es-AR')}`} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle"/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : <p className="text-center text-slate-400 py-10">No hay datos de categorías</p>}
          </div>

          {/* Top Proveedores */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-700 mb-6">Top 5 Proveedores</h2>
            <div className="flex flex-col gap-4">
              {topProveedores.map((prov, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold">{index + 1}</span>
                    <p className="text-sm font-medium text-slate-700 truncate w-32 md:w-40">{prov.nombre}</p>
                  </div>
                  <p className="text-sm font-bold text-slate-800">${prov.total.toLocaleString('es-AR')}</p>
                </div>
              ))}
            </div>
          </div>

          {/* NUEVO: Gráfico de Torta por Tipo de Comprobante */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 lg:col-span-3">
            <h2 className="text-lg font-bold text-slate-700 mb-6">Gasto según Tipo de Comprobante</h2>
            {datosComprobantes.length > 0 ? (
              <div className="h-72 w-full flex justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={datosComprobantes} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                      {datosComprobantes.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(value) => `$${value.toLocaleString('es-AR')}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : <p className="text-center text-slate-400 py-10">No hay datos</p>}
          </div>

          {/* Gráfico de Barras: Evolución Mensual (CON FILTRO DE AÑO) */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 lg:col-span-3">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-slate-700">Evolución Mensual de Gastos</h2>
                <select 
                    value={anioSeleccionado} 
                    onChange={(e) => setAnioSeleccionado(e.target.value)}
                    className="border border-slate-300 rounded-lg p-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                >
                    {aniosDisponibles.map(anio => <option key={anio} value={anio}>{anio}</option>)}
                    {aniosDisponibles.length === 0 && <option value="">Sin datos</option>}
                </select>
            </div>
            
            {datosBarras.length > 0 ? (
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={datosBarras} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="mes" tick={{fill: '#64748b'}} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(value) => `$${value / 1000}k`} tick={{fill: '#64748b'}} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(value) => `$${value.toLocaleString('es-AR')}`} cursor={{fill: '#f1f5f9'}} />
                    <Bar dataKey="total" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={60} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : <p className="text-center text-slate-400 py-10">No hay datos para este año</p>}
          </div>

        </div>
      </div>
    </main>
  );
}