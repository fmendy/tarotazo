# Plan de proyecto — «Tarotazo» (arcana)

Jefe de proyecto: coordinación, contratos (`docs/CONTRACTS.md`), integración y puertas.

## Equipo (agentes)
| Rol | Responsabilidad | Directorios |
|---|---|---|
| Diseñador de datos | Esquemas JSON, barajas, tiradas, provincias, validador | `content/schemas`, `content/decks`, `content/tools` |
| Guionista | Significados de 78 + 48 cartas, fichas de 52 provincias, diplomas, preguntas Sí/No | `content/es/meanings`, `provinces`, `titles`, `interactions` |
| Escritor (diálogos) | Voz de Madame Remedios: fragmentos de los 6 tonos, onboarding, péndulo | `content/es/fragments`, `onboarding`, `pendulum` |
| Backend | API Spring Boot sin estado, motor narrativo, péndulo, rate‑limit | `api/` |
| Frontend | SPA de 10 pantallas, estado efímero, i18n, péndulo, titulaciones | `web/` |
| Animación | Barajado, corte, abanico, giro 3D, ambiente, física del péndulo, sonido | `web/src/fx`, `web/src/pendulum` |
| Diseño gráfico | Guía de estilo, cartas SVG, mapa, vidente, péndulos, marcos | `art/`, `web/public/art` |
| DevOps (contratado) | Docker, Caddy, Nginx, CI/CD, seguridad de cabeceras | `deploy/`, Dockerfiles, `.github/` |
| QA (a contratar, fase 5) | E2E Playwright, carga, auditoría de privacidad, OWASP ZAP | `web/e2e`, `qa/` |

## Fases y puertas
| Fase | Contenido | Estado |
|---|---|---|
| 0 · Descubrimiento | Personaje, tono, contratos, guía de estilo | Contratos hechos; guía de estilo en curso |
| 1 · Cimientos | Monorepo, CI/CD, compose, esqueleto API, esquemas, motor v0, animación base | En curso (oleada 1) |
| 2 · MVP tarot | Onboarding, RWS + castellana, tiradas 1/3/5, lectura completa | En curso (oleada 1) |
| 3 · Péndulo | Física, control, 3 modelos, modos Sí/No, tablero, mapa | En curso (oleada 1) |
| 4 · Contenido y pulido | Resto de barajas/tiradas/tonos, 1.500 fragmentos, diploma, sonido, rendimiento | Parcial en oleada 1; oleada 2 |
| 5 · Calidad y lanzamiento | E2E, privacidad, seguridad, textos legales, beta | Oleada 3 |

Puertas: **diseño aprobado** (fin fase 0) · **demo MVP** (fin fase 2) · **lanzamiento** (fin fase 5).

## Decisiones tomadas
- 2026-11-20 · Verificación de edad: **autodeclaración** (casilla o fecha de nacimiento) basta por ahora. La verificación fuerte queda fuera de alcance; se puede revisar más adelante.

## Decisiones abiertas (requieren al titular)
1. Textos legales (aviso legal LSSI, privacidad RGPD/LOPDGDD): borradores marcados «pendiente de revisión legal»; faltan los datos del titular.
2. Dominio y VPS de despliegue.
