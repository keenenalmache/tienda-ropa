import { Component, computed, inject, signal } from '@angular/core';
import { AdminResenas, ResenaAdmin } from '../../../services/admin-resenas';
import { Dialogos } from '../../../services/dialogos';
import { supabase } from '../../../supabase.client';

type Filtro = 'todas' | 'visibles' | 'ocultas' | 'bajas' | 'sin-responder';

@Component({
  selector: 'app-admin-resenas',
  templateUrl: './resenas-admin.html',
  styleUrl: './resenas-admin.css',
})
export class ResenasAdmin {
  private api = inject(AdminResenas);
  private dialogos = inject(Dialogos);

  todas = signal<ResenaAdmin[]>([]);
  cargando = signal(true);
  error = signal('');
  filtro = signal<Filtro>('todas');
  busqueda = signal('');
  respondiendoId = signal<number | null>(null);
  textoRespuesta = signal('');

  filtros: { valor: Filtro; etiqueta: string }[] = [
    { valor: 'todas', etiqueta: 'Todas' },
    { valor: 'visibles', etiqueta: 'Visibles' },
    { valor: 'ocultas', etiqueta: 'Ocultas' },
    { valor: 'bajas', etiqueta: '1–2 estrellas' },
    { valor: 'sin-responder', etiqueta: 'Sin responder' },
  ];

  resumen = computed(() => {
    const l = this.todas();
    const vis = l.filter((r) => !r.oculta);
    return {
      total: l.length,
      promedio: vis.length ? vis.reduce((s, r) => s + r.estrellas, 0) / vis.length : 0,
      ocultas: l.filter((r) => r.oculta).length,
      bajas: vis.filter((r) => r.estrellas <= 2).length,
      sinResponder: vis.filter((r) => !r.respuesta).length,
    };
  });

    extremos = computed(() => {
    const m = new Map<number, { nombre: string; suma: number; n: number }>();
    for (const r of this.todas().filter((x) => !x.oculta)) {
      const a = m.get(r.productoId) ?? { nombre: r.producto, suma: 0, n: 0 };
      a.suma += r.estrellas;
      a.n++;
      m.set(r.productoId, a);
    }
    const l = [...m.values()]
      .map((x) => ({ nombre: x.nombre, prom: x.suma / x.n, n: x.n }))
      .sort((a, b) => b.prom - a.prom || b.n - a.n);
    return l.length > 1 ? { mejor: l[0], peor: l[l.length - 1] } : null;
  });

  vistas = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    return this.todas().filter((r) => {
      switch (this.filtro()) {
        case 'visibles': if (r.oculta) return false; break;
        case 'ocultas': if (!r.oculta) return false; break;
        case 'bajas': if (r.oculta || r.estrellas > 2) return false; break;
        case 'sin-responder': if (r.oculta || r.respuesta) return false; break;
      }
      return !q || `${r.autor} ${r.comentario} ${r.producto}`.toLowerCase().includes(q);
    });
  });

  constructor() {
    this.cargar();
  }

  async cargar() {
    try {
      this.todas.set(await this.api.listar());
    } catch {
      this.error.set('No se pudieron cargar las reseñas.');
    }
    this.cargando.set(false);
  }

  private async ejecutar(accion: () => Promise<void>) {
    this.error.set('');
    try {
      await accion();
      await this.cargar();
    } catch {
      this.error.set('No se pudo completar la acción.');
    }
  }

  alternarOculta(r: ResenaAdmin) {
    return this.ejecutar(() => this.api.ocultar(r.id, !r.oculta));
  }

  async eliminar(r: ResenaAdmin) {
    const ok = await this.dialogos.preguntar({
      titulo: 'Eliminar reseña',
      mensaje: `¿Eliminar la reseña de ${r.autor}? No se puede deshacer. Si solo quieres que no se vea, usa "Ocultar".`,
      confirmar: 'Eliminar',
      cancelar: 'Cancelar',
    });
    if (ok) await this.ejecutar(() => this.api.eliminar(r.id));
  }

  empezarRespuesta(r: ResenaAdmin) {
    this.respondiendoId.set(r.id);
    this.textoRespuesta.set(r.respuesta ?? '');
  }

  async guardarRespuesta(r: ResenaAdmin) {
    const t = this.textoRespuesta().trim();
    await this.ejecutar(() => this.api.responder(r.id, t || null));
    this.respondiendoId.set(null);
  }

  quitarRespuesta(r: ResenaAdmin) {
    return this.ejecutar(() => this.api.responder(r.id, null));
  }

  estrellasTexto(n: number): string {
    return '★'.repeat(n) + '☆'.repeat(5 - n);
  }

  fecha(f: string): string {
    return new Date(f).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  
    async contarDesde(iso: string): Promise<number> {
    const { count } = await supabase
      .from('resenas')
      .select('id', { count: 'exact', head: true })
      .gt('creada', iso);
    return count ?? 0;
  }
}