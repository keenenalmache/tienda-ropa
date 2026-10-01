import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Productos } from '../../services/productos';
import { Producto } from '../../models/producto';

@Component({
  selector: 'app-detalle-producto',
  imports: [RouterLink],
  templateUrl: './detalle-producto.html',
  styleUrl: './detalle-producto.css',
})
export class DetalleProducto {
  private ruta = inject(ActivatedRoute);
  private servicio = inject(Productos);

  producto = signal<Producto | undefined>(undefined);
  cargando = signal(true);

  constructor() {
    const id = Number(this.ruta.snapshot.paramMap.get('id'));
    this.servicio.obtenerPorId(id).then((p) => {
      this.producto.set(p);
      this.cargando.set(false);
    });
  }

  enlaceWhatsapp(p: Producto): string {
    const mensaje = encodeURIComponent(`Hola, me interesa: ${p.nombre}`);
    return `https://wa.me/593XXXXXXXXX?text=${mensaje}`;
  }
}