import { Directive, ElementRef, HostListener, inject, input } from '@angular/core';

export function mayusculas(t: string): string {
  return t.toUpperCase();
}
export function capitalizar(t: string): string {
  const s = t.toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}
export function primeraMayuscula(t: string): string {
  const i = t.search(/[^\s¿¡]/);
  if (i === -1) return t;
  return t.slice(0, i) + t.charAt(i).toUpperCase() + t.slice(i + 1);
}
export function soloNumeros(t: string): string {
  return t.replace(/\D/g, '').slice(0, 15);
}
// 0991234567 → 593991234567
export function whatsappEc(t: string): string {
  let n = t.replace(/\D/g, '');
  if (n.startsWith('00')) n = n.slice(2);
  if (n.startsWith('0')) n = '593' + n.slice(1);
  return n.slice(0, 15);
}

type Modo = 'mayusculas' | 'capitalizar' | 'telefono' | 'whatsapp' | 'frase';

@Directive({ selector: 'input[formato]' })
export class Formato {
  formato = input.required<Modo>();
  private el = inject<ElementRef<HTMLInputElement>>(ElementRef);

  @HostListener('input')
  alEscribir() {
    const el = this.el.nativeElement;
    const antes = el.value;
    const despues = this.aplicar(antes);
    if (despues === antes) return;
    const pos = Math.max(0, (el.selectionStart ?? despues.length) - (antes.length - despues.length));
    el.value = despues;
    el.setSelectionRange(pos, pos);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }

  private aplicar(t: string): string {
    switch (this.formato()) {
      case 'mayusculas': return mayusculas(t);
      case 'capitalizar': return capitalizar(t);
      case 'telefono': return soloNumeros(t);
      case 'whatsapp': return whatsappEc(t);
      case 'frase': return primeraMayuscula(t);
    }
  }
}
