export const fetch = require('node-fetch')

export async function fetchPost (url, body) {
	const r = await fetch(url, {
		headers: { 'content-type': 'application/json' },
		method: 'POST',
		body: JSON.stringify(body)
	})
	return r.json()
}

export const fetchGet = async url => {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.json()
  } catch(e){
    console.error(e)
    return null;
  }
}

export async function fetchCaught (url, params) {
    let resp
    try {
      resp = await fetch(url, params)
    } catch (e) {
      console.error(e)
      return { errMsg: `Unexpected error: ${e && e.message}` }
    }
    let body
    try {
      body = await resp.json()
    } catch(e) {
      console.error(e)
      return { errMsg: `Unexpected error: ${resp.status}, ${e && e.message}`, resp }
    }
    return { body, resp, errMsg: '' }
}