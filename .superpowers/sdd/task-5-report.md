# Task 5 Report: CentroMandoDashboard - Gate + Prominent CTA

## Changes Made

### 1. CentroMandoDashboard.tsx

**Imports added:**
- `Plus` from lucide-react
- `CreateFirstUnitGate` from `@/components/business/CreateFirstUnitGate`
- `BusinessSettingsModal` from `@/components/business/BusinessSettingsModal`

**State added:**
- `const [showCreateModal, setShowCreateModal] = useState(false);`

**Gate logic added at top of render (line 82-94):**
- When `settingsList.length === 0`, renders `<CreateFirstUnitGate />` instead of dashboard

**Header modified (line 226-235):**
- Added wrapper `<div className="flex items-center gap-2">` containing:
  - Green "CREAR UNIDAD DE NEGOCIO" button with `Plus` icon (opens modal with `initialShowNew={true}`)
  - Existing `BusinessSettings` button unchanged

**Modal rendering added (line 279-285):**
- When `showCreateModal` is true, renders `<BusinessSettingsModal>` with `initialShowNew={true}`

### 2. BusinessSettingsModal.tsx

**Interface updated:**
- Added optional `initialShowNew?: boolean` prop

**State initialization modified:**
- Changed `useState(false)` to `useState(initialShowNew)` so modal can open directly to "new unit" form

## Verification

- [x] Gate renders `CreateFirstUnitGate` when no business units exist
- [x] Green CTA button visible in header when units exist
- [x] Button opens `BusinessSettingsModal` with new unit form pre-shown
- [x] `BusinessSettings` button remains unchanged for managing existing units
