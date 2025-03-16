import { Check } from 'lucide-react';
import { clsx } from 'clsx';

interface StepIndicatorProps {
  currentStep: number;
  steps: string[];
}

export function StepIndicator({ currentStep, steps }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center space-x-4 mb-8">
      {steps.map((step, index) => (
        <div key={step} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={clsx(
                'w-8 h-8 rounded-full flex items-center justify-center transition-colors',
                index < currentStep
                  ? 'bg-green-500'
                  : index === currentStep
                  ? 'bg-blue-500'
                  : 'bg-gray-700'
              )}
            >
              {index < currentStep ? (
                <Check className="w-5 h-5 text-white" />
              ) : (
                <span className="text-white">{index + 1}</span>
              )}
            </div>
            <span className="text-sm text-gray-400 mt-2">{step}</span>
          </div>
          {index < steps.length - 1 && (
            <div
              className={clsx(
                'h-0.5 w-16 mx-2',
                index < currentStep ? 'bg-green-500' : 'bg-gray-700'
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}