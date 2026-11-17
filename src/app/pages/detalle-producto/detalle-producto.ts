import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Productos } from '../../services/productos';
import { Producto } from '../../models/producto';
import { Negocio } from '../../services/negocio';
import { Favoritos } from '../../services/favoritos';
import { Resenas, Resena } from '../../services/resenas';
import { Auth } from '../../services/auth';
import { Dialogos } from '../../services/dialogos';
// Con este stock o menos se avisa "quedan pocas unidades"
const STOCK_POCO = 3;

@Component({
  selector: 'app-detalle-producto',
  imports: [RouterLink],
  templateUrl: './detalle-producto.html',
  styleUrl: './detalle-producto.css',
})
export class DetalleProducto {
  private ruta = inject(ActivatedRoute);
  private servicio = inject(Productos);
  private negocio = inject(Negocio);
  favs = inject(Favoritos);
    private resSrv = inject(Resenas);
  auth = inject(Auth);
  private id = Number(this.ruta.snapshot.paramMap.get('id'));

    private dlg = inject(Dialogos);

  resenas = signal<Resena[]>([]);
  orden = signal<'recientes' | 'mejores' | 'peores'>('recientes');
  estrellasForm = signal(0);
  comentarioForm = signal('');
  enviando = signal(false);
  errorResena = signal('');
  menuId = signal<number | null>(null);
  editandoId = signal<number | null>(null);
  editEstrellas = signal(0);
  editComentario = signal('');

  promedio = computed(() => {
    const l = this.resenas();
    return l.length ? l.reduce((s, r) => s + r.estrellas, 0) / l.length : 0;
  });
  miResena = computed(() => this.resenas().find((r) => r.userId === this.auth.perfil()?.id));

    distribucion = computed(() => {
    const l = this.resenas();
    return [5, 4, 3, 2, 1].map((n) => {
      const c = l.filter((r) => r.estrellas === n).length;
      return { n, c, pct: l.length ? (c * 100) / l.length : 0 };
      
    });
  });
  
  // Tu reseña primero; el resto según el orden elegido
  lista = computed(() => {
    const mi = this.auth.perfil()?.id;
    const o = this.orden();
    return [...this.resenas()].sort((a, b) => {
      if (a.userId === mi) return -1;
      if (b.userId === mi) return 1;
      if (o === 'mejores') return b.estrellas - a.estrellas || b.creada.localeCompare(a.creada);
      if (o === 'peores') return a.estrellas - b.estrellas || b.creada.localeCompare(a.creada);
      return b.creada.localeCompare(a.creada);
    });
  });

  @HostListener('document:click')
  cerrarMenu() {
    this.menuId.set(null);
  }

  estrellasTexto(n: number): string {
    const r = Math.round(n);
    return '★'.repeat(r) + '☆'.repeat(5 - r);
  }

  tiempo(f: string): string {
    const s = (Date.now() - new Date(f).getTime()) / 1000;
    if (s < 60) return 'justo ahora';
    const m = s / 60;
    if (m < 60) return `hace ${Math.floor(m)} min`;
    const h = m / 60;
    if (h < 24) return `hace ${Math.floor(h)} h`;
    const d = h / 24;
    if (d < 30) return `hace ${Math.floor(d)} ${Math.floor(d) === 1 ? 'día' : 'días'}`;
    const mo = d / 30;
    if (mo < 12) return `hace ${Math.floor(mo)} ${Math.floor(mo) === 1 ? 'mes' : 'meses'}`;
    const a = Math.floor(d / 365);
    return `hace ${a} ${a === 1 ? 'año' : 'años'}`;
  }

  async cargarResenas() {
    this.resenas.set(await this.resSrv.deProducto(this.id));
    this.resSrv.cargarResumenes()
  }
    private validarComentario(texto: string): string | null {
    const c = texto.trim();
    if (!c) return null; // vacío está permitido
    if (c.length < 10) return 'Escribe al menos 10 caracteres, o deja el comentario vacío.';
    if (new Set(c.toLowerCase().replace(/\s/g, '')).size < 4) return 'Escribe un comentario real, por favor.';
    return null;
  }

  async enviarResena() {
    if (this.estrellasForm() < 1) {
          const e = this.validarComentario(this.comentarioForm());
    if (e) {
      this.errorResena.set(e);
      return;
    }
      this.errorResena.set('Elige de 1 a 5 estrellas.');
      return;
    }
    this.enviando.set(true);
    this.errorResena.set('');
    const err = await this.resSrv.guardar(this.id, this.estrellasForm(), this.comentarioForm());
    this.enviando.set(false);
    if (err) {
      this.errorResena.set('No se pudo guardar tu reseña. Intenta de nuevo.');
      return;
    }
    this.estrellasForm.set(0);
    this.comentarioForm.set('');
    await this.cargarResenas();
  }

  empezarEditar(r: Resena) {
    this.menuId.set(null);
    this.errorResena.set('');
    this.editandoId.set(r.id);
    this.editEstrellas.set(r.estrellas);
    this.editComentario.set(r.comentario);
  }

  async guardarEdicion(r: Resena) {
    if (this.editEstrellas() < 1) return;
        const e = this.validarComentario(this.editComentario());
    if (e) {
      this.errorResena.set(e);
      return;
    }
    const err = await this.resSrv.editar(r.id, this.editEstrellas(), this.editComentario());
    if (err) {
      this.errorResena.set('No se pudo guardar el cambio.');
      return;
    }
    this.editandoId.set(null);
    await this.cargarResenas();
  }

  async borrar(r: Resena) {
    this.menuId.set(null);
    const ok = await this.dlg.preguntar({
      titulo: 'Eliminar reseña',
      mensaje: '¿Seguro que quieres eliminar tu reseña? No se puede deshacer.',
      confirmar: 'Eliminar',
      cancelar: 'Cancelar',
    });
    if (!ok) return;
    await this.resSrv.borrar(r.id);
    await this.cargarResenas();
  }

  async alternarUtil(r: Resena) {
    const yo = this.auth.perfil()?.id;
    if (!yo) {
      this.auth.entrarConGoogle();
      return;
    }
    const ya = r.utiles.includes(yo);
    this.resenas.update((l) =>
      l.map((x) => (x.id === r.id ? { ...x, utiles: ya ? x.utiles.filter((u) => u !== yo) : [...x.utiles, yo] } : x)),
    );
    await this.resSrv.alternarUtil(r.id, ya);
  }

  producto = signal<Producto | undefined>(undefined);
  cargando = signal(true);
  tallaElegida = signal<string | null>(null);
  colorElegido = signal<string | null>(null);
  fotoActiva = signal(0);

  private mapaColores: Record<string, string> = {
    negro: '#111111', blanco: '#ffffff', gris: '#9ca3af', rojo: '#dc2626', azul: '#2563eb',
    verde: '#16a34a', amarillo: '#facc15', naranja: '#f97316', rosado: '#f472b6', rosa: '#f472b6',
    morado: '#7c3aed', beige: '#d6c3a5', café: '#7b4a2b', cafe: '#7b4a2b', celeste: '#7dd3fc',
    vino: '#7f1d1d', crema: '#f5ecd7',
  };

  fotos = computed(() => {
    const p = this.producto();
    if (!p) return [];
    return p.imagenes.length ? p.imagenes : p.imagen ? [p.imagen] : [];
  });
  fotoPrincipal = computed(() => this.fotos()[this.fotoActiva()] ?? '');

    // Galería deslizable (celular): marca qué foto está a la vista
  alDeslizar(e: Event) {
    const el = e.target as HTMLElement;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== this.fotoActiva()) this.fotoActiva.set(i);
  }

  tallas = computed(() => [...new Set((this.producto()?.variantes ?? []).map((v) => v.talla))]);
  colores = computed(() => [...new Set((this.producto()?.variantes ?? []).map((v) => v.color))]);

  mensajeStock = computed(() => {
    const t = this.tallaElegida();
    const c = this.colorElegido();
    if (!this.producto()?.variantes.length) {
      return { texto: 'Consulta la disponibilidad por WhatsApp.', tono: '' };
    }
    if (t === null || c === null) {
      return { texto: 'Elige talla y color para ver la disponibilidad.', tono: '' };
    }
    const n = this.stockDe(t, c);
    if (n === 0) return { texto: 'Sin stock en esta combinación.', tono: 'cero' };
    if (n <= STOCK_POCO) return { texto: `¡Quedan solo ${n}!`, tono: 'poco' };
    return { texto: 'Disponible.', tono: 'ok' };
  });

    constructor() {
    this.servicio.obtenerPorId(this.id).then((p) => {
      this.producto.set(p);
      this.cargando.set(false);
      this.cargarResenas();
    });
  }

  // Stock de las variantes que coinciden (null = cualquiera)
  stockDe(talla: string | null, color: string | null): number {
    return (this.producto()?.variantes ?? [])
      .filter((v) => (talla === null || v.talla === talla) && (color === null || v.color === color))
      .reduce((suma, v) => suma + v.stock, 0);
  }
  tallaAgotada(t: string): boolean {
    return this.stockDe(t, this.colorElegido()) === 0;
  }
  colorAgotado(c: string): boolean {
    return this.stockDe(this.tallaElegida(), c) === 0;
  }
  elegirTalla(t: string) {
    this.tallaElegida.update((actual) => (actual === t ? null : t));
  }
  elegirColor(c: string) {
    this.colorElegido.update((actual) => (actual === c ? null : c));
  }

  colorCss(nombre: string): string {
    return this.mapaColores[nombre.trim().toLowerCase()] ?? '';
  }

  precioFinal(p: Producto): number {
    return p.precioOferta ?? p.precio;
  }
  ahorro(p: Producto): number {
    return p.precioOferta === null ? 0 : p.precio - p.precioOferta;
  }
  dinero(n: number): string {
    return Number.isInteger(n) ? String(n) : n.toFixed(2);
  }

  // El mensaje de WhatsApp incluye la talla y el color elegidos
  enlaceWhatsapp(p: Producto): string {
    const partes = [`Hola, me interesa: ${p.nombre}`];
    if (this.tallaElegida()) partes.push(`talla ${this.tallaElegida()}`);
    if (this.colorElegido()) partes.push(`color ${this.colorElegido()}`);
    const mensaje = `${partes.join(', ')} ($${this.precioFinal(p)})`;
    return `https://wa.me/${this.negocio.datos().whatsapp}?text=${encodeURIComponent(mensaje)}`;
  }

  enlaceCompartir(p: Producto): string {
    const url = `${location.origin}/producto/${p.id}`;
    const texto = `Mira esto en ${this.negocio.datos().nombre}: ${p.nombre} - $${this.precioFinal(p)}\n${url}`;
    return `https://wa.me/?text=${encodeURIComponent(texto)}`;
  }
}