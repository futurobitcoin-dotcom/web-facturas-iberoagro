'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import Link from 'next/link';

export default function Proveedores() {
  const [facturas, setFacturas] = useState([]);
  const [detalles, setDetalles] = useState([]);
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargarDatos() {
      // 1. Cargamos las facturas primero
      const { data: dataFacturas, error: errorFacturas } = await supabase
        .from('facturas_encabezado')
        .select('*');

      if (!errorFacturas && dataFacturas) {
        setFacturas(dataFacturas);
      }

      // 2. Cargamos los detalles después
      const { data: dataDetalles, error: errorDetalles } = await supabase
        .from('facturas_detalle')
        .select('*');

      if (!errorDetalles && dataDetalles) {
        setDetalles(dataDetalles);
      }

      setCargando(false);
    }
    cargarDatos();
  }, []);

  const listaProveedores = [...new Set(facturas.map(f => f.razon_social).filter(Boolean))].sort();
  const sugerenciasProveedores = listaProveedores.filter(p => p.toLowerCase().includes(busqueda.toLowerCase()));

  const facturasProveedor = proveedorSeleccionado 
    ? facturas.filter(f => f.razon_social === proveedorSeleccionado) 
    : [];

  const totalComprado = facturasProveedor.reduce((sum, f) => sum + (f.total || 0), 0);
  const cantidadCompras = facturasProveedor.length;
  
  const facturaMasAlta = facturasProveedor.length > 0 
    ? facturasProveedor.reduce((max, f) => (f.total > max.total ? f : max), facturasProveedor[0]) 
    : null;

  const fechasOrdenadas = facturasProveedor.map(f => f.fecha_emision).sort().reverse();
  const ultimaCompra = fechasOrdenadas.length > 0 ? fechasOrdenadas[0] : '-';
  const cuitProveedor = facturasProveedor.length > 0 ? facturasProveedor[0].proveedor_cuit : '-';

  // Función para obtener los detalles de una factura específica
  const getDetallesFactura = (facturaId) => {
    return detalles.filter(d => d.factura_id === facturaId);
  };

  return (
    <main className="p-8 font-sans bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Legajos de Proveedores</h1>
            <p className="text-slate-500 mt-1">Historial estratégico y estadísticas</p>
          </div>
          <Link href="/" className="bg-slate-800 text-white px-6 py-2.5 rounded-lg shadow hover:bg-slate-900 transition font-medium">
            ← Volver al Panel
          </Link>
        </div>

        {/* Buscador */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
          <label className="block text-sm font-bold text-slate-700 mb-2">Buscar Proveedor</label>
          <div className="relative">
            <input 
              type="text" 
              placeholder="Escribí la razón social..."
              value={busqueda}
              onChange={(e) => { setBusqueda(e.target.value); setProveedorSeleccionado(''); }}
              className="w-full border border-slate-300 rounded-lg p-3 text-base focus:ring-2 focus:ring-emerald-500 outline-none transition"
            />
            {busqueda && !proveedorSeleccionado && sugerenciasProveedores.length > 0 && (
              <ul className="absolute z-10 w-full bg-white border border-slate-200 mt-1 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {sugerenciasProveedores.map((prov, i) => (
                  <li key={i} onClick={() => { setProveedorSeleccionado(prov); setBusqueda(prov); }} className="px-4 py-3 hover:bg-slate-100 cursor-pointer text-slate-700 font-medium border-b border-slate-100 last:border-0 transition-colors">
                    {prov}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {cargando ? (
          <p className="text-center text-slate-500 font-medium">Cargando datos...</p>
        ) : proveedorSeleccionado ? (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-bold text-slate-800 mb-1">{proveedorSeleccionado}</h2>
            <p className="text-slate-500 mb-6 font-mono text-sm bg-slate-200 inline-block px-3 py-1 rounded-full">CUIT: {cuitProveedor}</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-blue-500">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Comprado</p>
                <p className="text-3xl font-extrabold text-slate-800">${totalComprado.toLocaleString('es-AR')}</p>
                <p className="text-sm text-slate-500 mt-2">En {cantidadCompras} comprobantes</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-emerald-500">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Factura más Alta</p>
                <p className="text-3xl font-extrabold text-slate-800">${facturaMasAlta ? facturaMasAlta.total.toLocaleString('es-AR') : '0'}</p>
                <p className="text-sm text-slate-500 mt-2">{facturaMasAlta ? `Fecha: ${facturaMasAlta.fecha_emision}` : 'Sin datos'}</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-amber-500">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Última Compra</p>
                <p className="text-3xl font-extrabold text-slate-800">{ultimaCompra}</p>
                <p className="text-sm text-slate-500 mt-2">Fecha del último comprobante</p>
              </div>
            </div>

            <h3 className="text-lg font-bold text-slate-700 mb-4">Historial de Facturas y Detalles</h3>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <table className="min-w-full table-auto">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="py-4 px-6 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-1/4">Factura</th>
                    <th className="py-4 px-6 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Concepto / Detalle</th>
                    <th className="py-4 px-6 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Cuenta</th>
                    <th className="py-4 px-6 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {facturasProveedor.sort((a,b) => b.fecha_emision.localeCompare(a.fecha_emision)).map(f => {
                    const detallesFactura = getDetallesFactura(f.id);
                    const rowSpan = detallesFactura.length > 0 ? detallesFactura.length : 1;

                    return (
                      <React.Fragment key={f.id}>
                        {/* Fila del Encabezado de la Factura */}
                        <tr className="bg-slate-50/50">
                          <td className="py-4 px-6 text-sm text-slate-800 font-bold border-l-4 border-emerald-500" rowSpan={rowSpan}>
                            <div className="flex flex-col">
                              <span>{f.fecha_emision}</span>
                              <span className="text-xs font-mono text-slate-500 mt-1">{f.tipo_comprobante}</span>
                              <span className="text-xs font-mono text-slate-500">{f.punto_venta}-{f.numero_comprobante}</span>
                            </div>
                          </td>
                          {detallesFactura.length > 0 ? (
                            <>
                              <td className="py-3 px-6 text-sm text-slate-600">{detallesFactura[0].concepto}</td>
                              <td className="py-3 px-6 text-sm text-slate-500 text-xs">{detallesFactura[0].cuenta_contable_id?.split(' - ')[0]}</td>
                              <td className="py-3 px-6 text-sm text-right text-slate-700">${detallesFactura[0].monto.toLocaleString('es-AR')}</td>
                            </>
                          ) : (
                            <td colSpan="3" className="py-4 px-6 text-sm text-slate-400 italic">Sin detalle cargado</td>
                          )}
                        </tr>

                        {/* Filas adicionales del detalle (si hay más de un concepto) */}
                        {detallesFactura.slice(1).map((det, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-3 px-6 text-sm text-slate-600">{det.concepto}</td>
                            <td className="py-3 px-6 text-sm text-slate-500 text-xs">{det.cuenta_contable_id?.split(' - ')[0]}</td>
                            <td className="py-3 px-6 text-sm text-right text-slate-700">${det.monto.toLocaleString('es-AR')}</td>
                          </tr>
                        ))}

                        {/* Fila de Total de la Factura */}
                        <tr className="border-b-2 border-slate-200 bg-white">
                           <td colSpan="3" className="py-2 px-6 text-right text-xs font-bold text-slate-400 uppercase">Total Factura:</td>
                           <td className="py-2 px-6 text-right text-sm font-extrabold text-slate-800">${f.total.toLocaleString('es-AR')}</td>
                        </tr>
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-xl border border-slate-200 shadow-sm">
            <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            <p className="text-slate-500 text-lg">Buscá un proveedor arriba para ver su legajo completo.</p>
          </div>
        )}
      </div>
    </main>
  );
}