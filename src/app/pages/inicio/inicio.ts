import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink} from '@angular/router';
import { Productos } from '../../services/productos';
import { Producto } from '../../models/producto';
import { Negocio } from '../../services/negocio';
import { Personaje } from '../../components/personaje/personaje';

@Component({
  selector: 'app-inicio',
  imports: [RouterLink, Personaje],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css',
})
export class Inicio {
  private servicio = inject(Productos);
  private negocio = inject(Negocio);

  datos = this.negocio.datos;
    listaFrases = computed(() =>
    this.datos().frases.split('\n').map((f) => f.trim()).filter(Boolean),
  );
  productos = signal<Producto[]>([]);

  destacados = computed(() => this.productos().filter((p) => p.destacado).slice(0, 10));
  fotoHombre = computed(() => this.fotoDe('hombre'));
  fotoMujer = computed(() => this.fotoDe('mujer'));

  enlaceWhatsapp = computed(() => {
    const mensaje = encodeURIComponent('Hola, quisiera más información.');
    return `https://wa.me/${this.datos().whatsapp}?text=${mensaje}`;
  });

  constructor() {
    this.servicio.obtenerTodos().then((lista) => this.productos.set(lista));
  }

  // Usa la foto de un producto destacado de la categoría; si no hay, la del primero con foto
  private fotoDe(categoria: string): string {
    const lista = this.productos().filter((p) => p.categoria === categoria && p.imagen);
    return (lista.find((p) => p.destacado) ?? lista[0])?.imagen ?? '';
  }
}