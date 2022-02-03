import './Bookmarklet.scss'
import { getPermissions, isPermitted, addHost, removeHost } from 'lib/bookmarklet/bookmarkletPermissions'
import { useState } from 'react'

const Bookmarklet = () => {

  const [hosts, setHosts] = useState(getPermissions())
  const [newHostInput, setNewHostInput] = useState('')
  const [error, setError] = useState(null)

  return (
    <div id='bookmarklet'>
      <div className='panel'>

        <div>
          Whitelisted domains will be allowed to communicate with ambire wallet through the <b>Ambire Bookmarklet</b>
          <br />
          (To use ambire bookmarklet, copy the javascript content of the <a href={'/bookmarklet/bookmarkletSnippet.js'}>Ambire Bookmarklet Snipped</a> and save it as a bookmark)
        </div>

        {error && (<div>
          Error: {error}
        </div>)}

        <input value={newHostInput} onChange={(e) => {
          setNewHostInput(e.currentTarget.value.trim())
        }}/>
        <button onClick={() => {
          setError(null)
          if (!newHostInput) { // matches domain
            setError('empty domain')
          } else if (!newHostInput.match(/^((?!-)[A-Za-z0-9-]{1,63}(?<!-)\.?)+([A-Za-z]{2,6})?(:[0-9]+)?$/)) {
            setError('invalid domain')
          } else if (isPermitted(newHostInput)) {
            setError(`domain ${newHostInput} already exists`)
          } else {
            setHosts(addHost(newHostInput))
          }
        }}>Add
        </button>
        {hosts.length ? (
          <>
            <div className='panel-title'>Whitelisted domains</div>
            <div className='content'>
              <table>
                <tbody>
                {
                  Object.values(hosts).map(h => (
                    <tr>
                      <td>{h}</td>
                      <td>
                        <button onClick={() => {
                          setHosts(removeHost(h))
                        }}>Revoke
                        </button>
                      </td>
                    </tr>)
                  )
                }
                </tbody>
              </table>
            </div>
          </>
        ) : (<div>No whitelisted domain yet</div>)
        }
      </div>
    </div>
  )
}

export default Bookmarklet
