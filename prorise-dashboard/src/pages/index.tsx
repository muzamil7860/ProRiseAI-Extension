import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { useRouter } from 'next/router'
import Head from 'next/head'

export default function Home() {
  const router = useRouter()

  return (
    <>
      <Head>
        <title>ProRise AI - LinkedIn Assistant Dashboard</title>
        <meta name="description" content="AI-powered LinkedIn assistant with analytics and plan management" />
      </Head>

      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <header className="p-6 border-b border-gray-700">
          <div className="container mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center font-bold text-2xl text-black">
                P
              </div>
              <div>
                <h1 className="text-2xl font-bold">ProRise AI</h1>
                <p className="text-sm text-gray-400">LinkedIn Assistant</p>
              </div>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={() => router.push('/login')}
                className="btn btn-secondary"
              >
                Login
              </button>
              <button 
                onClick={() => router.push('/register')}
                className="btn btn-primary"
              >
                Get Started
              </button>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <main className="flex-1 container mx-auto px-6 py-16">
          <div className="text-center max-w-4xl mx-auto animate-fade-in">
            <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
              AI-Powered LinkedIn Assistant
            </h2>
            <p className="text-xl text-gray-300 mb-12">
              Enhance your LinkedIn presence with AI-driven content creation, suggestions, and analytics
            </p>

            {/* Feature Cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
              <div className="card">
                <div className="text-4xl mb-4">✍️</div>
                <h3 className="text-xl font-bold mb-2">Post Creator</h3>
                <p className="text-gray-400">Create engaging LinkedIn posts with AI</p>
              </div>
              <div className="card">
                <div className="text-4xl mb-4">💬</div>
                <h3 className="text-xl font-bold mb-2">Comment Enhancer</h3>
                <p className="text-gray-400">Craft perfect comments and responses</p>
              </div>
              <div className="card">
                <div className="text-4xl mb-4">💡</div>
                <h3 className="text-xl font-bold mb-2">Reply Suggester</h3>
                <p className="text-gray-400">Smart reply suggestions for messages</p>
              </div>
              <div className="card">
                <div className="text-4xl mb-4">📊</div>
                <h3 className="text-xl font-bold mb-2">Analytics</h3>
                <p className="text-gray-400">Track your usage and performance</p>
              </div>
            </div>

            <div className="mt-16">
              <button 
                onClick={() => router.push('/register')}
                className="btn btn-primary text-lg px-8 py-4"
              >
                Start Free Trial
              </button>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-700 py-6">
          <div className="container mx-auto px-6 text-center text-gray-400">
            <p>&copy; 2024 ProRise AI. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions)

  // If user is logged in, redirect based on role
  if (session?.user) {
    if ((session.user.role as any) === 'SUPER_ADMIN' || (session.user.role as any) === 'ADMIN') {
      return {
        redirect: {
          destination: '/admin/dashboard',
          permanent: false,
        },
      }
    } else {
      return {
        redirect: {
          destination: '/dashboard',
          permanent: false,
        },
      }
    }
  }

  return {
    props: {},
  }
}
