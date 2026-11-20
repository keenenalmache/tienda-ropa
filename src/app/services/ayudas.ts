import { Injectable, computed, signal } from '@angular/core';

const CLAVE = 'ayudas-cerradas';

@Injectable({ providedIn: 'root' })
export class Ayudas {
  private cerradas = signal<string[]>(this.leer());
  hayCerradas = computed(() => this.cerradas().length > 0);

  visible(clave: string): boolean {
    return !this.cerradas().includes(clave);
  }

  cerrar(clave: string) {
    this.cerradas.update((l) => [...l, clave]);
    this.guardar();
  }

  restablecer() {
    this.cerradas.set([]);
    this.guardar();
  }

  private guardar() {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(this.cerradas()));
    } catch {}
  }

  private leer(): string[] {
    try {
      const v = JSON.parse(localStorage.getItem(CLAVE) ?? '[]');
      return Array.isArray(v) ? v : [];
    } catch {
      return [];
    }
  }
}