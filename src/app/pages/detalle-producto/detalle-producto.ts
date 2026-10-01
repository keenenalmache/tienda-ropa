import { Component, inject } from '@angular/core';
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

  producto?: Producto;

  constructor() {
    const id = Number(this.ruta.snapshot.paramMap.get('id'));
    this.producto = this.servicio.obtenerPorId(id);
  }

  enlaceWhatsapp(p: Producto): string {
    const mensaje = encodeURIComponent(`Hola, me interesa: ${p.nombre}`);
    return `https://wa.me/+593978901839?text=${mensaje}`;
  }
}