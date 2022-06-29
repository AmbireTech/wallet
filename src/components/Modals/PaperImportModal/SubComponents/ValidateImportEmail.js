import { Button, TextInput } from 'components/common'
import { useRef, useEffect } from 'react'

const ValidateImportEmail = ({ foundAddress, setError }) => {

  //const [isLoading, setIsLoading] = useState(false)

  const textFieldRef = useRef()

  useEffect(() => {
    setTimeout(() => {
      textFieldRef?.current?.focus()
    }, 100)
  }, [])

  return (
    <>
      <div className='instructions'>
        Validate the email associated with your account {foundAddress}
      </div>

      TODO
      <TextInput ref={textFieldRef} placeholder='Email'/>

      <div className='buttonHolder'>
        <Button
          full
          disabled>
          Continue
        </Button>
      </div>
    </>
  )
}

export default ValidateImportEmail
