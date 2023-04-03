import sha1 from 'js-sha1'

const checkHaveIbeenPwned = async (password) => {
  if (!password) return false

	try {
		const hashedPassword = (await sha1(password)).toUpperCase()
	
		const url = `https://api.pwnedpasswords.com/range/${hashedPassword.slice(0, 5)}`
	
		const data = await fetch(url, {
			headers: { Accept: 'application/vnd.haveibeenpwned.v2+json' }
		})
	
		const hashList = (await data.text()).split('\r\n').map((hash) => hash.split(':')[0])
	
		// Password is found in a data breach
		return hashList.includes(hashedPassword.slice(5))
	} catch {
		// If the API is down, we just let the user continue
		return false
	}
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
