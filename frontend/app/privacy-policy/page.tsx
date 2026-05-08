import Link from "next/link";
import { SiteHeader } from "../components/common/site-header";
import { SiteFooter } from "../components/common/site-footer";

const sections = [
  {
    title: "Information We Collect",
    text: "We collect basic account details, app activity, and learning progress data needed to personalize your study experience.",
  },
  {
    title: "How We Use Information",
    text: "Your data helps us show relevant lessons, generate quiz feedback, track progress, and improve product performance.",
  },
  {
    title: "Data Sharing",
    text: "We do not sell your personal data. Data is shared only with trusted service providers for core platform operations or when legally required.",
  },
  {
    title: "Data Security",
    text: "We apply technical and organizational safeguards to protect your data against unauthorized access, disclosure, and misuse.",
  },
  {
    title: "Your Rights",
    text: "You can request access, correction, export, or deletion of your personal data, subject to applicable legal requirements.",
  },
  {
    title: "Contact",
    text: "For privacy questions, contact our team at privacy@learncomputers.edu.",
  },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="theme-page min-h-screen">
      <SiteHeader />

      <main className="mx-auto w-full max-w-4xl px-6 pb-20 pt-12 md:px-10">
        <h1 className="mt-4 text-4xl font-black leading-tight md:text-5xl">Privacy Policy</h1>
        <p className="theme-muted mt-4">
          Effective date: May 6, 2026. This policy explains how Learn Computers collects, uses, and protects student personal data.
        </p>

        <div className="mt-10 space-y-4">
          {sections.map((section) => (
            <section key={section.title} className="theme-surface theme-border rounded-2xl border p-5 shadow-sm">
              <h2 className="text-xl font-black">{section.title}</h2>
              <p className="theme-muted mt-2">{section.text}</p>
            </section>
          ))}
        </div>

        <div className="theme-surface theme-border theme-muted mt-10 rounded-2xl border p-5 text-sm">
          Need more details? Return to the{" "}
          <Link href="/" className="accent-text font-bold">
            homepage
          </Link>
          .
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
