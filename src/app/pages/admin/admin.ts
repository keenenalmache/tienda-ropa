import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '../../services/auth';
import { Negocio } from '../../services/negocio';
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
  private negocio = inject(Negocio);
  private temporizador?: ReturnType<typeof setTimeout>;

  correo = this.auth.usuario;
  productos = signal<ProductoAdmin[]>([]);
  categorias = signal<Categoria[]>([]);
  cargando = signal(true);
  mensaje = signal('');
  error = signal('');
  mostrarForm = signal(false);
  mostrarNegocio = signal(false);
  editandoId = signal<number | null>(null);
  subiendo = signal(false);

  productoEditado = computed(() =>
    this.productos().find((p) => p.id === this.editandoId()),
  );

  form = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    descripcion: [''],
    precio: [0, [Validators.required, Validators.min(0)]],
    precio_oferta: [null as number | null, [Validators.min(0)]],
    categoria_id: [0, [Validators.required, Validators.min(1)]],
    activo: [true],
    destacado: [false],
    nuevo: [false],
  });

  formVariante = this.fb.nonNullable.group({
    talla: ['', Validators.required],
    color: ['', Validators.required],
    stock: [0, [Validators.required, Validators.min(0)]],
  });

  formNegocio = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    lema: [''],
    whatsapp: [''],
    telefono: [''],
    direccion: [''],
    horario: [''],
    instagram: [''],
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

  private irArriba() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private async ejecutar(accion: () => Promise<void>, ok: string) {
    clearTimeout(this.temporizador);
    this.error.set('');
    this.mensaje.set('');
    try {
      await accion();
      this.mensaje.set(ok);
      this.temporizador = setTimeout(() => this.mensaje.set(''), 6000);
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
      precio_oferta: null,
      categoria_id: this.categorias()[0]?.id ?? 0,
      activo: true,
      destacado: false,
      nuevo: false,
    });
    this.mostrarForm.set(true);
  }

  editar(p: ProductoAdmin) {
    this.editandoId.set(p.id);
    this.form.reset({
      nombre: p.nombre,
      descripcion: p.descripcion ?? '',
      precio: Number(p.precio),
      precio_oferta: p.precio_oferta == null ? null : Number(p.precio_oferta),
      categoria_id: p.categoria_id,
      activo: p.activo,
      destacado: p.destacado,
      nuevo: p.nuevo,
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
      this.error.set('Completa el nombre y elige una categoría.');
      this.irArriba();
      return;
    }
    const datos = this.form.getRawValue();
    if (datos.precio_oferta !== null && datos.precio_oferta >= datos.precio) {
      this.error.set('El precio de oferta debe ser menor que el precio normal.');
      this.irArriba();
      return;
    }
    const esNuevo = this.editandoId() === null;
    await this.ejecutar(
      async () => {
        const id = this.editandoId();
        if (id === null) {
          this.editandoId.set(await this.api.crear(datos));
        } else {
          await this.api.actualizar(id, datos);
        }
        await this.recargar();
      },
      esNuevo
        ? 'Producto creado. Baja para agregar tallas, colores y fotos.'
        : 'Cambios guardados correctamente.',
    );
    this.irArriba();
  }

  async alternarActivo(p: ProductoAdmin) {
    await this.ejecutar(
      async () => {
        await this.api.cambiarActivo(p.id, !p.activo);
        await this.recargar();
      },
      p.activo ? 'Producto oculto del catálogo.' : 'Producto visible en el catálogo.',
    );
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

  // Reduce a 1600 px como máximo y convierte a WebP antes de subir
  private optimizarImagen(archivo: File): Promise<File> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(archivo);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        const escala = Math.min(1, 1600 / Math.max(img.width, img.height));
        const ancho = Math.round(img.width * escala);
        const alto = Math.round(img.height * escala);
        const lienzo = document.createElement('canvas');
        lienzo.width = ancho;
        lienzo.height = alto;
        const ctx = lienzo.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo procesar la imagen.'));
          return;
        }
        ctx.drawImage(img, 0, 0, ancho, alto);
        lienzo.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('No se pudo procesar la imagen.'));
              return;
            }
            const ext = blob.type === 'image/webp' ? 'webp' : 'png';
            const base = archivo.name.replace(/\.[^.]+$/, '');
            resolve(new File([blob], `${base}.${ext}`, { type: blob.type }));
          },
          'image/webp',
          0.85,
        );
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('No se pudo leer la imagen. Usa un archivo JPG, PNG o WebP.'));
      };
      img.src = url;
    });
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
    if (archivo.size > 15 * 1024 * 1024) {
      this.error.set('La imagen pesa más de 15 MB.');
      input.value = '';
      return;
    }

    const orden = Math.max(0, ...p.imagenes.map((i) => i.orden)) + 1;
    this.subiendo.set(true);
    await this.ejecutar(async () => {
      const lista = await this.optimizarImagen(archivo);
      await this.api.subirImagen(p.id, lista, orden);
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

  abrirNegocio() {
    this.formNegocio.reset(this.negocio.datos());
    this.mostrarNegocio.set(true);
  }

  async guardarNegocio() {
    if (this.formNegocio.invalid) {
      this.formNegocio.markAllAsTouched();
      this.error.set('El nombre del negocio es obligatorio.');
      this.irArriba();
      return;
    }
    const v = this.formNegocio.getRawValue();
    const whatsapp = v.whatsapp.replace(/\D/g, '');
    if (whatsapp.length < 8) {
      this.error.set('El WhatsApp debe llevar solo números y el código de país. Ejemplo: 593991234567');
      this.irArriba();
      return;
    }
    await this.ejecutar(async () => {
      await this.negocio.guardar({ ...v, nombre: v.nombre.trim(), whatsapp });
    }, 'Datos del negocio guardados correctamente.');
    this.irArriba();
  }

  async salir() {
    await this.auth.salir();
    this.router.navigate(['/login']);
  }
}