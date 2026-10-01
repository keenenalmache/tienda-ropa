import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Productos } from '../../services/productos';

@Component({
  selector: 'app-catalogo',
  imports: [RouterLink],
  templateUrl: './catalogo.html',
  styleUrl: './catalogo.css',
})
export class Catalogo {
  private servicio = inject(Productos);
  private todos = this.servicio.obtenerTodos();

  categorias = [
    { valor: 'todas', etiqueta: 'Todas' },
    { valor: 'hombre', etiqueta: 'Hombre' },
    { valor: 'mujer', etiqueta: 'Mujer' },
    { valor: 'ninos', etiqueta: 'Niños' },
  ];

  categoriaActiva = signal('todas');
  busqueda = signal('');

  productos = computed(() => {
    const cat = this.categoriaActiva();
    const texto = this.busqueda().toLowerCase().trim();

    return this.todos.filter(
      (p) =>
        (cat === 'todas' || p.categoria === cat) &&
        p.nombre.toLowerCase().includes(texto),
    );
  });

  elegirCategoria(valor: string) {
    this.categoriaActiva.set(valor);
  }

  buscar(evento: Event) {
    this.busqueda.set((evento.target as HTMLInputElement).value);
  }
}