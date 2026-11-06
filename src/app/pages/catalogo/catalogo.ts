import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Productos, categoriasDe } from '../../services/productos';
import { Favoritos } from '../../services/favoritos';
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
  favs = inject(Favoritos);

  private todos = signal<Producto[]>([]);
  cargando = signal(true);
  busqueda = signal('');
  private filtroUrl = signal('todas');
  private paraUrl = signal('todos');

  paraOpciones = [
    { valor: 'todos', etiqueta: 'Todos' },
    { valor: 'hombre', etiqueta: 'Hombre' },
    { valor: 'mujer', etiqueta: 'Mujer' },
    { valor: 'unisex', etiqueta: 'Unisex' },
  ];

  // Categorías reales (solo las que tienen productos) + Ofertas y Favoritos
  categorias = computed(() => [
    { valor: 'todas', etiqueta: 'Todas' },
    ...categoriasDe(this.todos()).map((c) => ({ valor: c.slug, etiqueta: c.nombre })),
    { valor: 'ofertas', etiqueta: 'Ofertas' },
    { valor: 'favoritos', etiqueta: 'Favoritos ♥' },
  ]);

  categoriaActiva = computed(() =>
    this.categorias().some((c) => c.valor === this.filtroUrl()) ? this.filtroUrl() : 'todas',
  );
  paraActivo = computed(() =>
    this.paraOpciones.some((o) => o.valor === this.paraUrl()) ? this.paraUrl() : 'todos',
  );

  productos = computed(() => {
    const cat = this.categoriaActiva();
    const para = this.paraActivo();
    const texto = this.busqueda().toLowerCase().trim();

    return this.todos()
      .filter((p) => {
        if (cat === 'ofertas' && p.precioOferta === null) return false;
        if (cat === 'favoritos' && !this.favs.esFavorito(p.id)) return false;
        if (cat !== 'todas' && cat !== 'ofertas' && cat !== 'favoritos' && p.categoria !== cat) return false;
        // Hombre y Mujer incluyen también lo unisex
        if (para === 'unisex' && p.genero !== 'unisex') return false;
        if ((para === 'hombre' || para === 'mujer') && p.genero !== para && p.genero !== 'unisex') return false;        return p.nombre.toLowerCase().includes(texto);
      })
      .sort((a, b) => Number(b.destacado) - Number(a.destacado));
  });

  constructor() {
    this.ruta.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      this.filtroUrl.set(params.get('filtro') ?? 'todas');
      this.paraUrl.set(params.get('para') ?? 'todos');
    });

    this.servicio.obtenerTodos().then((lista) => {
      this.todos.set(lista);
      this.cargando.set(false);
    });
  }

  elegirCategoria(valor: string) {
    this.router.navigate([], {
      relativeTo: this.ruta,
      queryParamsHandling: 'merge',
      queryParams: { filtro: valor === 'todas' ? null : valor },
    });
  }

  elegirPara(valor: string) {
    this.router.navigate([], {
      relativeTo: this.ruta,
      queryParamsHandling: 'merge',
      queryParams: { para: valor === 'todos' ? null : valor },
    });
  }

  buscar(evento: Event) {
    this.busqueda.set((evento.target as HTMLInputElement).value);
  }
}