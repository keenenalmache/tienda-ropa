import { Component, computed, inject, signal } from '@angular/core';
import { Ayuda } from '../../../components/ayuda/ayuda';
import { AdminProductos, ProductoAdmin, VarianteAdmin } from '../../../services/admin-productos';

const STOCK_BAJO = 3;
type Filtro = 'todo' | 'agotado' | 'bajo' | 'con-stock';

@Component({
  selector: 'app-admin-inventario',
  imports: [Ayuda],
  templateUrl: './inventario-admin.html',
  styleUrl: './inventario-admin.css',
})
export class InventarioAdmin {
  private api = inject(AdminProductos);

  productos = signal<ProductoAdmin[]>([]);
  cargando = signal(true);
  error = signal('');
  busqueda = signal('');
  filtro = signal<Filtro>('todo');

  filtros: { valor: Filtro; etiqueta: string }[] = [
    { valor: 'todo', etiqueta: 'Todo' },
    { valor: 'agotado', etiqueta: 'Agotado' },
    { valor: 'bajo', etiqueta: 'Stock bajo (3 o menos)' },
    { valor: 'con-stock', etiqueta: 'Con stock' },
  ];

  resumen = computed(() => {
    const vars = this.productos().flatMap((p) => p.variantes);
    return {
      unidades: vars.reduce((s, v) => s + v.stock, 0),
      agotadas: vars.filter((v) => v.stock === 0).length,
      bajas: vars.filter((v) => v.stock > 0 && v.stock <= STOCK_BAJO).length,
    };
  });

  grupos = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    const f = this.filtro();
    return this.productos()
      .map((p) => {
        const nombreOk = !q || p.nombre.toLowerCase().includes(q);
        const vars = p.variantes.filter((v) => {
          if (q && !nombreOk && !`${v.talla} ${v.color}`.toLowerCase().includes(q)) return false;
          switch (f) {
            case 'agotado': return v.stock === 0;
            case 'bajo': return v.stock > 0 && v.stock <= STOCK_BAJO;
            case 'con-stock': return v.stock > 0;
            default: return true;
          }
        });
        return { p, vars };
      })
      .filter((g) => g.vars.length > 0);
  });

  constructor() {
    this.cargar();
  }

  async cargar() {
    try {
      this.productos.set(await this.api.listar());
    } catch {
      this.error.set('No se pudo cargar el inventario.');
    }
    this.cargando.set(false);
  }

  foto(p: ProductoAdmin): string | null {
    return [...p.imagenes].sort((a, b) => a.orden - b.orden)[0]?.url ?? null;
  }

  total(p: ProductoAdmin): number {
    return p.variantes.reduce((s, v) => s + v.stock, 0);
  }

  bajo(stock: number): boolean {
    return stock > 0 && stock <= STOCK_BAJO;
  }

  private poner(id: number, stock: number) {
    this.productos.update((l) =>
      l.map((p) => ({ ...p, variantes: p.variantes.map((x) => (x.id === id ? { ...x, stock } : x)) })),
    );
  }

  async fijar(v: VarianteAdmin, nuevo: number) {
    if (nuevo < 0 || nuevo === v.stock) return;
    const antes = v.stock;
    this.error.set('');
    this.poner(v.id, nuevo);
    try {
      await this.api.cambiarStock(v.id, nuevo);
    } catch {
      this.poner(v.id, antes);
      this.error.set('No se pudo guardar el cambio de stock.');
    }
  }

  desdeInput(v: VarianteAdmin, e: Event) {
    const el = e.target as HTMLInputElement;
    const n = Math.floor(Number(el.value));
    if (!Number.isFinite(n) || n < 0) {
      el.value = String(v.stock);
      return;
    }
    this.fijar(v, n);
  }
}