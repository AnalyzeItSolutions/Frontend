import type { Metadata } from 'next';
import { LegalLayout, LegalSection } from '../Components/legal/LegalLayout';

export const metadata: Metadata = {
  title: 'Security — AnalyzeIt',
  description: 'How AnalyzeIt protects accounts, credentials, and workspace data.',
};

export default function SecurityPage() {
  return (
    <LegalLayout title="Security" updated="October 25, 2026">
      <p>
        AnalyzeIt is built so that product features stay behind an account, credentials stay
        scoped, and workspace data is only loaded for the signed-in user.
      </p>

      <LegalSection title="1. Account gate">
        <p>
          Middleware on the AnalyzeIt site redirects visitors without an auth cookie to sign in
          before Chat, globe, dashboards, connectors, objects, billing, profile, and related tools
          can load. Those routes never fetch workspace APIs for anonymous visitors. API routes that
          serve customer data still expect a bearer token. The marketing homepage, login, and legal
          pages stay public.
        </p>
      </LegalSection>

      <LegalSection title="2. Authentication">
        <p>
          Passwords are stored as hashes. Sessions use a bearer token kept in the browser. We
          recommend a unique password and signing out on shared devices. Social sign-in may be
          offered later; until then, email and password are the supported method.
        </p>
      </LegalSection>

      <LegalSection title="3. Read-only IAM for connectors">
        <p>
          When you connect an external system, grant the minimum access the connector needs —
          preferably a read-only role. AnalyzeIt is designed to display and analyze data, not to
          change source systems. Connector credentials are encrypted at rest when a vault key is
          configured. GitHub, Stripe, Salesforce, SQL, and catalog datasets (Kaggle, Hugging Face,
          OpenML) sync as live read-only pulls.
        </p>
      </LegalSection>

      <LegalSection title="4. Transport and isolation">
        <p>
          Production traffic is served over HTTPS. Workspace records are scoped to your account.
          Project sharing uses explicit links and role-aware UI redaction. Incognito mode avoids
          writing durable history for that session.
        </p>
      </LegalSection>

      <LegalSection title="5. Model providers">
        <p>
          Assistant requests are sent to language-model and search providers as needed to answer
          you. Do not paste secrets into chat that you would not share with those processors. We do
          not use your private connected business data to train public models.
        </p>
      </LegalSection>

      <LegalSection title="6. Desktop app and command line">
        <p>
          The <a href="/download" className="text-brand hover:underline">desktop app and command line</a>{' '}
          keep data you import on your own computer, in a vault encrypted at rest with a key kept in
          an owner-only file on that computer. Nothing in the vault is uploaded; when you ask the online assistant
          about a local dataset, only your question and a column summary you allowed are sent,
          never rows. Sign-in happens in your browser (no password is typed into the app), and the
          session token is stored in an owner-only file on that computer. Queries you run on local data are
          read-only and limited to your own datasets.
        </p>
        <p>
          <strong>Cloud compute</strong> is off unless you turn it on (<code>analyzeit compute cloud</code>).
          With it on, your data still stays stored on your computer; for each question an assistant asks,
          the app sends only the columns that one analysis needs, over HTTPS, to the AnalyzeIt compute
          service. The service checks your sign-in, runs the same analysis and the same rules as the app
          (no rows, no identifiers, no group of fewer than 3 records in what an assistant receives) in
          memory, returns the result to your computer and keeps nothing: no file, no database and no log
          of the data. If it cannot be reached, the analysis runs on your computer. Private datasets are
          never sent.
        </p>
        <p>
          Updates are signed with a private key that is kept off our build servers; the app and
          command line verify each update against a public key built into the program and refuse
          anything that does not verify or is older than the installed version. Release files list
          SHA-256 checksums on the download page. Builds are produced in private repositories.
        </p>
      </LegalSection>

      <LegalSection title="7. Reporting issues">
        <p>
          If you discover a vulnerability, email{' '}
          <a href="mailto:security@analyzeit.in" className="text-brand hover:underline">
            security@analyzeit.in
          </a>
          . Please do not publicly disclose an issue until we have had a reasonable chance to
          investigate and fix it.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
