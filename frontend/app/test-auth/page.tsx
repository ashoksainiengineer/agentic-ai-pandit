import { SignIn } from '@clerk/nextjs';
import '@/app/globals.css';

export default function SignInPage() {
    return (
        <main className="min-h-screen bg-[var(--prism-canvas)] flex items-center justify-center relative overflow-hidden">
            <div className="relative z-10 w-full max-w-md px-4">
                <SignIn
                    routing="path"
                    path="/sign-in"
                    signUpUrl="/sign-up"
                    fallbackRedirectUrl="/dashboard"
                />
            </div>
        </main>
    );
}
