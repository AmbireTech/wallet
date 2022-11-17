import './Stepper.scss'
import React, { FC } from 'react'

interface Step {
  name: string
}

type Props = {
  steps: Step[]
  currentStep: Number
  noLabels: boolean
}

// step
const Stepper: FC<Props> = ({ steps, currentStep, noLabels = false }) => {
  return (
    <div className="stepper">
      {steps.map((s, index) => {
        return (
          <div
            className={`step step${
              currentStep > index ? 'Prev' : currentStep === index ? 'Current' : 'Next'
            }`}
            key={index}
          >
            <span className="stepStatus" />
            {!noLabels && <span className="stepName">{s.name}</span>}
            {index > 0 && <span className="stepBar stepBarPrev" />}

            {index < steps.length - 1 && <span className="stepBar stepBarNext" />}
          </div>
        )
      })}
    </div>
  )
}

export default Stepper
