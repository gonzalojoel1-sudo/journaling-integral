## Task 5: CentroMandoDashboard - add gate + prominent CTA button

**Files:**
- Modify: `src/app/negocio/CentroMandoDashboard.tsx`

**Interfaces:**
- Consumes: `settingsList` prop
- Produces: Gate renders when no units, new "CREAR UNIDAD" button in header

- [ ] **Step 1: Add gate logic**

In `CentroMandoDashboard`, add check at the top of render:
```tsx
if (settingsList.length === 0) {
  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 font-mono">Panel Financiero</p>
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 mt-1">Centro de Mando</h1>
        </div>
      </header>
      <CreateFirstUnitGate />
    </div>
  );
}
```

Import `CreateFirstUnitGate`:
```tsx
import { CreateFirstUnitGate } from '@/components/business/CreateFirstUnitGate';
```

- [ ] **Step 2: Replace gear icon with prominent button**

In the header, replace the `<BusinessSettings initialSettings={settingsList} />` button with:

```tsx
<div className="flex items-center gap-2">
  {settingsList.length > 0 && (
    <button
      onClick={() => {/* open modal to create new unit */}}
      className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors shadow-md shadow-emerald-600/20 cursor-pointer"
    >
      <Plus className="h-4 w-4" />
      CREAR UNIDAD DE NEGOCIO
    </button>
  )}
  <BusinessSettings initialSettings={settingsList} />
</div>
```

Wait — `BusinessSettings` is a button that opens a modal. We need to expose its internal toggle state OR create a new approach. Look at `BusinessSettings.tsx` — it has internal `show` state.

Better approach: Make `BusinessSettings` expose an `onCreateNew` prop, OR just render the button directly in `CentroMandoDashboard` and call a server action to create.

Actually, the simplest approach: keep `BusinessSettings` as-is for managing existing units. Add a separate "CREAR UNIDAD DE NEGOCIO" button that directly calls `upsertBusinessSetting` with minimal fields OR opens a dedicated modal.

**Simpler approach**: Add `showNew={true}` prop to `BusinessSettingsModal` when creating from the CTA. But `BusinessSettingsModal` starts with `showNew=false`.

Actually the cleanest approach: Extract the modal opening state from `BusinessSettings` or just open `BusinessSettingsModal` directly. Let me check if we can pass an initial `showNew` prop.

Looking at the current `BusinessSettings` component:
```tsx
export function BusinessSettings({ initialSettings }: BusinessSettingsProps) {
  const [show, setShow] = useState(false);
  ...
  {show && <BusinessSettingsModal settings={initialSettings} onClose={() => setShow(false)} />}
}
```

We can modify `BusinessSettings` to accept an optional `openOnMount` prop:
```tsx
export function BusinessSettings({ initialSettings, openOnMount = false }: BusinessSettingsProps) {
  const [show, setShow] = useState(openOnMount);
```

Then in `CentroMandoDashboard`, add the button:
```tsx
<button
  onClick={() => {/* open modal with new unit form visible */}}
  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors shadow-md shadow-emerald-600/20 cursor-pointer"
>
  <Plus className="h-4 w-4" />
  CREAR UNIDAD DE NEGOCIO
</button>
```

But we still need to open the modal. Let me use a simpler approach: wrap the button in a state that controls the modal.

**Simpler approach**: Create a local `showModal` state in `CentroMandoDashboard` and render `BusinessSettingsModal` directly with `showNew={true}` for the CTA click:

```tsx
const [showCreateModal, setShowCreateModal] = useState(false);
...
<button
  onClick={() => setShowCreateModal(true)}
  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors shadow-md shadow-emerald-600/20 cursor-pointer"
>
  <Plus className="h-4 w-4" />
  CREAR UNIDAD DE NEGOCIO
</button>
...
{showCreateModal && (
  <BusinessSettingsModal
    settings={settingsList}
    onClose={() => setShowCreateModal(false)}
    initialShowNew={true}
  />
)}
```

Modify `BusinessSettingsModal` to accept `initialShowNew` prop:
```tsx
interface BusinessSettingsModalProps {
  settings: BusinessSetting[];
  onClose: () => void;
  initialShowNew?: boolean;
}

export function BusinessSettingsModal({ settings, onClose, initialShowNew = false }: BusinessSettingsModalProps) {
  const [showNew, setShowNew] = useState(initialShowNew);
```

- [ ] **Step 3: Add Plus import if not present**
Add `Plus` to lucide-react imports.

- [ ] **Step 4: Commit**
```bash
git add src/app/negocio/CentroMandoDashboard.tsx
git commit -m "feat(business): add unit creation gate and prominent CTA in CentroMandoDashboard"
```

---

