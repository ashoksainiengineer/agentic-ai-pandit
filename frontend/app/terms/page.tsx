import { Metadata } from 'next';
import Link from 'next/link';
import {
  Scale,
  FileText,
  AlertCircle,
  BookOpen,
  Shield,
  Cpu,
  Globe,
  Ban,
  DollarSign,
  Brain,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import Layout from '@/components/Layout';

export const metadata: Metadata = {
  title: 'Terms of Service | AI Pandit',
  description:
    'Comprehensive terms and conditions for using AI Pandit birth time rectification services. Includes AI processing consent, privacy practices, and user responsibilities.',
};

export default function TermsPage() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* ── Hero ─────────────────────────────────────────────── */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-black/[0.08] rounded-full text-xs font-medium text-black/60 tracking-wider mb-6">
            <Scale className="w-3.5 h-3.5" />
            LEGAL
          </div>
          <h1 className="text-3xl sm:text-4xl font-medium text-black mb-4">Terms of Service</h1>
          <p className="text-sm text-black/60 max-w-2xl mx-auto leading-relaxed">
            Please read these terms carefully before using AI Pandit services. By using our
            platform, you agree to be bound by these terms.
          </p>
          <p className="text-xs text-black/40 mt-4">Last updated: January 31, 2026 | Version 3.0</p>
        </div>

        {/* ── Sections ─────────────────────────────────────────── */}
        <div className="space-y-6">
          {/* Introduction */}
          <section className="bg-white rounded-2xl p-6 md:p-8 border border-black/[0.06]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-black/[0.04] flex items-center justify-center">
                <FileText className="w-5 h-5 text-black" />
              </div>
              <h2 className="text-xl font-semibold text-black">Introduction & Acceptance</h2>
            </div>
            <p className="text-sm text-black/60 leading-relaxed mb-4">
              AI Pandit provides AI-powered birth time rectification services based on Vedic
              astrology principles. Our platform uses Skyfield ephemeris data and advanced machine
              learning algorithms to provide accurate astrological calculations.
            </p>
            <p className="text-sm text-black/60 leading-relaxed">
              By accessing or using AI Pandit, you agree to these Terms of Service and our{' '}
              <Link href="/privacy" className="text-black hover:underline font-medium">
                Privacy Policy
              </Link>
              . If you do not agree with any part of these terms, you may not use our services.
            </p>
          </section>

          {/* AI Processing Consent */}
          <section className="bg-white rounded-2xl p-6 md:p-8 border border-black/[0.06]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#6366f1]/10 flex items-center justify-center">
                <Brain className="w-5 h-5 text-[#6366f1]" />
              </div>
              <h2 className="text-xl font-semibold text-black">AI Processing Consent</h2>
            </div>
            <div className="bg-[#6366f1]/5 border border-[#6366f1]/10 rounded-xl p-4 mb-4">
              <p className="text-[#6366f1] font-semibold text-sm mb-2">Important Notice About AI Processing</p>
              <p className="text-sm text-black/70">
                Our birth time rectification service uses Artificial Intelligence to analyze your
                astrological data. By using our service, you explicitly consent to:
              </p>
            </div>
            <ul className="space-y-3 text-sm text-black/60">
              {[
                {
                  bold: 'Data Processing:',
                  text: 'Your birth data (date, time, coordinates) and life events will be processed by AI systems to perform astrological analysis.',
                },
                {
                  bold: 'Anonymization:',
                  text: 'Your name and exact location are anonymized before being sent to AI systems. Real names are replaced with [REDACTED_NAME] markers, emails with [REDACTED_EMAIL], and phone numbers with [REDACTED_PHONE].',
                },
                {
                  bold: 'Third-Party AI Providers:',
                  text: 'Your anonymized astrological data may be processed by Groq (GPT-OSS-120B) or via OpenRouter (DeepSeek). Both providers process your data solely for birth time rectification.',
                },
                {
                  bold: 'Data Exclusions:',
                  text: 'Health information is explicitly excluded from AI processing. Spouse names are anonymized; only birth data (DOB, time, coordinates) is shared for synastry analysis.',
                },
                {
                  bold: 'No Training Use:',
                  text: 'Your data is not used to train AI models or improve third-party AI services.',
                },
              ].map((item) => (
                <li key={item.bold} className="flex items-start gap-2">
                  <span className="text-[#6366f1] mt-0.5">✓</span>
                  <span>
                    <strong>{item.bold}</strong> {item.text}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-4 p-4 bg-amber-50 border border-amber-100 rounded-xl">
              <p className="text-sm text-amber-800">
                <strong>Withdrawal of Consent:</strong> You may withdraw your AI processing consent at
                any time by deleting your account or contacting us. This will prevent future analyses
                but will not affect completed analyses.
              </p>
            </div>
          </section>

          {/* Data Shared with AI */}
          <section className="bg-white rounded-2xl p-6 md:p-8 border border-black/[0.06]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#3b82f6]/10 flex items-center justify-center">
                <Cpu className="w-5 h-5 text-[#3b82f6]" />
              </div>
              <h2 className="text-xl font-semibold text-black">Data Shared with AI Systems</h2>
            </div>
            <p className="text-sm text-black/60 leading-relaxed mb-4">
              For transparency, here is exactly what data is shared with AI systems during analysis:
            </p>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div className="p-4 bg-[#184131]/5 border border-[#184131]/10 rounded-xl">
                <h4 className="font-semibold text-[#184131] mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Data That IS Shared
                </h4>
                <ul className="text-sm text-black/70 space-y-1.5">
                  <li>• Anonymized data with PII redacted ([REDACTED_NAME])</li>
                  <li>• Birth date, time, coordinates</li>
                  <li>• Life event dates & descriptions</li>
                  <li>• Spouse birth data (DOB/time/coords)</li>
                  <li>• Skyfield ephemeris calculations</li>
                  <li>• Anonymous user ID (pseudonym)</li>
                </ul>
              </div>
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
                <h4 className="font-semibold text-red-700 mb-3 flex items-center gap-2">
                  <XCircle className="w-4 h-4" />
                  Data That is NEVER Shared
                </h4>
                <ul className="text-sm text-black/70 space-y-1.5">
                  <li>• Your real name</li>
                  <li>• Exact address/location string</li>
                  <li>• Health conditions</li>
                  <li>• Spouse&apos;s real name</li>
                  <li>• Email address</li>
                  <li>• Phone number</li>
                </ul>
              </div>
            </div>

            <p className="text-sm text-black/60">
              All data shared with AI systems is anonymized and used solely for the purpose of birth
              time rectification. We do not share your data with AI providers for any other purpose.
            </p>
          </section>

          {/* Spiritual Guidance Disclaimer */}
          <section className="bg-white rounded-2xl p-6 md:p-8 border border-black/[0.06]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <h2 className="text-xl font-semibold text-black">Spiritual Guidance Disclaimer</h2>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-4">
              <p className="text-amber-800 font-semibold text-sm mb-2">Important Notice</p>
              <p className="text-sm text-amber-700">
                The birth time rectification and astrological analysis provided by AI Pandit are for
                spiritual guidance and informational purposes only. They should not be considered as:
              </p>
            </div>
            <ul className="space-y-2 text-sm text-black/60">
              {[
                'A substitute for professional astrological consultation',
                'Legal, medical, financial, or professional advice',
                'A basis for making critical life decisions without human consultation',
                'Scientific or factual predictions about future events',
                'A guarantee of specific results or outcomes',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-amber-600 mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-black/60">
              You acknowledge that astrology is a spiritual practice and results may vary. AI Pandit
              makes no warranties about the accuracy, reliability, or applicability of the analysis
              provided.
            </p>
          </section>

          {/* User Responsibilities */}
          <section className="bg-white rounded-2xl p-6 md:p-8 border border-black/[0.06]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#3b82f6]/10 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-[#3b82f6]" />
              </div>
              <h2 className="text-xl font-semibold text-black">User Responsibilities</h2>
            </div>
            <p className="text-sm text-black/60 leading-relaxed mb-4">When using AI Pandit, you agree to:</p>
            <ul className="space-y-2 text-sm text-black/60">
              {[
                'Provide accurate birth information to the best of your knowledge',
                'Use the service for lawful purposes only',
                'Respect the intellectual property rights of our platform',
                'Not attempt to reverse engineer, scrape, or misuse our AI systems',
                'Be at least 18 years of age or have parental consent',
                'Obtain consent from your spouse before entering their birth data',
                'Not use the service to process data about others without their consent',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-[#3b82f6] mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Data Accuracy & Limitations */}
          <section className="bg-white rounded-2xl p-6 md:p-8 border border-black/[0.06]">
            <h2 className="text-xl font-semibold text-black mb-4">Data Accuracy & Limitations</h2>
            <p className="text-sm text-black/60 leading-relaxed mb-4">
              While we strive for the highest accuracy in our calculations using Skyfield ephemeris
              data, please note:
            </p>
            <ul className="space-y-2 text-sm text-black/60">
              {[
                'Rectification results depend on the accuracy of provided life events',
                'AI analysis has inherent limitations and should be used as guidance',
                'Historical timezone and location data may have uncertainties',
                'Results are probabilistic, not deterministic',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-black mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Limitation of Liability */}
          <section className="bg-white rounded-2xl p-6 md:p-8 border border-black/[0.06]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <Shield className="w-5 h-5 text-red-500" />
              </div>
              <h2 className="text-xl font-semibold text-black">Limitation of Liability</h2>
            </div>
            <p className="text-sm text-black/60 leading-relaxed mb-4">
              To the fullest extent permitted by applicable law:
            </p>
            <ul className="space-y-2 text-sm text-black/60">
              {[
                'AI Pandit and its operators shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the service.',
                'Our total liability shall not exceed the amount you paid for the specific analysis that gave rise to the liability.',
                'We are not responsible for decisions you make based on our analysis.',
                'We do not guarantee continuous, uninterrupted, or secure access to our services.',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Refund Policy */}
          <section className="bg-white rounded-2xl p-6 md:p-8 border border-black/[0.06]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#10b981]/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-[#10b981]" />
              </div>
              <h2 className="text-xl font-semibold text-black">Payment & Refund Policy</h2>
            </div>
            <ul className="space-y-2 text-sm text-black/60">
              {[
                'All payments are processed securely through Razorpay.',
                'Once an analysis begins processing, refunds are not available as computational resources have been allocated.',
                'If technical issues prevent analysis completion, we will either reprocess at no charge or provide a full refund.',
                'Refund requests must be made within 7 days of payment.',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-[#10b981] mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Termination */}
          <section className="bg-white rounded-2xl p-6 md:p-8 border border-black/[0.06]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#f97316]/10 flex items-center justify-center">
                <Ban className="w-5 h-5 text-[#f97316]" />
              </div>
              <h2 className="text-xl font-semibold text-black">Termination & Suspension</h2>
            </div>
            <p className="text-sm text-black/60 leading-relaxed mb-4">
              We reserve the right to suspend or terminate your access to AI Pandit at our
              discretion, without notice, for conduct that we believe violates these terms or is
              harmful to other users, us, or third parties.
            </p>
            <p className="text-sm text-black/60 leading-relaxed">
              Upon termination, your right to use the service immediately ceases. Provisions of these
              terms that by their nature should survive termination shall survive.
            </p>
          </section>

          {/* Governing Law */}
          <section className="bg-white rounded-2xl p-6 md:p-8 border border-black/[0.06]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-black/[0.04] flex items-center justify-center">
                <Globe className="w-5 h-5 text-black" />
              </div>
              <h2 className="text-xl font-semibold text-black">Governing Law & Jurisdiction</h2>
            </div>
            <p className="text-sm text-black/60 leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of India.
              Any disputes arising under these terms shall be subject to the exclusive jurisdiction
              of the courts in Mumbai, Maharashtra, India.
            </p>
          </section>

          {/* Service Availability */}
          <section className="bg-white rounded-2xl p-6 md:p-8 border border-black/[0.06]">
            <h2 className="text-xl font-semibold text-black mb-4">Service Availability</h2>
            <p className="text-sm text-black/60 leading-relaxed">
              We aim to maintain high availability of our services, but we do not guarantee
              uninterrupted access. The service may be temporarily unavailable due to maintenance,
              updates, or factors beyond our control. Analysis processing times may vary based on
              system load.
            </p>
          </section>

          {/* Modifications */}
          <section className="bg-white rounded-2xl p-6 md:p-8 border border-black/[0.06]">
            <h2 className="text-xl font-semibold text-black mb-4">Modifications to Terms</h2>
            <p className="text-sm text-black/60 mb-4">
              We may update these terms from time to time. We will notify users of significant
              changes via email or through our platform. Continued use of the service after changes
              constitutes acceptance of the updated terms.
            </p>
            <p className="text-sm text-black/60">
              For questions about these terms, please contact us at{' '}
              <a
                href="mailto:app.aipandit@gmail.com"
                className="text-black hover:text-black/60 transition-colors font-medium"
              >
                app.aipandit@gmail.com
              </a>
            </p>
          </section>
        </div>

        {/* Copyright */}
        <p className="text-center text-xs text-black/40 mt-12">© 2026 AI Pandit. All rights reserved.</p>
      </div>
    </Layout>
  );
}
