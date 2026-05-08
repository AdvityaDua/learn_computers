"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { SiteHeader } from "./components/common/site-header";
import { SiteFooter } from "./components/common/site-footer";
import { PortalPreviewTabs } from "./components/landing/portal-preview-tabs";
import { Button } from "./components/common/button";


const roleCards = [
  {
    icon: "1",
    title: "Learn",
    subtitle: "Understand concepts faster",
    points: ["Short, focused lesson videos", "Clear topic-by-topic roadmap", "Simple explanations with examples"],
  },
  {
    icon: "2",
    title: "Practice",
    subtitle: "Build confidence daily",
    points: ["Interactive quizzes after lessons", "Practice sets by difficulty", "Instant feedback on mistakes"],
  },
  {
    icon: "3",
    title: "Improve",
    subtitle: "Track your growth",
    points: ["Weekly progress reports", "Topic-wise gap analysis", "Personalized revision suggestions"],
  },
];

const features = [
  { icon: "VL", title: "Video Lessons", text: "Learn with short, structured videos that keep topics easy to follow." },
  { icon: "IQ", title: "Interactive Quizzes", text: "Test yourself right after learning with instant scoring and hints." },
  { icon: "AS", title: "Smart Assignments", text: "Practice with tasks designed to reinforce what you just studied." },
  { icon: "LB", title: "Leaderboards", text: "Stay motivated by tracking your ranking and consistency streaks." },
  { icon: "PT", title: "Progress Tracking", text: "See how much you improved this week across every subject." },
  { icon: "GA", title: "Gap Analysis", text: "Find weak topics quickly and focus revision where it matters most." },
];

const stats = [
  { value: "25K+", label: "Practice Sessions" },
  { value: "120+", label: "Learning Paths" },
  { value: "94%", label: "Goal Completion" },
  { value: "4.9/5", label: "Student Rating" },
];

const testimonials = [
  {
    quote: "My scores improved in just 3 weeks because I always know what to revise next.",
    author: "Aarav, Class 10",
  },
  {
    quote: "The quiz feedback is super clear. I fixed my weak algebra topics much faster.",
    author: "Meera, Class 9",
  },
  {
    quote: "Leaderboards and streaks keep me consistent every day without feeling boring.",
    author: "Kabir, Class 11",
  },
];


export default function Home() {
  useEffect(() => {
    if (localStorage.getItem("accessToken")) {
      window.location.href = "/dashboard";
    }
  }, []);

  return (
    <div className="theme-page min-h-screen">
      <SiteHeader />

      <main>
        <section className="mx-auto grid w-full max-w-6xl gap-10 px-6 pb-20 pt-14 md:grid-cols-2 md:items-center md:px-10">
          <div>
            <h1 className="mt-5 text-balance text-4xl font-black leading-tight md:text-6xl">
              The smarter way to learn, practice, and improve every week.
            </h1>
            <p className="theme-muted mt-5 max-w-xl text-lg leading-relaxed">
              Built for students who want better scores with less confusion through clear lessons, smart practice, and personal progress tracking.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button href="/signup" variant="primary" size="lg">
                Get Started
              </Button>
              <Button href="#how-it-works" variant="outline" size="lg">
                See How It Works
              </Button>
            </div>
          </div>

          <div className="panel rounded-3xl p-5">
            <p className="accent-text mb-4 text-sm font-bold uppercase tracking-[0.12em]">Student Workspace</p>
            <div className="grid gap-3 md:grid-cols-3">
              <article className="theme-border rounded-xl border p-3 panel-hover">
                <div className="accent-bg mb-2 inline-flex rounded-md px-2 py-1 text-xs font-bold">Learn</div>
                <p className="text-sm font-semibold">Concept videos and notes</p>
              </article>
              <article className="theme-border rounded-xl border p-3 panel-hover">
                <div className="accent-bg mb-2 inline-flex rounded-md px-2 py-1 text-xs font-bold">Practice</div>
                <p className="text-sm font-semibold">Quizzes and assignments</p>
              </article>
              <article className="theme-border rounded-xl border p-3 panel-hover">
                <div className="accent-bg mb-2 inline-flex rounded-md px-2 py-1 text-xs font-bold">Progress</div>
                <p className="text-sm font-semibold">Scores and weak topics</p>
              </article>
            </div>
            <div className="theme-border theme-surface-soft mt-4 h-40 rounded-xl border p-3">
              <div className="theme-border h-3 w-28 rounded-full border" />
              <div className="mt-3 grid grid-cols-4 gap-2">
                <div className="theme-surface theme-border h-16 rounded-md border" />
                <div className="theme-surface theme-border h-16 rounded-md border" />
                <div className="theme-surface theme-border h-16 rounded-md border" />
                <div className="theme-surface theme-border h-16 rounded-md border" />
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="mx-auto w-full max-w-6xl px-6 pb-20 md:px-10">
          <div className="mb-8">
            <h2 className="section-title">How It Works</h2>
            <p className="section-subtitle">A simple system designed around student growth.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {roleCards.map((card) => (
              <article key={card.title} className="panel panel-hover rounded-2xl p-5">
                <span className="accent-bg inline-flex h-9 w-9 items-center justify-center rounded-lg text-sm font-black">
                  {card.icon}
                </span>
                <h3 className="mt-4 text-xl font-black">{card.title}</h3>
                <p className="accent-text mt-1 font-semibold">{card.subtitle}</p>
                <ul className="theme-muted mt-4 space-y-2 text-sm">
                  {card.points.map((point) => (
                    <li key={point} className="flex items-start gap-2">
                      <span className="accent-bg mt-1 h-2 w-2 rounded-full" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section id="features" className="mx-auto w-full max-w-6xl px-6 pb-20 md:px-10">
          <div className="mb-8">
            <h2 className="section-title">Feature Highlights</h2>
            <p className="section-subtitle">Everything a student needs to learn smarter every day.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="panel panel-hover rounded-2xl p-5"
              >
                <span className="accent-bg inline-flex rounded-md px-2 py-1 text-xs font-black">
                  {feature.icon}
                </span>
                <h3 className="mt-4 text-lg font-black">{feature.title}</h3>
                <p className="theme-muted mt-1 text-sm">{feature.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="theme-surface theme-border border-y">
          <div className="mx-auto grid w-full max-w-6xl gap-6 px-6 py-10 md:grid-cols-4 md:px-10">
            {stats.map((stat) => (
              <article key={stat.label} className="text-center">
                <p className="kpi-value">{stat.value}</p>
                <p className="theme-muted mt-1 text-sm font-semibold">{stat.label}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="testimonials" className="mx-auto w-full max-w-6xl px-6 py-20 md:px-10">
          <div className="mb-8">
            <h2 className="section-title">Student & Teacher Testimonials</h2>
            <p className="section-subtitle">Real feedback from students using the platform daily.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {testimonials.map((item) => (
              <blockquote key={item.author} className="panel panel-hover rounded-2xl p-5">
                <p className="theme-muted">"{item.quote}"</p>
                <footer className="accent-text mt-4 text-sm font-bold">{item.author}</footer>
              </blockquote>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-6 pb-20 md:px-10">
          <div className="mb-8">
            <h2 className="section-title">Portal Preview</h2>
            <p className="section-subtitle">See how your learning dashboard adapts to your current goal.</p>
          </div>
          <PortalPreviewTabs />
        </section>

        <section id="start-now" className="mx-auto w-full max-w-6xl px-6 pb-20 md:px-10">
          <div className="panel rounded-3xl p-6 md:p-8">
            <h2 className="section-title">Start Your Learning Plan</h2>
            <p className="section-subtitle max-w-2xl">
              Share your details and we will suggest a personalized learning path to match your target goals.
            </p>

            <form className="mt-6 grid gap-4 md:grid-cols-2">
              <div>
                <label className="theme-muted mb-1 block text-sm font-semibold">Name</label>
                <input
                  type="text"
                  placeholder="Your name"
                  className="input-theme"
                />
              </div>
              <div>
                <label className="theme-muted mb-1 block text-sm font-semibold">Current Class / Level</label>
                <input
                  type="text"
                  placeholder="e.g. Class 10"
                  className="input-theme"
                />
              </div>
              <div>
                <label className="theme-muted mb-1 block text-sm font-semibold">Email</label>
                <input
                  type="email"
                  placeholder="name@email.com"
                  className="input-theme"
                />
              </div>
              <div>
                <label className="theme-muted mb-1 block text-sm font-semibold">Your Goal</label>
                <input
                  type="text"
                  placeholder="e.g. Improve math in 8 weeks"
                  className="input-theme"
                />
              </div>
              <div className="md:col-span-2">
                <Button href="/signup" variant="primary" size="lg">
                  Start My Plan
                </Button>
              </div>
            </form>
          </div>
        </section>

        <section id="contact" className="mx-auto w-full max-w-6xl px-6 pb-24 md:px-10">
          <div className="panel rounded-3xl p-6 md:p-8">
            <div className="grid gap-8 lg:grid-cols-2">
              <div>
                <h2 className="section-title mt-5">Talk to our learning support team</h2>
                <p className="section-subtitle">
                  Share your query and our team will help you pick the right learning path, solve account issues, or guide your onboarding.
                </p>
                <div className="theme-muted mt-6 space-y-2 text-sm">
                  <p>Email: support@learncomputers.com</p>
                  <p>Help hours: Monday to Saturday, 9:00 AM to 7:00 PM</p>
                  <p>Response time: Usually within 24 hours</p>
                </div>
              </div>

              <form className="grid gap-4">
                <div>
                  <label className="theme-muted mb-1 block text-sm font-semibold">Full Name</label>
                  <input type="text" placeholder="Your full name" className="input-theme" />
                </div>

                <div>
                  <label className="theme-muted mb-1 block text-sm font-semibold">Email</label>
                  <input type="email" placeholder="you@example.com" className="input-theme" />
                </div>

                <div>
                  <label className="theme-muted mb-1 block text-sm font-semibold">Subject</label>
                  <input type="text" placeholder="How can we help?" className="input-theme" />
                </div>

                <div>
                  <label className="theme-muted mb-1 block text-sm font-semibold">Message</label>
                  <textarea
                    placeholder="Write your message"
                    className="input-theme min-h-32 resize-y"
                  />
                </div>

                <div>
                  <Button variant="primary" size="lg">
                    Send Message
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
