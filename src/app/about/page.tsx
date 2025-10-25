"use client";
import { motion } from "framer-motion";
import { Brain } from "lucide-react";
import { FaRocket, FaRobot, FaChartLine, FaBolt, FaGithub, FaTrophy, FaRoad, FaUserGraduate } from "react-icons/fa";

const About = () => {
  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7 }
  };
  
  return (
    <div className="max-w-5xl mx-auto px-6 py-16 mt-8">
      {/* Hero Section with Gradient Background */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 p-10 mb-16 shadow-none">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('/circuit-pattern.png')]"></div>
        <motion.div 
          className="relative z-10 text-center"
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.8 }}
        >
          <motion.h1 
            className="text-5xl font-bold mb-6 text-white"
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.6 }}
          >
            About AlgoJourney <FaRocket className="inline ml-2" />
          </motion.h1>

          <motion.p 
            className="text-xl text-white/90 max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            Welcome to AlgoJourney, a cutting-edge AI-powered testing platform and tracker designed to enhance competitive programming, project rating, and real-time collaboration.
          </motion.p>
        </motion.div>
      </div>

      {/* Features Section with Improved Cards */}
      <motion.h2 
        className="text-3xl font-bold text-center mb-10 text-gray-800"
        {...fadeIn}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        Platform Features
      </motion.h2>
      
      <motion.div 
        className="grid md:grid-cols-2 gap-8"
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        transition={{ delay: 0.6, duration: 0.6 }}
      >
        {/* Feature 1 */}
        <motion.div 
          className="p-8 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-none border border-blue-200 hover:shadow-none transition-shadow duration-300"
          whileHover={{ y: -5 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center mb-4">
            <FaRobot className="text-3xl text-blue-600 mr-4" />
            <h2 className="text-2xl font-semibold text-blue-700">Real-Time AI Chat</h2>
          </div>
          <p className="text-gray-700 mt-2 leading-relaxed">
            Engage with Gemini Pro-powered AI for live problem-solving, code reviews, and project insights. Get instant feedback as you code.
          </p>
        </motion.div>

        {/* Feature 2 */}
        <motion.div 
          className="p-8 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-none border border-blue-200 hover:shadow-none transition-shadow duration-300"
          whileHover={{ y: -5 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center mb-4">
            <FaChartLine className="text-3xl text-blue-600 mr-4" />
            <h2 className="text-2xl font-semibold text-blue-700">AI-Based Project Rating</h2>
          </div>
          <p className="text-gray-700 mt-2 leading-relaxed">
            Your GitHub projects are analyzed and rated based on code quality, maintainability, and adherence to best practices.
          </p>
        </motion.div>

        {/* Feature 3 */}
        <motion.div 
          className="p-8 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-none border border-blue-200 hover:shadow-none transition-shadow duration-300"
          whileHover={{ y: -5 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center mb-4">
            <FaBolt className="text-3xl text-blue-600 mr-4" />
            <h2 className="text-2xl font-semibold text-blue-700">WebSockets for Live Actions</h2>
          </div>
          <p className="text-gray-700 mt-2 leading-relaxed">
            Teachers and students interact in real-time, with teachers sending live coding questions and receiving immediate solutions.
          </p>
        </motion.div>

        {/* Feature 4 */}
        <motion.div 
          className="p-8 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-none border border-blue-200 hover:shadow-none transition-shadow duration-300"
          whileHover={{ y: -5 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center mb-4">
            <FaGithub className="text-3xl text-blue-600 mr-4" />
            <h2 className="text-2xl font-semibold text-blue-700">GitHub Integration</h2>
          </div>
          <p className="text-gray-700 mt-2 leading-relaxed">
            Securely connect your GitHub account, import repositories, and receive AI-powered feedback on your code.
          </p>
        </motion.div>
      </motion.div>

      {/* Tech Stack with Modern Cards */}
      <motion.div 
        className="mt-16"
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        transition={{ delay: 0.9, duration: 0.6 }}
      >
        <h2 className="text-3xl font-bold text-center mb-10 text-gray-800">Our Tech Stack</h2>
        
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl shadow-none p-8 border border-gray-200">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-4 rounded-lg bg-white shadow-none">
              <h3 className="text-xl font-semibold text-gray-800 mb-3 border-b pb-2">Frontend</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-center"><span className="w-3 h-3 rounded-full bg-blue-500 mr-2"></span> Next.js</li>
                <li className="flex items-center"><span className="w-3 h-3 rounded-full bg-blue-400 mr-2"></span> React</li>
                <li className="flex items-center"><span className="w-3 h-3 rounded-full bg-blue-300 mr-2"></span> Tailwind CSS</li>
                <li className="flex items-center"><span className="w-3 h-3 rounded-full bg-blue-200 mr-2"></span> Framer Motion</li>
              </ul>
            </div>
            
            <div className="p-4 rounded-lg bg-white shadow-none">
              <h3 className="text-xl font-semibold text-gray-800 mb-3 border-b pb-2">Backend</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-center"><span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span> Node.js</li>
                <li className="flex items-center"><span className="w-3 h-3 rounded-full bg-green-400 mr-2"></span> Express</li>
                <li className="flex items-center"><span className="w-3 h-3 rounded-full bg-green-300 mr-2"></span> Prisma</li>
                <li className="flex items-center"><span className="w-3 h-3 rounded-full bg-green-200 mr-2"></span> WebSockets</li>
              </ul>
            </div>
            
            <div className="p-4 rounded-lg bg-white shadow-none">
              <h3 className="text-xl font-semibold text-gray-800 mb-3 border-b pb-2">Services</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-center"><span className="w-3 h-3 rounded-full bg-purple-500 mr-2"></span> PostgreSQL (Neon.tech)</li>
                <li className="flex items-center"><span className="w-3 h-3 rounded-full bg-purple-400 mr-2"></span> Google Gemini Pro</li>
                <li className="flex items-center"><span className="w-3 h-3 rounded-full bg-purple-300 mr-2"></span> NextAuth.js</li>
                <li className="flex items-center"><span className="w-3 h-3 rounded-full bg-purple-200 mr-2"></span> OAuth (GitHub, Google)</li>
              </ul>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Current Features (Changed from Future Plans) */}
      <motion.div 
        className="mt-16 mb-12"
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        transition={{ delay: 1.2, duration: 0.6 }}
      >
        <h2 className="text-3xl font-bold text-center mb-10 text-gray-800">Available Features</h2>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div className="p-6 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl shadow-none border border-indigo-200">
            <div className="flex items-center mb-4">
              <FaTrophy className="text-2xl text-indigo-600 mr-4" />
              <h3 className="text-xl font-semibold text-indigo-700">Leaderboards</h3>
            </div>
            <p className="text-gray-700">Compete with peers through our comprehensive leaderboards for project ratings and coding challenge rankings.</p>
          </div>
          
          <div className="p-6 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl shadow-none border border-indigo-200">
            <div className="flex items-center mb-4">
              <Brain className="text-2xl text-indigo-600 mr-4" />
              <h3 className="text-xl font-semibold text-indigo-700">AI Chat</h3>
            </div>
            <p className="text-gray-700">Get hands-free coding assistance with our voice-activated AI chat feature for smoother workflow.</p>
          </div>
          
          <div className="p-6 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl shadow-none border border-indigo-200">
            <div className="flex items-center mb-4">
              <FaRoad className="text-2xl text-indigo-600 mr-4" />
              <h3 className="text-xl font-semibold text-indigo-700">AI-driven Roadmaps</h3>
            </div>
            <p className="text-gray-700">Receive personalized learning paths and skill improvement suggestions based on your coding patterns.</p>
          </div>
          
          <div className="p-6 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl shadow-none border border-indigo-200">
            <div className="flex items-center mb-4">
              <FaUserGraduate className="text-2xl text-indigo-600 mr-4" />
              <h3 className="text-xl font-semibold text-indigo-700">Collaboration Tools</h3>
            </div>
            <p className="text-gray-700">Access advanced real-time collaboration tools for students and teachers, including live code sharing and review sessions.</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default About;