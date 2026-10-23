import { Component, computed, effect, inject, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterOutlet, RouterLink } from '@angular/router';
import { Negocio } from './services/negocio';

type Tema = 'claro' | 'oscuro';

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
  tema = signal<Tema>(this.temaInicial());

  constructor() {
    effect(() => this.titulo.setTitle(this.nombre()));
    effect(() => {
      const t = this.tema();
      document.documentElement.setAttribute('data-tema', t);
      try {
        localStorage.setItem('tema', t);
      } catch {}
    });
  }

  alternarTema() {
    this.tema.update((t) => (t === 'oscuro' ? 'claro' : 'oscuro'));
  }

  // Primero lo que eligió el usuario; si no, la preferencia de su dispositivo
  private temaInicial(): Tema {
    try {
      const guardado = localStorage.getItem('tema');
      if (guardado === 'claro' || guardado === 'oscuro') return guardado;
    } catch {}
    return matchMedia('(prefers-color-scheme: dark)').matches ? 'oscuro' : 'claro';
  }
}