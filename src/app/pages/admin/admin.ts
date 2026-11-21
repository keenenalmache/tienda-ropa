import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
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
import { DIAS_NUEVO } from '../../services/productos';
import { ResenasAdmin } from './resenas-admin/resenas-admin';
import { AdminResenas } from '../../services/admin-resenas';
import { Formato } from '../../utils/formato';
import { Ayuda } from '../../components/ayuda/ayuda';
import { Ayudas } from '../../services/ayudas';
import { InventarioAdmin } from './inventario-admin/inventario-admin';
import { Generos } from '../../services/generos';


type Vista = 'lista' | 'producto' | 'negocio' | 'categorias' | 'resenas' | 'inventario';
type Filtro = 'todos' | 'visibles' | 'ocultos' | 'stock-bajo' | 'sin-fotos';
type EstadoStock = 'agotado' | 'bajo' | 'ok';

// Con este stock total o menos se muestra "Últimas unidades"
const STOCK_BAJO = 3;

@Component({
  selector: 'app-admin',
  imports: [ReactiveFormsModule, ResenasAdmin, Formato, Ayuda, InventarioAdmin],
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
  private resApi = inject(AdminResenas);
  private ruta = inject(ActivatedRoute);
  ayudas = inject(Ayudas);
  private gen = inject(Generos);
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

    nuevasResenas = signal(0);

  private resenasVistoEn(): string {
    try {
      return localStorage.getItem('resenas-visto') ?? '1970-01-01T00:00:00Z';
    } catch {
      return '1970-01-01T00:00:00Z';
    }
  }

  private async contarNuevasResenas() {
    this.nuevasResenas.set(await this.resApi.contarDesde(this.resenasVistoEn()));
  }

  listaFiltrada = computed(() => {
    const texto = this.busqueda().toLowerCase().trim();
    const f = this.filtro();
    return this.productos().filter((p) => {
      if (texto && !p.nombre.toLowerCase().includes(texto)) return false;
      if (this.categoriaFiltro() && p.categoria_id !== this.categoriaFiltro()) return false;
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
    anuncio_activo: [false],
    anuncio_texto: [''],
    anuncio_mensaje: [''],
  });

    frasesLista = signal<string[]>(['']);

  private frasesDe(texto: string): string[] {
    const l = texto.split('\n').map((f) => f.trim()).filter(Boolean);
    return l.length ? l : [''];
  }

  cambiarFrase(i: number, texto: string) {
    this.frasesLista.update((l) => l.map((f, j) => (j === i ? texto : f)));
    this.formNegocio.markAsDirty();
  }

  agregarFrase() {
    if (this.frasesLista().length >= 8) return;
    this.frasesLista.update((l) => [...l, '']);
    this.formNegocio.markAsDirty();
  }

  quitarFrase(i: number) {
    this.frasesLista.update((l) => (l.length > 1 ? l.filter((_, j) => j !== i) : ['']));
    this.formNegocio.markAsDirty();
  }

  constructor() {
    this.cargar().then(() => this.abrirDesdeEnlace());
    this.contarNuevasResenas();
  }

    categoriaFiltro = signal(0);
  seleccion = signal<number[]>([]);
    modoSeleccion = signal(false);

  alternarModoSel() {
    this.modoSeleccion.update((v) => !v);
    if (!this.modoSeleccion()) this.seleccion.set([]);
  }

  estaSel(id: number): boolean {
    return this.seleccion().includes(id);
  }

  alternarSel(id: number) {
    this.seleccion.update((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  todosSel = computed(() => {
    const l = this.listaFiltrada();
    return l.length > 0 && l.every((p) => this.seleccion().includes(p.id));
  });

  alternarTodos() {
    const ids = this.listaFiltrada().map((p) => p.id);
    if (this.todosSel()) this.seleccion.update((s) => s.filter((id) => !ids.includes(id)));
    else this.seleccion.update((s) => [...new Set([...s, ...ids])]);
  }

  limpiarSel() {
    this.seleccion.set([]);
  }

  async masivo(cambio: { categoria_id?: number; activo?: boolean; nuevo?: boolean; destacado?: boolean }, ok: string) {
    const ids = this.seleccion();
    if (!ids.length) return;
    await this.ejecutar(async () => {
      await this.api.actualizarVarios(ids, cambio);
      this.seleccion.set([]);
      await this.recargar();
    }, ok);
  }

  async moverSeleccion(valor: string) {
    const id = Number(valor);
    if (!id) return;
    const nombre = this.categorias().find((c) => c.id === id)?.nombre ?? '';
    await this.masivo({ categoria_id: id }, `Productos movidos a "${nombre}".`);
  }

  async etiquetaSeleccion(valor: string) {
    const mapa: Record<string, [{ nuevo?: boolean; destacado?: boolean }, string]> = {
      'nuevo+': [{ nuevo: true }, 'Productos marcados como Nuevo.'],
      'nuevo-': [{ nuevo: false }, 'Se quitó la etiqueta Nuevo.'],
      'dest+': [{ destacado: true }, 'Productos marcados como Destacado.'],
      'dest-': [{ destacado: false }, 'Se quitó la etiqueta Destacado.'],
    };
    const m = mapa[valor];
    if (m) await this.masivo(m[0], m[1]);
  }

  async eliminarSeleccion() {
    const sel = this.productos().filter((p) => this.seleccion().includes(p.id));
    if (!sel.length) return;
    const nombres = sel.slice(0, 8).map((p) => p.nombre);
    if (sel.length > 8) nombres.push(`… y ${sel.length - 8} más`);
    const ok = await this.dialogos.preguntar({
      titulo: 'Eliminar productos',
      mensaje: `Vas a eliminar ${sel.length} producto(s) con sus fotos, tallas y stock. No se puede deshacer.`,
      lista: nombres,
      confirmar: 'Eliminar',
      cancelar: 'Cancelar',
    });
    if (!ok) return;
    await this.ejecutar(async () => {
      for (const p of sel) await this.api.eliminarProducto(p);
      this.seleccion.set([]);
      await this.recargar();
    }, `${sel.length} producto(s) eliminado(s).`);
  }
  private async abrirDesdeEnlace() {
    const id = Number(this.ruta.snapshot.queryParamMap.get('editar'));
    if (!id) return;
    const p = this.productos().find((x) => x.id === id);
    if (p) await this.editar(p);
  }
  private async cargar() {
    await this.gen.cargar();
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
    generos = this.gen.lista;
  formGenero = this.fb.nonNullable.group({ nombre: [''] });
  formEditGenero = this.fb.nonNullable.group({ nombre: [''] });
  editandoGenero = signal<string | null>(null);

  generosConConteo = computed(() =>
    this.generos().map((g) => ({
      ...g,
      total: this.productos().filter((p) => (p.genero ?? 'unisex') === g.valor).length,
    })),
  );

  async agregarGenero() {
    const nombre = this.formGenero.getRawValue().nombre.trim();
    const valor = crearSlug(nombre);
    if (!nombre || !valor) {
      await this.dialogos.avisar('Revisa el nombre', 'Escribe un nombre para el género.', []);
      return;
    }
    if (this.generos().some((g) => g.valor === valor)) {
      await this.dialogos.avisar('Ya existe', `Ya hay un género llamado "${nombre}".`, []);
      return;
    }
    await this.ejecutar(async () => {
      await this.gen.crear(valor, nombre);
      this.formGenero.reset({ nombre: '' });
    }, 'Género agregado.');
  }

  editarGenero(g: { valor: string; etiqueta: string }) {
    this.formEditGenero.reset({ nombre: g.etiqueta });
    this.editandoGenero.set(g.valor);
  }

  async guardarGenero(valor: string) {
    const nombre = this.formEditGenero.getRawValue().nombre.trim();
    if (!nombre) return;
    await this.ejecutar(async () => {
      await this.gen.renombrar(valor, nombre);
      this.editandoGenero.set(null);
    }, 'Género actualizado.');
  }

  async quitarGenero(g: { valor: string; etiqueta: string; total: number }) {
    if (g.valor === 'unisex') {
      await this.dialogos.avisar('No se puede eliminar', '"Unisex" es el género base.', []);
      return;
    }
    if (g.total > 0) {
      await this.dialogos.avisar(
        'No se puede eliminar',
        `"${g.etiqueta}" lo usan ${g.total} producto(s).`,
        ['Cámbialos a otro género y vuelve a intentarlo.'],
      );
      return;
    }
    const ok = await this.dialogos.preguntar({
      titulo: 'Eliminar género',
      mensaje: `¿Eliminar "${g.etiqueta}"?`,
      confirmar: 'Eliminar',
    });
    if (!ok) return;
    await this.ejecutar(() => this.gen.eliminar(g.valor), 'Género eliminado.');
  }

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
    if (vista === 'negocio') {
      this.formNegocio.reset(this.negocio.datos());
      this.frasesLista.set(this.frasesDe(this.negocio.datos().frases));
    }    if (vista !== 'producto') this.editandoId.set(null);
        if (vista === 'resenas') {
      try {
        localStorage.setItem('resenas-visto', new Date().toISOString());
      } catch { /* sin almacenamiento */ }
      this.nuevasResenas.set(0);
    }
    
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
    async eliminarProducto(p: ProductoAdmin) {
    const ok = await this.dialogos.preguntar({
      titulo: 'Eliminar producto',
      mensaje: `¿Eliminar "${p.nombre}" para siempre? Se borrarán también sus fotos, tallas y colores y no se puede deshacer. Si solo quieres quitarlo del catálogo, usa "Ocultar".`,
      confirmar: 'Eliminar',
    });
    if (!ok) return;
    await this.ejecutar(async () => {
      await this.api.eliminarProducto(p);
      if (this.editandoId() === p.id) {
        this.editandoId.set(null);
        this.form.markAsPristine();
        this.abrir('lista');
      }
      await this.recargar();
    }, 'Producto eliminado.');
  }
  masId = signal<number | null>(null);

  alternarMas(id: number) {
    this.masId.update((actual) => (actual === id ? null : id));
  }
  // Días que le quedan a la etiqueta "Nuevo" (para mostrarlo en la lista)
  textoNuevo(p: ProductoAdmin): string {
    if (!p.nuevo || !p.nuevo_desde) return '';
    const restan = DIAS_NUEVO - Math.floor((Date.now() - new Date(p.nuevo_desde).getTime()) / 86400000);
    return restan > 0 ? `${restan} d` : 'vencido';
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
    const archivos = Array.from(input.files ?? []);
    const p = this.productoEditado();
    if (!archivos.length || !p) return;

    const validos = archivos.filter((a) => a.type.startsWith('image/') && a.size <= 15 * 1024 * 1024);
    const omitidos = archivos.length - validos.length;
    if (!validos.length) {
      this.error.set('Los archivos deben ser imágenes de máximo 15 MB.');
      input.value = '';
      return;
    }

    let orden = Math.max(0, ...p.imagenes.map((i) => i.orden));
    const base = validos.length === 1 ? 'Foto subida.' : `${validos.length} fotos subidas.`;
    const aviso = omitidos ? ` (${omitidos} se omitieron: no eran imágenes o pesaban más de 15 MB)` : '';

    this.subiendo.set(true);
    await this.ejecutar(async () => {
      try {
        for (const archivo of validos) {
          const lista = await this.optimizarImagen(archivo);
          orden++;
          await this.api.subirImagen(p.id, lista, orden);
        }
      } finally {
        await this.recargar();
      }
    }, base + aviso);
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
    async guardarTextoFoto(img: ImagenAdmin, titulo: string, descripcion: string) {
    if ((img.titulo ?? '') === titulo.trim() && (img.descripcion ?? '') === descripcion.trim()) return;
    await this.ejecutar(async () => {
      await this.api.actualizarTextoImagen(img.id, titulo, descripcion);
      await this.recargar();
    }, 'Texto de la foto guardado.');
  }

    verComoCliente(id: number) {
    window.open(`/producto/${id}`, '_blank', 'noopener');
  }

  // ---------- Datos del negocio ----------
    async guardarNegocio() {
    const v = this.formNegocio.getRawValue();
    const whatsapp = v.whatsapp.replace(/\D/g, '');
    const faltan: string[] = [];
    if (!v.nombre.trim()) faltan.push('El nombre del negocio');
    if (whatsapp.length < 8) faltan.push('El WhatsApp (solo números y con código de país, ej. 593991234567)');
    if (v.anuncio_activo && !v.anuncio_texto.trim()) faltan.push('El texto del anuncio (o desactívalo)');
    if (faltan.length) {
      await this.dialogos.avisar('Revisa los datos', 'No se puede guardar todavía:', faltan);
      return;
    }
    const frases = this.frasesLista().map((f) => f.trim()).filter(Boolean).join('\n');
    await this.ejecutar(async () => {
      await this.negocio.guardar({
        ...v,
        frases,
        nombre: v.nombre.trim(),
        whatsapp,
        anuncio_texto: v.anuncio_texto.trim(),
        anuncio_mensaje: v.anuncio_mensaje.trim(),
      });
    }, 'Datos del negocio guardados correctamente.');
    if (!this.error()) this.formNegocio.markAsPristine();
    this.irArriba();
  }

  async salir() {
    await this.auth.salir();
    this.router.navigate(['/login']);
  }
}