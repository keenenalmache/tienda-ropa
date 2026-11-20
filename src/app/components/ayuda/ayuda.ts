import { Component, inject, input } from '@angular/core';
import { Ayudas } from '../../services/ayudas';

@Component({
  selector: 'app-ayuda',
  template: `
    @if (ayudas.visible(clave())) {
      <aside class="ayuda" role="note">
        <span class="foco" aria-hidden="true">💡</span>
        <div class="cuerpo"><ng-content /></div>
        <button type="button" class="cerrar" aria-label="Entendido, ocultar esta ayuda" (click)="ayudas.cerrar(clave())">✕</button>
      </aside>
    }
  `,
  styleUrl: './ayuda.css',
})
export class Ayuda {
  ayudas = inject(Ayudas);
  clave = input.required<string>();
}