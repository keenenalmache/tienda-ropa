import { Injectable, signal } from '@angular/core';
import { supabase } from '../supabase.client';
import { NEGOCIO } from '../negocio.config';

export interface DatosNegocio {
  nombre: string;
  lema: string;
  whatsapp: string;
  telefono: string;
  direccion: string;
  horario: string;
  instagram: string;
  // Frases del globo de la portada, una por línea
  frases: string;
}

const BASE: DatosNegocio = {
  nombre: NEGOCIO.nombre,
  lema: 'La ropa mas cómoda y chévere del Ecuador.',
  frases: '¡Nueva colección!\nMira las ofertas de la semana\n¿Dudas con la talla? ¡Escríbenos!',
  whatsapp: NEGOCIO.whatsapp,
  telefono: NEGOCIO.telefono,
  direccion: NEGOCIO.direccion,
  horario: NEGOCIO.horario,
  instagram: NEGOCIO.instagram,
};

const CLAVE_CACHE = 'negocio-cache';

function leerCache(): DatosNegocio | null {
  try {
    const texto = localStorage.getItem(CLAVE_CACHE);
    return texto ? { ...BASE, ...JSON.parse(texto) } : null;
  } catch {
    return null;
  }
}

function guardarCache(datos: DatosNegocio) {
  try {
    localStorage.setItem(CLAVE_CACHE, JSON.stringify(datos));
  } catch {}
}

@Injectable({ providedIn: 'root' })
export class Negocio {
  // Arranca con lo último que se vio (caché); si no hay, con los valores base
  datos = signal<DatosNegocio>(leerCache() ?? BASE);

  constructor() {
    this.cargar();
  }

  async cargar() {
    // Se piden todas las columnas: si "frases" aún no existe en la base, no se rompe nada
    const { data, error } = await supabase.from('negocio').select('*').eq('id', 1).maybeSingle();
    if (error || !data) return;
    const nuevos: DatosNegocio = {
      nombre: data.nombre || BASE.nombre,
      lema: data.lema || '',
      whatsapp: data.whatsapp || BASE.whatsapp,
      telefono: data.telefono || '',
      direccion: data.direccion || '',
      horario: data.horario || '',
      instagram: data.instagram || '',
      frases: data.frases ?? BASE.frases,
    };
    this.datos.set(nuevos);
    guardarCache(nuevos);
  }

  async guardar(nuevos: DatosNegocio) {
    const { error } = await supabase.from('negocio').upsert({ id: 1, ...nuevos });
    if (!error) {
      this.datos.set(nuevos);
      guardarCache(nuevos);
      return;
    }

    // Si falta la columna "frases", se guarda todo lo demás y se avisa qué falta
    if (error.message?.includes('frases')) {
      const { frases, ...resto } = nuevos;
      const { error: error2 } = await supabase.from('negocio').upsert({ id: 1, ...resto });
      if (error2) throw error2;
      const parcial = { ...nuevos, frases: this.datos().frases };
      this.datos.set(parcial);
      guardarCache(parcial);
      throw new Error(
        'Se guardaron los datos, pero las frases del globo no: falta crear la columna "frases" en Supabase (ejecuta database/migracion-frases.sql).',
      );
    }
    throw error;
  }
}