export interface Producto {
  id: number;
  nombre: string;
  categoria: 'hombre' | 'mujer' | 'ninos';
  precio: number;
  tallas: string[];
  colores: string[];
  descripcion: string;
  imagen: string;
}