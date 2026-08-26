"use client"
import Navbar from "@/src/components/landing/navbar"
import HeroSection from "@/src/components/landing/hero"
import AboutSection from "@/src/components/landing/about"
import FeaturesSection from "@/src/components/landing/features"
import HowItWorksSection from "@/src/components/landing/howItWorks"
import TestimonialsSection from "@/src/components/landing/testimonials"
import Footer from "@/src/components/landing/footer"

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <HeroSection />
      <AboutSection />
      <FeaturesSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <Footer />
    </>
  );
}