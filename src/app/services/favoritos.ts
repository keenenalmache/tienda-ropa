import { Injectable, signal, computed } from '@angular/core';

const CLAVE = 'favoritos';

@Injectable({ providedIn: 'root' })
export class Favoritos {
  ids = signal<number[]>(this.leer());
  total = computed(() => this.ids().length);

  esFavorito(id: number): boolean {
    return this.ids().includes(id);
  }

  alternar(id: number) {
    this.ids.update((l) => (l.includes(id) ? l.filter((x) => x !== id) : [...l, id]));
    try {
      localStorage.setItem(CLAVE, JSON.stringify(this.ids()));
    } catch {}
  }

  private leer(): number[] {
    try {
      const v = JSON.parse(localStorage.getItem(CLAVE) ?? '[]');
      return Array.isArray(v) ? v.filter((n) => typeof n === 'number') : [];
    } catch {
      return [];
    }
  }
}