import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-restablecer',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './restablecer.html',
  styleUrl: '../login/login.css',
})
export class Restablecer {
  private fb = inject(FormBuilder);
  private auth = inject(Auth);
  private router = inject(Router);

  estado = signal<'verificando' | 'listo' | 'vencido' | 'hecho'>('verificando');
  enviando = signal(false);
  error = signal('');

  form = this.fb.nonNullable.group({
    clave: ['', [Validators.required, Validators.minLength(8)]],
    repetir: ['', Validators.required],
  });

  constructor() {
    // Supabase procesa el enlace del correo y abre una sesión temporal
    this.auth.haySesion().then((ok) => this.estado.set(ok ? 'listo' : 'vencido'));
  }

  async guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    const { clave, repetir } = this.form.getRawValue();
    if (clave !== repetir) {
      this.error.set('Las contraseñas no coinciden.');
      return;
    }
    this.enviando.set(true);
    this.error.set('');
    const mensaje = await this.auth.cambiarClave(clave);
    this.enviando.set(false);
    if (mensaje) {
      this.error.set('No se pudo cambiar la contraseña. Pide un enlace nuevo.');
    } else {
      this.estado.set('hecho');
      setTimeout(() => this.router.navigate(['/admin']), 2000);
    }
  }
}