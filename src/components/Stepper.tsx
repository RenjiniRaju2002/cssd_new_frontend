import React from 'react';
import '../styles/stepper.css';

interface StepperProps {
  currentStep: number;
  steps: string[];
}

const Stepper: React.FC<StepperProps> = ({ currentStep, steps }) => {
  return (
    <div className="stepper-container">
      {steps.map((label, idx) => {
        const stepNum = idx + 1;
        const isActive = currentStep === idx;
        const isCompleted = currentStep > idx;
        return (
          <div key={label} className={`stepper-step${isActive ? ' active' : ''}${isCompleted ? ' completed' : ''}`}> 
            <div className="stepper-circle">{stepNum}</div>
            <div className="stepper-label">{label}</div>
            {idx < steps.length - 1 && <div className="stepper-arrow" />}
          </div>
        );
      })}
    </div>
  );
};

export default Stepper; 