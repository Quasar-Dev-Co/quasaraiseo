export const metadata = {
  title: "Terms of Service — Quasar AI SEO",
  description: "The terms and conditions for using Quasar AI SEO.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-4xl font-black tracking-tight">Terms of Service</h1>
        <p className="mt-2 text-sm text-slate-500">Last updated: {new Date().getFullYear()}</p>

        <div className="mt-10 space-y-8 text-[15px] leading-relaxed text-slate-700 dark:text-slate-300">
          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">1. Acceptance of Terms</h2>
            <p className="mt-3">
              By accessing or using Quasar AI SEO at https://seo.quasarasoft.com, you agree to be
              bound by these Terms of Service. If you do not agree, please do not use the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">2. Description of Service</h2>
            <p className="mt-3">
              Quasar AI SEO provides SEO tools including website auditing, keyword research, AI content
              generation, landing page design, WordPress publishing, and task management with Google Sheets
              integration.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">3. User Accounts</h2>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>You must provide accurate account information.</li>
              <li>You are responsible for keeping your password and API keys secure.</li>
              <li>You are responsible for all activity under your account.</li>
              <li>You must be at least 18 years old to use this service.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">4. Acceptable Use</h2>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>Do not use the service for illegal or unauthorized purposes.</li>
              <li>Do not attempt to access other users&apos; data or accounts.</li>
              <li>Do not abuse, overload, or disrupt the service.</li>
              <li>Do not use AI-generated content for spam, misinformation, or deceptive practices.</li>
              <li>You are responsible for the content you generate and publish through the platform.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">5. API Keys and Third-Party Services</h2>
            <p className="mt-3">
              You are responsible for the costs and usage associated with your own OpenAI and OpenRouter API keys.
              You are responsible for complying with the terms of any third-party services you connect, including
              Google Sheets and WordPress.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">6. Intellectual Property</h2>
            <p className="mt-3">
              You retain ownership of content you create using the platform. The platform, its design, code,
              and branding are the property of Quasar AI SEO. AI-generated content is provided for your use
              subject to the terms of the underlying AI provider.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">7. Disclaimers</h2>
            <p className="mt-3">
              The service is provided &ldquo;as is&rdquo; without warranties of any kind. AI-generated content
              may contain errors and should be reviewed before publishing. We do not guarantee specific SEO
              rankings or results.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">8. Limitation of Liability</h2>
            <p className="mt-3">
              Quasar AI SEO shall not be liable for any indirect, incidental, or consequential damages arising
              from the use of the service. Our total liability shall not exceed the amount you have paid us
              in the preceding 12 months.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">9. Termination</h2>
            <p className="mt-3">
              We may suspend or terminate your account for violations of these Terms. You may delete your
              account at any time.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">10. Changes to Terms</h2>
            <p className="mt-3">
              We may update these Terms from time to time. Continued use of the service after changes
              constitutes acceptance of the new Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">11. Contact</h2>
            <p className="mt-3">
              For questions about these Terms, contact us at{" "}
              <a href="mailto:info.pravas.cs@gmail.com" className="font-semibold text-blue-600 hover:underline">
                info.pravas.cs@gmail.com
              </a>
            </p>
          </section>
        </div>

        <div className="mt-12 border-t border-slate-200 pt-6 dark:border-white/10">
          <a href="/" className="text-sm font-bold text-blue-600 hover:underline">&larr; Back to Quasar AI SEO</a>
        </div>
      </div>
    </main>
  );
}
