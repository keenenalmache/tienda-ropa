import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private fb = inject(FormBuilder);
  private auth = inject(Auth);
  private router = inject(Router);

  error = signal('');
  enviando = signal(false);

  form = this.fb.nonNullable.group({
    correo: ['', [Validators.required, Validators.email]],
    clave: ['', Validators.required],
  });

  async entrar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.enviando.set(true);
    this.error.set('');
    const { correo, clave } = this.form.getRawValue();
    const mensaje = await this.auth.entrar(correo, clave);
    this.enviando.set(false);
    if (mensaje) {
      this.error.set('Correo o contraseña incorrectos.');
    } else {
      this.router.navigate(['/admin']);
    }
  }
}