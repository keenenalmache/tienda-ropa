import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, map } from 'rxjs';
import { Negocio } from '../../services/negocio';

@Component({
  selector: 'app-pie',
  imports: [RouterLink],
  templateUrl: './pie.html',
  styleUrl: './pie.css',
})
export class Pie {
  private negocio = inject(Negocio);
  private router = inject(Router);

  datos = this.negocio.datos;
  anio = new Date().getFullYear();

  private url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );
  // No se muestra en el panel ni en las pantallas de acceso
  visible = computed(() => !/^\/(admin|login|recuperar|restablecer)/.test(this.url()));

  enlaceWhatsapp = computed(() => `https://wa.me/${this.datos().whatsapp}`);
  enlaceInstagram = computed(() => {
    const i = this.datos().instagram.trim();
    if (!i) return '';
    return i.startsWith('http') ? i : `https://instagram.com/${i.replace(/^@/, '')}`;
  });
}