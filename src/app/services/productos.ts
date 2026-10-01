import { Injectable } from '@angular/core';
import { createClient } from '@supabase/supabase-js';
import { Producto } from '../models/producto';
import { SUPABASE_URL, SUPABASE_KEY } from '../supabase.config';

@Injectable({ providedIn: 'root' })
export class Productos {
  private supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  private convertir(fila: any): Producto {
    const variantes: any[] = fila.variantes ?? [];
    const imagenes: any[] = [...(fila.imagenes ?? [])].sort(
      (a, b) => a.orden - b.orden,
    );

    return {
      id: fila.id,
      nombre: fila.nombre,
      categoria: fila.categorias?.slug as Producto['categoria'],
      precio: Number(fila.precio),
      tallas: [...new Set(variantes.map((v) => v.talla))],
      colores: [...new Set(variantes.map((v) => v.color))],
      descripcion: fila.descripcion ?? '',
      imagen: imagenes[0]?.url ?? '',
    };
  }

  private consulta() {
    return this.supabase
      .from('productos')
      .select(
        'id, nombre, descripcion, precio, categorias(slug), variantes(talla, color), imagenes(url, orden)',
      );
  }

  async obtenerTodos(): Promise<Producto[]> {
    const { data, error } = await this.consulta().order('id');
    if (error) {
      console.error('Error al cargar productos:', error.message);
      return [];
    }
    return (data ?? []).map((f) => this.convertir(f));
  }

  async obtenerPorId(id: number): Promise<Producto | undefined> {
    const { data, error } = await this.consulta().eq('id', id).maybeSingle();
    if (error || !data) return undefined;
    return this.convertir(data);
  }
}