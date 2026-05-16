'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import '@/app/prism-design-system.css';

interface Testimonial {
  quote: string;
  name: string;
  role: string;
  avatar?: string;
}

interface TestimonialsSectionProps {
  title: string;
  testimonials: Testimonial[];
}

function AvatarFallback({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div
      className="w-11 h-11 rounded-full prism-gradient-spectrum flex items-center justify-center text-white text-xs font-medium"
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}

export default function TestimonialsSection({
  title,
  testimonials,
}: TestimonialsSectionProps) {
  return (
    <section className="prism-section overflow-hidden">
      <div className="prism-container">
        {/* Section Header */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="font-prism font-light text-[3.125rem] leading-[1.11] tracking-[-0.04em] text-prism-ink text-center mb-prism-10"
        >
          {title}
        </motion.h2>
      </div>

      {/* Carousel — edge bleed, horizontal scroll */}
      <div className="relative">
        <div className="flex gap-prism-6 overflow-x-auto prism-scrollbar-hide px-prism-7 pb-2">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={`${testimonial.name}-${index}`}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{
                duration: 0.4,
                ease: 'easeOut',
                delay: index * 0.05,
              }}
              className="prism-testimonial flex flex-col justify-between"
            >
              <p className="font-prism text-sm font-normal text-prism-ink leading-relaxed mb-prism-8">
                &ldquo;{testimonial.quote}&rdquo;
              </p>

              <div className="flex items-center gap-prism-4">
                {testimonial.avatar ? (
                  <Image
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    width={44}
                    height={44}
                    className="rounded-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <AvatarFallback name={testimonial.name} />
                )}
                <div>
                  <p className="font-prism text-sm font-medium text-prism-ink">
                    {testimonial.name}
                  </p>
                  <p className="font-prism text-[13px] font-normal text-prism-slate">
                    {testimonial.role}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
