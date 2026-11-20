import { Injectable } from '@angular/core';
import { Producto } from '../models/producto';
import { supabase } from '../supabase.client';

export const DIAS_NUEVO = 14;

export function sigueNuevo(marcado: boolean, desde: string | null): boolean {
  if (!marcado) return false;
  if (!desde) return true;
  return Date.now() - new Date(desde).getTime() < DIAS_NUEVO * 86400000;
}
// Fecha de creación + ventaja por etiquetas: destacado +7 días, nuevo +3 días
// Jerarquía: 1) "Nuevo" primero, 2) más etiquetas llamativas (destacado, descuento), 3) más reciente
export function puntajeNovedad(
  creadoEn: string | null,
  destacado: boolean,
  nuevo: boolean,
  oferta: boolean,
  
): number {
  const ms = creadoEn ? Date.parse(creadoEn) : 0;
  const edadDias = ms ? (Date.now() - ms) / 86400000 : 9999;
  const frescura = Math.max(0, 30 - edadDias);
  return (nuevo ? 1000 : 0) + (destacado ? 60 : 0) + (oferta ? 40 : 0) + frescura + ms / 1e13;
}
// Categorías que tienen al menos un producto visible (no hace falta otra consulta)
export function categoriasDe(lista: Producto[]): { slug: string; nombre: string }[] {
  const mapa = new Map<string, string>();
  for (const p of lista) {
    if (p.categoria && !mapa.has(p.categoria)) mapa.set(p.categoria, p.categoriaNombre);
  }
  return [...mapa]
    .map(([slug, nombre]) => ({ slug, nombre }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}
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
      categoriaNombre: fila.categorias?.nombre ?? '',
      genero: fila.genero ?? 'unisex',
      precio,
      precioOferta: oferta,
      descuento: oferta === null ? 0 : Math.round((1 - oferta / precio) * 100),
      destacado: !!fila.destacado,
      nuevo: sigueNuevo(!!fila.nuevo, fila.nuevo_desde ?? null),
      orden: puntajeNovedad(
        fila.creado_en ?? null,
        !!fila.destacado,
        sigueNuevo(!!fila.nuevo, fila.nuevo_desde ?? null),
        oferta !== null,
      ),
      tallas: [...new Set(variantes.map((v) => v.talla))],
      colores: [...new Set(variantes.map((v) => v.color))],
      descripcion: fila.descripcion ?? '',
      imagen: imagenes[0]?.url ?? '',
      variantes: variantes.map((v) => ({ talla: v.talla, color: v.color, stock: Number(v.stock) })),
      imagenes: imagenes.map((i) => i.url),
    };
  }

    private consultaBase() {
    return this.supabase
      .from('productos')
      .select(
        'id, nombre, descripcion, precio, precio_oferta, destacado, nuevo, nuevo_desde, creado_en, activo, genero, categorias(slug, nombre), variantes(talla, color, stock), imagenes(url, orden)',
      );
  }

  private consulta() {
    return this.consultaBase().eq('activo', true);
  }

  async obtenerPorId(id: number, verOculto = false): Promise<Producto | undefined> {
    const base = verOculto ? this.consultaBase() : this.consulta();
    const { data, error } = await base.eq('id', id).maybeSingle();
    if (error || !data) return undefined;
    return this.convertir(data);
  }
}