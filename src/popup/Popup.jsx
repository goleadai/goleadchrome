import { useEffect, useState } from 'react'
import './Popup.css'

export const Popup = () => {
  const [user, setUser] = useState(null)
  const [message, setMessage] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const connect = async () => {
    setIsLoading(true)
    setMessage(null)

    const getCookie = (server_url, name) => {
      return new Promise((resolve, reject) => {
        chrome.cookies.get({ url: server_url, name: name }, function (cookie) {
          if (cookie) {
            resolve(cookie.value)
          } else {
            reject(new Error('Cookie not found' + name))
          }
        })
      })
    }

    const accessUserCookie = async () => {
      try {
        console.log('starting')
        let auth_token;

        try {
          auth_token = await getCookie('https://twitter.com', 'auth_token')
        } catch (error) {
          console.log('error', error)
        }

        let ct0

        try {
          ct0 = await getCookie('https://twitter.com', 'ct0')
        } catch (error) {
          console.log('error', error)
        }

        if (!auth_token || !ct0) {
          try {
            auth_token = await getCookie('https://x.com', 'auth_token')
            ct0 = await getCookie('https://x.com', 'ct0')
          } catch (error) {
            console.log('error', error)
          }
        }

        const token = await getCookie('https://api.golead.ai', 'token')
        await createUserAccount(auth_token, ct0, token)
      } catch (error) {
        setMessage('Make sure you are logged in to Twitter and GoLead.')
        console.error('Error accessing cookie:', error)
      } finally {
        setIsLoading(false)
      }
    }

    const createUserAccount = async (auth_token, ct0, token) => {
      const url = 'https://api.golead.ai/api/accounts/connect'
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `${token}`,
        },
        body: JSON.stringify({ auth_token, ct0, screen_name: user.screenName }),
      })
      const data = await response.json()
      if (response.ok) {
        setMessage('Account connected successfully')
        console.log('Account data:', data)
      } else {
        setMessage('Error connecting account. Please try again.')
        console.error('Error connecting account:', response)
      }
    }

    await accessUserCookie()
  }

  useEffect(() => {
    const getUserData = async () => {
      return new Promise((resolve, reject) => {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
          if (tabs[0].id && tabs[0].status === 'complete') {
            chrome.scripting.executeScript(
              {
                target: { tabId: tabs[0].id },
                function: () => {
                  const scripts = [...document.getElementsByTagName('script')]
                  const initialStateScript = scripts.find((script) =>
                    script.textContent.startsWith('window.__INITIAL_STATE__'),
                  )
                  return initialStateScript ? initialStateScript.textContent : null
                },
              },
              (results) => {
                if (results && results.length > 0 && results[0].result !== null) {
                  resolve(results[0].result)
                } else {
                  reject(new Error('Unable to retrieve initial state script content'))
                }
              },
            )
          }
        })
      })
    }

    const fetchData = async () => {
      try {
        const userData = await getUserData()
        const dataForParse = userData.replace('window.__INITIAL_STATE__=', '')
        const userInfo = extractUserInfo(dataForParse)
        setUser(userInfo)
      } catch (error) {
        setMessage('Error fetching data. Make sure you are on the Twitter homepage.')
        console.error('Error fetching data:', error)
      }
    }

    fetchData()
  }, [])

  return (
    <main>
      <h3 className="title">Connect your Twitter account</h3>

      {user && (
        <div className="user-info">
          <p>
            <strong>Name:</strong> {user.name}
          </p>
          <p>
            <strong>Username:</strong> {user.screenName}
          </p>
        </div>
      )}

      {message && <p className="error">{message}</p>}

      {!message && (
        <button className="button" onClick={connect} disabled={isLoading}>
          {isLoading ? 'Connecting...' : 'Connect'}
        </button>
      )}
    </main>
  )
}

export default Popup

const extractUserInfo = (dataString) => {
  const nameRegex = /"name":"(.*?)"/
  const screenNameRegex = /"screen_name":"(.*?)"/
  const nameMatch = dataString.match(nameRegex)
  const screenNameMatch = dataString.match(screenNameRegex)
  return {
    name: nameMatch ? nameMatch[1] : null,
    screenName: screenNameMatch ? screenNameMatch[1] : null,
  }
}
