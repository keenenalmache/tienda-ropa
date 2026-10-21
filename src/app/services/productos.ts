import { Injectable } from '@angular/core';
import { Producto } from '../models/producto';
import { supabase } from '../supabase.client';

@Injectable({ providedIn: 'root' })
export class Productos {
  private supabase = supabase;

  private convertir(fila: any): Producto {
    const variantes: any[] = fila.variantes ?? [];
    const imagenes: any[] = [...(fila.imagenes ?? [])].sort(
      (a, b) => a.orden - b.orden,
    );
    const precio = Number(fila.precio);
    const oferta = fila.precio_oferta == null ? null : Number(fila.precio_oferta);

    return {
      id: fila.id,
      nombre: fila.nombre,
      categoria: fila.categorias?.slug ?? '',
      precio,
      precioOferta: oferta,
      descuento: oferta === null ? 0 : Math.round((1 - oferta / precio) * 100),
      destacado: !!fila.destacado,
      nuevo: !!fila.nuevo,
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
        'id, nombre, descripcion, precio, precio_oferta, destacado, nuevo, categorias(slug), variantes(talla, color), imagenes(url, orden)',
      )
      .eq('activo', true);
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