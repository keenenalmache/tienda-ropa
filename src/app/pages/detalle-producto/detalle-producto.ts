import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Productos } from '../../services/productos';
import { Producto } from '../../models/producto';
import { Negocio } from '../../services/negocio';
import { Favoritos } from '../../services/favoritos';
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

  constructor() {
    const id = Number(this.ruta.snapshot.paramMap.get('id'));
    this.servicio.obtenerPorId(id).then((p) => {
      this.producto.set(p);
      this.cargando.set(false);
    });
  }
  enlaceCompartir(p: Producto): string {
  const url = `${location.origin}/producto/${p.id}`;
  const texto = `Mira esto en ${this.negocio.datos().nombre}: ${p.nombre} - $${p.precioOferta ?? p.precio}\n${url}`;
  return `https://wa.me/?text=${encodeURIComponent(texto)}`;
}
  enlaceWhatsapp(p: Producto): string {
    const mensaje = encodeURIComponent(`Hola, me interesa: ${p.nombre}`);
    return `https://wa.me/${this.negocio.datos().whatsapp}?text=${mensaje}`;
  }
}