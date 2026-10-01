import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Productos } from '../../services/productos';

@Component({
  selector: 'app-inicio',
  imports: [RouterLink],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css',
})
export class Inicio {
  private servicio = inject(Productos);
  destacados = this.servicio.obtenerTodos().slice(0, 3);
}