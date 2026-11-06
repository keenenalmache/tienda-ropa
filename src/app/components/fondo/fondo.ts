import { Component, ElementRef, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { signal } from '@angular/core';

interface Pieza {
  img: string;
  x: number; // izquierda, en vw
  y: number; // arriba, en % del alto de la página
  w: number; // ancho, en vw
  r: number; // rotación, grados
  v: number; // parallax (0.03 suave - 0.15 marcado)
  d?: number; // retraso de aparición, segundos
  o?: number; // opacidad
  movil?: boolean; // false = se oculta en celular
}

type Seccion = 'inicio' | 'catalogo' | 'detalle' | 'otro' | 'admin';

// ====== AQUÍ AJUSTAS LA COMPOSICIÓN DE CADA SECCIÓN ======
const COMPOSICION: Record<Seccion, Pieza[]> = {
  inicio: [
    { img: 'mancha-fuxia', x: -5, y: 2, w: 28, r: -10, v: 0.06, d: 0.2 },
    { img: 'mancha-amarilla', x: 72, y: 4, w: 26, r: 15, v: 0.1, d: 0.5 },
    { img: 'letras-graffiti-1', x: 1, y: 12, w: 26, r: -6, v: 0.08, d: 0.9 },
    { img: 'dibujo-lata-spray', x: 88, y: 16, w: 9, r: 18, v: 0.12, d: 1.2 },
    { img: 'mancha-roja', x: 45, y: 22, w: 11, r: 0, v: 0.05, d: 1.4, movil: false },
    { img: 'mancha-rosada', x: 78, y: 30, w: 26, r: 20, v: 0.07 },
    { img: 'dibujo-spray-con-boca', x: 4, y: 40, w: 15, r: -8, v: 0.1 },
    { img: 'letras-graffiti-2', x: 68, y: 50, w: 27, r: 5, v: 0.08 },
    { img: 'cartel-alto-manchado', x: 42, y: 58, w: 11, r: -5, v: 0.12, movil: false },
    { img: 'frases-coloridas', x: 3, y: 66, w: 22, r: 4, v: 0.06 },
    { img: 'garabatos', x: 70, y: 74, w: 22, r: -4, v: 0.1 },
    { img: 'mancha-fuxia', x: 40, y: 84, w: 22, r: 8, v: 0.05 },
    { img: 'mancha-amarilla', x: -4, y: 90, w: 24, r: -12, v: 0.07 },
    { img: 'mancha-rosada', x: 75, y: 92, w: 24, r: 10, v: 0.06 },
  ],
  catalogo: [
    { img: 'mancha-fuxia', x: -8, y: 3, w: 22, r: -10, v: 0.06, o: 0.7 },
    { img: 'mancha-amarilla', x: 88, y: 10, w: 20, r: 15, v: 0.08, o: 0.7 },
    { img: 'dibujo-lata-spray', x: 93, y: 30, w: 8, r: 18, v: 0.1, o: 0.7 },
    { img: 'letras-graffiti-1', x: -6, y: 45, w: 20, r: -6, v: 0.07, o: 0.7, movil: false },
    { img: 'mancha-rosada', x: 90, y: 60, w: 20, r: 20, v: 0.06, o: 0.7 },
    { img: 'dibujo-spray-con-boca', x: -3, y: 78, w: 12, r: -8, v: 0.08, o: 0.7 },
    { img: 'mancha-roja', x: 92, y: 88, w: 9, r: 0, v: 0.05, o: 0.7 },
  ],
  detalle: [
    { img: 'mancha-fuxia', x: -8, y: 5, w: 22, r: -10, v: 0.06, o: 0.7 },
    { img: 'mancha-amarilla', x: 90, y: 8, w: 20, r: 15, v: 0.08, o: 0.7 },
    { img: 'garabatos', x: -6, y: 70, w: 18, r: -4, v: 0.07, o: 0.7, movil: false },
    { img: 'mancha-rosada', x: 92, y: 80, w: 18, r: 20, v: 0.06, o: 0.7 },
  ],
  otro: [
    { img: 'mancha-fuxia', x: -6, y: 5, w: 24, r: -10, v: 0.05, o: 0.75 },
    { img: 'mancha-amarilla', x: 82, y: 70, w: 24, r: 15, v: 0.05, o: 0.75 },
  ],
  admin: [],
};

@Component({
  selector: 'app-fondo',
  templateUrl: './fondo.html',
  styleUrl: './fondo.css',
})
export class Fondo {
  private el = inject(ElementRef<HTMLElement>);
  seccion = signal<Seccion>('inicio');
  piezas = () => COMPOSICION[this.seccion()];

  private visor?: IntersectionObserver;
  private ticking = false;

  constructor() {
    const router = inject(Router);
    this.seccionDe(router.url);
    router.events.subscribe((e) => {
      if (e instanceof NavigationEnd) {
        this.seccionDe(e.urlAfterRedirects);
        window.scrollTo?.(0, 0);
      }
    });

    const quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!quieto) {
      window.addEventListener(
        'scroll',
        () => {
          if (this.ticking) return;
          this.ticking = true;
          requestAnimationFrame(() => {
            this.el.nativeElement.style.setProperty('--sy', String(window.scrollY));
            this.ticking = false;
          });
        },
        { passive: true },
      );
    }

    // Cada pieza "se pinta" cuando entra en pantalla
    this.visor = new IntersectionObserver(
      (entradas) => {
        for (const en of entradas) {
          if (en.isIntersecting) {
            (en.target as HTMLElement).classList.add('visto');
            this.visor?.unobserve(en.target);
          }
        }
      },
      { threshold: 0.1 },
    );
  }

  private seccionDe(url: string) {
    const ruta = url.split('?')[0].split('#')[0];
    let s: Seccion = 'otro';
    if (ruta === '/' || ruta === '') s = 'inicio';
    else if (ruta.startsWith('/catalogo')) s = 'catalogo';
    else if (ruta.startsWith('/producto')) s = 'detalle';
    else if (ruta.startsWith('/admin')) s = 'admin';
    this.seccion.set(s);
    setTimeout(() => this.observar(), 80);
  }

  private observar() {
    this.el.nativeElement
      .querySelectorAll('.pz:not(.visto)')
      .forEach((p: Element) => this.visor?.observe(p));
  }
}