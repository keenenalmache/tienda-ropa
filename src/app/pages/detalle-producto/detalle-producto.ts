import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Productos } from '../../services/productos';
import { Producto } from '../../models/producto';
import { Negocio } from '../../services/negocio';
import { Favoritos } from '../../services/favoritos';

// Con este stock o menos se avisa "quedan pocas unidades"
const STOCK_POCO = 3;

@Component({
  selector: 'app-detalle-producto',
  imports: [RouterLink],
  templateUrl: './detalle-producto.html',
  styleUrl: './detalle-producto.css',
})
export class DetalleProducto {
  private ruta = inject(ActivatedRoute);
  private servicio = inject(Productos);
  private negocio = inject(Negocio);
  favs = inject(Favoritos);

  producto = signal<Producto | undefined>(undefined);
  cargando = signal(true);
  tallaElegida = signal<string | null>(null);
  colorElegido = signal<string | null>(null);
  fotoActiva = signal(0);

  private mapaColores: Record<string, string> = {
    negro: '#111111', blanco: '#ffffff', gris: '#9ca3af', rojo: '#dc2626', azul: '#2563eb',
    verde: '#16a34a', amarillo: '#facc15', naranja: '#f97316', rosado: '#f472b6', rosa: '#f472b6',
    morado: '#7c3aed', beige: '#d6c3a5', café: '#7b4a2b', cafe: '#7b4a2b', celeste: '#7dd3fc',
    vino: '#7f1d1d', crema: '#f5ecd7',
  };

  fotos = computed(() => {
    const p = this.producto();
    if (!p) return [];
    return p.imagenes.length ? p.imagenes : p.imagen ? [p.imagen] : [];
  });
  fotoPrincipal = computed(() => this.fotos()[this.fotoActiva()] ?? '');

  tallas = computed(() => [...new Set((this.producto()?.variantes ?? []).map((v) => v.talla))]);
  colores = computed(() => [...new Set((this.producto()?.variantes ?? []).map((v) => v.color))]);

  mensajeStock = computed(() => {
    const t = this.tallaElegida();
    const c = this.colorElegido();
    if (!this.producto()?.variantes.length) {
      return { texto: 'Consulta la disponibilidad por WhatsApp.', tono: '' };
    }
    if (t === null || c === null) {
      return { texto: 'Elige talla y color para ver la disponibilidad.', tono: '' };
    }
    const n = this.stockDe(t, c);
    if (n === 0) return { texto: 'Sin stock en esta combinación.', tono: 'cero' };
    if (n <= STOCK_POCO) return { texto: `¡Quedan solo ${n}!`, tono: 'poco' };
    return { texto: 'Disponible.', tono: 'ok' };
  });

  constructor() {
    const id = Number(this.ruta.snapshot.paramMap.get('id'));
    this.servicio.obtenerPorId(id).then((p) => {
      this.producto.set(p);
      this.cargando.set(false);
    });
  }

  // Stock de las variantes que coinciden (null = cualquiera)
  stockDe(talla: string | null, color: string | null): number {
    return (this.producto()?.variantes ?? [])
      .filter((v) => (talla === null || v.talla === talla) && (color === null || v.color === color))
      .reduce((suma, v) => suma + v.stock, 0);
  }
  tallaAgotada(t: string): boolean {
    return this.stockDe(t, this.colorElegido()) === 0;
  }
  colorAgotado(c: string): boolean {
    return this.stockDe(this.tallaElegida(), c) === 0;
  }
  elegirTalla(t: string) {
    this.tallaElegida.update((actual) => (actual === t ? null : t));
  }
  elegirColor(c: string) {
    this.colorElegido.update((actual) => (actual === c ? null : c));
  }

  colorCss(nombre: string): string {
    return this.mapaColores[nombre.trim().toLowerCase()] ?? '';
  }

  precioFinal(p: Producto): number {
    return p.precioOferta ?? p.precio;
  }
  ahorro(p: Producto): number {
    return p.precioOferta === null ? 0 : p.precio - p.precioOferta;
  }
  dinero(n: number): string {
    return Number.isInteger(n) ? String(n) : n.toFixed(2);
  }

  // El mensaje de WhatsApp incluye la talla y el color elegidos
  enlaceWhatsapp(p: Producto): string {
    const partes = [`Hola, me interesa: ${p.nombre}`];
    if (this.tallaElegida()) partes.push(`talla ${this.tallaElegida()}`);
    if (this.colorElegido()) partes.push(`color ${this.colorElegido()}`);
    const mensaje = `${partes.join(', ')} ($${this.precioFinal(p)})`;
    return `https://wa.me/${this.negocio.datos().whatsapp}?text=${encodeURIComponent(mensaje)}`;
  }

  enlaceCompartir(p: Producto): string {
    const url = `${location.origin}/producto/${p.id}`;
    const texto = `Mira esto en ${this.negocio.datos().nombre}: ${p.nombre} - $${this.precioFinal(p)}\n${url}`;
    return `https://wa.me/?text=${encodeURIComponent(texto)}`;
  }
}