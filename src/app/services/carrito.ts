import { Injectable, computed, effect, signal } from '@angular/core';

export interface ItemCarrito {
  productoId: number;
  nombre: string;
  talla: string;
  color: string;
  cantidad: number;
  precio: number; // precio unitario al momento de agregar
  foto: string;
  stock: number; // stock conocido de esa talla y color
}

const CLAVE = 'carrito';
const MAX_ITEMS = 30;

function leer(): ItemCarrito[] {
  try {
    const lista = JSON.parse(localStorage.getItem(CLAVE) ?? '[]');
    return Array.isArray(lista) ? lista : [];
  } catch {
    return [];
  }
}

@Injectable({ providedIn: 'root' })
export class Carrito {
  items = signal<ItemCarrito[]>(leer());

  unidades = computed(() => this.items().reduce((s, i) => s + i.cantidad, 0));
  subtotal = computed(() => this.items().reduce((s, i) => s + i.cantidad * i.precio, 0));

  constructor() {
    effect(() => {
      const datos = JSON.stringify(this.items());
      try {
        localStorage.setItem(CLAVE, datos);
      } catch { /* sin almacenamiento */ }
    });
  }

  private mismo(a: ItemCarrito, b: { productoId: number; talla: string; color: string }) {
    return a.productoId === b.productoId && a.talla === b.talla && a.color === b.color;
  }

  // Devuelve 'ok', 'tope' (ya está al máximo del stock) o 'lleno' (demasiados artículos)
  agregar(nuevo: Omit<ItemCarrito, 'cantidad'>): 'ok' | 'tope' | 'lleno' {
    const lista = this.items();
    const existente = lista.find((i) => this.mismo(i, nuevo));
    if (existente) {
      if (existente.cantidad >= nuevo.stock) return 'tope';
      this.items.set(
        lista.map((i) =>
          i === existente ? { ...i, cantidad: i.cantidad + 1, stock: nuevo.stock, precio: nuevo.precio } : i,
        ),
      );
      return 'ok';
    }
    if (lista.length >= MAX_ITEMS) return 'lleno';
    this.items.set([...lista, { ...nuevo, cantidad: 1 }]);
    return 'ok';
  }

  cantidadDe(productoId: number, talla: string, color: string): number {
    return this.items().find((i) => this.mismo(i, { productoId, talla, color }))?.cantidad ?? 0;
  }

  cambiar(item: ItemCarrito, delta: number) {
    const nueva = Math.min(Math.max(item.cantidad + delta, 1), Math.max(item.stock, 1));
    this.items.update((l) => l.map((i) => (i === item ? { ...i, cantidad: nueva } : i)));
  }

  quitar(item: ItemCarrito) {
    this.items.update((l) => l.filter((i) => i !== item));
  }

  vaciar() {
    this.items.set([]);
  }
    // Actualiza stock y precio con los datos reales; si ya no existe, queda sin stock
  sincronizar(datos: (i: ItemCarrito) => { stock: number; precio: number } | null) {
    this.items.update((l) =>
      l.map((i) => {
        const d = datos(i);
        if (!d) return { ...i, stock: 0 };
        return { ...i, stock: d.stock, precio: d.precio, cantidad: Math.min(i.cantidad, Math.max(d.stock, 1)) };
      }),
    );
  }
}