import { Injectable } from '@angular/core';
import { supabase } from '../supabase.client';

export interface VarianteAdmin {
  id: number;
  talla: string;
  color: string;
  stock: number;
}

export interface ImagenAdmin {
  id: number;
  url: string;
  orden: number;
}

export interface ProductoAdmin {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  activo: boolean;
  categoria_id: number;
  categorias: { nombre: string } | null;
  variantes: VarianteAdmin[];
  imagenes: ImagenAdmin[];
}

export interface Categoria {
  id: number;
  nombre: string;
}

export interface DatosProducto {
  nombre: string;
  descripcion: string;
  precio: number;
  categoria_id: number;
  activo: boolean;
}

@Injectable({ providedIn: 'root' })
export class AdminProductos {
  async listar(): Promise<ProductoAdmin[]> {
    const { data, error } = await supabase
      .from('productos')
      .select(
        'id, nombre, descripcion, precio, activo, categoria_id, categorias(nombre), variantes(id, talla, color, stock), imagenes(id, url, orden)',
      )
      .order('id', { ascending: false });
    if (error) throw error;
    return (data ?? []) as any;
  }

  async categorias(): Promise<Categoria[]> {
    const { data, error } = await supabase
      .from('categorias')
      .select('id, nombre')
      .order('id');
    if (error) throw error;
    return data ?? [];
  }

  async crear(datos: DatosProducto): Promise<number> {
    const { data, error } = await supabase
      .from('productos')
      .insert(datos)
      .select('id')
      .single();
    if (error) throw error;
    return data.id;
  }

  async actualizar(id: number, datos: DatosProducto) {
    const { error } = await supabase.from('productos').update(datos).eq('id', id);
    if (error) throw error;
  }

  async cambiarActivo(id: number, activo: boolean) {
    const { error } = await supabase.from('productos').update({ activo }).eq('id', id);
    if (error) throw error;
  }

  async agregarVariante(productoId: number, talla: string, color: string, stock: number) {
    const { error } = await supabase
      .from('variantes')
      .insert({ producto_id: productoId, talla, color, stock });
    if (error) throw error;
  }

  async cambiarStock(id: number, stock: number) {
    const { error } = await supabase.from('variantes').update({ stock }).eq('id', id);
    if (error) throw error;
  }

  async eliminarVariante(id: number) {
    const { error } = await supabase.from('variantes').delete().eq('id', id);
    if (error) throw error;
  }

  async subirImagen(productoId: number, archivo: File, orden: number) {
    const extension = archivo.name.split('.').pop()?.toLowerCase() || 'jpg';
    const ruta = `${productoId}/${Date.now()}.${extension}`;

    const { error } = await supabase.storage
      .from('productos')
      .upload(ruta, archivo, { contentType: archivo.type });
    if (error) throw error;

    const { data } = supabase.storage.from('productos').getPublicUrl(ruta);
    const { error: errorTabla } = await supabase
      .from('imagenes')
      .insert({ producto_id: productoId, url: data.publicUrl, orden });
    if (errorTabla) throw errorTabla;
  }

  async eliminarImagen(id: number, url: string) {
    const marca = '/productos/';
    const ruta = decodeURIComponent(url.substring(url.indexOf(marca) + marca.length));
    await supabase.storage.from('productos').remove([ruta]);

    const { error } = await supabase.from('imagenes').delete().eq('id', id);
    if (error) throw error;
  }
}