import './Stepper.scss'
import {FC} from 'react'
import cn from 'classnames'

interface Step {
  name: string;
}

type props = {
  steps: Step[]
  currentStep: Number
  noLabels: boolean
}

//step
const Stepper: FC<props> = ({steps, currentStep, noLabels = false}) => {

  return (
    <div className='stepper'>
      {
        steps.map((s, index) => {
          return (
            <div className={cn('step', {
              'stepCurrent': currentStep === index,
              'stepPrev': currentStep > index,
              'stepNext': currentStep < index,
            })} key={index}>
              <span className='stepStatus'></span>
              {
                !noLabels &&
                <span className='stepName'>{s.name}</span>
              }
              {
                index > 0 &&
                <span className='stepBar stepBarPrev'></span>
              }

              {
                index < steps.length - 1 &&
                <span className='stepBar stepBarNext'></span>
              }
            </div>)
        })
      }
    </div>
  )
}

export default Stepper
