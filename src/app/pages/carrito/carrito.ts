import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Carrito, ItemCarrito } from '../../services/carrito';
import { Negocio } from '../../services/negocio';
import { Productos } from '../../services/productos';
import { Dialogos } from '../../services/dialogos';

@Component({
  selector: 'app-carrito',
  imports: [RouterLink],
  templateUrl: './carrito.html',
  styleUrl: './carrito.css',
})
export class CarritoPagina {
  carrito = inject(Carrito);
  private negocio = inject(Negocio);
  private productos = inject(Productos);
  private dlg = inject(Dialogos);

  nombre = signal('');
  entrega = signal<'Retiro en tienda' | 'Envío'>('Retiro en tienda');
  revisando = signal(true);

  disponibles = computed(() => this.carrito.items().filter((i) => i.stock > 0));
  total = computed(() => this.disponibles().reduce((s, i) => s + i.cantidad * i.precio, 0));

  constructor() {
    this.revisar();
  }

  // Revisa precios y stock reales antes de mostrar el total
  private async revisar() {
    try {
      const lista = await this.productos.obtenerTodos();
      this.carrito.sincronizar((i) => {
        const p = lista.find((x) => x.id === i.productoId);
        const v = p?.variantes.find((x) => x.talla === i.talla && x.color === i.color);
        if (!p || !v) return null;
        return { stock: v.stock, precio: p.precioOferta ?? p.precio };
      });
    } catch {
      /* si falla, se muestran los datos guardados */
    }
    this.revisando.set(false);
  }

  dinero(n: number): string {
    return Number.isInteger(n) ? String(n) : n.toFixed(2);
  }

  mas(i: ItemCarrito) {
    this.carrito.cambiar(i, 1);
  }
  menos(i: ItemCarrito) {
    this.carrito.cambiar(i, -1);
  }
  quitar(i: ItemCarrito) {
    this.carrito.quitar(i);
  }

  async vaciar() {
    const ok = await this.dlg.preguntar({
      titulo: 'Vaciar carrito',
      mensaje: '¿Quitar todos los productos del carrito?',
      confirmar: 'Vaciar',
    });
    if (ok) this.carrito.vaciar();
  }

  enlaceWhatsapp = computed(() => {
    const d = this.negocio.datos();
    const lineas = this.disponibles().map(
      (i) => `• ${i.cantidad}x ${i.nombre} (${i.talla}, ${i.color}) – $${this.dinero(i.precio)} c/u`,
    );
    const partes = [
      `Hola, quiero consultar estos productos de ${d.nombre}:`,
      ...lineas,
      `Total estimado: $${this.dinero(this.total())}`,
    ];
    if (this.nombre().trim()) partes.push(`Nombre: ${this.nombre().trim()}`);
    partes.push(`Entrega: ${this.entrega()}`);
    return `https://wa.me/${d.whatsapp}?text=${encodeURIComponent(partes.join('\n'))}`;
  });
}