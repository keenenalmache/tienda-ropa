import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-recuperar',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './recuperar.html',
  styleUrl: '../login/login.css',
})
export class Recuperar {
  private fb = inject(FormBuilder);
  private auth = inject(Auth);

  enviando = signal(false);
  enviado = signal(false);
  error = signal('');

  form = this.fb.nonNullable.group({
    correo: ['', [Validators.required, Validators.email]],
  });

  async enviar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.enviando.set(true);
    this.error.set('');
    const mensaje = await this.auth.enviarRecuperacion(this.form.getRawValue().correo.trim());
    this.enviando.set(false);
    if (mensaje) {
      this.error.set('No se pudo enviar el correo. Espera unos minutos e inténtalo de nuevo.');
    } else {
      this.enviado.set(true);
    }
  }
}