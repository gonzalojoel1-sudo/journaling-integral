### Task 7: AI Chat Tool Update

**Files:**
- Modify: `src/app/api/chat/route.ts` (update `crearNuevoHabito` tool)

**Interfaces:**
- Consumes: new `habitType` + `domain` enums
- Produces: tool creates habits with new schema

- [ ] **Step 1: Update the tool**

In `src/app/api/chat/route.ts`, lines 207-238, replace the tool:

```typescript
crearNuevoHabito: tool({
  description: 'Crea un nuevo hábito o disciplina diaria en el sistema del usuario.',
  inputSchema: z.object({
    name: z.string().describe('Nombre del hábito, ej: Devocional Matutino'),
    habitType: z.enum(['crecer', 'sembrar', 'cambiar', 'preciso', 'pilar']).default('crecer').describe('Tipo de hábito: crecer (nuevo), sembrar (mini), cambiar (reemplazo), preciso (if-then), pilar (keystone)'),
    domain: z.enum(['cuerpo', 'mente', 'trabajo', 'relaciones', 'hogar', 'espiritual', 'finanzas']).optional().describe('Área de vida del hábito'),
    rescueAction: z.string().describe('Versión mínima del hábito para días difíciles (menos de 2 minutos)'),
    anchor: z.string().optional().describe('Rutina existente después de la cual se hará el hábito'),
    celebration: z.string().optional().describe('Celebración al completar el hábito'),
  }),
  execute: async ({ name, habitType, domain, rescueAction, anchor, celebration }) => {
    console.log('⚡ [TOOL EXECUTING] Crear hábito:', { name, habitType, domain, rescueAction, anchor });
    if (!userId) {
      return 'SISTEMA: Error - Usuario no autenticado.';
    }
    try {
      const celebrationMap: Record<string, string> = {
        crecer: '✅ Hecho',
        sembrar: '🎉',
        cambiar: '🔄 Avance',
        preciso: '🎯 Ejecutado',
        pilar: '🏛️ Un paso más',
      };

      await db.insert(habits).values({
        id: randomUUID(),
        userId,
        name,
        habitType: habitType || 'crecer',
        domain: domain || null,
        rescueAction: rescueAction,
        activeAction: rescueAction,
        celebration: celebration || celebrationMap[habitType || 'crecer'],
        anchor: anchor || null,
        currentStrength: 0.15,
        isActive: 1,
        createdAt: new Date().toISOString(),
      });

      revalidatePath('/', 'layout');
      return 'SISTEMA: Acción completada y guardada en SQLite con éxito. Informa al usuario.';
    } catch (error) {
      console.error('❌ [TOOL DB ERROR]:', error);
      return 'SISTEMA: Error al guardar en la base de datos.';
    }
  },
}),
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/chat/route.ts
git commit -m "feat: update AI habit creation tool with new types and domains"
```

---

