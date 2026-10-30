'use client';

import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import Link from 'next/link';
import { supabase } from '../supabase';

export default function Exportar() {
  const [columnasExcel, setColumnasExcel] = useState([]);
  const [mapeo, setMapeo] = useState({});
  const [generando, setGenerando] = useState(false);
  const [archivoCargado, setArchivoCargado] = useState(false);
  
  const [mapeosGuardados, setMapeosGuardados] = useState({});
  const [nombreMapeo, setNombreMapeo] = useState("");
  const [mapeoActivo, setMapeoActivo] = useState("");

  useEffect(() => {
    const guardados = localStorage.getItem('mapeos_facturas');
    if (guardados) {
      setMapeosGuardados(JSON.parse(guardados));
    }
  }, []);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
      if (data.length > 0) {
        setColumnasExcel(data[0]);
        setArchivoCargado(true);
        setMapeo({}); 
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleMapeo = (columnaExcel, valorDB) => {
    setMapeo({ ...mapeo, [columnaExcel]: valorDB });
  };

  const guardarConfiguracion = () => {
    if (!nombreMapeo) {
      alert("Por favor, ponele un nombre a esta configuración (Ej: GestorMax, Contador).");
      return;
    }
    
    const nuevosMapeos = {
      ...mapeosGuardados,
      [nombreMapeo]: { mapeo, columnasExcel }
    };
    
    setMapeosGuardados(nuevosMapeos);
    localStorage.setItem('mapeos_facturas', JSON.stringify(nuevosMapeos));
    setMapeoActivo(nombreMapeo);
    alert(`¡Configuración "${nombreMapeo}" guardada con éxito!`);
  };

  const cargarMapeoExistente = (nombre) => {
    if (!nombre) {
      setMapeo({});
      setColumnasExcel([]);
      setArchivoCargado(false);
      setMapeoActivo("");
      setNombreMapeo("");
      return;
    }
    const config = mapeosGuardados[nombre];
    if (config) {
      setMapeo(config.mapeo);
      setColumnasExcel(config.columnasExcel);
      setArchivoCargado(true);
      setMapeoActivo(nombre);
      setNombreMapeo(nombre);
    }
  };

  // --- NUEVA FUNCIÓN: Exportar Libro IVA AFIP ---
  const generarExcelAFIP = async () => {
    setGenerando(true);
    
    const { data: facturas, error } = await supabase
      .from('facturas_encabezado')
      .select('*')
      .order('fecha_emision', { ascending: true });

    if (error) {
      alert("Error al buscar facturas: " + error.message);
      setGenerando(false);
      return;
    }

    if (!facturas || facturas.length === 0) {
      alert("No hay facturas cargadas para exportar.");
      setGenerando(false);
      return;
    }

    // Armamos las filas con las columnas exactas que pide AFIP (Ajustalo con tu contadora)
    const filasExportacion = facturas.map(f => {
      // Convertimos fecha YYYY-MM-DD a DD/MM/YYYY
      const partesFecha = (f.fecha_emision || '').split('-');
      const fechaFormateada = partesFecha.length === 3 ? `${partesFecha[2]}/${partesFecha[1]}/${partesFecha[0]}` : f.fecha_emision;

      return {
        "Fecha": fechaFormateada,
        "Tipo Comprobante": f.tipo_comprobante,
        "Punto de Venta": f.punto_venta,
        "Número": f.numero_comprobante,
        "CUIT Proveedor": f.proveedor_cuit,
        "Denominación": f.razon_social,
        "Neto Gravado": f.subtotal,
        "IVA 21%": f.iva_21,
        "IVA 10.5%": f.iva_10_5,
        "Total": f.total
      };
    });

    const hoja = XLSX.utils.json_to_sheet(filasExportacion);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Libro IVA");
    XLSX.writeFile(libro, "Exportacion_AFIP_LibroIVA.xlsx");
    setGenerando(false);
  };

  const generarExcel = async () => {
    setGenerando(true);
    
    const { data: facturas, error } = await supabase
      .from('facturas_encabezado')
      .select('*');

    if (error) {
      alert("Error al buscar facturas: " + error.message);
      setGenerando(false);
      return;
    }

    if (!facturas || facturas.length === 0) {
      alert("No hay facturas cargadas para exportar.");
      setGenerando(false);
      return;
    }

    const filasExportacion = facturas.map(factura => {
      const fila = {};
      columnasExcel.forEach(col => {
        const campoDB = mapeo[col];
        if (campoDB && factura[campoDB] !== undefined) {
          fila[col] = factura[campoDB];
        } else {
          fila[col] = "";
        }
      });
      return fila;
    });

    const hoja = XLSX.utils.json_to_sheet(filasExportacion);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Facturas");
    XLSX.writeFile(libro, `Exportacion_${mapeoActivo || 'Facturas'}.xlsx`);
    setGenerando(false);
  };

  return (
    <main className="p-8 font-sans bg-slate-50 min-h-screen">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="bg-slate-600 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition font-medium">
              ← Volver al Panel
            </Link>
            <h1 className="text-2xl font-bold text-slate-800">Exportar Datos</h1>
          </div>
        </div>

        {/* OPCIÓN DIRECTA AFIP */}
        <div className="mb-8 bg-blue-50 p-5 rounded-xl border border-blue-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h3 className="text-lg font-bold text-blue-900">Exportación rápida para AFIP</h3>
            <p className="text-sm text-blue-700">Genera un Excel con las columnas estándar del Libro IVA Digital.</p>
          </div>
          <button 
            onClick={generarExcelAFIP}
            disabled={generando}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition w-full md:w-auto font-bold shadow-sm"
          >
            {generando ? 'Generando...' : 'Descargar Excel AFIP'}
          </button>
        </div>

        <div className="border-t pt-6">
          <h2 className="text-lg font-bold text-slate-700 mb-4">Otras exportaciones (GestorMax, Finnegans, Contador)</h2>
          <div className="mb-6 bg-slate-100 p-4 rounded-lg border border-slate-200">
            <label className="block text-sm font-bold text-slate-700 mb-2">Seleccionar una configuración guardada:</label>
            <select 
              onChange={(e) => cargarMapeoExistente(e.target.value)}
              value={mapeoActivo}
              className="w-full md:w-1/2 border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="">-- Nueva configuración / Subir Excel --</option>
              {Object.keys(mapeosGuardados).map(nombre => (
                <option key={nombre} value={nombre}>{nombre}</option>
              ))}
            </select>
          </div>

          {!archivoCargado ? (
            <div>
              <p className="mb-4 text-gray-600">Subí el Excel vacío de GestorMax, Finnegans o tu Contador para mapear las columnas.</p>
              <input 
                type="file" 
                accept=".xlsx, .xls" 
                onChange={handleFileUpload} 
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
              />
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-1 gap-4 mb-6">
                {columnasExcel.map((col, index) => (
                  <div key={index} className="flex items-center gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="font-mono text-sm w-1/3 font-semibold text-slate-700">{col}</span>
                    <span className="text-slate-400">→</span>
                    <select 
                      className="p-2 border border-slate-300 rounded-lg w-2/3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                      onChange={(e) => handleMapeo(col, e.target.value)}
                      value={mapeo[col] || ''}
                    >
                      <option value="">Seleccionar dato...</option>
                      <option value="fecha_emision">Fecha Emisión</option>
                      <option value="tipo_comprobante">Tipo Comprobante</option>
                      <option value="punto_venta">Punto de Venta</option>
                      <option value="numero_comprobante">Número Comprobante</option>
                      <option value="proveedor_cuit">CUIT Proveedor</option>
                      <option value="razon_social">Razón Social</option>
                      <option value="subtotal">Subtotal</option>
                      <option value="iva_21">IVA 21%</option>
                      <option value="iva_10_5">IVA 10.5%</option>
                      <option value="total">Total</option>
                    </select>
                  </div>
                ))}
              </div>

              <div className="bg-slate-100 p-4 rounded-lg border border-slate-200 mb-6 flex flex-col md:flex-row items-center gap-4">
                <input 
                  type="text" 
                  placeholder="Nombre del mapeo (Ej: GestorMax)" 
                  value={nombreMapeo}
                  onChange={(e) => setNombreMapeo(e.target.value)}
                  className="border border-slate-300 rounded-lg p-2 text-sm w-full md:w-1/2"
                />
                <button 
                  onClick={guardarConfiguracion}
                  className="bg-slate-800 text-white px-6 py-2 rounded-lg hover:bg-slate-900 transition w-full md:w-auto font-medium"
                >
                  Guardar Configuración
                </button>
              </div>

              <div className="flex gap-4 border-t pt-4">
                <button 
                  onClick={generarExcel}
                  disabled={generando}
                  className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 disabled:bg-gray-400 transition w-full font-medium"
                >
                  {generando ? 'Generando...' : 'Generar y Descargar Excel Personalizado'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}