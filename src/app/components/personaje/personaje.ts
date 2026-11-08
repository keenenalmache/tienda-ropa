import { Component, computed, effect, input, signal } from '@angular/core';

@Component({
  selector: 'app-personaje',
  templateUrl: './personaje.html',
  styleUrl: './personaje.css',
})
export class Personaje {
  src = input('personaje-grande.webp'); // modo oscuro (noche)
  srcDia = input('personaje-grande-dia.webp'); // modo claro (día)
  frases = input<string[]>([]);

  indice = signal(0);
  frase = computed(() => {
    const lista = this.frases();
    return lista.length ? lista[this.indice() % lista.length] : '';
  });

  constructor() {
    effect((limpiar) => {
      const n = this.frases().length;
      if (n < 2) return;
      const t = setInterval(() => this.indice.update((i) => (i + 1) % n), 4500);
      limpiar(() => clearInterval(t));
    });
  }
}