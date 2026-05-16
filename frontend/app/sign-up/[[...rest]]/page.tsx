// app/sign-up/[[...sign-up]]/page.tsx
// Clerk Sign Up Page — Light Theme Design System

import { SignUp } from '@clerk/nextjs';
import Link from 'next/link';

export default function SignUpPage() {
    return (
        <main className="min-h-screen bg-[var(--prism-canvas)] flex items-center justify-center relative overflow-hidden">
            {/* Logo — matches Navbar */}
            <Link href="/" className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-3 group z-20">
                <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-lg font-medium leading-none">ॐ</span>
                </div>
                <span className="text-xl font-medium text-black tracking-[-0.02em]">
                    AI Pandit
                </span>
            </Link>

            <div className="relative z-10 w-full max-w-md px-4 mt-8">
                <SignUp
                    appearance={{
                        variables: {
                            colorPrimary: '#000000',
                            colorBackground: '#FFFFFF',
                            colorInputBackground: '#FAFAFA',
                            colorInputText: '#000000',
                            colorText: '#000000',
                            colorTextSecondary: '#636363',
                            colorNeutral: '#d9d9d9',
                            colorDanger: '#C65D3B',
                            colorSuccess: '#184131',
                            borderRadius: '20px',
                        },
                        elements: {
                            rootBox: 'mx-auto w-full',
                            card: 'bg-white border border-[#d9d9d9] shadow-sm rounded-2xl overflow-hidden',

                            // Header
                            header: 'p-6 pb-4',
                            headerTitle: 'text-black font-medium text-2xl mb-1',
                            headerSubtitle: 'text-[#636363] text-sm',

                            // Form
                            form: 'p-6 pt-2',
                            formButtonPrimary: 'w-full bg-black hover:bg-black/80 text-white font-medium py-3 rounded-xl transition-all',

                            // Input fields
                            formFieldLabel: 'text-black text-sm font-medium mb-2 block',
                            formFieldInput: 'w-full bg-white border border-[#d9d9d9] text-black placeholder-[#636363] focus:border-black focus:ring-2 focus:ring-black/10 rounded-xl py-3 px-4 text-base outline-none transition-all',
                            formFieldInputShowPassword: 'text-[#636363] hover:text-black',
                            formFieldInputWrapper: 'relative',

                            // Required/Optional indicators
                            formFieldLabel__optional: 'hidden',

                            // Error/Success states
                            formFieldErrorText: 'text-[#C65D3B] text-xs mt-1 font-medium',
                            formFieldSuccessText: 'text-[#184131] text-xs mt-1 font-medium',
                            formFieldHintText: 'text-[#636363] text-xs mt-1',
                            alertText: 'text-[#C65D3B] text-sm',
                            alert: 'bg-red-50 border border-red-200 rounded-xl p-4 mb-4',

                            // Links
                            footer: 'p-6 pt-4 bg-[var(--prism-canvas)] border-t border-[#d9d9d9]',
                            footerAction: 'text-center text-sm text-[#636363]',
                            footerActionLink: 'text-black font-medium hover:text-black/70 transition-colors',

                            // Social buttons
                            socialButtonsBlockButton: 'w-full border border-[#d9d9d9] bg-white text-[#636363] hover:bg-[var(--prism-canvas)] hover:border-black/10 py-3 rounded-xl transition-all font-medium',
                            socialButtonsBlockButtonText: 'text-[#636363] font-medium',
                            socialButtonsProviderIcon: 'w-5 h-5',

                            // Divider
                            dividerLine: 'bg-[#d9d9d9]',
                            dividerText: 'text-[#636363] text-sm bg-white px-4',
                            dividerRow: 'my-4',

                            // Identity preview
                            identityPreview: 'bg-[var(--prism-canvas)] border border-[#d9d9d9] rounded-xl p-4 mb-4',
                            identityPreviewText: 'text-black',
                            identityPreviewEditButton: 'text-black font-medium hover:text-black/70',

                            // Other
                            formResendCodeLink: 'text-black font-medium hover:text-black/70',
                            otpCodeField: 'text-black text-xl font-medium text-center',
                            otpCodeFieldInput: 'bg-white border border-[#d9d9d9] rounded-xl text-black text-xl font-medium',
                        }
                    }}
                    routing="path"
                    path="/sign-up"
                    signInUrl="/sign-in"
                    fallbackRedirectUrl="/dashboard"
                />
            </div>

            {/* Footer */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-xs text-[#636363] z-10">
                <Link href="/" className="hover:text-black transition-colors">← Back to Home</Link>
            </div>
        </main>
    );
}
