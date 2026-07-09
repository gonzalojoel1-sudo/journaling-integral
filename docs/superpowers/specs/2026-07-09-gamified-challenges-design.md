# Sistema de Desafios Gamificados — Design Spec

**Date**: 2026-07-09
**Status**: Approved
**Goal**: Transformar la app en una maquina de creacion de habitos con desafios gamificados, insignias por minerales, y progresion de niveles expandida.

## Decisiones

| Decision | Choice |
|---|---|
| Tipo de mejora | Desafios gamificados con templates predefinidos |
| Alcance | Integral (todas las areas: disciplina, fe, cuerpo, negocio, mente, relaciones, legado, identidad) |
| Mecanica de juego | Niveles, insignias y desbloqueos |
| Visualizacion badges | Grid estilo consola (Xbox/PlayStation achievements) |
| Niveles | Expandir a Lvl 4 (Maestro) y Lvl 5 (Legado) |
| Cantidad de desafios | 40 base (8 areas x 5 minerales) + 10 ocultos = 50 totales |

## Sistema de Minerales

5 niveles progresivos por area:

| Mineral | Dias | Dificultad | Color Badge |
|---|---|---|---|
| Bronce | 7 dias | Facil | Marron/ambar |
| Plata | 14 dias | Medio | Gris/plateado |
| Oro | 30 dias | Dificil | Dorado |
| Diamante | 60 dias | Experto | Azul/cyan |
| Legendario | 90 dias | Maestro | Purpura |

## Areas y Desafios (40 base)

### Disciplina
- **Bronce (7d)**: Racha de Fuego — 7 dias de journaling sin falta
- **Plata (14d)**: Guardian de la Constancia — 14 dias + revision semanal completada
- **Oro (30d)**: Maestro de la Disciplina — 30 dias perfectos sin fallar un solo dia
- **Diamante (60d)**: Inquebrantable — 60 dias sin romper la racha
- **Legendario (90d)**: Legado de Hierro — 90 dias + mentorear a alguien en journaling

### Identidad
- **Bronce (7d)**: Espejo del Alma — Elegir y registrar tu SER 7 dias
- **Plata (14d)**: Arquitecto de Caracter — 14 dias con SER + accion diaria
- **Oro (30d)**: Forjador de Identidad — 30 dias + impactar positivamente a otra persona cada dia
- **Diamante (60d)**: Identidad Inquebrantable — 60 dias + escribir carta de identidad
- **Legendario (90d)**: Transformador — 90 dias + facilitar taller grupal de identidad

### Fe
- **Bronce (7d)**: Devoto — 7 dias de devocional completado
- **Plata (14d)**: Discipulo — 14 dias + aplicar el versiculo diario en una accion concreta
- **Oro (30d)**: Maestro de la Palabra — 30 dias + ensenar un versiculo a otra persona
- **Diamante (60d)**: Teologo Practico — 60 dias + memorizar 10 versiculos clave
- **Legendario (90d)**: Guia Espiritual — 90 dias + liderar un devocional grupal

### Cuerpo
- **Bronce (7d)**: Descanso Sagrado — 7 dias con sueño >= 7 horas
- **Plata (14d)**: Energia Divina — 14 dias con energia >= 7 y sueño >= 7
- **Oro (30d)**: Templo de Acero — 30 dias con ejercicio diario + sueño + energia
- **Diamante (60d)**: Guerrero del Cuerpo — 60 dias sin azucar procesada + ejercicio diario
- **Legendario (90d)**: Transformacion Fisica — 90 dias con meta fisica medible cumplida

### Negocio
- **Bronce (7d)**: Prospectador — 7 dias contactando 1 prospecto nuevo diario
- **Plata (14d)**: Constructor — 14 dias con prospecto + seguimiento
- **Oro (30d)**: Cerrador — 30 dias con ventas cerradas documentadas
- **Diamante (60d)**: Sistema de Negocio — 60 dias con sistema automatizado funcionando
- **Legendario (90d)**: Imperio — 90 dias + generar empleo para al menos 1 persona

### Mente
- **Bronce (7d)**: Aprendiz — 7 dias de autoeducacion diaria
- **Plata (14d)**: Pensador — 14 dias extrayendo ideas clave de lo aprendido
- **Oro (30d)**: Maestro — 30 dias + ensenar a alguien lo aprendido
- **Diamante (60d)**: Certificado — 60 dias + completar una certificacion formal
- **Legendario (90d)**: Autor — 90 dias + publicar libro, curso o contenido educativo

### Relaciones
- **Bronce (7d)**: Presente — 7 dias de cena sin pantallas
- **Plata (14d)**: Agradecido — 14 dias expresando gratitud diaria a alguien
- **Oro (30d)**: Mentor — 30 dias mentorando activamente a una persona
- **Diamante (60d)**: Pacificador — 60 dias + reconciliacion de una relacion rota
- **Legendario (90d)**: Fundador — 90 dias + fundar una comunidad o grupo

### Legado
- **Bronce (7d)**: Escriba — 7 dias de reflexion de legado escrita
- **Plata (14d)**: Visionario — 14 dias + esbozo de plan de legado
- **Oro (30d)**: Constructor de Legado — 30 dias con accion concreta hacia el legado
- **Diamante (60d)**: Testamento — 60 dias + documento formal de legado completado
- **Legendario (90d)**: Impacto Generacional — 90 dias con evidencia de impacto medible

## Desafios Ocultos (10)

Se desbloquean automaticamente al cumplir combinaciones:

| Desafio | Requisito |
|---|---|
| Trinidad | Oro en Fe + Identidad + Disciplina |
| Imperio Integral | Oro en Negocio + Mente + Relaciones |
| Equilibrio Supremo | Oro en Cuerpo + Mente + Fe |
| Maestro del Tiempo | 365 dias de journaling total |
| Milagro Financiero | Diamante en Negocio |
| Guerrero Completo | Diamante en 3 areas distintas |
| Sabio | 100 versiculos aplicados documentados |
| Titan | Legendario en cualquier area |
| Arquitecto de Almas | 10 personas mentoreadas |
| El Elegido | Completar los 40 desafios base |

## Sistema de Niveles Expandido

| Nivel | Nombre | Requisito |
|---|---|---|
| 1 | Fundamentos | Default |
| 2 | Direccion | 18 dias registrados en 30 dias |
| 3 | Legado | 25 dias registrados en 30 dias |
| 4 | Maestro | 3 insignias Diamante + todas las areas en Oro |
| 5 | Leyenda | 1 insignia Legendaria |

## Tablas Nuevas

### challenges
```sql
CREATE TABLE challenges (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  template_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',  -- active, completed, abandoned
  current_day INTEGER NOT NULL DEFAULT 1,
  progress_json TEXT,                     -- { "1": true, "7": true, ... }
  started_at TEXT NOT NULL,
  completed_at TEXT
);
```

### badges
```sql
CREATE TABLE badges (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  badge_id TEXT NOT NULL,
  area TEXT NOT NULL,
  mineral TEXT NOT NULL,
  unlocked_at TEXT NOT NULL,
  UNIQUE(user_id, badge_id)
);
```

## Archivos Nuevos

```
src/
├── app/
│   ├── challenges/
│   │   ├── page.tsx              ← pagina principal de desafios
│   │   └── ChallengesClient.tsx  ← grid de desafios + filtros
│   └── actions/
│       └── challenges.ts         ← logica CRUD + validacion
├── lib/
│   └── challenge-templates.ts    ← 50 templates con validators
└── db/
    └── schema.ts                 ← [MOD] agregar tablas challenges + badges
```

## Archivos Modificados

- `src/db/schema.ts` — nuevas tablas
- `src/app/actions/daily-journal.ts` — hook `validateActiveChallenges()` al guardar
- `src/app/actions/auth.ts` — `checkLevelProgression` expandido a 5 niveles
- `src/app/page.tsx` — widget de desafio activo
- `src/app/progress/page.tsx` — seccion de insignias
- `src/components/Navigation/*` — nuevo item "Desafios"

## Flujo del Usuario

1. Usuario entra a `/challenges` → ve grid de 50 desafios organizados por area y mineral
2. Desafios bloqueados muestran requisito (ej: "Completa Bronce primero")
3. Activa "Disciplina Bronce" → se crea registro en `challenges`
4. Cada dia completa su journal normalmente
5. Al guardar, `validateActiveChallenges()` revisa todos los desafios activos
6. Si cumple la mision del dia → `currentDay++`, progreso se actualiza
7. Si NO cumple la mision del dia → el `currentDay` NO retrocede, pero se registra el fallo en `progressJson`. 3 fallos en cualquier momento = desafio marcado `abandoned` (puede reactivarse)
8. Al llegar al ultimo dia → desafio marcado `completed`, badge desbloqueado
9. Badge aparece como toast de notificacion (3s, esquina inferior derecha) + se desbloquea en la grid
10. Se desbloquea el siguiente mineral de esa area
11. Al acumular badges, puede subir de nivel (Lvl 1→5)
