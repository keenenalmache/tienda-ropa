import { Component, computed, effect, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterOutlet, RouterLink } from '@angular/router';
import { Negocio } from './services/negocio';

@Component({
  imports: [RouterOutlet, RouterLink],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  private negocio = inject(Negocio);
  private titulo = inject(Title);
  nombre = computed(() => this.negocio.datos().nombre);

  constructor() {
    effect(() => this.titulo.setTitle(this.nombre()));
  }
}