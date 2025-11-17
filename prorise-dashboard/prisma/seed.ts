import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create plans
  const plans = [
    {
      name: 'Free',
      description: 'Get started with basic features',
      price: 0,
      features: [
        '10 posts per month',
        '20 comments per month',
        '20 replies per month',
        'Basic analytics',
      ],
      isActive: true,
    },
    {
      name: 'Pro',
      description: 'Perfect for professionals',
      price: 29.99,
      features: [
        'Unlimited posts',
        'Unlimited comments',
        'Unlimited replies',
        'Advanced analytics',
        'Priority support',
        'Custom templates',
      ],
      isActive: true,
    },
    {
      name: 'Enterprise',
      description: 'For teams and organizations',
      price: 99.99,
      features: [
        'Everything in Pro',
        'Team collaboration',
        'API access',
        'Custom integrations',
        'Dedicated account manager',
        'SLA guarantee',
      ],
      isActive: true,
    },
  ]

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { name: plan.name },
      update: {},
      create: plan,
    })
  }

  console.log('Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
