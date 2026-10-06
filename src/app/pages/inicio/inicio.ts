import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Productos } from '../../services/productos';
import { Producto } from '../../models/producto';
import { NEGOCIO } from '../../negocio.config';
@Component({
  selector: 'app-inicio',
  imports: [RouterLink],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css',
})
export class Inicio {
  nombre = NEGOCIO.nombre;
  private servicio = inject(Productos);
  destacados = signal<Producto[]>([]);

  constructor() {
    this.servicio
      .obtenerTodos()
      .then((lista) => this.destacados.set(lista.slice(0, 3)));
  }
}