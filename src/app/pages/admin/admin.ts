import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '../../services/auth';
import {
  AdminProductos,
  Categoria,
  ImagenAdmin,
  ProductoAdmin,
  VarianteAdmin,
} from '../../services/admin-productos';

@Component({
  selector: 'app-admin',
  imports: [ReactiveFormsModule],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
})
export class Admin {
  private fb = inject(FormBuilder);
  private api = inject(AdminProductos);
  private auth = inject(Auth);
  private router = inject(Router);

  correo = this.auth.usuario;
  productos = signal<ProductoAdmin[]>([]);
  categorias = signal<Categoria[]>([]);
  cargando = signal(true);
  mensaje = signal('');
  error = signal('');
  mostrarForm = signal(false);
  editandoId = signal<number | null>(null);
  subiendo = signal(false);

  productoEditado = computed(() =>
    this.productos().find((p) => p.id === this.editandoId()),
  );

  form = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    descripcion: [''],
    precio: [0, [Validators.required, Validators.min(0)]],
    categoria_id: [0, [Validators.required, Validators.min(1)]],
    activo: [true],
  });

  formVariante = this.fb.nonNullable.group({
    talla: ['', Validators.required],
    color: ['', Validators.required],
    stock: [0, [Validators.required, Validators.min(0)]],
  });

  constructor() {
    this.cargar();
  }

  private async cargar() {
    try {
      const [productos, categorias] = await Promise.all([
        this.api.listar(),
        this.api.categorias(),
      ]);
      this.productos.set(productos);
      this.categorias.set(categorias);
    } catch (e: any) {
      this.error.set(e?.message ?? 'No se pudieron cargar los datos.');
    } finally {
      this.cargando.set(false);
    }
  }

  private async recargar() {
    this.productos.set(await this.api.listar());
  }

  private async ejecutar(accion: () => Promise<void>, ok: string) {
    this.error.set('');
    this.mensaje.set('');
    try {
      await accion();
      this.mensaje.set(ok);
    } catch (e: any) {
      this.error.set(e?.message ?? 'Ocurrió un error.');
    }
  }

  stockTotal(p: ProductoAdmin): number {
    return p.variantes.reduce((suma, v) => suma + v.stock, 0);
  }

  nuevo() {
    this.editandoId.set(null);
    this.form.reset({
      nombre: '',
      descripcion: '',
      precio: 0,
      categoria_id: this.categorias()[0]?.id ?? 0,
      activo: true,
    });
    this.mostrarForm.set(true);
  }

  editar(p: ProductoAdmin) {
    this.editandoId.set(p.id);
    this.form.reset({
      nombre: p.nombre,
      descripcion: p.descripcion ?? '',
      precio: Number(p.precio),
      categoria_id: p.categoria_id,
      activo: p.activo,
    });
    this.mostrarForm.set(true);
  }

  cerrar() {
    this.mostrarForm.set(false);
    this.editandoId.set(null);
  }

  async guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const datos = this.form.getRawValue();
    await this.ejecutar(async () => {
      const id = this.editandoId();
      if (id === null) {
        this.editandoId.set(await this.api.crear(datos));
      } else {
        await this.api.actualizar(id, datos);
      }
      await this.recargar();
    }, 'Producto guardado.');
  }

  async alternarActivo(p: ProductoAdmin) {
    await this.ejecutar(async () => {
      await this.api.cambiarActivo(p.id, !p.activo);
      await this.recargar();
    }, p.activo ? 'Producto oculto del catálogo.' : 'Producto visible en el catálogo.');
  }

  async agregarVariante() {
    const id = this.editandoId();
    if (id === null || this.formVariante.invalid) {
      this.formVariante.markAllAsTouched();
      return;
    }
    const { talla, color, stock } = this.formVariante.getRawValue();
    await this.ejecutar(async () => {
      await this.api.agregarVariante(id, talla.trim(), color.trim(), stock);
      this.formVariante.reset({ talla: '', color: '', stock: 0 });
      await this.recargar();
    }, 'Variante agregada.');
  }

  async cambiarStock(v: VarianteAdmin, evento: Event) {
    const valor = Number((evento.target as HTMLInputElement).value);
    if (!Number.isInteger(valor) || valor < 0) {
      this.error.set('El stock debe ser un número entero mayor o igual a 0.');
      return;
    }
    await this.ejecutar(async () => {
      await this.api.cambiarStock(v.id, valor);
      await this.recargar();
    }, 'Stock actualizado.');
  }

  async quitarVariante(v: VarianteAdmin) {
    if (!confirm(`¿Eliminar la variante ${v.talla} / ${v.color}?`)) return;
    await this.ejecutar(async () => {
      await this.api.eliminarVariante(v.id);
      await this.recargar();
    }, 'Variante eliminada.');
  }

  async subirFoto(evento: Event) {
    const input = evento.target as HTMLInputElement;
    const archivo = input.files?.[0];
    const p = this.productoEditado();
    if (!archivo || !p) return;

    if (!archivo.type.startsWith('image/')) {
      this.error.set('El archivo debe ser una imagen.');
      input.value = '';
      return;
    }
    if (archivo.size > 2 * 1024 * 1024) {
      this.error.set('La imagen pesa más de 2 MB. Usa una más liviana.');
      input.value = '';
      return;
    }

    const orden = Math.max(0, ...p.imagenes.map((i) => i.orden)) + 1;
    this.subiendo.set(true);
    await this.ejecutar(async () => {
      await this.api.subirImagen(p.id, archivo, orden);
      await this.recargar();
    }, 'Foto subida.');
    this.subiendo.set(false);
    input.value = '';
  }

  async quitarFoto(img: ImagenAdmin) {
    if (!confirm('¿Eliminar esta foto?')) return;
    await this.ejecutar(async () => {
      await this.api.eliminarImagen(img.id, img.url);
      await this.recargar();
    }, 'Foto eliminada.');
  }

  async salir() {
    await this.auth.salir();
    this.router.navigate(['/login']);
  }
}