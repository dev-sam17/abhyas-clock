"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Clock,
  Target,
  TrendingUp,
  CheckCircle2,
  Timer,
  BarChart3,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Footer } from "@/components/footer";

export default function LandingPage() {
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/home",
    });
  };
  return (
    <div className="min-h-screen bg-linear-to-br from-background via-background to-muted">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary"
              >
                Your Smart Exam Companion
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="mb-6 text-balance text-5xl font-bold leading-tight tracking-tight text-foreground sm:text-6xl lg:text-7xl"
              >
                Abhyas Clock
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="mb-8 text-pretty text-lg text-muted-foreground sm:text-xl"
              >
                Offline Exam Practice with Smart Time Analytics. Practice with
                hardcopy papers, track every second, and master your competitive
                exams.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="flex flex-col gap-4 sm:flex-row"
              >
                <Button
                  size="lg"
                  className="group w-full gap-2 sm:w-auto"
                  onClick={handleGoogleSignIn}
                >
                  <svg
                    className="size-5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Sign in with Google
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </motion.div>
            </motion.div>

            {/* Right Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
              className="relative"
            >
              <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted/50 shadow-2xl">
                <Image
                  src="/student-studying-with-timer-and-exam-papers-on-des.jpg"
                  alt="Student practicing with exam papers and timer"
                  fill
                  className="object-cover"
                />
              </div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.6 }}
                className="absolute -bottom-6 -right-6 rounded-xl bg-card p-4 shadow-lg"
              >
                <div className="flex items-center gap-2">
                  <Clock className="size-8 text-primary" />
                  <div>
                    <div className="text-2xl font-bold text-foreground">
                      45:23
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Time Tracked
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Problem Statement Section */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12 text-center"
          >
            <h2 className="mb-4 text-balance text-3xl font-bold text-foreground sm:text-4xl">
              The Problem We Solve
            </h2>
            <p className="mx-auto max-w-2xl text-pretty text-lg text-muted-foreground">
              Students preparing for competitive exams face real challenges when
              practicing with hardcopy papers
            </p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                icon: Target,
                title: "Manual Question Numbering",
                description:
                  "Writing question numbers repeatedly is tedious and error-prone",
              },
              {
                icon: Timer,
                title: "Time Tracking Issues",
                description:
                  "Difficult to track time per question and simulate real exam pressure",
              },
              {
                icon: BarChart3,
                title: "No Analytics",
                description:
                  "Hard to identify weak areas without proper performance data",
              },
            ].map((problem, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                className="rounded-xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-destructive/10">
                  <problem.icon className="size-6 text-destructive" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-foreground">
                  {problem.title}
                </h3>
                <p className="text-pretty text-muted-foreground">
                  {problem.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12 text-center"
          >
            <h2 className="mb-4 text-balance text-3xl font-bold text-foreground sm:text-4xl">
              Our Smart Solution
            </h2>
            <p className="mx-auto max-w-2xl text-pretty text-lg text-muted-foreground">
              A web-based test simulation app designed specifically for offline
              exam practice
            </p>
          </motion.div>

          <div className="grid gap-8 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative aspect-4/3 overflow-hidden rounded-xl bg-muted/50 shadow-lg"
            >
              <Image
                src="/digital-omr-sheet-interface-on-tablet-with-timer-a.jpg"
                alt="OMR Sheet Interface"
                fill
                className="object-cover"
              />
            </motion.div>

            <div className="flex flex-col justify-center gap-6">
              {[
                {
                  icon: CheckCircle2,
                  title: "Auto Question Numbering",
                  description:
                    "Set your starting question and let the system generate the rest automatically",
                },
                {
                  icon: Clock,
                  title: "Exam-Like Timing",
                  description:
                    "Timer and stopwatch modes to simulate real exam conditions with overtime tracking",
                },
                {
                  icon: TrendingUp,
                  title: "Smart Analytics",
                  description:
                    "Track time per question, identify patterns, and see your progress with detailed charts",
                },
                {
                  icon: Target,
                  title: "Focus on Practice",
                  description:
                    "Pure time and attempt management - no distractions, just efficient practice",
                },
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                  className="flex gap-4"
                >
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="size-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="mb-1 text-lg font-semibold text-foreground">
                      {feature.title}
                    </h3>
                    <p className="text-pretty text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12 text-center"
          >
            <h2 className="mb-4 text-balance text-3xl font-bold text-foreground sm:text-4xl">
              How It Works
            </h2>
            <p className="mx-auto max-w-2xl text-pretty text-lg text-muted-foreground">
              Three simple steps to revolutionize your exam practice
            </p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Create Test Preset",
                description:
                  "Define test name, question count, starting number, and choose timer or stopwatch mode",
                image: "form with test configuration fields on laptop screen",
              },
              {
                step: "02",
                title: "Practice Offline",
                description:
                  "Solve your hardcopy question paper, then enter answers using our digital OMR sheet",
                image:
                  "student entering answers on digital OMR sheet with timer running",
              },
              {
                step: "03",
                title: "Get Insights",
                description:
                  "Enter answer key, get instant evaluation, and view detailed analytics on your performance",
                image:
                  "analytics dashboard showing score charts and time breakdown",
              },
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15, duration: 0.6 }}
                className="relative"
              >
                <div className="mb-4 aspect-video overflow-hidden rounded-xl bg-muted/50 shadow-md">
                  <Image
                    src={`/.jpg?height=300&width=400&query=${step.image}`}
                    alt={step.title}
                    width={400}
                    height={300}
                    className="size-full object-cover"
                  />
                </div>
                <div className="mb-2 text-4xl font-bold text-primary/20">
                  {step.step}
                </div>
                <h3 className="mb-2 text-xl font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="text-pretty text-muted-foreground">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-4xl rounded-2xl bg-linear-to-br from-primary/10 via-primary/5 to-transparent p-8 text-center shadow-lg sm:p-12"
        >
          <h2 className="mb-4 text-balance text-3xl font-bold text-foreground sm:text-4xl">
            Ready to Master Your Exams?
          </h2>
          <p className="mb-8 text-pretty text-lg text-muted-foreground">
            Join students who are transforming their offline practice with smart
            time tracking and analytics
          </p>
          <Button
            size="lg"
            className="group gap-2"
            onClick={handleGoogleSignIn}
          >
            <svg className="size-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Get Started with Google
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
