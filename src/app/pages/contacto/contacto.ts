import { Component } from '@angular/core';

@Component({
  selector: 'app-contacto',
  imports: [],
  templateUrl: './contacto.html',
  styleUrl: './contacto.css',
})
export class Contacto {
  negocio = {
    direccion: 'Calle Principal y Av. Central, Machala',
    horario: 'Lunes a sábado, 9:00 a 19:00',
    telefono: '+593 99 999 9999',
    whatsapp: '593999999999',
    instagram: '@tunegocio',
  };

  get enlaceWhatsapp(): string {
    const mensaje = encodeURIComponent('Hola, quisiera más información.');
    return `https://wa.me/${this.negocio.whatsapp}?text=${mensaje}`;
  }
}