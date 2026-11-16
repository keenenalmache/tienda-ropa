import { Injectable, signal } from '@angular/core';
import { supabase } from '../supabase.client';

@Injectable({ providedIn: 'root' })
export class Auth {
  usuario = signal<string | null>(null);

  constructor() {
    supabase.auth.getSession().then(({ data }) => {
      this.usuario.set(data.session?.user.email ?? null);
    });
    supabase.auth.onAuthStateChange((_evento, sesion) => {
      this.usuario.set(sesion?.user.email ?? null);
    });
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