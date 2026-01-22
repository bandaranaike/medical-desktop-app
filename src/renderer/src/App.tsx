import Versions from './components/Versions'
import electronLogo from './assets/electron.svg'
import { useEffect, useState } from 'react'

type User = {
  id: number
  name: string
  email: string
}

function App(): React.JSX.Element {
  const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')

  const [users, setUsers] = useState<User[]>([])

  useEffect(() => {
    window.api
      .listUsers()
      .then(setUsers)
      .catch((e) => console.error(e))
  }, [])

  return (
    <>
      <img alt="logo" className="logo" src={electronLogo} />
      <div className="creator">Powered by electron-vite</div>
      <div className="text">
        Build an Electron app with <span className="react">React</span>
        &nbsp;and <span className="ts">TypeScript</span>
      </div>
      <p className="tip">
        Please try pressing <code>F12</code> to open the devTool
      </p>
      <div style={{ padding: 20 }}>
        <h1>Users ({users.length})</h1>
        <ul>
          {users.map((u) => (
            <li key={u.id}>
              {u.name} – {u.email}
            </li>
          ))}
        </ul>
        End of users
      </div>
      <div className="actions">
        <div className="action">
          <a href="https://electron-vite.org/" target="_blank" rel="noreferrer">
            Documentation
          </a>
        </div>
        <div className="action">
          <a target="_blank" rel="noreferrer" onClick={ipcHandle}>
            Send IPC
          </a>
        </div>
      </div>
      <Versions></Versions>
    </>
  )
}

export default App
