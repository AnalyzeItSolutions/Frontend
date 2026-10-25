import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalLayout, LegalSection } from '../Components/legal/LegalLayout';

export const metadata: Metadata = {
  title: 'Data analysis software: which kind fits your job — AnalyzeIt',
  description: 'Spreadsheets, business intelligence, statistical tools and AI data analysis compared by the job they do, with a checklist for choosing and where AnalyzeIt fits.',
  alternates: { canonical: '/data-analysis-software' },
};

const link = 'text-brand hover:underline';

export default function DataAnalysisSoftwarePage() {
  return (
    <LegalLayout
      title="Data analysis software: which kind fits your job"
      eyebrow={false}
      showHeroUpdated={false}
      subtitle="Data analysis, business analytics and business intelligence software overlap. Start from the question you need answered."
    >
      <LegalSection title="Four kinds of data analysis software">
        <p>
          <strong>Spreadsheets</strong> are familiar and flexible for small tables. They get slow and error-prone as data
          grows, and every formula is a place for a mistake to hide.
        </p>
        <p>
          <strong>Business intelligence and dashboard tools</strong> show the same figures to many people, on a schedule.
          They usually need someone to model the data first.
        </p>
        <p>
          <strong>Statistical and code tools</strong>, such as Python and R, give analysts full control. They need skills
          to use well.
        </p>
        <p>
          <strong>AI data analysis tools</strong> let you ask in plain words. Their quality depends on one thing: whether
          the numbers are calculated by code and shown to you, or written by a language model.
        </p>
      </LegalSection>

      <LegalSection title="Match the software to the question">
        <ul className="list-disc space-y-2 pl-5">
          <li>&ldquo;What changed this month, and was it real?&rdquo; needs a period comparison and a check against normal noise.</li>
          <li>&ldquo;Which segment drove the drop?&rdquo; needs a breakdown by group that shows how big each group is.</li>
          <li>&ldquo;What will next quarter look like?&rdquo; needs a forecast with a stated range, not a single line.</li>
          <li>&ldquo;Show this to the whole team every Monday&rdquo; needs a dashboard that refreshes and can be shared.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Where AnalyzeIt fits">
        <p>
          AnalyzeIt is an AI data analysis tool for business questions. You ask in plain language. Statistics run in code
          before the language model writes anything, and the calculation, the period compared and the sources are shown
          with each answer. The model explains the results; it does not produce the figures.
        </p>
        <p>
          Connectors read your data. Anything that would change a source system, such as a Razorpay refund, waits for
          you to approve that exact action first. You can also start
          with public data from the{' '}
          <Link href="/data" className={link}>country data</Link> and{' '}
          <Link href="/indicators" className={link}>indicator rankings</Link>, which carry their source.
        </p>
        <p>
          For the formulas behind common results, see{' '}
          <Link href="/methods" className={link}>statistics methods</Link> and{' '}
          <Link href="/metrics" className={link}>business metrics</Link>. Each one comes with Excel, SQL and Python to
          check the result yourself.
        </p>
      </LegalSection>

      <LegalSection title="How to choose">
        <p>
          Work through the full checklist in{' '}
          <Link href="/guides/choose-a-data-analysis-tool" className={link}>how to choose a data analysis tool</Link>. Three
          questions do most of the work:
        </p>
        <ol className="list-decimal space-y-2 pl-5">
          <li>Who will ask the questions: analysts, or managers who need answers themselves?</li>
          <li>Can you check an answer? Look for the calculation and the source behind every number.</li>
          <li>Does it fit your data and budget as it grows? Test with your own file before you commit.</li>
        </ol>
        <p>
          Related reading:{' '}
          <Link href="/guides/types-of-data-analysis" className={link}>types of data analysis</Link>,{' '}
          <Link href="/guides/chatgpt-or-a-data-analysis-tool" className={link}>ChatGPT or a data analysis tool</Link>, and{' '}
          <Link href="/guides/spreadsheet-or-ai-data-tool" className={link}>spreadsheet or AI data tool</Link>.
        </p>
      </LegalSection>

      <LegalSection title="Try it on your own data">
        <p>
          <Link href="/try" className={link}>Try AnalyzeIt</Link> with five free runs and no account, or read the{' '}
          <Link href="/features" className={link}>feature list</Link>. Plans are on the{' '}
          <Link href="/products" className={link}>products page</Link>.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
