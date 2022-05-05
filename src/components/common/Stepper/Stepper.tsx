import './Stepper.scss'
import {FC} from "react";

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
            <div className={`step step${currentStep > index ? 'Prev' : (currentStep === index ? 'Current' : 'Next')}`}>
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
