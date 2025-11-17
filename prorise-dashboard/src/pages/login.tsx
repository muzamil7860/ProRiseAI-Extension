import { useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { signIn } from 'next-auth/react'

export default function Login() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: formData.email,
        password: formData.password,
      })

      if (result?.error) {
        throw new Error(result.error)
      }

      if (result?.ok) {
        // Fetch session to check user role
        const response = await fetch('/api/auth/session')
        const session = await response.json()

        // Redirect based on role
        if (session?.user?.role === 'SUPER_ADMIN') {
          router.push('/admin/dashboard')
        } else if (session?.user?.role === 'ADMIN') {
          router.push('/admin/dashboard')
        } else {
          router.push('/dashboard')
        }
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>Login - ProRise AI</title>
      </Head>

      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto rounded-xl bg-primary flex items-center justify-center font-bold text-3xl text-black mb-4">
              P
            </div>
            <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
            <p className="text-gray-400">Login to your ProRise AI account</p>
          </div>

          {router.query.registered && (
            <div className="mb-4 p-3 rounded bg-primary/10 border border-primary text-primary text-center">
              Registration successful! Please login.
            </div>
          )}

          <div className="card">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded bg-red-500/10 border border-red-500 text-red-500">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  className="input"
                  placeholder="you@example.com"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Password</label>
                <input
                  type="password"
                  className="input"
                  placeholder="••••••••"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-400">
                Don't have an account?{' '}
                <Link href="/register" className="text-primary hover:underline">
                  Register
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
