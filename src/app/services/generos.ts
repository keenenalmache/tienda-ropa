    import { Injectable, signal } from '@angular/core';
import { supabase } from '../supabase.client';

export interface Genero { valor: string; etiqueta: string; orden: number; }

@Injectable({ providedIn: 'root' })
export class Generos {
  lista = signal<Genero[]>([{ valor: 'unisex', etiqueta: 'Unisex', orden: 0 }]);

  async cargar(): Promise<Genero[]> {
    const { data } = await supabase.from('generos').select('*').order('orden').order('etiqueta');
    if (data?.length) this.lista.set(data as Genero[]);
    return this.lista();
  }

  async crear(valor: string, etiqueta: string) {
    const orden = this.lista().length;
    const { error } = await supabase.from('generos').insert({ valor, etiqueta, orden });
    if (error) throw error;
    await this.cargar();
  }

  async renombrar(valor: string, etiqueta: string) {
    const { error } = await supabase.from('generos').update({ etiqueta }).eq('valor', valor);
    if (error) throw error;
    await this.cargar();
  }

  async eliminar(valor: string) {
    const { error } = await supabase.from('generos').delete().eq('valor', valor);
    if (error) throw error;
    await this.cargar();
  }
}