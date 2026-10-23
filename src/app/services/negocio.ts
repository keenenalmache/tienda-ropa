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
  frases: string;
}

const FRASES = '¡Nueva colección!\nMira las ofertas de la semana\nPregúntanos por tu talla';

const BASE: DatosNegocio = {
  nombre: NEGOCIO.nombre,
  lema: 'Ropa cómoda y con estilo.',
  whatsapp: NEGOCIO.whatsapp,
  telefono: NEGOCIO.telefono,
  direccion: NEGOCIO.direccion,
  horario: NEGOCIO.horario,
  instagram: NEGOCIO.instagram,
  frases: FRASES,
};

@Injectable({ providedIn: 'root' })
export class Negocio {
  datos = signal<DatosNegocio>(BASE);

  constructor() {
    this.cargar();
  }

  async cargar() {
    const { data, error } = await supabase
      .from('negocio')
      .select('nombre, lema, whatsapp, telefono, direccion, horario, instagram, frases')
      .eq('id', 1)
      .maybeSingle();
    if (error || !data) return;
    this.datos.set({
      nombre: data.nombre || BASE.nombre,
      lema: data.lema || '',
      whatsapp: data.whatsapp || BASE.whatsapp,
      telefono: data.telefono || '',
      direccion: data.direccion || '',
      horario: data.horario || '',
      instagram: data.instagram || '',
      frases: data.frases ?? FRASES,
    });
  }

  async guardar(nuevos: DatosNegocio) {
    const { error } = await supabase.from('negocio').upsert({ id: 1, ...nuevos });
    if (error) throw error;
    this.datos.set(nuevos);
  }
}