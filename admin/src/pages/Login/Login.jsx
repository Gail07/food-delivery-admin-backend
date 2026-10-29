import { useState } from 'react'
import './Login.css'
import { assets } from '../../assets/assets'
import { api, setToken } from '../../api'

const Login = ({ onLogin }) => {
  const [data, setData] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const onChangeHandler = (event) => {
    const { name, value } = event.target
    setData(prev => ({ ...prev, [name]: value }))
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const response = await api.post('/api/user/admin/login', data)
      if (response.data.success) {
        setToken(response.data.token)
        onLogin(response.data.token)
      } else {
        setError(response.data.message || 'Login failed')
      }
    } catch {
      setError('Server unreachable')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='admin-login'>
      <form className='admin-login-form' onSubmit={onSubmit}>
        <img src={assets.logo} alt='Logo' />
        <h2>Admin Panel</h2>
        <input name='email' type='email' placeholder='Email' value={data.email} onChange={onChangeHandler} autoComplete='username' required />
        <input name='password' type='password' placeholder='Password' value={data.password} onChange={onChangeHandler} autoComplete='current-password' required />
        {error && <p className='admin-login-error'>{error}</p>}
        <button type='submit' disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </div>
  )
}

export default Login
