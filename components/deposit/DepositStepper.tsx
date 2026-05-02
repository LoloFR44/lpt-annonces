const STEPS = ['Catégorie', 'Détails', 'Visibilité', 'Publication']

export default function DepositStepper({ currentStep }: { currentStep: 1 | 2 | 3 | 4 }) {
  return (
    <div className="bg-white border-b border-border px-8">
      <div className="max-w-[700px] mx-auto flex">
        {STEPS.map((label, i) => {
          const step = i + 1
          const done = step < currentStep
          const active = step === currentStep
          return (
            <div key={label} className="flex-1 py-4 text-center relative">
              {i < STEPS.length - 1 && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-8 bg-border" />
              )}
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mx-auto mb-1.5
                ${done ? 'bg-teal text-white' : active ? 'bg-navy text-white' : 'bg-surface text-muted'}`}>
                {done ? '✓' : step}
              </div>
              <div className={`text-[11px] font-semibold uppercase tracking-wider
                ${done ? 'text-teal' : active ? 'text-navy' : 'text-muted'}`}>
                {label}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
