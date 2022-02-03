
export const getPermissions = () => {
  try {
    return JSON.parse(localStorage.getItem('bookmarklet_whitelist')) || []
  } catch (e) {
    return []
  }
}

export const isPermitted = (host) => {
  return !!getPermissions().find(a => a.toLowerCase() === host.toLowerCase())
}

export const savePermissions = (permissions) => {
  console.log('saving', permissions)
    localStorage.setItem('bookmarklet_whitelist', JSON.stringify(permissions))
}

export const addHost = (host) => {
  let permissions = getPermissions()
  console.log('existing', permissions)

  let permissionIndex = permissions.findIndex(p => p.toLowerCase() === host.toLowerCase())

  if (permissionIndex === -1) {
    permissions.push(host)
    savePermissions(permissions)
  }
  return permissions
}

export const removeHost = host => {
  let permissions = getPermissions()

  let permissionIndex = permissions.findIndex(p => p.toLowerCase() === host.toLowerCase())

  if (permissionIndex !== -1) {
    permissions.splice(permissionIndex, 1)
    savePermissions(permissions)
  }
  return permissions
}
