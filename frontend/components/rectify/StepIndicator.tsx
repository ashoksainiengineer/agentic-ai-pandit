'use client';

/**
 * Step indicator with labels — matches edit page stepper style.
 * Shows "Step N of M" with progress bar and label.
 */
interface StepIndicatorProps {
  step: number;
  totalSteps: number;
  labels: string[];
}

export function StepIndicator({ step, totalSteps, labels }: StepIndicatorProps) {
  return (
    <div className="max-w-md mx-auto mb-8">
      <p className="text-center text-xs text-[#959595] mb-3">
        Step {step} of {totalSteps}
      </p>
      <div className="flex items-center justify-between relative">
        <div className="absolute top-4 left-0 w-full h-1 bg-[rgba(0,0,0,0.08)] rounded-full" />
        <div
          className="absolute top-4 left-0 h-1 bg-[#000000] rounded-full transition-all duration-500"
          style={{ width: `${((step - 1) / (totalSteps - 1)) * 100}%` }}
        />
        {labels.map((label, i) => {
          const s = i + 1;
          const isComplete = s < step;
          const isCurrent = s === step;
          return (
            <div key={s} className="flex flex-col items-center relative z-10">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all border-2 ${
                  isComplete
                    ? 'bg-[#184131] border-[#184131] text-white'
                    : isCurrent
                    ? 'bg-white border-[#000000] text-black shadow-[0_0_10px_rgba(0,0,0,0.08)]'
                    : 'bg-white border-[#EBE2D6] text-[#959595]'
                }`}
              >
                {isComplete ? '✓' : s}
              </div>
              <span
                className={`text-[10px] mt-1.5 font-medium text-center ${
                  isCurrent ? 'text-black' : 'text-[#959595]'
                }`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
