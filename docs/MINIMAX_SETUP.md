# MiniMax Setup — Guía Operativa

**Fecha:** 2026-07-29  
**Suscripción:** MiniMax Token Plan (~5.1B tokens/mes de M3)

---

## 📋 Modelos en uso

| Endpoint | Provider | Modelo | Uso |
|----------|----------|--------|-----|
| `/api/chat` (primary) | MiniMax | `MiniMax-M3` | Chat principal con tools |
| `/api/chat` (fallback) | MiniMax | `MiniMax-M2.7-highspeed` | Si primary falla |
| `/api/smart-entry` (fast) | MiniMax | `MiniMax-M2.7-highspeed` | JSON extraction rápido |
| `/api/smart-entry` (primary) | MiniMax | `MiniMax-M3` | Fallback si fast falla |
| RAG embeddings | **Local TF-IDF** | `local-tfidf-v1` | Sin API (sin costo) |

**Thinking mode:** desactivado en todas las llamadas vía `providerOptions: MINIMAX_NO_THINKING` (`src/lib/minimax-options.ts`).

---

## 🔑 Configuración de API key

### Obtener key
```
https://platform.minimax.io/user-center/basic-information/interface-key
```

### Variables de entorno requeridas

**`.env`** y **`.env.local`** (ambos gitignored):
```bash
MINIMAX_API_KEY=sk-cp-...tu_key...
```

### Verificación de carga
```bash
node -e "require('dotenv').config(); console.log('MINIMAX_API_KEY:', process.env.MINIMAX_API_KEY?.substring(0, 12))"
```

Salida esperada: `MINIMAX_API_KEY: sk-cp-...`

---

## 🔄 Endpoints base

| Protocolo | URL base | Uso |
|-----------|----------|-----|
| OpenAI-compatible | `https://api.minimax.io/v1` | Default (usado por AI SDK con `createOpenAI`) |
| Anthropic-compatible | `https://api.minimax.io/anthropic` | Alternativa (no usado actualmente) |

---

## 🧪 Pruebas rápidas

### Test 1: Dev server arranca
```bash
npm run dev
```
Debe mostrar:
```
✓ Ready in ~1s
- Environments: .env.local, .env
```

### Test 2: Chat endpoint funciona
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"hola"}]}' \
  http://localhost:3000/api/chat
```
Debe retornar streaming con response de MiniMax-M3 en español, **sin bloques `<think>`**.

### Test 3: Smart-entry extrae JSON
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"transcript":"hoy dormí bien, energía 8, grateful por mi familia"}' \
  http://localhost:3000/api/smart-entry
```
Debe retornar JSON estructurado con `energy`, `gratitude`, etc.

---

## 💰 Monitoreo de uso

Dashboard: https://platform.minimax.io/user-center/basic-information/usage

- **Modelo principal:** MiniMax-M3 (cuenta más tokens)
- **Embeddings:** $0 (TF-IDF local)
- **Threshold recomendado:** alerta al 80% del quota mensual

---

## 🛠 Troubleshooting

### Error: `401 Unauthorized`
- Verifica que `MINIMAX_API_KEY` esté en `.env` (no solo `.env.example`)
- Reinicia el dev server después de cambiar `.env`

### Error: `timeout`
- Aumenta `MINIMAX_TIMEOUT_MS` en `src/config/ai.ts` (default: 30000ms)
- Verifica que no estés cerca del rate limit

### Respuestas lentas (>5s primer token)
- **Thinking está activado** — verifica que `providerOptions: MINIMAX_NO_THINKING` esté en todas las llamadas
- **Modelo equivocado** — verifica que `FAST_MODEL` solo se use como fallback

### RAG no encuentra entradas
- Verifica que `pnpm db:backfill-embeddings` haya corrido
- Revisa logs: `{"msg":"rag_store_embedding_failed"}` indica error de schema

---

## 🔄 Migración desde providers anteriores

### Antes (free tier)
- OpenRouter `poolside/laguna-m.1:free`
- OpenCode `deepseek-v4-flash-free`
- Groq `llama-3.3-70b-versatile`
- Google Gemini `gemini-3-flash-preview`
- Google Embeddings `text-embedding-004`

### Después (MiniMax Token Plan)
- 1 sola API key: `MINIMAX_API_KEY`
- 1 endpoint base: `https://api.minimax.io/v1`
- 4 dependencias eliminadas de `package.json`
- RAG: TF-IDF local (sin API)

### Costo
- **Antes:** $0 (free tiers, pero con límites y latencia inconsistente)
- **Ahora:** incluido en suscripción MiniMax (~5.1B tokens/mes)

---

## 📊 Benchmarks de performance

Medido en `localhost` con `curl` (cold cache, primer request):

| Endpoint | Sin optimizaciones | Con optimizaciones | Mejora |
|----------|------------------:|-------------------:|-------:|
| `POST /api/chat` | 8.76s | 4.09s | **-53%** |
| LLM calls por chat request | 2 | 1 | -50% |
| Tokens de output (avg) | baseline | -60% (sin thinking) | **-60%** |

### Optimizaciones aplicadas
1. **Thinking mode desactivado** en todas las llamadas MiniMax (`MINIMAX_NO_THINKING`)
2. **Standalone query eliminada** — la última mensaje del usuario ES la query de búsqueda (TF-IDF es keyword-based, no necesita reescritura LLM)
3. **`unstable_cache` para `getRandomVerse`** — contenido bíblico estático cacheado por 1h
4. **Índices DB aplicados** — `daily_entries(user_id, date)`, `habits(user_id, is_active)`, `business_transactions(user_id, date)`, etc.

---

## 📚 Referencias

- Docs oficiales: https://platform.minimax.io/docs
- Pricing: https://platform.minimax.io/docs/guides/pricing-token-plan
- Migration commit: `feat(ai): migrate all providers to MiniMax Token Plan`
- Thinking fix commit: `feat(ai): disable MiniMax-M3 thinking mode`
- Auditoría previa: `docs/auditoria-2026-07-28-full.md`
