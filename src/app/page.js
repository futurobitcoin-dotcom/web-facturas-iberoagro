'use client';

import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import Link from 'next/link';
import React from 'react';

export default function Home() {
  const [facturas, setFacturas] = useState([]);
  const [detalles, setDetalles] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filaExpandida, setFilaExpandida] = useState(null); 

  const [filtroFechaDesde, setFiltroFechaDesde] = useState('');
  const [filtroFechaHasta, setFiltroFechaHasta] = useState('');
  const [filtroProveedor, setFiltroProveedor] = useState('');
  const [filtroCuit, setFiltroCuit] = useState('');
  const [filtroComprobante, setFiltroComprobante] = useState('');
  const [filtroMonto, setFiltroMonto] = useState('');

  const [mostrarSugerenciasProv, setMostrarSugerenciasProv] = useState(false);
  const [mostrarSugerenciasCuit, setMostrarSugerenciasCuit] = useState(false);

  useEffect(() => {
    async function cargarDatos() {
      const { data: dataFacturas, error: errorFacturas } = await supabase
        .from('facturas_encabezado')
        .select('*')
        .order('fecha_emision', { ascending: false });

      if (!errorFacturas && dataFacturas) {
        setFacturas(dataFacturas);
      }

      const { data: dataDetalles, error: errorDetalles } = await supabase
        .from('facturas_detalle')
        .select('*');

      if (!errorDetalles && dataDetalles) {
        setDetalles(dataDetalles);
      }

      setCargando(false);
    }
    
    cargarDatos();

    window.addEventListener('focus', cargarDatos);
    return () => window.removeEventListener('focus', cargarDatos);
  }, []);

  const proveedoresUnicos = [...new Set(facturas.map(f => f.razon_social).filter(Boolean))];
  const cuitsUnicos = [...new Set(facturas.map(f => f.proveedor_cuit).filter(Boolean))];

  const facturasFiltradas = facturas.filter((factura) => {
    let cumpleFecha = true;
    if (filtroFechaDesde) cumpleFecha = cumpleFecha && factura.fecha_emision >= filtroFechaDesde;
    if (filtroFechaHasta) cumpleFecha = cumpleFecha && factura.fecha_emision <= filtroFechaHasta;
    
    const cumpleProv = filtroProveedor === '' || (factura.razon_social && factura.razon_social.toLowerCase().includes(filtroProveedor.toLowerCase()));
    const cumpleCuit = filtroCuit === '' || (factura.proveedor_cuit && factura.proveedor_cuit.includes(filtroCuit));
    
    const numCompleto = `${factura.punto_venta}-${factura.numero_comprobante}`;
    const cumpleComprobante = filtroComprobante === '' || numCompleto.includes(filtroComprobante) || factura.numero_comprobante.includes(filtroComprobante);
    
    const cumpleMonto = filtroMonto === '' || factura.total >= parseFloat(filtroMonto);

    return cumpleFecha && cumpleProv && cumpleCuit && cumpleComprobante && cumpleMonto;
  });

  const totalFiltrado = facturasFiltradas.reduce((sum, f) => sum + (f.total || 0), 0);

  const limpiarFiltros = () => {
    setFiltroFechaDesde('');
    setFiltroFechaHasta('');
    setFiltroProveedor('');
    setFiltroCuit('');
    setFiltroComprobante('');
    setFiltroMonto('');
  };

  const eliminarFactura = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar esta factura? Esta acción no se puede deshacer.')) {
      const { error } = await supabase.from('facturas_encabezado').delete().eq('id', id);
      if (!error) {
        setFacturas(facturas.filter(f => f.id !== id));
        setDetalles(detalles.filter(d => d.factura_id !== id));
      } else {
        alert("Error al eliminar: " + error.message);
      }
    }
  };

  const toggleDetalle = (id) => {
    if (filaExpandida === id) setFilaExpandida(null);
    else setFilaExpandida(id);
  };

  const getDetallesFactura = (facturaId) => detalles.filter(d => d.factura_id === facturaId);

  return (
    <main className="font-sans bg-slate-50 min-h-screen pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        
        <div className="w-full mb-8 rounded-2xl overflow-hidden shadow-lg border border-slate-200 bg-white">
          <img src="/banner.jpg" alt="Iberoagro Banner" className="w-full h-auto object-cover max-h-[300px]" />
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Panel de Facturas</h1>
            <p className="text-slate-500 mt-1">Gestioná y filtrá los comprobantes cargados</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Link href="/factura/nueva" className="bg-slate-800 text-white px-6 py-2.5 rounded-lg shadow-sm hover:bg-slate-900 transition-all font-medium flex items-center gap-2">
              + Nueva Factura
            </Link>
            <Link href="/dashboard" className="bg-blue-600 text-white px-6 py-2.5 rounded-lg shadow-sm hover:bg-blue-700 transition-all font-medium flex items-center gap-2">
              Ver Dashboard
            </Link>
            <Link href="/proveedores" className="bg-purple-600 text-white px-6 py-2.5 rounded-lg shadow-sm hover:bg-purple-700 transition-all font-medium flex items-center gap-2">
              Legajo Proveedores
            </Link>
            <Link href="/exportar" className="bg-emerald-600 text-white px-6 py-2.5 rounded-lg shadow-sm hover:bg-emerald-700 transition-all font-medium flex items-center gap-2">
              Exportar a Excel
            </Link>
          </div>
        </div>
        
        {/* Panel de Búsqueda */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 relative">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Desde</label>
            <input type="date" value={filtroFechaDesde} onChange={(e) => setFiltroFechaDesde(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Hasta</label>
            <input type="date" value={filtroFechaHasta} onChange={(e) => setFiltroFechaHasta(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition" />
          </div>
          
          <div className="relative">
            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Proveedor</label>
            <input 
              type="text" 
              placeholder="Ej: Rostica..." 
              value={filtroProveedor} 
              onChange={(e) => { setFiltroProveedor(e.target.value); setMostrarSugerenciasProv(true); }} 
              onBlur={() => setTimeout(() => setMostrarSugerenciasProv(false), 200)}
              onFocus={() => setMostrarSugerenciasProv(true)}
              className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition" 
            />
            {mostrarSugerenciasProv && filtroProveedor && (
              <ul className="absolute z-10 w-full bg-white border border-slate-200 mt-1 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {proveedoresUnicos.filter(p => p.toLowerCase().includes(filtroProveedor.toLowerCase())).map((prov, i) => (
                  <li key={i} onClick={() => { setFiltroProveedor(prov); setMostrarSugerenciasProv(false); }} className="px-4 py-2 hover:bg-slate-100 cursor-pointer text-sm text-slate-700">
                    {prov}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="relative">
            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">CUIT Proveedor</label>
            <input 
              type="text" 
              placeholder="Ej: 307100..." 
              value={filtroCuit} 
              onChange={(e) => { setFiltroCuit(e.target.value); setMostrarSugerenciasCuit(true); }} 
              onBlur={() => setTimeout(() => setMostrarSugerenciasCuit(false), 200)}
              onFocus={() => setMostrarSugerenciasCuit(true)}
              className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition" 
            />
            {mostrarSugerenciasCuit && filtroCuit && (
              <ul className="absolute z-10 w-full bg-white border border-slate-200 mt-1 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {cuitsUnicos.filter(c => c.includes(filtroCuit)).map((cuit, i) => (
                  <li key={i} onClick={() => { setFiltroCuit(cuit); setMostrarSugerenciasCuit(false); }} className="px-4 py-2 hover:bg-slate-100 cursor-pointer text-sm text-slate-700">
                    {cuit}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">N° Comprobante</label>
            <input type="text" placeholder="Ej: 0003-0000..." value={filtroComprobante} onChange={(e) => setFiltroComprobante(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Monto Mínimo ($)</label>
            <input type="number" placeholder="Ej: 50000" value={filtroMonto} onChange={(e) => setFiltroMonto(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition" />
          </div>
          
          <div className="flex items-end">
             <button onClick={limpiarFiltros} className="w-full bg-slate-200 text-slate-700 px-4 py-2.5 rounded-lg hover:bg-slate-300 transition font-medium text-sm">
                Limpiar Filtros
             </button>
          </div>
        </div>

        {cargando ? (
          <div className="text-center py-20 text-slate-500">Cargando facturas...</div>
        ) : facturasFiltradas.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 text-center py-20 text-slate-500">
            No se encontraron facturas con esos filtros.
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="py-4 px-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha</th>
                    <th className="py-4 px-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Proveedor</th>
                    <th className="py-4 px-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">CUIT</th>
                    <th className="py-4 px-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Tipo</th>
                    <th className="py-4 px-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">N° Comprobante</th>
                    <th className="py-4 px-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Total</th>
                    <th className="py-4 px-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {facturasFiltradas.map((factura) => {
                    const detallesFactura = getDetallesFactura(factura.id);
                    const estaExpandida = filaExpandida === factura.id;

                    return (
                      <React.Fragment key={factura.id}>
                        <tr className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-4 px-4 text-sm text-slate-700 whitespace-nowrap">{factura.fecha_emision}</td>
                          <td className="py-4 px-4 text-sm font-medium text-slate-800">{factura.razon_social || '---'}</td>
                          <td className="py-4 px-4 text-sm text-slate-600 whitespace-nowrap">{factura.proveedor_cuit}</td>
                          <td className="py-4 px-4 text-sm text-slate-600">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 whitespace-nowrap">
                              {factura.tipo_comprobante}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-sm text-slate-600 font-mono whitespace-nowrap">{factura.punto_venta}-{factura.numero_comprobante}</td>
                          <td className="py-4 px-4 text-sm text-right font-bold text-slate-800 whitespace-nowrap">${factura.total ? factura.total.toLocaleString('es-AR') : '0'}</td>
                          
                          {/* COLUMNA DE ACCIONES MEJORADA */}
                          <td className="py-4 px-4 text-center">
                            <div className="flex justify-center items-center gap-3 whitespace-nowrap text-sm">
                              <button onClick={() => toggleDetalle(factura.id)} className="text-slate-500 hover:text-slate-800 font-medium underline decoration-slate-300 underline-offset-2">
                                {estaExpandida ? 'Ocultar' : 'Detalle'}
                              </button>
                              
                              {factura.archivo_url && (
                                <a href={`${factura.archivo_url}?t=${new Date().getTime()}`} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:text-emerald-800 font-bold">
                                  Archivo
                                </a>
                              )}
                              
                              <Link href={`/factura/${factura.id}`} className="text-blue-600 hover:text-blue-800 font-bold">Editar</Link>
                              
                              <button onClick={() => eliminarFactura(factura.id)} className="text-red-600 hover:text-red-800 font-bold">Eliminar</button>
                            </div>
                          </td>
                        </tr>
                        
                        {estaExpandida && (
                          <tr>
                            <td colSpan="7" className="bg-slate-50 p-4 border-b border-slate-200">
                              <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Ítems / Conceptos de la Factura</h4>
                                {detallesFactura.length > 0 ? (
                                  <table className="min-w-full">
                                    <thead>
                                      <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
                                        <th className="pb-2 font-medium">Concepto</th>
                                        <th className="pb-2 font-medium">Cuenta Contable</th>
                                        <th className="pb-2 font-medium text-right">Monto Neto</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {detallesFactura.map((det, idx) => (
                                        <tr key={idx} className="text-sm text-slate-700 border-b border-slate-50 last:border-0">
                                          <td className="py-2">{det.concepto}</td>
                                          <td className="py-2 text-xs text-slate-500">{det.cuenta_contable_id}</td>
                                          <td className="py-2 text-right font-mono">${det.monto.toLocaleString('es-AR')}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                ) : (
                                  <p className="text-sm text-slate-400 italic">No hay detalles guardados para esta factura.</p>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                  <tr>
                    <td colSpan="5" className="py-4 px-4 text-right text-sm font-bold text-slate-600 uppercase tracking-wider">Total Filtrado:</td>
                    <td className="py-4 px-4 text-right text-lg font-extrabold text-emerald-600">${totalFiltrado.toLocaleString('es-AR')}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}