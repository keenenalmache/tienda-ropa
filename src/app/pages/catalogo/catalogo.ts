import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
  private ruta = inject(ActivatedRoute);
  private router = inject(Router);
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
        let coincide = true;
        if (cat === 'ofertas') coincide = p.precioOferta !== null;
        else if (cat !== 'todas') coincide = p.categoria === cat;
        return coincide && p.nombre.toLowerCase().includes(texto);
      })
      .sort((a, b) => Number(b.destacado) - Number(a.destacado));
  });

  constructor() {
    this.ruta.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const filtro = params.get('filtro');
      const validos = this.categorias.map((c) => c.valor);
      this.categoriaActiva.set(filtro && validos.includes(filtro) ? filtro : 'todas');
    });

    this.servicio.obtenerTodos().then((lista) => {
      this.todos.set(lista);
      this.cargando.set(false);
    });
  }

  elegirCategoria(valor: string) {
    this.router.navigate([], {
      relativeTo: this.ruta,
      queryParams: { filtro: valor === 'todas' ? null : valor },
    });
  }

  buscar(evento: Event) {
    this.busqueda.set((evento.target as HTMLInputElement).value);
  }
}