# Documento de requisitos: Catálogo web para tienda de ropa

**Versión:** 0.1 · **Fecha:** 6 de octubre de 2026 · **Autor:** Keenen Almache

## 1. Introducción

**Propósito.** Este documento define qué debe hacer el sistema y con qué calidad. Sirve como acuerdo entre el desarrollador y el cliente.

**Alcance.** Sitio web donde los clientes de un negocio de ropa consultan el catálogo y preguntan por un producto por WhatsApp, más un panel donde el dueño administra el catálogo sin tocar código.

- **Dentro del alcance:** catálogo, filtros, detalle de producto, contacto, panel de administración, fotos y control de stock.
- **Fuera del alcance de esta versión:** carrito, pagos en línea, envíos y cuentas de clientes.

**Definiciones.** *RLS*: seguridad a nivel de fila en la base de datos. *Variante*: combinación de talla y color de un producto, con su stock. *Activo*: producto visible en el catálogo público.

## 2. Interesados

| Interesado | Interés |
|---|---|
| Dueño del negocio | Administrar productos, fotos y stock |
| Clientes finales | Consultar productos y contactar al negocio |
| Desarrollador | Construir y mantener el sistema |

## 3. Metodología

Desarrollo iterativo e incremental, con entregas pequeñas que el cliente revisa (referencia: ISO/IEC/IEEE 12207). Se eligió así porque el cliente aún no tiene definidos todos sus requisitos.

| Iteración | Entrega | Estado |
|---|---|---|
| 0.1 | Prototipo navegable con datos de ejemplo | Hecha |
| 0.2 | Base de datos conectada | Hecha |
| 0.3 | Login y panel de administración | Hecha |
| 0.4 | Subida de fotos | Hecha |
| 0.5 | Publicación en línea | Hecha |
| 0.6 | Datos reales y diseño visual | Pendiente del cliente |

## 4. Requisitos funcionales

| ID | Requisito | Prioridad | Criterio de aceptación | Estado |
|---|---|---|---|---|
| RF-01 | El sistema muestra un catálogo con foto, nombre y precio. | Alta | Solo aparecen los productos activos. | Implementado |
| RF-02 | El usuario filtra por categoría y busca por nombre. | Alta | Ambos filtros funcionan a la vez. | Implementado |
| RF-03 | El usuario ve el detalle: descripción, tallas, colores y fotos. | Alta | Un producto inexistente muestra un aviso, no un error. | Implementado |
| RF-04 | Cada producto tiene un botón que abre WhatsApp con el mensaje escrito. | Alta | El mensaje incluye el nombre del producto. | Implementado |
| RF-05 | Hay páginas de inicio y contacto con ubicación y horario. | Media | Los datos salen de un único archivo de configuración. | Implementado con datos de ejemplo |
| RF-06 | El administrador inicia y cierra sesión. | Alta | Sin sesión, `/admin` redirige a `/login`. | Implementado |
| RF-07 | El administrador crea y edita productos. | Alta | Los cambios se ven en el catálogo al instante. | Implementado |
| RF-08 | El administrador gestiona tallas, colores y stock por variante. | Media | No admite stock negativo ni variantes duplicadas. | Implementado |
| RF-09 | El administrador sube y elimina fotos. | Media | El panel rechaza imágenes de más de 2 MB. | Implementado |
| RF-10 | El administrador oculta un producto sin borrarlo. | Media | Desaparece del catálogo público y se conserva en el panel. | Implementado |

## 5. Requisitos no funcionales (ISO/IEC 25010)

| Característica | Requisito | Cómo se verifica |
|---|---|---|
| Usabilidad | El sitio se ve y funciona bien en celular. | Prueba en un teléfono real y en el modo móvil de Chrome. |
| Rendimiento | El catálogo carga en menos de 3 segundos con conexión normal. | Informe Lighthouse de Chrome. |
| Seguridad | Registro de usuarios cerrado. Lectura pública y escritura solo con sesión (RLS). Claves privadas fuera del código. Sitio con HTTPS. | Intentar escribir sin sesión y comprobar que se rechaza. |
| Mantenibilidad | Código versionado en Git con commits descriptivos. Datos del negocio centralizados. | Revisión del historial y del archivo `negocio.config.ts`. |
| Compatibilidad | Funciona en versiones recientes de Chrome, Edge, Firefox y Safari. | Prueba manual en cada navegador. |
| Portabilidad | Las tablas usan PostgreSQL estándar. Las políticas de seguridad y el almacenamiento de fotos son específicos de Supabase. | La Parte 1 de `database/esquema.sql` se ejecuta también en pgAdmin. |
| Fiabilidad | Despliegue automático desde Git y esquema SQL guardado en el repositorio. | Revisión de la configuración de Netlify y de la carpeta `database/`. |

## 6. Restricciones y supuestos

- Presupuesto cero: se usan los planes gratuitos de Supabase, Netlify y GitHub.
- Los proyectos gratuitos de Supabase pueden pausarse tras un periodo de inactividad. Confirmar las condiciones vigentes antes de la entrega.
- El dominio propio (`.com`) se compra cuando el cliente apruebe el proyecto.

## 7. Control de cambios

| Fecha | Cambio solicitado | Quién | Requisito afectado | Decisión |
|---|---|---|---|---|
| Ejemplo | Mostrar "consultar" en lugar del precio | Cliente | RF-01 | Pendiente |

## 8. Pendientes del cliente

| Pendiente | Estado | Impacto |
|---|---|---|
| Nombre y logo del negocio | Sin confirmar | Portada, menú |
| Número de WhatsApp | Sin confirmar | RF-04, RF-05 |
| Dirección, horario e Instagram | Sin confirmar | RF-05 |
| ¿Mostrar precios o "consultar"? | Sin confirmar | RF-01, RF-03 |
| ¿Quién actualiza el catálogo y con qué frecuencia? | Sin confirmar | RF-07 a RF-10 |