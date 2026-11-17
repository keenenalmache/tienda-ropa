import { Injectable, signal } from '@angular/core';
import { supabase } from '../supabase.client';
import type { User } from '@supabase/supabase-js';

export interface Perfil {
  id: string;
  correo: string;
  nombre: string;
  foto: string | null;
  
}

@Injectable({ providedIn: 'root' })
export class Auth {
  usuario = signal<string | null>(null);

  perfil = signal<Perfil | null>(null);

  private aplicar(u: User | null) {
    this.usuario.set(u?.email ?? null);
    this.perfil.set(
      u
        ? {
            id: u.id,
            correo: u.email ?? '',
            nombre:
              u.user_metadata?.['full_name'] ?? u.user_metadata?.['name'] ?? (u.email ?? '').split('@')[0],
            foto: u.user_metadata?.['avatar_url'] ?? u.user_metadata?.['picture'] ?? null,
          }
        : null,
    );
  }

  constructor() {
    supabase.auth.getSession().then(({ data }) => this.aplicar(data.session?.user ?? null));
    supabase.auth.onAuthStateChange((_evento, sesion) => this.aplicar(sesion?.user ?? null));
  }

  // Ingreso de clientes: te manda a Google y vuelve a la misma página
   async entrarConGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: location.href, queryParams: { prompt: 'select_account' } },
    });
  }

  async cambiarCuenta() {
    await supabase.auth.signOut();
    await this.entrarConGoogle();
  }
  async entrar(correo: string, clave: string): Promise<string | null> {
    const { error } = await supabase.auth.signInWithPassword({
      email: correo,
      password: clave,
    });
    return error ? error.message : null;
  }

  async salir() {
    await supabase.auth.signOut();
  }

  async haySesion(): Promise<boolean> {
    const { data } = await supabase.auth.getSession();
    return !!data.session;
  }
    async enviarRecuperacion(correo: string): Promise<string | null> {
    const { error } = await supabase.auth.resetPasswordForEmail(correo, {
      redirectTo: `${location.origin}/restablecer`,
    });
    return error ? error.message : null;
  }

  async cambiarClave(clave: string): Promise<string | null> {
    const { error } = await supabase.auth.updateUser({ password: clave });
    return error ? error.message : null;
  }
    // ¿La cuenta actual es administradora? (lo decide la base de datos)
  async esAdmin(): Promise<boolean> {
    const { data, error } = await supabase.rpc('es_admin');
    return !error && data === true;
  }
}