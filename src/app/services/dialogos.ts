import { Injectable, signal } from '@angular/core';

export interface OpcionesDialogo {
  titulo: string;
  mensaje: string;
  lista?: string[];
  confirmar?: string;
  cancelar?: string | null; // null = sin botón de cancelar
}

@Injectable({ providedIn: 'root' })
export class Dialogos {
  estado = signal<OpcionesDialogo | null>(null);
  private resolver?: (valor: boolean) => void;

  preguntar(o: OpcionesDialogo): Promise<boolean> {
    this.resolver?.(false);
    this.estado.set(o);
    return new Promise((r) => (this.resolver = r));
  }

  avisar(titulo: string, mensaje: string, lista?: string[]): Promise<boolean> {
    return this.preguntar({ titulo, mensaje, lista, cancelar: null });
  }

  responder(valor: boolean) {
    this.estado.set(null);
    this.resolver?.(valor);
    this.resolver = undefined;
  }
}