import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs';
import { Negocio } from '../../services/negocio';

const CLAVE = 'anuncio-cerrado';
const DIAS = 7;

function leerCerrado(): string | null {
  try {
    const x = JSON.parse(localStorage.getItem(CLAVE) ?? 'null');
    return x && x.hasta > Date.now() ? String(x.texto) : null;
  } catch {
    return null;
  }
}

@Component({
  selector: 'app-anuncio',
  templateUrl: './anuncio.html',
  styleUrl: './anuncio.css',
})
export class Anuncio {
  private negocio = inject(Negocio);
  private router = inject(Router);
  private url = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => this.router.url),
    ),
    { initialValue: this.router.url },
  );

  private listo = signal(false);
  private cerrado = signal<string | null>(leerCerrado());

  constructor() {
    setTimeout(() => this.listo.set(true), 2500);
  }

  texto = computed(() => this.negocio.datos().anuncio_texto.trim());

  visible = computed(() => {
    const d = this.negocio.datos();
    return (
      this.listo() &&
      d.anuncio_activo &&
      !!this.texto() &&
      !this.url().startsWith('/admin') &&
      this.cerrado() !== this.texto()
    );
  });

  enlace = computed(() => {
    const d = this.negocio.datos();
    const msg = d.anuncio_mensaje || d.anuncio_texto;
    return `https://wa.me/${d.whatsapp}?text=${encodeURIComponent(msg)}`;
  });

  cerrar() {
    this.cerrado.set(this.texto());
    try {
      localStorage.setItem(
        CLAVE,
        JSON.stringify({ texto: this.texto(), hasta: Date.now() + DIAS * 86400000 }),
      );
    } catch { /* sin almacenamiento */ }
  }
}