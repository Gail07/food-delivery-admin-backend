import { useState } from 'react'
import Navbar from './components/Navbar/Navbar'
import Sidebar from './components/Sidebar/Sidebar'
import { Routes, Route, Navigate } from 'react-router-dom'
import Add from './pages/Add/Add'
import List from './pages/List/List'
import Orders from './pages/Orders/Orders'
import Login from './pages/Login/Login'
import { ToastContainer } from 'react-toastify';
import { url } from './assets/assets'
import { getToken, setToken as storeToken } from './api'

const App = () => {

  const [token, setToken] = useState(getToken())

  const logout = () => {
    storeToken('')
    setToken('')
  }

  if (!token) {
    return (
      <>
        <ToastContainer />
        <Login onLogin={setToken} />
      </>
    )
  }

  return (
    <div>
      <ToastContainer />
      <Navbar onLogout={logout} />
      <hr />
      <div className="app-content">
        <Sidebar />
        <Routes>
          <Route path="/add" element={<Add />} />
          <Route path="/list" element={<List url={url}/>} />
          <Route path="/orders" element={<Orders />} />
          <Route path="*" element={<Navigate to="/orders" replace />} />
        </Routes>
      </div>
    </div>
  )
}

export default App
