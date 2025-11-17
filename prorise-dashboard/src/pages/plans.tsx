import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'

interface Plan {
  id: string
  name: string
  description: string
  price: number
  features: string[]
}

export default function Plans() {
  const router = useRouter()
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState<string | null>(null)

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/plans')
      const data = await response.json()
      setPlans(data.plans)
    } catch (error) {
      console.error('Failed to fetch plans:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePurchase = async (planId: string) => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    setPurchasing(planId)

    try {
      const response = await fetch('/api/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ planId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Purchase failed')
      }

      alert('Plan purchased successfully!')
      router.push('/dashboard')
    } catch (error: any) {
      alert(error.message || 'Purchase failed')
    } finally {
      setPurchasing(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse-slow text-2xl text-primary">Loading plans...</div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Plans - ProRise AI</title>
      </Head>

      <div className="min-h-screen">
        {/* Header */}
        <header className="border-b border-gray-700">
          <div className="container mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center font-bold text-xl text-black">
                P
              </div>
              <div>
                <h1 className="text-xl font-bold">ProRise AI</h1>
                <p className="text-xs text-gray-400">Plans</p>
              </div>
            </div>
            <button 
              onClick={() => router.push('/dashboard')}
              className="btn btn-secondary text-sm"
            >
              Back to Dashboard
            </button>
          </div>
        </header>

        <main className="container mx-auto px-6 py-12">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Choose Your Plan</h2>
            <p className="text-xl text-gray-400">Select the perfect plan for your LinkedIn AI needs</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan) => (
              <div key={plan.id} className="card hover:scale-105 transition-transform">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-gray-400 mb-4">{plan.description}</p>
                  <div className="text-5xl font-bold text-primary mb-2">
                    ${plan.price}
                  </div>
                  <p className="text-gray-400 text-sm">per month</p>
                </div>

                <div className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className="text-primary mt-1">✓</div>
                      <p className="text-gray-300">{feature}</p>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handlePurchase(plan.id)}
                  disabled={purchasing === plan.id}
                  className="btn btn-primary w-full"
                >
                  {purchasing === plan.id ? 'Processing...' : 'Purchase Now'}
                </button>
              </div>
            ))}
          </div>

          {plans.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400 text-xl">No plans available at the moment.</p>
            </div>
          )}
        </main>
      </div>
    </>
  )
}
