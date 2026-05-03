'use client'

import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { CarouselSection } from '@/components/carousel-section'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Users, Utensils, TrendingUp } from 'lucide-react'
import Link from 'next/link'

const messesData = [
  {
    id: '1',
    title: 'Alpha Mess',
    description: 'Premium shared kitchen with 50+ members managing daily meals and finances.',
    image: '/messes/alpha.jpg',
  },
  {
    id: '2',
    title: 'Beta Mess',
    description: 'Collaborative mess for students with organized meal planning and budgets.',
    image: '/messes/beta.jpg',
  },
  {
    id: '3',
    title: 'Gamma Mess',
    description: 'Professional mess with advanced attendance tracking and shopping lists.',
    image: '/messes/gamma.jpg',
  },
  {
    id: '4',
    title: 'Delta Mess',
    description: 'Community-driven mess with transparent financial management and meal schedules.',
    image: '/messes/delta.jpg',
  },
]

const menusData = [
  {
    id: '1',
    title: 'Monday: Indian Cuisine',
    description: 'Delicious North Indian meals - Dal Makhani, Roti, and fresh Salad',
    image: '/menus/monday.jpg',
  },
  {
    id: '2',
    title: 'Tuesday: Continental',
    description: 'Grilled Chicken, Pasta, and seasonal vegetables with garlic bread',
    image: '/menus/tuesday.jpg',
  },
  {
    id: '3',
    title: 'Wednesday: Asian Fusion',
    description: 'Stir-fried noodles, Fried rice, and spring rolls with sweet sauce',
    image: '/menus/wednesday.jpg',
  },
  {
    id: '4',
    title: 'Thursday: Traditional',
    description: 'Rice, Dal Tadka, Chicken Curry, and homemade Yogurt',
    image: '/menus/thursday.jpg',
  },
]

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="relative py-16 sm:py-20 md:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          {/* Background gradient */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-20 right-0 w-80 h-80 bg-accent/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-secondary/20 rounded-full blur-3xl" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <div>
              <div className="inline-flex items-center gap-2 mb-6 px-3 py-1 bg-accent/10 border border-accent/20 rounded-full">
                <span className="w-2 h-2 rounded-full bg-accent" />
                <span className="text-sm font-semibold text-accent">Welcome to Mess Management</span>
              </div>

              <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-6 leading-tight">
                Organize Your <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Mess</span> with Ease
              </h1>

              <p className="text-lg text-muted-foreground mb-8 leading-relaxed max-w-xl">
                A comprehensive platform for managing shared kitchen spaces, meal planning, finances, shopping, and attendance tracking all in one place.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                  <Link href="/register">Get Started Free</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-accent text-accent hover:bg-accent/10">
                  <Link href="#features">Learn More</Link>
                </Button>
              </div>

              {/* Stats */}
              <div className="mt-12 pt-8 border-t border-border flex gap-8">
                <div>
                  <p className="text-2xl font-bold text-foreground">10K+</p>
                  <p className="text-sm text-muted-foreground">Active Users</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">500+</p>
                  <p className="text-sm text-muted-foreground">Messes</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">98%</p>
                  <p className="text-sm text-muted-foreground">Satisfaction</p>
                </div>
              </div>
            </div>

            {/* Image showcase - Cards */}
            <div className="space-y-4">
              <Card className="bg-gradient-to-br from-primary/20 to-accent/20 border-border p-6 rounded-xl">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 rounded-lg bg-primary/20">
                    <Users size={24} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Total Messes</h3>
                    <p className="text-2xl font-bold text-accent">500+</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">Manage your mess community efficiently</p>
              </Card>

              <Card className="bg-gradient-to-br from-secondary/20 to-accent/20 border-border p-6 rounded-xl">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 rounded-lg bg-secondary/20">
                    <Utensils size={24} className="text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Users</h3>
                    <p className="text-2xl font-bold text-secondary">10K+</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">Join thousands of happy users</p>
              </Card>

              <Card className="bg-gradient-to-br from-accent/20 to-primary/20 border-border p-6 rounded-xl">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 rounded-lg bg-accent/20">
                    <TrendingUp size={24} className="text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Growth</h3>
                    <p className="text-2xl font-bold text-foreground">↗ 45%</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">Month over month increase</p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 lg:px-8 bg-card/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Powerful Features</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to manage your mess efficiently and transparently
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: 'Meal Management',
                description: 'Plan and organize meals for your entire mess community',
                icon: '🍽️',
              },
              {
                title: 'Finance Tracking',
                description: 'Transparent expense tracking and fair cost distribution',
                icon: '💰',
              },
              {
                title: 'Shopping Lists',
                description: 'Collaborative shopping lists with item tracking',
                icon: '🛒',
              },
              {
                title: 'Attendance',
                description: 'Track member attendance and manage participation',
                icon: '✓',
              },
              {
                title: 'Notifications',
                description: 'Real-time updates and alerts for all activities',
                icon: '🔔',
              },
              {
                title: 'Analytics',
                description: 'Detailed reports and insights about your mess',
                icon: '📊',
              },
            ].map((feature, index) => (
              <Card key={index} className="p-6 border-border hover:shadow-lg transition">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Carousels */}
      <section className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-16">
          <CarouselSection title="Popular Messes" items={messesData} />
          <CarouselSection title="This Week&apos;s Menus" items={menusData} />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10 border-y border-border">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Ready to Simplify Your Mess Management?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of satisfied users and take control of your mess today.
          </p>
          <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold">
            <Link href="/register">Start Free Trial</Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  )
}
