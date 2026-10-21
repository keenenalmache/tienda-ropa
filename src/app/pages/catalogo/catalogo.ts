import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Productos } from '../../services/productos';
import { Producto } from '../../models/producto';

@Component({
  selector: 'app-catalogo',
  imports: [RouterLink],
  templateUrl: './catalogo.html',
  styleUrl: './catalogo.css',
})
export class Catalogo {
  private servicio = inject(Productos);
  private todos = signal<Producto[]>([]);
  cargando = signal(true);

  categorias = [
    { valor: 'todas', etiqueta: 'Todas' },
    { valor: 'hombre', etiqueta: 'Hombre' },
    { valor: 'mujer', etiqueta: 'Mujer' },
    { valor: 'ofertas', etiqueta: 'Ofertas' },
  ];

  categoriaActiva = signal('todas');
  busqueda = signal('');

  productos = computed(() => {
    const cat = this.categoriaActiva();
    const texto = this.busqueda().toLowerCase().trim();

    return this.todos()
      .filter((p) => {
        const coincideCategoria =
          cat === 'todas'
            ? true
            : cat === 'ofertas'
              ? p.precioOferta !== null
              : p.categoria === cat;
        return coincideCategoria && p.nombre.toLowerCase().includes(texto);
      })
      .sort((a, b) => Number(b.destacado) - Number(a.destacado));
  });

  constructor() {
    this.servicio.obtenerTodos().then((lista) => {
      this.todos.set(lista);
      this.cargando.set(false);
    });
  }

  elegirCategoria(valor: string) {
    this.categoriaActiva.set(valor);
  }

  buscar(evento: Event) {
    this.busqueda.set((evento.target as HTMLInputElement).value);
  }
}