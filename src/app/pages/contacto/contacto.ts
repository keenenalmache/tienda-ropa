import { Component } from '@angular/core';
import { NEGOCIO } from '../../negocio.config';

@Component({
  selector: 'app-contacto',
  imports: [],
  templateUrl: './contacto.html',
  styleUrl: './contacto.css',
})
export class Contacto {
  negocio = NEGOCIO;

  get enlaceWhatsapp(): string {
    const mensaje = encodeURIComponent('Hola, quisiera más información.');
    return `https://wa.me/${NEGOCIO.whatsapp}?text=${mensaje}`;
  }
}