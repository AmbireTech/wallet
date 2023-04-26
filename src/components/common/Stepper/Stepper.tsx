import './Stepper.scss'
import { FC } from 'react'
import cn from 'classnames'

interface Step {
  name: string
}

type PropsType = {
  steps: Step[]
  currentStep: Number
  noLabels: boolean
}

// step
const Stepper: FC<PropsType> = ({ steps, currentStep, noLabels = false }) => {
  return (
    <div className="stepper">
      {steps.map((s, index) => {
        return (
          <div
            className={cn('step', {
              stepCurrent: currentStep === index,
              stepPrev: currentStep > index,
              stepNext: currentStep < index
            })}
            key={s.name}
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
