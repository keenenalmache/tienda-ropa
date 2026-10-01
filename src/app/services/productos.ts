import { Injectable } from '@angular/core';
import { Producto } from '../models/producto';

@Injectable({ providedIn: 'root' })
export class Productos {
  private productos: Producto[] = [
    {
      id: 1,
      nombre: 'Camiseta básica',
      categoria: 'hombre',
      precio: 12,
      tallas: ['S', 'M', 'L'],
      colores: ['blanco', 'negro'],
      descripcion: 'Algodón 100%.',
      imagen: 'camiseta.webp',
    },
    {
      id: 2,
      nombre: 'Vestido floral',
      categoria: 'mujer',
      precio: 25,
      tallas: ['S', 'M'],
      colores: ['azul'],
      descripcion: 'Ligero, ideal para el clima cálido.',
      imagen: 'vestido.webp',
    },
    {
      id: 3,
      nombre: 'Jean clásico',
      categoria: 'hombre',
      precio: 30,
      tallas: ['30', '32', '34'],
      colores: ['azul oscuro'],
      descripcion: 'Corte recto, tela resistente.',
      imagen: 'jean.webp',
    },
    {
      id: 4,
      nombre: 'Blusa de lino',
      categoria: 'mujer',
      precio: 18,
      tallas: ['S', 'M', 'L'],
      colores: ['beige', 'blanco'],
      descripcion: 'Fresca y cómoda para el día a día.',
      imagen: 'blusa.webp',
    },
    {
      id: 5,
      nombre: 'Conjunto deportivo infantil',
      categoria: 'ninos',
      precio: 20,
      tallas: ['4', '6', '8'],
      colores: ['rojo', 'gris'],
      descripcion: 'Dos piezas, algodón suave.',
      imagen: 'conjunto.webp',
    },
  ];

  obtenerTodos(): Producto[] {
    return this.productos;
  }

  obtenerPorId(id: number): Producto | undefined {
    return this.productos.find((p) => p.id === id);
  }

  filtrarPorCategoria(cat: string): Producto[] {
    return this.productos.filter((p) => p.categoria === cat);
  }
}