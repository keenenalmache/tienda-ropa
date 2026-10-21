import { Component, computed, inject } from '@angular/core';
import { Negocio } from '../../services/negocio';

@Component({
  selector: 'app-contacto',
  imports: [],
  templateUrl: './contacto.html',
  styleUrl: './contacto.css',
})
export class Contacto {
  negocio = inject(Negocio).datos;

  enlaceWhatsapp = computed(() => {
    const mensaje = encodeURIComponent('Hola, quisiera más información.');
    return `https://wa.me/${this.negocio().whatsapp}?text=${mensaje}`;
  });
}