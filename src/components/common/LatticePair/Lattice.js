import styles from './LatticePair.module.scss'

import { TextInput, Info, Alert } from 'components/common'

const Lattice = ({
    handleInputDeviceId,
    handleInputSecret,
    inputSecretRef,
    isSecretFieldShown,
    isLoading,
    title,
    buttons
}) => {

    const renderMessage = () => {
        if (isLoading && !isSecretFieldShown) return <div className={styles.info} />

        if (isSecretFieldShown) return <Alert className={styles.info} text="Enter your SECRET from your GRID+ device"/>

        return <Info className={styles.info}>
            The device ID is listed on your Lattice under <strong>Settings</strong>
        </Info>
    }

    return (
        <div className={styles.wrapper}>
            { title && <div className={styles.title}>{ title } </div>}
            <div className={styles.content}>
                <div className={styles.formItem}>
                    <label>1. Enter Device</label>
                    <TextInput
                        disabled={isSecretFieldShown}
                        placeholder="Enter the device ID"
                        onInput={value => handleInputDeviceId(value)}
                    />
                </div>
                {isSecretFieldShown && (
                    <div className={styles.formItem}>
                        <label>2. Enter Secret</label>
                        <TextInput
                            ref={inputSecretRef}
                            placeholder="Enter secret"
                            onInput={value => handleInputSecret(value)}
                        />
                    </div>
                )}
                {(isLoading && !isSecretFieldShown) && (
                    <div className={styles.loadingText}>It may takes a while. Please wait...</div>
                )}
            </div>

            {renderMessage()}

            {buttons}
        </div>
    )
}

export default Lattice
