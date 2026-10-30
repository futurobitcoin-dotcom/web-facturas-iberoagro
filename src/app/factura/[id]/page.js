'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

export default function FormularioFactura() {
  const router = useRouter();
  const params = useParams();
  const esNueva = params.id === 'nueva';

  const [formData, setFormData] = useState({
    fecha_emision: '', tipo_comprobante: 'FACTURA A', punto_venta: '', numero_comprobante: '',
    proveedor_cuit: '', razon_social: '', subtotal: 0, iva_21: 0, iva_10_5: 0, total: 0
  });
  const [cargando, setCargando] = useState(!esNueva);

  useEffect(() => {
    if (!esNueva) {
      async function cargarFactura() {
        const { data } = await supabase.from('facturas_encabezado').select('*').eq('id', params.id).single();
        if (data) setFormData(data);
        setCargando(false);
      }
      cargarFactura();
    }
  }, [esNueva, params.id]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const guardarFactura = async (e) => {
    e.preventDefault();
    
    // Nos aseguramos de que el CUIT y la Razón Social no viajen vacíos
    const datosLimpios = {
      ...formData,
      razon_social: formData.razon_social || '',
      proveedor_cuit: formData.proveedor_cuit || ''
    };

    let errorDB;
    if (esNueva) {
      const { error } = await supabase.from('facturas_encabezado').insert([datosLimpios]);
      errorDB = error;
    } else {
      const { error } = await supabase.from('facturas_encabezado').update(datosLimpios).eq('id', params.id);
      errorDB = error;
    }

    if (errorDB) {
      alert("Error al guardar: " + errorDB.message);
    } else {
      // Refrescamos los datos de Next.js para que el panel se entere del cambio
      router.refresh(); 
      router.push('/');
    }
  };

  if (cargando) return <div className="p-10 text-center text-slate-500 font-medium">Cargando...</div>;

  return (
    <main className="p-8 font-sans bg-slate-50 min-h-screen">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-slate-200">
        
        <div className="flex justify-between items-center mb-8 border-b pb-4">
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
            {esNueva ? 'Cargar Nueva Factura' : 'Editar Factura'}
          </h1>
          <Link href="/" className="bg-slate-800 text-white px-5 py-2.5 rounded-lg hover:bg-slate-900 transition font-medium">
            ← Cancelar
          </Link>
        </div>

        <form onSubmit={guardarFactura} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="md:col-span-2 bg-slate-50 p-4 rounded-lg border border-slate-200 mb-2">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Datos del Proveedor</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Razón Social</label>
                <input type="text" name="razon_social" value={formData.razon_social || ''} onChange={handleChange} required className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">CUIT</label>
                <input type="text" name="proveedor_cuit" value={formData.proveedor_cuit || ''} onChange={handleChange} required className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
            </div>
          </div>

          <div className="md:col-span-2 bg-slate-50 p-4 rounded-lg border border-slate-200 mb-2">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Datos del Comprobante</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Fecha Emisión</label>
                <input type="date" name="fecha_emision" value={formData.fecha_emision || ''} onChange={handleChange} required className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Tipo</label>
                <select name="tipo_comprobante" value={formData.tipo_comprobante} onChange={handleChange} className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none">
                  <option value="FACTURA A">FACTURA A</option>
                  <option value="FACTURA B">FACTURA B</option>
                  <option value="FACTURA C">FACTURA C</option>
                  <option value="NOTA DE CREDITO A">NOTA DE CREDITO A</option>
                  <option value="TICKET">TICKET</option>
                </select>
              </div>
              <div className="flex gap-2">
                 <div className="w-1/3">
                    <label className="block text-sm font-bold text-slate-700 mb-1">Pto Vta</label>
                    <input type="text" name="punto_venta" value={formData.punto_venta || ''} onChange={handleChange} className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
                 </div>
                 <div className="w-2/3">
                    <label className="block text-sm font-bold text-slate-700 mb-1">Número</label>
                    <input type="text" name="numero_comprobante" value={formData.numero_comprobante || ''} onChange={handleChange} required className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
                 </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 bg-slate-50 p-4 rounded-lg border border-slate-200">
             <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Importes</h3>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Subtotal</label>
                  <input type="number" step="0.01" name="subtotal" value={formData.subtotal || 0} onChange={handleChange} className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">IVA 21%</label>
                  <input type="number" step="0.01" name="iva_21" value={formData.iva_21 || 0} onChange={handleChange} className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">IVA 10.5%</label>
                  <input type="number" step="0.01" name="iva_10_5" value={formData.iva_10_5 || 0} onChange={handleChange} className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Total</label>
                  <input type="number" step="0.01" name="total" value={formData.total || 0} onChange={handleChange} required className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-emerald-50 font-bold text-emerald-800" />
                </div>
             </div>
          </div>

          <div className="md:col-span-2 mt-4 flex justify-end gap-4 border-t pt-6">
            <Link href="/" className="px-6 py-2.5 border border-slate-300 rounded-lg text-slate-600 font-medium hover:bg-slate-50 transition-colors">Cancelar</Link>
            <button type="submit" className="bg-emerald-600 text-white px-8 py-2.5 rounded-lg hover:bg-emerald-700 shadow-sm transition font-bold">
              Guardar Factura
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}