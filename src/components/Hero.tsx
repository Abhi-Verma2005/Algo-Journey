"use client"
import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronDown, Code, Database, Github, Linkedin, ArrowRight, Star, Zap, Target } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { motion, useScroll } from "framer-motion"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import arena0 from '@/images/arena0.png'
import arena from '@/images/arena.png'
import projectEval from '@/images/projectEval.png'
import useDemo from "@/store/demoCreds"
import { CardContainer } from "./ui/3d-card"
import DSAHeroBackground from "./DSAbackground"

const ModernLandingPage = () => {
  const { scrollYProgress } = useScroll()
  const { data: session } = useSession()
  const { setCreds } = useDemo()
  const router = useRouter()
  const [activeFeature, setActiveFeature] = useState(0)

  const features = [
    {
      id: 0,
      icon: <Code className="h-6 w-6" />,
      title: "Interactive Challenges",
      description: "Solve real-world problems with instant feedback and detailed explanations.",
      image: arena0
    },
    {
      id: 1,
      icon: <Target className="h-6 w-6" />,
      title: "Visual Learning",
      description: "Understand algorithms through interactive visualizations and step-by-step breakdowns.",
      image: arena
    },
    {
      id: 2,
      icon: <Database className="h-6 w-6" />,
      title: "Progress Tracking",
      description: "Monitor your growth with detailed analytics and personalized learning paths.",
      image: projectEval
    }
  ]

  const stats = [
    { number: "10K+", label: "Active Learners" },
    { number: "500+", label: "Challenges" },
    { number: "50+", label: "Algorithms" },
    { number: "95%", label: "Success Rate" }
  ]

  const testimonials = [
    {
      quote: "AlgoJourney transformed my approach to coding interviews. The visual explanations are game-changing.",
      name: "Sarah Chen",
      role: "Software Engineer at Google",
      rating: 5
    },
    {
      quote: "Finally, a platform that makes complex algorithms feel approachable and fun to learn.",
      name: "Marcus Johnson",
      role: "CS Student at MIT",
      rating: 5
    },
    {
      quote: "The progress tracking helped me identify weak spots and improve systematically.",
      name: "Priya Patel",
      role: "Senior Developer",
      rating: 5
    }
  ]

  return (
    <div className="relative w-full overflow-hidden bg-white">
      {/* Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-indigo-600 origin-left z-50"
        style={{ scaleX: scrollYProgress }}
      />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 py-20">
        {/* Background - Lower z-index */}
        <div className="absolute inset-0 z-0">
          <DSAHeroBackground />
        </div>

        {/* Content - Higher z-index */}
        <div className="relative z-20 max-w-7xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-600/10 border border-blue-200/50 backdrop-blur-sm">
              <Zap className="h-4 w-4 text-blue-600 mr-2" />
              <span className="text-blue-700 text-sm font-medium">Master Coding Interviews</span>
            </div>
          </motion.div>

          {/* Main Heading */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-6"
          >
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight relative z-30">
              <span className="block mb-2">
                <span className="text-slate-900">Algo</span>
                <span className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 bg-clip-text text-transparent">Journey</span>
              </span>
            </h1>
          </motion.div>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl md:text-2xl text-slate-600 max-w-4xl mx-auto mb-12 leading-relaxed relative z-30"
          >
            Master algorithms and data structures through interactive learning. 
            <span className="text-blue-600 font-semibold"> Join 10,000+ developers</span> who have accelerated their careers.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16 relative z-30"
          >
            {!session && (
              <Button 
                onClick={() => {
                  setCreds({ username: '', password: '' })
                  router.push('/auth/signin')
                }}
                className="group bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 rounded-2xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                size="lg"
              >
                Start Learning Free
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
              </Button>
            )}
            
            <Button
              variant="outline"
              onClick={() => router.push('/about')}
              className="border-2 border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-700 px-8 py-4 rounded-2xl text-lg font-medium transition-all duration-300"
              size="lg"
            >
              About
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto relative z-30"
          >
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-slate-900 mb-1">{stat.number}</div>
                <div className="text-sm text-slate-600">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.2 }}
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex flex-col items-center"
          >
            <span className="text-sm text-slate-500 mb-2">Scroll to explore</span>
            <ChevronDown className="h-5 w-5 text-slate-400" />
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <motion.div
            className="text-center mb-20"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Everything you need to <span className="text-blue-600">excel</span>
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              From interactive challenges to comprehensive analytics, we have built the complete learning ecosystem.
            </p>
          </motion.div>

          {/* Interactive Feature Showcase */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Feature Navigation */}
            <div className="space-y-4">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.id}
                  className={`p-6 rounded-2xl cursor-pointer transition-all duration-300 ${
                    activeFeature === index 
                      ? 'bg-white shadow-lg border-l-4 border-blue-600' 
                      : 'bg-white/50 hover:bg-white hover:shadow-md'
                  }`}
                  onClick={() => setActiveFeature(index)}
                  whileHover={{ x: 4 }}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <div className="flex items-start space-x-4">
                    <div className={`p-3 rounded-xl ${
                      activeFeature === index ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900 mb-2">{feature.title}</h3>
                      <p className="text-slate-600">{feature.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Feature Image */}
            <CardContainer>
              <motion.div
              className="relative"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden">
                <Image
                  src={features[activeFeature].image}
                  alt={features[activeFeature].title}
                  width={600}
                  height={400}
                  className="w-full h-[400px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>
            </motion.div>
            </CardContainer>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Loved by <span className="text-blue-600">developers</span> worldwide
            </h2>
            <p className="text-xl text-slate-600">See what our community has to say about their learning journey</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-lg transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -4 }}
              >
                {/* Rating */}
                <div className="flex space-x-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>

                <blockquote className="text-slate-700 mb-6 italic">
                  &quot;{testimonial.quote}&quot;
                </blockquote>

                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">{testimonial.name}</div>
                    <div className="text-sm text-slate-600">{testimonial.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Account Section */}
      <section className="py-24 px-4 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
              Try Before You Commit
            </h2>
            <p className="text-xl text-slate-600 mb-8">
              Explore AlgoJourney with our demo account - no registration required
            </p>

            <div className="bg-white rounded-3xl p-8 shadow-lg max-w-lg mx-auto">
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl">
                  <span className="font-medium text-slate-700">Username:</span>
                  <code className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg font-mono">Visitor</code>
                </div>
                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl">
                  <span className="font-medium text-slate-700">Password:</span>
                  <code className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg font-mono">Visitor1234</code>
                </div>
              </div>
              
              <p className="text-sm text-slate-500 mt-6 mb-6">
                Demo account includes limited features for exploration
              </p>

              <Button 
                onClick={() => {
                  setCreds({ username: "Visitor", password: "Visitor1234" })
                  router.push('/auth/signin')
                }}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 rounded-xl font-semibold"
              >
                Try Demo Account
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-6xl font-bold mb-6">
              Ready to level up your 
              <span className="block bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                coding skills?
              </span>
            </h2>
            <p className="text-xl text-slate-300 mb-12 max-w-3xl mx-auto">
              Join thousands of developers who have transformed their careers with AlgoJourney. 
              Start your personalized learning path today.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {!session && (
                <Button 
                  onClick={() => router.push('/auth/signin')}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 rounded-2xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                  size="lg"
                >
                  Start Free Today
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              )}
              
              <Button
                variant="outline"
                onClick={() => router.push('/about')}
                className="border-2 border-slate-600 hover:border-slate-500 hover:bg-slate-800 text-white px-8 py-4 rounded-2xl text-lg font-medium transition-all duration-300"
                size="lg"
              >
                Learn More
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            {/* Brand */}
            <div className="md:col-span-2">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent mb-4">
                AlgoJourney
              </h3>
              <p className="text-slate-400 mb-6 max-w-md">
                Empowering developers worldwide to master algorithms and data structures through 
                interactive learning experiences.
              </p>
              <div className="flex space-x-4">
                <Link href="#" className="text-slate-400 hover:text-blue-400 transition-colors duration-200">
                  <Github className="h-6 w-6" />
                </Link>
                <Link href="#" className="text-slate-400 hover:text-blue-400 transition-colors duration-200">
                  <Linkedin className="h-6 w-6" />
                </Link>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Product</h4>
              <ul className="space-y-2">
                <li><Link href="#" className="text-slate-400 hover:text-white transition-colors duration-200">Features</Link></li>
                <li><Link href="#" className="text-slate-400 hover:text-white transition-colors duration-200">Pricing</Link></li>
                <li><Link href="#" className="text-slate-400 hover:text-white transition-colors duration-200">Tutorials</Link></li>
                <li><Link href="#" className="text-slate-400 hover:text-white transition-colors duration-200">Documentation</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li><Link href="#" className="text-slate-400 hover:text-white transition-colors duration-200">About</Link></li>
                <li><Link href="#" className="text-slate-400 hover:text-white transition-colors duration-200">Blog</Link></li>
                <li><Link href="#" className="text-slate-400 hover:text-white transition-colors duration-200">Careers</Link></li>
                <li><Link href="#" className="text-slate-400 hover:text-white transition-colors duration-200">Contact</Link></li>
              </ul>
            </div>
          </div>

          {/* Contributors Section */}
          <div className="border-t border-slate-800 pt-12 mb-8">
            <h4 className="text-xl font-semibold mb-8 text-center">Built by passionate developers</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  name: "Abhishek Verma",
                  role: "Full Stack Developer",
                  github: "https://github.com/Abhi-Verma2005",
                  linkedin: "https://www.linkedin.com/in/abhishek-verma-6803b1309/",
                },
                {
                  name: "Anish Suman",
                  role: "Full Stack Developer", 
                  github: "https://github.com/anish877",
                  linkedin: "https://www.linkedin.com/in/aniiiiiiiii/",
                }
              ].map((contributor, index) => (
                <div key={index} className="bg-slate-800 p-6 rounded-2xl">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
                      {contributor.name.charAt(0)}
                    </div>
                    <div>
                      <h5 className="font-semibold text-white">{contributor.name}</h5>
                      <p className="text-slate-400 text-sm">{contributor.role}</p>
                    </div>
                  </div>
                  <div className="flex space-x-4">
                    <Link 
                      href={contributor.github} 
                      target="_blank"
                      className="text-slate-400 hover:text-blue-400 transition-colors duration-200"
                    >
                      <Github className="h-5 w-5" />
                    </Link>
                    <Link 
                      href={contributor.linkedin} 
                      target="_blank"
                      className="text-slate-400 hover:text-blue-400 transition-colors duration-200"
                    >
                      <Linkedin className="h-5 w-5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-slate-800 pt-8 text-center">
            <p className="text-slate-400">
              © {new Date().getFullYear()} AlgoJourney. Made with ❤️ for the developer community.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default ModernLandingPage