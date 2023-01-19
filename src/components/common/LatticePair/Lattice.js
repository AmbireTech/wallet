import styles from './LatticePair.module.scss'

import { TextInput } from 'components/common'

const Lattice = ({
    handleInputDeviceId,
    handleInputSecret,
    inputSecretRef,
    isSecretFieldShown,
    isLoading,
    title,
    buttons
}) => {

    return (
        <div className={styles.wrapper}>
            {title && <div className={styles.title}>{ title }</div>}
            <div className={styles.content}>
                <p>
                    The device ID is listed on your Lattice under{' '}
                    <strong>Settings</strong>.
                </p>
                <h4>Device ID</h4>
                <TextInput
                    disabled={isSecretFieldShown}
                    placeholder="Enter the device ID"
                    onInput={value => handleInputDeviceId(value)}
                />
                {isSecretFieldShown && (
                    <>
                        <h4>Secret</h4>
                        <TextInput
                            ref={inputSecretRef}
                            placeholder="Enter secret"
                            style={{ textTransform:'uppercase' }}
                            onInput={value => handleInputSecret(value)}
                        />
                    </>
                )}
                {(isLoading && !isSecretFieldShown) ? (
                    <>
                        <h3>It may takes a while.</h3>
                        <h3>Please wait...</h3>
                    </>
                ) : (
                    <></>
                )}
                {buttons && buttons}
            </div>
        </div>
    )
}

export default Lattice
