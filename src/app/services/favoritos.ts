import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { supabase } from '../supabase.client';
import { Auth } from './auth';

const CLAVE = 'favoritos';

@Injectable({ providedIn: 'root' })
export class Favoritos {
  private auth = inject(Auth);
  private usuario: string | null = null;

  ids = signal<number[]>(this.leer());
  total = computed(() => this.ids().length);

  constructor() {
    effect(() => {
      const id = this.auth.perfil()?.id ?? null;
      untracked(() => this.alCambiarUsuario(id));
    });
  }

  esFavorito(id: number): boolean {
    return this.ids().includes(id);
  }

  alternar(id: number) {
    const ya = this.esFavorito(id);
    this.ids.update((l) => (ya ? l.filter((x) => x !== id) : [...l, id]));
    this.guardarLocal();
    if (this.usuario) this.guardarRemoto(this.usuario, id, ya);
  }

  private async guardarRemoto(usuario: string, id: number, eliminar: boolean) {
    if (eliminar) {
      await supabase.from('favoritos').delete().eq('user_id', usuario).eq('producto_id', id);
    } else {
      await supabase
        .from('favoritos')
        .upsert({ user_id: usuario, producto_id: id }, { onConflict: 'user_id,producto_id' });
    }
  }

  // Al ingresar: mezcla lo del navegador con lo de la cuenta. Al salir: limpia el dispositivo.
  private async alCambiarUsuario(id: string | null) {
    if (id === this.usuario) return;
    if (!id) {
      this.usuario = null;
      this.ids.set([]);
      this.guardarLocal();
      return;
    }
    this.usuario = id;
    const { data } = await supabase.from('favoritos').select('producto_id').eq('user_id', id);
    const remotos = (data ?? []).map((r) => Number(r.producto_id));
    const locales = this.ids();
    const nuevos = locales.filter((x) => !remotos.includes(x));
    if (nuevos.length) {
      await supabase
        .from('favoritos')
        .upsert(nuevos.map((p) => ({ user_id: id, producto_id: p })), { onConflict: 'user_id,producto_id' });
    }
    this.ids.set([...new Set([...remotos, ...locales])]);
    this.guardarLocal();
  }

  private guardarLocal() {
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