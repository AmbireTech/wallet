import sha1 from 'js-sha1'

const checkHaveIbeenPwned = async (password) => {
  if (!password) return null

  const hashedPassword = (await sha1(password)).toUpperCase()

  const url = `https://api.pwnedpasswords.com/range/${hashedPassword.slice(0, 5)}`

	const data = await fetch(url, {
		headers: { Accept: 'application/vnd.haveibeenpwned.v2+json' }
	})

	const hashList = (await data.text()).split('\r\n').map((hash) => hash.split(':')[0])

  // Password is found in a data breach
  if (hashList.includes(hashedPassword.slice(5))) {
    return 'breached'
  }
  
  return 'not-breached'
}

const passwordChecks = [
	{
		label: 'Minimum 8 characters',
		id: 'min8',
		satisfied: false,
		check: function (passphrase) {
			return passphrase.length >= 8
		}
	}
]

export default passwordChecks

export { checkHaveIbeenPwned }
