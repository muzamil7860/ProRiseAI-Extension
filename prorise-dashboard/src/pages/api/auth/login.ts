import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { verifyPassword, generateToken } from '@/lib/auth'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { email, password } = loginSchema.parse(req.body)

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        plan: true,
        stats: true,
      },
    })

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password)
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user

    return res.status(200).json({
      user: userWithoutPassword,
      token,
      message: 'Login successful',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid input', errors: error.errors })
    }
    console.error('Login error:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}
