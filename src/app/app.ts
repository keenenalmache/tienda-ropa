import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { NavigationEnd, Router, RouterOutlet, RouterLink } from '@angular/router';
import { filter, map } from 'rxjs';
import { Negocio } from './services/negocio';
import { Dialogo } from './components/dialogo/dialogo';
import { Pie } from './components/pie/pie';
import { Fondo } from './components/fondo/fondo';
type Tema = 'claro' | 'oscuro';

@Component({
 imports: [RouterOutlet, RouterLink, Fondo, Dialogo, Pie],  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  private negocio = inject(Negocio);
  private titulo = inject(Title);
  nombre = computed(() => this.negocio.datos().nombre);
    private router = inject(Router);
  private url = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map((e) => (e as NavigationEnd).urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  barraVisible = computed(() => !/^\/(admin|login|recuperar|restablecer|producto)/.test(this.url()));
  activa = computed(() => {
    const u = this.url();
    if (u === '/' || u === '') return 'inicio';
    if (u.startsWith('/catalogo')) return u.includes('filtro=favoritos') ? 'favoritos' : 'catalogo';
    return '';
  });
  enlaceWhatsapp = computed(
    () =>
      `https://wa.me/${this.negocio.datos().whatsapp}?text=${encodeURIComponent('Hola, quisiera más información.')}`,
  );
  tema = signal<Tema>(this.temaInicial());

    avisoTema = signal(this.avisoPendiente());

  private avisoPendiente(): boolean {
    try {
      return localStorage.getItem('aviso-tema') !== '1';
    } catch {
      return true;
    }
  }

  cerrarAviso() {
    this.avisoTema.set(false);
    try {
      localStorage.setItem('aviso-tema', '1');
    } catch {}
  }

  constructor() {
    effect(() => this.titulo.setTitle(this.nombre()));
    effect(() => {
      const t = this.tema();
      document.documentElement.setAttribute('data-tema', t);
      try {
        localStorage.setItem('tema', t);
      } catch {}
    });
    if (this.avisoTema()) setTimeout(() => this.cerrarAviso(), 9000);
  }

  alternarTema() {
    this.cerrarAviso();
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