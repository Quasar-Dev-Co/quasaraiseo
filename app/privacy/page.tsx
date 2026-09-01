export const metadata = {
  title: "Privacy Policy — Quasar AI SEO",
  description: "How Quasar AI SEO collects, uses, and protects your data.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-4xl font-black tracking-tight">Privacy Policy</h1>
        <p className="mt-2 text-sm text-slate-500">Last updated: {new Date().getFullYear()}</p>

        <div className="mt-10 space-y-8 text-[15px] leading-relaxed text-slate-700 dark:text-slate-300">
          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">1. Overview</h2>
            <p className="mt-3">
              Quasar AI SEO (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) is an SEO and content
              optimization platform accessible at https://seo.quasarasoft.com. This Privacy Policy
              explains what information we collect, how we use it, and the choices you have.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">2. Information We Collect</h2>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li><strong>Account information:</strong> Name, email address, and password (hashed) when you create an account.</li>
              <li><strong>API keys:</strong> OpenAI and OpenRouter API keys you provide to power AI features. These are stored securely and used only to make API calls on your behalf.</li>
              <li><strong>Website data:</strong> URLs, branding information, and WordPress site credentials you connect for auditing and publishing.</li>
              <li><strong>Generated content:</strong> Keyword research, reports, landing page designs, and AI-generated content stored in your account.</li>
              <li><strong>Usage data:</strong> Pages visited, features used, and interaction logs for improving the service.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">3. How We Use Your Information</h2>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>To provide SEO auditing, keyword research, content generation, and WordPress publishing features.</li>
              <li>To authenticate your identity and secure your account.</li>
              <li>To communicate with you about your account and service updates.</li>
              <li>To improve our features and user experience.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">4. Data Sharing</h2>
            <p className="mt-3">
              We do not sell your data. We share data only with third-party services necessary to operate the platform:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li><strong>OpenAI / OpenRouter:</strong> Your API keys are sent to these providers to generate AI content. We do not store their responses beyond what is needed for your account.</li>
              <li><strong>Google Sheets API:</strong> When you connect Google Sheets, we access your spreadsheets only with your explicit OAuth consent.</li>
              <li><strong>WordPress:</strong> When you connect a WordPress site, we publish content using your site token.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">5. Data Security</h2>
            <p className="mt-3">
              API keys and credentials are encrypted at rest. All communication uses HTTPS. Access to your data
              requires authentication with a valid JWT token. We follow industry best practices to protect your information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">6. Data Retention</h2>
            <p className="mt-3">
              Your data is retained as long as your account is active. You may request deletion of your account
              and all associated data at any time by contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">7. Your Rights</h2>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>Access your personal data</li>
              <li>Request correction or deletion of your data</li>
              <li>Export your data</li>
              <li>Revoke third-party access (Google, WordPress, AI providers) at any time</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">8. Cookies</h2>
            <p className="mt-3">
              We use essential cookies for authentication and session management. We do not use tracking
              or advertising cookies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">9. Contact</h2>
            <p className="mt-3">
              For privacy questions or data requests, contact us at{" "}
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
