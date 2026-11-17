import { Injectable } from '@angular/core';
import { supabase } from '../supabase.client';

export interface ResenaAdmin {
  id: number;
  productoId: number;
  producto: string;
  autor: string;
  foto: string | null;
  estrellas: number;
  comentario: string;
  creada: string;
  editada: string | null;
  oculta: boolean;
  respuesta: string | null;
}

@Injectable({ providedIn: 'root' })
export class AdminResenas {
  async listar(): Promise<ResenaAdmin[]> {
    const { data, error } = await supabase
      .from('resenas')
      .select('*, productos(nombre)')
      .order('creada', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((r) => ({
      id: r.id,
      productoId: r.producto_id,
      producto: r.productos?.nombre ?? '(producto eliminado)',
      autor: r.autor,
      foto: r.foto,
      estrellas: r.estrellas,
      comentario: r.comentario ?? '',
      creada: r.creada,
      editada: r.editada_en,
      oculta: r.oculta,
      respuesta: r.respuesta,
    }));
  }

  async contarDesde(iso: string): Promise<number> {
    const { count } = await supabase
      .from('resenas')
      .select('id', { count: 'exact', head: true })
      .gt('creada', iso);
    return count ?? 0;
  }

  async ocultar(id: number, oculta: boolean) {
    const { error } = await supabase.from('resenas').update({ oculta }).eq('id', id);
    if (error) throw error;
  }

  async eliminar(id: number) {
    const { error } = await supabase.from('resenas').delete().eq('id', id);
    if (error) throw error;
  }

  async responder(id: number, texto: string | null) {
    const { error } = await supabase
      .from('resenas')
      .update({ respuesta: texto, respuesta_en: texto ? new Date().toISOString() : null })
      .eq('id', id);
    if (error) throw error;
  }
}