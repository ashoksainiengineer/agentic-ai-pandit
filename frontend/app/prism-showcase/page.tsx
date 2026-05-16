/**
 * Prism Design System Showcase Page
 * Demonstrates all components and sections of the "Prism on white stationery" design system.
 */

'use client';
import Header from '@/components/prism/Header';
import Footer from '@/components/prism/Footer';
import HeroSection from '@/components/prism/HeroSection';
import FeaturesSection from '@/components/prism/FeaturesSection';
import TestimonialsSection from '@/components/prism/TestimonialsSection';
import PricingSection from '@/components/prism/PricingSection';
import CTASection from '@/components/prism/CTASection';
import Container from '@/components/prism/Container';
import Section from '@/components/prism/Section';
import Button from '@/components/prism/Button';
import Card from '@/components/prism/Card';
import Input from '@/components/prism/Input';
import Badge from '@/components/prism/Badge';
import Pill from '@/components/prism/Pill';
import {
  Zap,
  Shield,
  Sparkles,
  BarChart3,
  Globe,
  Lock,
} from 'lucide-react';

/* ──────────────────────────────────────────────────────────────────────────────
   SAMPLE DATA
   ────────────────────────────────────────────────────────────────────────────── */

const navItems = [
  { label: 'Features', href: '#features' },
  { label: 'Testimonials', href: '#testimonials' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Components', href: '#components' },
];

const features = [
  {
    icon: Zap,
    title: 'Lightning Fast',
    description:
      'Experience sub-second response times with our optimized edge infrastructure.',
    tab: 'Performance',
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description:
      'Bank-grade encryption and compliance certifications keep your data safe.',
    tab: 'Security',
  },
  {
    icon: Sparkles,
    title: 'AI-Powered Insights',
    description:
      'Leverage machine learning to uncover patterns and drive smarter decisions.',
    tab: 'AI',
  },
  {
    icon: BarChart3,
    title: 'Real-time Analytics',
    description:
      'Monitor every metric that matters with live dashboards and alerts.',
    tab: 'Analytics',
  },
  {
    icon: Globe,
    title: 'Global CDN',
    description:
      'Deploy at the edge with 200+ locations worldwide for minimal latency.',
    tab: 'Performance',
  },
  {
    icon: Lock,
    title: 'Access Control',
    description:
      'Granular permissions and SSO integration for your entire organization.',
    tab: 'Security',
  },
];

const testimonials = [
  {
    quote:
      'The most elegant design system we have ever implemented. Every detail feels intentional.',
    name: 'Sarah Chen',
    role: 'Design Lead, Vercel',
    avatar: undefined,
  },
  {
    quote:
      'Our development velocity increased 3x after adopting the Prism components. Truly remarkable.',
    name: 'Marcus Johnson',
    role: 'Engineering Director, Linear',
    avatar: undefined,
  },
  {
    quote:
      'The frosted glass aesthetic is subtle yet distinctive. It elevates our entire product.',
    name: 'Elena Rodriguez',
    role: 'Product Designer, Figma',
    avatar: undefined,
  },
  {
    quote:
      'Finally, a design system that respects whitespace and typography. Pure craftsmanship.',
    name: 'James Park',
    role: 'CTO, Notion',
    avatar: undefined,
  },
  {
    quote:
      'Implementation was seamless. The documentation and component API are world-class.',
    name: 'Aisha Patel',
    role: 'Frontend Engineer, Stripe',
    avatar: undefined,
  },
];

const pricingPlans = [
  {
    name: 'Starter',
    price: '$0',
    period: '/month',
    features: [
      'Up to 3 projects',
      'Community support',
      'Basic analytics',
      '1 team member',
    ],
    featured: false,
    ctaLabel: 'Get Started',
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/month',
    features: [
      'Unlimited projects',
      'Priority support',
      'Advanced analytics',
      '10 team members',
      'Custom integrations',
      'SSO authentication',
    ],
    featured: true,
    ctaLabel: 'Start Free Trial',
  },
  {
    name: 'Enterprise',
    price: '$99',
    period: '/month',
    features: [
      'Everything in Pro',
      'Dedicated support',
      'SLA guarantee',
      'Unlimited members',
      'Custom contracts',
      'On-premise option',
    ],
    featured: false,
    ctaLabel: 'Contact Sales',
  },
];

/* ──────────────────────────────────────────────────────────────────────────────
   COMPONENT SHOWCASE DATA
   ────────────────────────────────────────────────────────────────────────────── */

const componentExamples = [
  {
    title: 'Buttons',
    description: 'Three variants with consistent hover and active states.',
    content: (
      <div className="flex flex-wrap items-center gap-4">
        <Button variant="filled">Filled Button</Button>
        <Button variant="ghost">Ghost Button</Button>
        <Button variant="soft">Soft Button</Button>
        <Button variant="filled" loading>
          Loading
        </Button>
        <Button variant="filled" disabled>
          Disabled
        </Button>
      </div>
    ),
  },
  {
    title: 'Cards',
    description: 'Frosted glass cards with configurable padding and hover effects.',
    content: (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card padding="sm">
          <h4 className="font-medium text-black mb-2">Small Padding</h4>
          <p className="text-sm text-black/60">
            Compact card for tight spaces and dense layouts.
          </p>
        </Card>
        <Card padding="md" hover>
          <h4 className="font-medium text-black mb-2">Medium + Hover</h4>
          <p className="text-sm text-black/60">
            Standard card with subtle lift on hover interaction.
          </p>
        </Card>
        <Card padding="lg">
          <h4 className="font-medium text-black mb-2">Large Padding</h4>
          <p className="text-sm text-black/60">
            Spacious card for featured content and highlights.
          </p>
        </Card>
      </div>
    ),
  },
  {
    title: 'Badges & Pills',
    description: 'Status indicators and category filters.',
    content: (
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="neutral">Neutral</Badge>
          <Badge variant="spectrum">Spectrum</Badge>
          <Badge variant="dark">Dark</Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Pill active>All</Pill>
          <Pill>Design</Pill>
          <Pill>Engineering</Pill>
          <Pill>Product</Pill>
          <Pill>Marketing</Pill>
        </div>
      </div>
    ),
  },
  {
    title: 'Inputs',
    description: 'Form controls with frosted glass styling.',
    content: (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
        <Input label="Full Name" placeholder="Enter your name" />
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          error="Please enter a valid email address"
        />
        <Input
          label="Password"
          type="password"
          placeholder="Min 8 characters"
          helperText="Must include uppercase, lowercase, and a number"
        />
        <Input label="Company" placeholder="Acme Inc." disabled />
      </div>
    ),
  },
];

/* ──────────────────────────────────────────────────────────────────────────────
   PAGE COMPONENT
   ────────────────────────────────────────────────────────────────────────────── */

export default function PrismShowcasePage() {
  return (
    <div className="min-h-screen bg-[var(--prism-canvas)] font-sans">
      {/* Import design system styles */}
      <style jsx global>{`
        @import url('./globals.css');
      `}</style>

      {/* Header */}
      <Header
        logo={
          <span className="text-xl font-medium text-black tracking-tight">
            Prism
          </span>
        }
        navItems={navItems}
        ctaLabel="Get Started"
        ctaHref="#pricing"
      />

      {/* Hero */}
      <HeroSection
        subtitle="Design System Showcase"
        title="Prism on white stationery"
        description="A light, minimal design system where color refracts from a nearly monochrome surface. Every element is intentional, every interaction is polished."
        ctaLabel="Explore Components"
        ctaHref="#components"
        showMockup
      />

      {/* Features */}
      <div id="features">
        <FeaturesSection
          title="Built for precision"
          subtitle="Every component follows strict design constraints"
          features={features}
        />
      </div>

      {/* Testimonials */}
      <div id="testimonials">
        <TestimonialsSection
          title="Loved by teams"
          testimonials={testimonials}
        />
      </div>

      {/* Pricing */}
      <div id="pricing">
        <PricingSection
          title="Simple, transparent pricing"
          subtitle="Start free, scale as you grow"
          plans={pricingPlans}
        />
      </div>

      {/* Component Showcase */}
      <div id="components">
        <Section size="lg">
          <Container>
            <div className="text-center mb-prism-12">
              <h2 className="text-[3.125rem] font-light text-black leading-[1.18] tracking-[-0.04em]">
                Component Library
              </h2>
              <p className="mt-4 text-lg font-normal text-black/60 max-w-2xl mx-auto">
                Explore the full set of primitives, layouts, and patterns that
                make up the Prism design system.
              </p>
            </div>

            <div className="flex flex-col gap-prism-12">
              {componentExamples.map((example) => (
                <Card key={example.title} padding="lg">
                  <div className="mb-6">
                    <h3 className="text-[1.375rem] font-medium text-black leading-[1.25] tracking-[-0.02em]">
                      {example.title}
                    </h3>
                    <p className="mt-1 text-base font-normal text-black/60">
                      {example.description}
                    </p>
                  </div>
                  {example.content}
                </Card>
              ))}
            </div>
          </Container>
        </Section>
      </div>

      {/* CTA */}
      <CTASection
        title="Ready to get started?"
        subtitle="Join thousands of teams building with Prism."
        ctaLabel="Start Building"
        ctaHref="#"
      />

      {/* Footer */}
      <Footer
        columns={[
          {
            title: 'Product',
            links: [
              { label: 'Features', href: '#' },
              { label: 'Pricing', href: '#' },
              { label: 'Changelog', href: '#' },
              { label: 'Roadmap', href: '#' },
            ],
          },
          {
            title: 'Resources',
            links: [
              { label: 'Documentation', href: '#' },
              { label: 'Components', href: '#' },
              { label: 'Design Tokens', href: '#' },
              { label: 'Templates', href: '#' },
            ],
          },
          {
            title: 'Company',
            links: [
              { label: 'About', href: '#' },
              { label: 'Blog', href: '#' },
              { label: 'Careers', href: '#' },
              { label: 'Contact', href: '#' },
            ],
          },
          {
            title: 'Legal',
            links: [
              { label: 'Privacy', href: '#' },
              { label: 'Terms', href: '#' },
              { label: 'Security', href: '#' },
              { label: 'Cookies', href: '#' },
            ],
          },
        ]}
        copyright="2026 Prism Design System. All rights reserved."
      />
    </div>
  );
}
