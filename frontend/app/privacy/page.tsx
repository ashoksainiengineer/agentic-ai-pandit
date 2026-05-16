import { Metadata } from 'next';
import {
  Shield,
  Lock,
  Eye,
  Database,
  Trash2,
  FileText,
  Server,
  Key,
  Cpu,
  UserX,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import Layout from '@/components/Layout';

export const metadata: Metadata = {
  title: 'Privacy Policy | AI Pandit',
  description:
    'Learn how AI Pandit protects your personal data and birth information with military-grade encryption and AI anonymization.',
};

export default function PrivacyPage() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* ── Hero ─────────────────────────────────────────────── */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-black/[0.08] rounded-full text-xs font-medium text-black/60 tracking-wider mb-6">
            <Shield className="w-3.5 h-3.5" />
            DATA PROTECTION
          </div>
          <h1 className="text-3xl sm:text-4xl font-medium text-black mb-4">
            Privacy Policy
          </h1>
          <p className="text-sm text-black/60 max-w-2xl mx-auto leading-relaxed">
            Your trust is our highest priority. We employ military-grade encryption, strict
            anonymization for AI processing, and transparent data protection practices to safeguard
            your personal and astrological information.
          </p>
        </div>

        {/* ── Sections ─────────────────────────────────────────── */}
        <div className="space-y-6">
          {/* End-to-End Encryption */}
          <section className="bg-white rounded-2xl p-6 md:p-8 border border-black/[0.06]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#184131]/10 flex items-center justify-center">
                <Lock className="w-5 h-5 text-[#184131]" />
              </div>
              <h2 className="text-xl font-semibold text-black">End-to-End Encryption</h2>
            </div>
            <p className="text-sm text-black/60 leading-relaxed mb-4">
              All your personal data is protected with AES-256 end-to-end encryption. We use your
              unique authentication key to encrypt sensitive information, ensuring:
            </p>
            <ul className="space-y-2 text-sm text-black/60">
              {[
                'Your data is encrypted before storage in our database',
                'Only you can decrypt and access your information',
                'Even our team cannot access your decrypted data',
                'Encryption keys are never stored alongside encrypted data',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-[#184131] mt-0.5">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* AI Processing & Anonymization */}
          <section className="bg-white rounded-2xl p-6 md:p-8 border border-black/[0.06]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-black/[0.04] flex items-center justify-center">
                <Cpu className="w-5 h-5 text-black" />
              </div>
              <h2 className="text-xl font-semibold text-black">AI Processing & Data Anonymization</h2>
            </div>

            <div className="p-4 bg-black/[0.03] border border-black/[0.06] rounded-xl mb-6">
              <p className="text-sm text-black">
                <strong>Critical Privacy Protection:</strong> We use advanced anonymization
                techniques to ensure your personally identifiable information (PII) is never exposed
                to AI systems or third-party AI providers.
              </p>
            </div>

            <h3 className="font-semibold text-black mb-3 flex items-center gap-2">
              <UserX className="w-4 h-4" />
              How We Anonymize Your Data
            </h3>
            <p className="text-sm text-black/60 leading-relaxed mb-4">
              Before any data is sent to AI systems for birth time rectification analysis, we
              automatically remove personally identifiable information (PII) from your data:
            </p>
            <ul className="space-y-2 text-sm text-black/60 mb-6">
              {[
                { label: 'Names', desc: 'Real names are replaced with [REDACTED_NAME] markers' },
                { label: 'Spouse Name', desc: 'Removed or replaced with [REDACTED_NAME]' },
                { label: 'Birth Place Names', desc: 'Only coordinates (latitude/longitude) are sent to AI' },
                { label: 'Emails & Phones', desc: 'Replaced with [REDACTED_EMAIL] and [REDACTED_PHONE]' },
              ].map((item) => (
                <li key={item.label} className="flex items-start gap-2">
                  <span className="text-black mt-0.5">→</span>
                  <span>
                    <strong>{item.label}:</strong> {item.desc}
                  </span>
                </li>
              ))}
            </ul>

            <h3 className="font-semibold text-black mb-3">Explicit Consent Required</h3>
            <p className="text-sm text-black/60 leading-relaxed mb-4">
              Before any AI analysis begins, you must provide explicit consent. You will see a clear
              modal explaining:
            </p>
            <ul className="space-y-2 text-sm text-black/60">
              {[
                'Exactly what astrological data will be analyzed by AI',
                'That your name and PII will be anonymized before processing',
                'Which third-party AI providers may process your anonymized data',
                'That AI providers do not retain or train models on your data',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-[#184131] mt-0.5 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6 p-4 bg-[#184131]/5 border border-[#184131]/10 rounded-xl">
              <p className="text-sm text-[#184131]">
                <strong>You control your data:</strong> You can decline AI processing and request
                deletion of your data at any time through your dashboard.
              </p>
            </div>
          </section>

          {/* Data Shared with AI Systems */}
          <section className="bg-white rounded-2xl p-6 md:p-8 border border-black/[0.06]">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#6366f1]/10 flex items-center justify-center">
                <Database className="w-5 h-5 text-[#6366f1]" />
              </div>
              <h2 className="text-xl font-semibold text-black">Data Shared with AI Systems</h2>
            </div>
            <p className="text-sm text-black/60 leading-relaxed mb-6">
              When you provide consent for AI analysis, only the following anonymized data is
              transmitted to our AI providers:
            </p>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="bg-[#184131]/5 rounded-xl p-5 border border-[#184131]/10">
                <h3 className="font-semibold text-[#184131] mb-4 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Data Sent to AI (Anonymized)
                </h3>
                <ul className="space-y-3 text-sm text-black/80">
                  {[
                    { bold: 'Skyfield Calculations:', text: 'Planetary positions, house cusps, degrees, nakshatras' },
                    { bold: 'Dasha Periods:', text: 'Vimshottari, Yogini, and Chara dasha calculations' },
                    { bold: 'Divisional Charts:', text: 'Navamsa (D9), Dasamsa (D10), and other varga charts' },
                    { bold: 'Life Events:', text: 'Dates, categories, importance levels (descriptions anonymized)' },
                    { bold: 'Birth Profile Data:', text: 'Astrological birth parameters mapped to astrological indicators' },
                    { bold: 'Transit Data:', text: 'Planetary transits for event dates' },
                    { bold: 'Anonymous ID:', text: 'Pseudonym replacing your real name' },
                  ].map((item) => (
                    <li key={item.bold} className="flex items-start gap-2">
                      <span className="text-[#184131] mt-0.5">✓</span>
                      <span>
                        <strong>{item.bold}</strong> {item.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-red-50 rounded-xl p-5 border border-red-100">
                <h3 className="font-semibold text-red-700 mb-4 flex items-center gap-2">
                  <XCircle className="w-4 h-4" />
                  Data NEVER Sent to AI
                </h3>
                <ul className="space-y-3 text-sm text-black/80">
                  {[
                    { bold: 'Your Real Name:', text: 'Always anonymized before AI processing' },
                    { bold: 'Spouse Name:', text: 'Removed or anonymized' },
                    { bold: 'Birth Place Names:', text: 'Only coordinates sent' },
                    { bold: 'Email Address:', text: 'Never shared with AI systems' },
                    { bold: 'Health Information:', text: 'Medical conditions and health details excluded' },
                    { bold: 'Financial Details:', text: 'Income, investments, specific amounts excluded' },
                    { bold: 'IP Address:', text: 'Not transmitted to AI providers' },
                  ].map((item) => (
                    <li key={item.bold} className="flex items-start gap-2">
                      <span className="text-red-500 mt-0.5">✗</span>
                      <span>
                        <strong>{item.bold}</strong> {item.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
              <p className="text-sm text-amber-800">
                <strong>Important:</strong> All data sent to AI systems is processed in real-time for
                analysis only. AI providers (Groq with GPT-OSS-120B, or DeepSeek via OpenRouter) do
                not retain, store, or use your data for model training. Processing is ephemeral and
                stateless.
              </p>
            </div>
          </section>

          {/* Third-Party AI Providers */}
          <section className="bg-white rounded-2xl p-6 md:p-8 border border-black/[0.06]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#06b6d4]/10 flex items-center justify-center">
                <Server className="w-5 h-5 text-[#06b6d4]" />
              </div>
              <h2 className="text-xl font-semibold text-black">Third-Party AI Providers</h2>
            </div>
            <p className="text-sm text-black/60 leading-relaxed mb-4">
              We use multiple AI providers for birth time rectification analysis. Based on
              configuration, your anonymized data may be processed by one of the following providers:
            </p>
            <div className="space-y-4">
              {[
                {
                  name: 'Groq (Primary Provider)',
                  items: [
                    'Model: GPT-OSS-120B (open-source, 120 billion parameters)',
                    'Processes anonymized astrological data only',
                    'No access to your real name, email, or PII',
                    'Does not train models on your data',
                    'Ultra-fast inference with low latency',
                    'Privacy Policy: groq.com/privacy',
                  ],
                },
                {
                  name: 'OpenRouter (Alternative Gateway)',
                  items: [
                    'Routes anonymized requests to various AI models (including DeepSeek)',
                    'Does not store request content or responses',
                    'Provides model failover and routing optimization',
                    'Privacy Policy: openrouter.ai/privacy',
                  ],
                },
                {
                  name: 'DeepSeek (via OpenRouter)',
                  items: [
                    'Model: DeepSeek V3 / Reasoner (when configured via OpenRouter)',
                    'Processes anonymized astrological data only',
                    'No access to your real name, email, or PII',
                    'Does not train models on your data',
                    'Data retention: Ephemeral (not stored)',
                    'Privacy Policy: deepseek.com/privacy',
                  ],
                },
              ].map((provider) => (
                <div key={provider.name} className="p-4 bg-black/[0.02] rounded-xl border border-black/[0.04]">
                  <h4 className="font-semibold text-black mb-2">{provider.name}</h4>
                  <ul className="space-y-1 text-sm text-black/60">
                    {provider.items.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-black/[0.02] border border-black/[0.06] rounded-xl">
              <p className="text-sm text-black/70">
                <strong>Data Processing Agreement:</strong> All third-party providers are bound by
                data processing agreements that prohibit retention, sale, or secondary use of your
                data. They may only process data for the specific purpose of generating your birth
                time rectification analysis.
              </p>
            </div>
          </section>

          {/* Data We Collect - Detailed Table */}
          <section className="bg-white rounded-2xl p-6 md:p-8 border border-black/[0.06]">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#3b82f6]/10 flex items-center justify-center">
                <Database className="w-5 h-5 text-[#3b82f6]" />
              </div>
              <h2 className="text-xl font-semibold text-black">Data We Collect & Store</h2>
            </div>
            <p className="text-sm text-black/60 leading-relaxed mb-6">
              We collect only the information necessary for birth time rectification. Below is a
              complete breakdown of what data we store and how it&apos;s protected:
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-black/[0.03] border-b border-black/[0.06]">
                    <th className="text-left p-3 font-semibold text-black">Data Category</th>
                    <th className="text-left p-3 font-semibold text-black">Fields</th>
                    <th className="text-left p-3 font-semibold text-black">Storage</th>
                    <th className="text-left p-3 font-semibold text-black">Sent to AI</th>
                    <th className="text-left p-3 font-semibold text-black">Encrypted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.04]">
                  {[
                    ['Birth Information', 'Full Name, Date of Birth, Birth Time', 'Database', 'Anonymized', '✓ AES-256'],
                    ['Location Coordinates', 'Latitude, Longitude, Timezone', 'Database', 'Yes', 'Plain (needed for calculations)'],
                    ['Personal Traits', 'Height, Build, Complexion, Eye Color, Hair Type', 'Database', 'Yes', '✓ AES-256'],
                    ['Birth Profile Data', 'Facial Structure, Psychographic, Biological, Family Details', 'Database', 'Yes', '✓ AES-256'],
                    ['Life Events', 'Category, Date, Description, Importance, Time Precision', 'Database', 'Anonymized', '✓ AES-256'],
                    ['Spouse Data', 'Name, Date of Birth, Birth Time, Birth Place', 'Database', 'No', '✓ AES-256'],
                    ['Analysis Settings', 'Time Offset Preset, Custom Minutes', 'Database', 'Yes', 'Plain'],
                    ['Account Info', 'Email, Full Name (from Clerk authentication)', 'Database', 'No', 'Plain'],
                    ['Consent Records', 'AI Consent Status, Timestamp, IP Address', 'Database', 'No', '✓ AES-256'],
                  ].map((row) => (
                    <tr key={row[0]}>
                      <td className="p-3 text-black/70 font-medium">{row[0]}</td>
                      <td className="p-3 text-black/60">{row[1]}</td>
                      <td className="p-3">
                        <span className="px-2 py-1 bg-[#3b82f6]/10 text-[#3b82f6] rounded-md text-xs font-medium">
                          {row[2]}
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-1 rounded-md text-xs font-medium ${
                            row[3] === 'No'
                              ? 'bg-red-50 text-red-600'
                              : row[3] === 'Anonymized'
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-[#184131]/10 text-[#184131]'
                          }`}
                        >
                          {row[3]}
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-1 rounded-md text-xs font-medium ${
                            row[4].startsWith('✓')
                              ? 'bg-[#184131]/10 text-[#184131]'
                              : 'bg-black/[0.04] text-black/50'
                          }`}
                        >
                          {row[4]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 p-4 bg-amber-50 border border-amber-100 rounded-xl">
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> Only location coordinates (latitude/longitude) and analysis
                settings are stored unencrypted, as they are required for astrological calculations.
                All personal identifying information is always encrypted. Data marked
                &quot;Anonymized&quot; for AI is stripped of PII before transmission.
              </p>
            </div>
          </section>

          {/* How We Use Your Data */}
          <section className="bg-white rounded-2xl p-6 md:p-8 border border-black/[0.06]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#6366f1]/10 flex items-center justify-center">
                <Eye className="w-5 h-5 text-[#6366f1]" />
              </div>
              <h2 className="text-xl font-semibold text-black">How We Use Your Data</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { title: 'Birth Time Rectification', desc: 'Your anonymized birth data and life events are analyzed by our AI to determine your precise birth time.' },
                { title: 'Session Management', desc: 'Your draft data is saved so you can resume your analysis later.' },
                { title: 'Account Authentication', desc: 'Email and name from Clerk are used for login and account identification only.' },
                { title: 'What We DON\'T Do', desc: 'We never sell, share, or use your data for advertising or third-party analytics.' },
              ].map((item) => (
                <div key={item.title} className="p-4 bg-black/[0.02] rounded-xl border border-black/[0.04]">
                  <h3 className="font-semibold text-black mb-2">{item.title}</h3>
                  <p className="text-sm text-black/60">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Technical Security */}
          <section className="bg-white rounded-2xl p-6 md:p-8 border border-black/[0.06]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-black/[0.04] flex items-center justify-center">
                <Server className="w-5 h-5 text-black" />
              </div>
              <h2 className="text-xl font-semibold text-black">Technical Security Measures</h2>
            </div>
            <div className="space-y-4">
              {[
                {
                  icon: Key,
                  title: 'Encryption at Rest',
                  desc: 'All database storage uses AES-256 encryption. Encryption keys are derived from your unique Clerk authentication ID.',
                },
                {
                  icon: Shield,
                  title: 'Secure Infrastructure',
                  desc: 'Data is stored in Neon Postgres databases with industry-leading security practices, regular audits, and penetration testing.',
                },
                {
                  icon: Lock,
                  title: 'Secure Transmission',
                  desc: 'All data transmitted between your browser and our servers uses TLS 1.3 encryption (HTTPS).',
                },
                {
                  icon: UserX,
                  title: 'AI Anonymization Layer',
                  desc: 'Before any data reaches AI systems, our anonymization engine removes all PII and replaces names with pseudonyms.',
                },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-3">
                  <item.icon className="w-5 h-5 text-black mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-black">{item.title}</h4>
                    <p className="text-sm text-black/60">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Data Retention */}
          <section className="bg-white rounded-2xl p-6 md:p-8 border border-black/[0.06]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#f97316]/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-[#f97316]" />
              </div>
              <h2 className="text-xl font-semibold text-black">Data Retention</h2>
            </div>
            <p className="text-sm text-black/60 leading-relaxed mb-4">
              We retain your data only as long as necessary:
            </p>
            <ul className="space-y-2 text-sm text-black/60">
              {[
                { bold: 'Active Sessions:', text: 'Stored indefinitely until you delete them' },
                { bold: 'Completed Analyses:', text: 'Retained for 7 years (for your reference)' },
                { bold: 'Deleted Data:', text: 'Permanently removed within 30 days of deletion request' },
                { bold: 'AI Processing Logs:', text: 'Ephemeral only — no retention by AI providers' },
                { bold: 'Consent Records:', text: 'Retained for 3 years for legal compliance' },
                { bold: 'Audit Logs:', text: 'Kept for 1 year for security purposes' },
              ].map((item) => (
                <li key={item.bold} className="flex items-start gap-2">
                  <span className="text-[#f97316] mt-0.5">•</span>
                  <span>
                    <strong>{item.bold}</strong> {item.text}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* Your Rights */}
          <section className="bg-white rounded-2xl p-6 md:p-8 border border-black/[0.06]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <h2 className="text-xl font-semibold text-black">Your Rights (GDPR, CCPA & DPDP)</h2>
            </div>
            <p className="text-sm text-black/60 leading-relaxed mb-4">
              You have complete control over your personal data:
            </p>
            <div className="grid md:grid-cols-2 gap-3">
              {[
                { bold: 'Right to Access:', text: 'Request a copy of all your data' },
                { bold: 'Right to Rectification:', text: 'Update inaccurate information' },
                { bold: 'Right to Erasure:', text: 'Delete all your data permanently' },
                { bold: 'Right to Portability:', text: 'Export your data' },
                { bold: 'Right to Restrict Processing:', text: 'Pause data usage' },
                { bold: 'Right to Object:', text: 'Opt-out of AI processing' },
                { bold: 'Right to Withdraw Consent:', text: 'Revoke AI processing consent anytime' },
                { bold: 'Right to Explanation:', text: 'Understand how AI uses your data' },
              ].map((item) => (
                <div key={item.bold} className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">✓</span>
                  <span className="text-sm text-black/60">
                    <strong>{item.bold}</strong> {item.text}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-black/60">
              To exercise any of these rights, contact us at{' '}
              <a href="mailto:app.aipandit@gmail.com" className="text-black hover:underline font-medium">
                app.aipandit@gmail.com
              </a>{' '}
              or use the delete option in your dashboard.
            </p>
          </section>

          {/* Legal Compliance */}
          <section className="bg-white rounded-2xl p-6 md:p-8 border border-black/[0.06]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-black/[0.04] flex items-center justify-center">
                <Shield className="w-5 h-5 text-black" />
              </div>
              <h2 className="text-xl font-semibold text-black">Legal Compliance</h2>
            </div>
            <p className="text-sm text-black/60 leading-relaxed mb-4">
              Our data processing practices comply with major global privacy regulations:
            </p>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { title: 'GDPR (EU)', desc: 'Full compliance with EU data protection standards. We process data on the basis of explicit consent and legitimate interest.' },
                { title: 'CCPA (California)', desc: 'California residents have the right to know what data is collected and request deletion.' },
                { title: 'DPDP (India)', desc: 'Compliant with India\'s Digital Personal Data Protection Act, 2023.' },
              ].map((item) => (
                <div key={item.title} className="p-4 bg-black/[0.02] rounded-xl border border-black/[0.04]">
                  <h4 className="font-semibold text-black mb-2">{item.title}</h4>
                  <p className="text-sm text-black/60">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Contact */}
          <section className="bg-white rounded-2xl p-6 md:p-8 border border-black/[0.06]">
            <h2 className="text-xl font-semibold text-black mb-4">Questions About Privacy?</h2>
            <p className="text-sm text-black/60 mb-4">
              If you have any questions about our privacy practices, AI data processing, or would
              like to exercise your data rights, please contact our Data Protection Officer:
            </p>
            <a
              href="mailto:app.aipandit@gmail.com"
              className="inline-flex items-center gap-2 text-black hover:text-black/60 transition-colors font-medium text-sm"
            >
              app.aipandit@gmail.com
            </a>
          </section>
        </div>

        {/* Last Updated */}
        <p className="text-center text-xs text-black/40 mt-12">
          Last updated: January 2026 | Version 3.0 (AI Processing Update)
        </p>
      </div>
    </Layout>
  );
}
