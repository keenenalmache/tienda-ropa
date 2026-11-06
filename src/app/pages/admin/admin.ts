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
  crearSlug 
} from '../../services/admin-productos';
import { Dialogos } from '../../services/dialogos';
type Vista = 'lista' | 'producto' | 'negocio' | 'categorias';
type Filtro = 'todos' | 'visibles' | 'ocultos' | 'stock-bajo' | 'sin-fotos';
type EstadoStock = 'agotado' | 'bajo' | 'ok';

// Con este stock total o menos se muestra "Últimas unidades"
const STOCK_BAJO = 3;

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
  private dialogos = inject(Dialogos);

  correo = this.auth.usuario;
  productos = signal<ProductoAdmin[]>([]);
  categorias = signal<Categoria[]>([]);
  cargando = signal(true);
  mensaje = signal('');
  error = signal('');
  vista = signal<Vista>('lista');
  editandoId = signal<number | null>(null);
  subiendo = signal(false);

  busqueda = signal('');
  filtro = signal<Filtro>('todos');
  filtros: { valor: Filtro; etiqueta: string }[] = [
    { valor: 'todos', etiqueta: 'Todos' },
    { valor: 'visibles', etiqueta: 'Visibles' },
    { valor: 'ocultos', etiqueta: 'Ocultos' },
    { valor: 'stock-bajo', etiqueta: 'Stock bajo o agotado' },
    { valor: 'sin-fotos', etiqueta: 'Sin fotos' },
  ];

  productoEditado = computed(() => this.productos().find((p) => p.id === this.editandoId()));

  resumen = computed(() => {
    const l = this.productos();
    return {
      total: l.length,
      ocultos: l.filter((p) => !p.activo).length,
      bajo: l.filter((p) => this.estadoStock(p) !== 'ok').length,
      sinFotos: l.filter((p) => p.imagenes.length === 0).length,
    };
  });

  listaFiltrada = computed(() => {
    const texto = this.busqueda().toLowerCase().trim();
    const f = this.filtro();
    return this.productos().filter((p) => {
      if (texto && !p.nombre.toLowerCase().includes(texto)) return false;
      switch (f) {
        case 'visibles':
          return p.activo;
        case 'ocultos':
          return !p.activo;
        case 'stock-bajo':
          return this.estadoStock(p) !== 'ok';
        case 'sin-fotos':
          return p.imagenes.length === 0;
        default:
          return true;
      }
    });
  });

  form = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    descripcion: [''],
    precio: [0, [Validators.required, Validators.min(0)]],
    precio_oferta: [null as number | null, [Validators.min(0)]],
    categoria_id: [0, [Validators.required, Validators.min(1)]],
    activo: [true],
    destacado: [false],
    nuevo: [false],
    genero: ['unisex']
  });
  editandoVarianteId = signal<number | null>(null);
  formEditVariante = this.fb.nonNullable.group({ talla: [''], color: [''], stock: [0] });
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
    frases: [''],
  });

  constructor() {
    this.cargar();
  }

  private async cargar() {
    try {
      const [productos, categorias] = await Promise.all([this.api.listar(), this.api.categorias()]);
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
      this.error.set(
        e?.code === '23505'
          ? 'Ya existe una variante con esa talla y color.'
          : (e?.message ?? 'Ocurrió un error.'),
      );
    }
  }
    generos = [
    { valor: 'unisex', etiqueta: 'Unisex' },
    { valor: 'hombre', etiqueta: 'Hombre' },
    { valor: 'mujer', etiqueta: 'Mujer' },
  ];

  formCategoria = this.fb.nonNullable.group({ nombre: [''] });
  formEditCategoria = this.fb.nonNullable.group({ nombre: [''] });
  editandoCategoriaId = signal<number | null>(null);

  categoriasConConteo = computed(() =>
    this.categorias().map((c) => ({
      ...c,
      total: this.productos().filter((p) => p.categoria_id === c.id).length,
    })),
  );

  // ---------- Stock ----------
  stockTotal(p: ProductoAdmin): number {
    return p.variantes.reduce((suma, v) => suma + v.stock, 0);
  }

  estadoStock(p: ProductoAdmin): EstadoStock {
    const total = this.stockTotal(p);
    if (total === 0) return 'agotado';
    return total <= STOCK_BAJO ? 'bajo' : 'ok';
  }

  fotosOrdenadas(p: ProductoAdmin): ImagenAdmin[] {
    return [...p.imagenes].sort((a, b) => a.orden - b.orden);
  }

  // ---------- Navegación entre vistas ----------
 private async confirmarSalida(): Promise<boolean> {
    const sucio =
      (this.vista() === 'producto' && this.form.dirty) ||
      (this.vista() === 'negocio' && this.formNegocio.dirty);
    if (!sucio) return true;
    return this.dialogos.preguntar({
      titulo: 'Cambios sin guardar',
      mensaje: 'Si sales ahora, perderás lo que cambiaste. ¿Quieres salir sin guardar?',
      confirmar: 'Salir sin guardar',
      cancelar: 'Seguir editando',
    });
  }

  private abrir(vista: Vista) {
    this.error.set('');
    this.mensaje.set('');
    this.vista.set(vista);
    this.irArriba();
  }

    async irA(vista: Vista) {
    if (!(await this.confirmarSalida())) return;
    if (vista === 'negocio') this.formNegocio.reset(this.negocio.datos());
    if (vista !== 'producto') this.editandoId.set(null);
    this.abrir(vista);
  }

  async nuevo() {
    if (!(await this.confirmarSalida())) return;
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
      genero: 'unisex'
    });
    this.abrir('producto');
  }

  async editar(p: ProductoAdmin) {
    if (!(await this.confirmarSalida())) return;
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
      genero: p.genero ?? 'unisex',
    });
    this.abrir('producto');
  }

  // ---------- Productos ----------
   async guardar() {
    const faltan = this.faltantes();
    if (faltan.length) {
      this.form.markAllAsTouched();
      await this.dialogos.avisar('Falta completar', 'Revisa lo siguiente antes de guardar:', faltan);
      return;
    }
    const datos = this.form.getRawValue();
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
        ? 'Producto creado. Ahora agrega tallas, colores y fotos.'
        : 'Cambios guardados correctamente.',
    );
    if (!this.error()) this.form.markAsPristine();
    this.irArriba();
  }
  private faltantes(): string[] {
    const f = this.form.controls;
    const lista: string[] = [];
    if (!f.nombre.value.trim()) lista.push('El nombre del producto');
        if (!(f.categoria_id.value >= 1)) lista.push('La categoría (si no hay ninguna, créala en la pestaña Categorías)');
    const precio = f.precio.value;
    if (!Number.isFinite(precio) || precio < 0) lista.push('El precio (un número desde 0)');
    const oferta = f.precio_oferta.value;
    if (oferta !== null && Number.isFinite(precio) && oferta >= precio) {
      lista.push('El precio de oferta debe ser menor que el precio normal');
    }
    return lista;
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

  async alternarMarca(p: ProductoAdmin, campo: 'destacado' | 'nuevo') {
    const cambio = campo === 'destacado' ? { destacado: !p.destacado } : { nuevo: !p.nuevo };
    await this.ejecutar(
      async () => {
        await this.api.actualizarParcial(p.id, cambio);
        await this.recargar();
      },
      'Etiqueta actualizada.',
    );
  }
  private async nombreCategoriaValido(nombre: string, idActual: number | null): Promise<boolean> {
    const n = nombre.trim();
    const faltan: string[] = [];
    if (!n) faltan.push('El nombre de la categoría');
    else if (!crearSlug(n)) faltan.push('El nombre debe tener letras o números');
    else if (this.categorias().some((c) => c.id !== idActual && crearSlug(c.nombre) === crearSlug(n))) {
      faltan.push('Ya existe una categoría con ese nombre');
    }
    if (!faltan.length) return true;
    await this.dialogos.avisar('Revisa el nombre', 'No se puede guardar todavía:', faltan);
    return false;
  }

  async agregarCategoria() {
    const nombre = this.formCategoria.getRawValue().nombre;
    if (!(await this.nombreCategoriaValido(nombre, null))) return;
    await this.ejecutar(async () => {
      await this.api.crearCategoria(nombre.trim());
      this.formCategoria.reset({ nombre: '' });
      this.categorias.set(await this.api.categorias());
    }, 'Categoría agregada.');
  }

  editarCategoria(c: Categoria) {
    this.formEditCategoria.reset({ nombre: c.nombre });
    this.editandoCategoriaId.set(c.id);
  }

  cancelarEdicionCategoria() {
    this.editandoCategoriaId.set(null);
  }

  async guardarCategoria(c: Categoria) {
    const nombre = this.formEditCategoria.getRawValue().nombre;
    if (!(await this.nombreCategoriaValido(nombre, c.id))) return;
    await this.ejecutar(async () => {
      await this.api.renombrarCategoria(c.id, nombre.trim());
      this.editandoCategoriaId.set(null);
      this.categorias.set(await this.api.categorias());
      await this.recargar();
    }, 'Categoría actualizada.');
  }

  async quitarCategoria(c: Categoria & { total: number }) {
    if (c.total > 0) {
      await this.dialogos.avisar(
        'No se puede eliminar',
        `La categoría "${c.nombre}" tiene ${c.total} producto(s).`,
        ['Cambia esos productos a otra categoría y vuelve a intentarlo.'],
      );
      return;
    }
    const ok = await this.dialogos.preguntar({
      titulo: 'Eliminar categoría',
      mensaje: `¿Eliminar la categoría "${c.nombre}"?`,
      confirmar: 'Eliminar',
    });
    if (!ok) return;
    await this.ejecutar(async () => {
      await this.api.eliminarCategoria(c.id);
      this.categorias.set(await this.api.categorias());
    }, 'Categoría eliminada.');
  }
  // Crea una copia oculta, con las mismas tallas y colores pero stock 0, y la abre para editarla
  async duplicar(p: ProductoAdmin) {
    await this.ejecutar(
      async () => {
        const id = await this.api.crear({
          nombre: `${p.nombre} (copia)`,
          descripcion: p.descripcion ?? '',
          precio: Number(p.precio),
          precio_oferta: p.precio_oferta == null ? null : Number(p.precio_oferta),
          categoria_id: p.categoria_id,
          activo: false,
          destacado: false,
          nuevo: false,
          genero: p.genero,
        });
        for (const v of p.variantes) {
          await this.api.agregarVariante(id, v.talla, v.color, 0);
        }
        await this.recargar();
        const copia = this.productos().find((x) => x.id === id);
        if (copia) await this.editar(copia);
      },
      'Copia creada: está oculta y con stock 0. Cambia lo que haga falta y agrega las fotos.',
    );
  }

  exportar() {
    const limpio = (t: string) => (/^[=+\-@]/.test(t) ? `'${t}` : t);
    const filas: string[][] = [['Producto', 'Categoría', 'Precio', 'Oferta', 'Stock', 'Estado']];
    for (const p of this.productos()) {
      filas.push([
        limpio(p.nombre),
        p.categorias?.nombre ?? '',
        String(p.precio),
        p.precio_oferta == null ? '' : String(p.precio_oferta),
        String(this.stockTotal(p)),
        p.activo ? 'Visible' : 'Oculto',
      ]);
    }
    const csv = filas.map((f) => f.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'productos.csv';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  // ---------- Variantes ----------
  async agregarVariante() {
    const id = this.editandoId();
    if (id === null) return;
    const { talla, color, stock } = this.formVariante.getRawValue();
    if (!(await this.validarVariante(talla, color, stock))) return;
    await this.ejecutar(async () => {
      await this.api.agregarVariante(id, talla.trim(), color.trim(), stock);
      this.formVariante.reset({ talla: '', color: '', stock: 0 });
      await this.recargar();
    }, 'Variante agregada.');
  }
  editarVariante(v: VarianteAdmin) {
    this.formEditVariante.reset({ talla: v.talla, color: v.color, stock: v.stock });
    this.editandoVarianteId.set(v.id);
  }
   cancelarEdicionVariante() {
    this.editandoVarianteId.set(null);
  }
  async guardarVariante(v: VarianteAdmin) {
    const { talla, color, stock } = this.formEditVariante.getRawValue();
    if (!(await this.validarVariante(talla, color, stock))) return;
    await this.ejecutar(async () => {
      await this.api.actualizarVariante(v.id, talla.trim(), color.trim(), stock);
      this.editandoVarianteId.set(null);
      await this.recargar();
    }, 'Variante actualizada.');
  }
  private async validarVariante(talla: string, color: string, stock: number): Promise<boolean> {
    const faltan: string[] = [];
    if (!talla.trim()) faltan.push('La talla');
    if (!color.trim()) faltan.push('El color');
    if (!Number.isInteger(stock) || stock < 0) faltan.push('El stock (un número entero desde 0)');
    if (!faltan.length) return true;
    await this.dialogos.avisar('Falta completar', 'Revisa lo siguiente:', faltan);
    return false;
  }
  async quitarVariante(v: VarianteAdmin) {
    const ok = await this.dialogos.preguntar({
      titulo: 'Eliminar variante',
      mensaje: `¿Eliminar la variante ${v.talla} / ${v.color}?`,
      confirmar: 'Eliminar',
    });
    if (!ok) return;
    await this.ejecutar(async () => {
      await this.api.eliminarVariante(v.id);
      await this.recargar();
    }, 'Variante eliminada.');
  }

  async quitarFoto(img: ImagenAdmin) {
    const ok = await this.dialogos.preguntar({
      titulo: 'Eliminar foto',
      mensaje: '¿Eliminar esta foto? No se puede deshacer.',
      confirmar: 'Eliminar',
    });
    if (!ok) return;
    await this.ejecutar(async () => {
      await this.api.eliminarImagen(img.id, img.url);
      await this.recargar();
    }, 'Foto eliminada.');
  }

 

  // ---------- Fotos ----------
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

  async moverFoto(p: ProductoAdmin, img: ImagenAdmin, direccion: -1 | 1) {
    const lista = this.fotosOrdenadas(p);
    const i = lista.findIndex((x) => x.id === img.id);
    const j = i + direccion;
    if (i < 0 || j < 0 || j >= lista.length) return;
    [lista[i], lista[j]] = [lista[j], lista[i]];
    await this.ejecutar(async () => {
      for (let k = 0; k < lista.length; k++) {
        if (lista[k].orden !== k + 1) await this.api.cambiarOrdenImagen(lista[k].id, k + 1);
      }
      await this.recargar();
    }, 'Orden de las fotos actualizado.');
  }

  // ---------- Datos del negocio ----------
  async guardarNegocio() {
    
    const v = this.formNegocio.getRawValue();
    const whatsapp = v.whatsapp.replace(/\D/g, '');
        const faltan: string[] = [];
    if (!v.nombre.trim()) faltan.push('El nombre del negocio');
    if (whatsapp.length < 8) faltan.push('El WhatsApp (solo números y con código de país, ej. 593991234567)');
    if (faltan.length) {
      await this.dialogos.avisar('Falta completar', 'Revisa lo siguiente antes de guardar:', faltan);
      return;
    }
    await this.ejecutar(async () => {
      await this.negocio.guardar({ ...v, nombre: v.nombre.trim(), whatsapp });
    }, 'Datos del negocio guardados correctamente.');
    if (!this.error()) this.formNegocio.markAsPristine();
    this.irArriba();
  }

  async salir() {
    await this.auth.salir();
    this.router.navigate(['/login']);
  }
}