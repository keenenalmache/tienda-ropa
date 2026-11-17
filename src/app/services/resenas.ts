import { Injectable, inject } from '@angular/core';
import { supabase } from '../supabase.client';
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
}

@Injectable({ providedIn: 'root' })
export class Resenas {
  private auth = inject(Auth);

  async deProducto(productoId: number): Promise<Resena[]> {
    const { data } = await supabase
      .from('resenas')
      .select('*')
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
    }));
  }

  async guardar(productoId: number, estrellas: number, comentario: string): Promise<string | null> {
    const p = this.auth.perfil();
    if (!p) return 'Inicia sesión para opinar.';
    const { error } = await supabase.from('resenas').upsert(
      {
        producto_id: productoId,
        user_id: p.id,
        autor: p.nombre,
        foto: p.foto,
        estrellas,
        comentario: comentario.trim(),
      },
      { onConflict: 'producto_id,user_id' },
    );
    return error ? error.message : null;
  }

  async borrar(id: number): Promise<string | null> {
    const { error } = await supabase.from('resenas').delete().eq('id', id);
    return error ? error.message : null;
  }
}