export interface Producto {
  id: number;
  nombre: string;
  categoria: string;
  precio: number;
  precioOferta: number | null;
  descuento: number;
  destacado: boolean;
  nuevo: boolean;
  tallas: string[];
  colores: string[];
  descripcion: string;
  imagen: string;
}