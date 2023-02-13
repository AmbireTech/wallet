import { ethers } from "ethers"
import WEAK_PASSWORDS from 'ambire-common/src/constants/commonPasswords.json'

const passwordChecks = [
  {
    label: 'Minimum 8 characters',
    id: 'min8',
    satisfied: false,
    check: function(passphrase) {
      return passphrase.length >= 8
    } 
  },
  {
    label: 'At least one number',
    id: 'min1num',
    satisfied: false,
    check: function(passphrase) {
      return (/\d/).test(passphrase)
    } 
  },
  {
    label: 'At least one uppercase letter',
    id: 'min1up',
    satisfied: false,
    check: function (passphrase) {
      return (/[A-Z]/).test(passphrase)
    }
  },
  {
    label: 'Password is not a common password',
    id: 'notCommon',
    satisfied: false,
    check: function (passphrase) {
      return !WEAK_PASSWORDS.includes(ethers.utils.ripemd160(ethers.utils.toUtf8Bytes(passphrase)))
    }
  }
]

export default passwordChecks