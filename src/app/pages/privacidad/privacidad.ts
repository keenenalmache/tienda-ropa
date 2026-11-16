import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Negocio } from '../../services/negocio';

@Component({
  selector: 'app-privacidad',
  imports: [RouterLink],
  template: `
    <h1>Política de privacidad</h1>
    <p class="fecha">Última actualización: 15 de noviembre de 2026</p>

    <h2>Quiénes somos</h2>
    <p>
      {{ datos().nombre }} es una tienda de ropa. Este sitio muestra nuestro catálogo y permite a las personas
      iniciar sesión para guardar favoritos y dejar calificaciones y comentarios sobre los productos.
    </p>

    <h2>Qué datos recogemos</h2>
    <ul>
      <li>
        <strong>Si inicias sesión con Google:</strong> tu nombre, tu correo electrónico y tu foto de perfil de
        Google. Nunca recibimos tu contraseña de Google.
      </li>
      <li><strong>Lo que publicas:</strong> tus calificaciones y comentarios sobre los productos.</li>
      <li><strong>Tus favoritos:</strong> la lista de productos que marcas con el corazón.</li>
      <li>
        <strong>En tu navegador:</strong> guardamos preferencias como el modo claro u oscuro. No usamos cookies
        de publicidad.
      </li>
    </ul>

    <h2>Para qué los usamos</h2>
    <ul>
      <li>Identificarte para que puedas calificar, comentar y guardar favoritos.</li>
      <li>Mostrar públicamente tu nombre y tu calificación junto a tus comentarios.</li>
      <li>Mantener el orden y prevenir abusos (por ejemplo, ocultar comentarios ofensivos).</li>
    </ul>
    <p>No vendemos ni compartimos tus datos con terceros para publicidad. En este sitio no se hacen pagos.</p>

    <h2>Dónde se guardan</h2>
    <p>
      Los datos se almacenan en Supabase (base de datos y autenticación) y el sitio se publica con Cloudflare.
      Ambos aplican medidas de seguridad estándar de la industria.
    </p>

    <h2>Tus derechos</h2>
    <p>
      Puedes pedir en cualquier momento ver, corregir o eliminar tus datos, incluyendo tu cuenta y tus
      comentarios, conforme a la Ley Orgánica de Protección de Datos Personales de Ecuador. Escríbenos por
      <a [href]="enlaceWhatsapp()" target="_blank" rel="noopener">WhatsApp</a> y lo atenderemos.
    </p>

    <h2>Cambios en esta política</h2>
    <p>Si la actualizamos, publicaremos la nueva versión en esta misma página con su fecha.</p>

    <p class="volver"><a routerLink="/">← Volver a la tienda</a></p>
  `,
  styles: [
    `
      :host {
        line-height: 1.6;
      }
      h1 {
        font-size: clamp(2rem, 6vw, 3.4rem);
      }
      h2 {
        margin-top: 2rem;
        font-size: 1.5rem;
      }
      .fecha {
        color: var(--suave);
      }
      ul {
        padding-left: 1.2rem;
      }
      li {
        margin-bottom: 0.4rem;
      }
      .volver {
        margin-top: 2rem;
      }
    `,
  ],
})
export class Privacidad {
  datos = inject(Negocio).datos;
  enlaceWhatsapp = computed(() => `https://wa.me/${this.datos().whatsapp}`);
}