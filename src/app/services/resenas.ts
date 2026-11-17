import { Injectable, inject, signal } from '@angular/core';import { supabase } from '../supabase.client';
import { Auth } from './auth';

export interface Resena {
  id: number;
  productoId: number;
  userId: string;
  autor: string;
  foto: string | null;
  estrellas: number;
  comentario: string;
  creada: string;
  editada: string | null;
  respuesta: string | null;
  utiles: string[]; // ids de usuarios que marcaron "Útil"
}

@Injectable({ providedIn: 'root' })
export class Resenas {
  private auth = inject(Auth);
  resumenes = signal<Record<number, { promedio: number; total: number }>>({});

  constructor() {
    this.cargarResumenes();
  }

  async cargarResumenes() {
    const { data } = await supabase.from('resenas_resumen').select('*');
    const m: Record<number, { promedio: number; total: number }> = {};
    for (const r of data ?? []) m[r.producto_id] = { promedio: Number(r.promedio), total: Number(r.total) };
    this.resumenes.set(m);
  }

  resumen(id: number) {
    return this.resumenes()[id];
  }
  async deProducto(productoId: number): Promise<Resena[]> {
    const { data } = await supabase
      .from('resenas')
      .select('*, resenas_utiles(user_id)')
      .eq('producto_id', productoId)
      .eq('oculta', false)
      .order('creada', { ascending: false });
    return (data ?? []).map((r) => ({
      id: r.id,
      productoId: r.producto_id,
      userId: r.user_id,
      autor: r.autor,
      foto: r.foto,
      estrellas: r.estrellas,
      comentario: r.comentario ?? '',
      creada: r.creada,
      editada: r.editada_en,
      respuesta: r.respuesta,
      utiles: ((r.resenas_utiles ?? []) as { user_id: string }[]).map((u) => u.user_id),
    }));
  }

  async guardar(productoId: number, estrellas: number, comentario: string): Promise<string | null> {
    const p = this.auth.perfil();
    if (!p) return 'Inicia sesión para opinar.';
    const { error } = await supabase.from('resenas').upsert(
      { producto_id: productoId, user_id: p.id, autor: p.nombre, foto: p.foto, estrellas, comentario: comentario.trim() },
      { onConflict: 'producto_id,user_id' },
    );
    return error ? error.message : null;
  }

  async editar(id: number, estrellas: number, comentario: string): Promise<string | null> {
    const { error } = await supabase.from('resenas').update({ estrellas, comentario: comentario.trim() }).eq('id', id);
    return error ? error.message : null;
  }

  async borrar(id: number): Promise<string | null> {
    const { error } = await supabase.from('resenas').delete().eq('id', id);
    return error ? error.message : null;
  }

  async alternarUtil(id: number, yaMarcado: boolean) {
    const p = this.auth.perfil();
    if (!p) return;
    if (yaMarcado) await supabase.from('resenas_utiles').delete().eq('resena_id', id).eq('user_id', p.id);
    else await supabase.from('resenas_utiles').insert({ resena_id: id, user_id: p.id });
  }
}