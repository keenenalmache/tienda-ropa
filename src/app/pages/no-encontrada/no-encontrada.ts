import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-no-encontrada',
  imports: [RouterLink],
  template: `
    <section class="caja">
      <p class="codigo" aria-hidden="true">404</p>
      <h1>Esta página no existe</h1>
      <p class="texto">
        Puede que el enlace esté mal escrito o que el producto ya no esté disponible.
      </p>
      <div class="acciones">
        <a routerLink="/" class="boton">Volver al inicio</a>
        <a routerLink="/catalogo" class="boton secundario">Ver catálogo</a>
      </div>
    </section>
  `,
  styles: `
    :host { display: block; }
    .caja {
      max-width: 520px;
      margin: 0 auto;
      padding: 7rem 1.2rem 3rem;
      text-align: center;
    }
    .codigo {
      margin: 0;
      font-size: clamp(5rem, 22vw, 9rem);
      font-weight: 900;
      line-height: 1;
      background: linear-gradient(#7ff0e3, #14a3a3 55%, #0b6e6e);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
      filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.35));
    }
    h1 { margin: 0.4rem 0 0.6rem; font-size: 1.6rem; }
    .texto { margin: 0 0 1.6rem; opacity: 0.85; }
    .acciones { display: flex; flex-wrap: wrap; gap: 0.7rem; justify-content: center; }
    .boton {
      display: inline-block;
      padding: 0.7rem 1.4rem;
      border-radius: 10px;
      font-weight: 800;
      text-decoration: none;
      color: #032b2b;
      background: linear-gradient(#35d3c4, #14a3a3 60%, #0d8585);
      border: 1px solid #0b7070;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      transition: transform 150ms ease;
    }
    .boton:hover { transform: translateY(-2px); }
    .boton.secundario {
      background: transparent;
      color: inherit;
      border-color: currentColor;
      box-shadow: none;
    }
  `,
})
export class NoEncontrada {}