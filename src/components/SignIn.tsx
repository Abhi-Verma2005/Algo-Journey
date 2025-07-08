"use client"
import React, { useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, User, ArrowRight, Code, Zap, Target } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import useDemo from '@/store/demoCreds';

export default function SignIn() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { creds } = useDemo()
  const [isLoading, setIsLoading] = useState(false);
  const Router = useRouter();

  useEffect(() => {
    if(!creds.username) return 
    setTimeout(async () => {
      setIsLoading(true);
    
    try {
      const result = await signIn('credentials', {
        username: creds.username,
        password: creds.password,
        redirect: false
      });
      
      if (!result) {
        toast.error('Please check credentials, and try again.');
        return;
      }
      
      if (result.error) {
        toast.error('Please check credentials, and try again.');
        return;
      }

      if(result.url) {
        toast.success('Signed In Successfully');
        setTimeout(()=>{
          Router.push('/user/dashboard');
        }, 1000)
      }
      
    } catch (error) {
      console.error(error);
      toast.error("An error occurred during sign-in.");
    } finally {
      setIsLoading(false);
    }
    }, 500)
  }, [creds])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const result = await signIn('credentials', {
        username,
        password,
        redirect: false
      });
      
      if (!result) {
        toast.error('Please check credentials, and try again.');
        return;
      }
      
      if (result.error) {
        toast.error('Please check credentials, and try again.');
        return;
      }

      if(result.url) {
        toast.success('Signed In Successfully');
        setTimeout(()=>{
          Router.push('/user/dashboard');
        }, 1000)
      }
      
    } catch (error) {
      console.error(error);
      toast.error("An error occurred during sign-in.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      await signIn('google', { callbackUrl: '/user/dashboard' });
    } catch (error) {
      console.error(error);
      toast.error('SignIn with Google failed, Try again!');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <Toaster position="top-center" />
      
      {/* Left Side - Large Image/Illustration */}
      <div className="hidden lg:flex lg:w-3/5 xl:w-2/3 relative bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-800 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-32 h-32 bg-blue-500/20 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute bottom-40 right-20 w-48 h-48 bg-purple-500/20 rounded-full blur-xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-indigo-400/20 rounded-full blur-lg animate-pulse delay-500"></div>
        </div>
        
        {/* DSA Themed SVG Illustration */}
        <div className="relative z-10 flex items-center justify-center w-full p-12">
          <div className="max-w-2xl">
            {/* Code Structure Visualization */}
            <svg viewBox="0 0 800 600" className="w-full h-auto opacity-90">
              {/* Tree Structure */}
              <g className="animate-pulse">
                {/* Root Node */}
                <circle cx="400" cy="100" r="25" fill="#4F46E5" className="drop-shadow-lg"/>
                <text x="400" y="107" textAnchor="middle" className="fill-white text-sm font-bold">1</text>
                
                {/* Level 2 */}
                <line x1="400" y1="125" x2="300" y2="175" stroke="#6366F1" strokeWidth="3"/>
                <line x1="400" y1="125" x2="500" y2="175" stroke="#6366F1" strokeWidth="3"/>
                <circle cx="300" cy="200" r="20" fill="#7C3AED" className="drop-shadow-lg"/>
                <text x="300" y="207" textAnchor="middle" className="fill-white text-sm font-bold">2</text>
                <circle cx="500" cy="200" r="20" fill="#7C3AED" className="drop-shadow-lg"/>
                <text x="500" y="207" textAnchor="middle" className="fill-white text-sm font-bold">3</text>
                
                {/* Level 3 */}
                <line x1="300" y1="220" x2="250" y2="270" stroke="#8B5CF6" strokeWidth="2"/>
                <line x1="300" y1="220" x2="350" y2="270" stroke="#8B5CF6" strokeWidth="2"/>
                <line x1="500" y1="220" x2="450" y2="270" stroke="#8B5CF6" strokeWidth="2"/>
                <line x1="500" y1="220" x2="550" y2="270" stroke="#8B5CF6" strokeWidth="2"/>
                
                <circle cx="250" cy="295" r="15" fill="#A855F7"/>
                <text x="250" y="300" textAnchor="middle" className="fill-white text-xs font-bold">4</text>
                <circle cx="350" cy="295" r="15" fill="#A855F7"/>
                <text x="350" y="300" textAnchor="middle" className="fill-white text-xs font-bold">5</text>
                <circle cx="450" cy="295" r="15" fill="#A855F7"/>
                <text x="450" y="300" textAnchor="middle" className="fill-white text-xs font-bold">6</text>
                <circle cx="550" cy="295" r="15" fill="#A855F7"/>
                <text x="550" y="300" textAnchor="middle" className="fill-white text-xs font-bold">7</text>
              </g>
              
              {/* Array Visualization */}
              <g className="opacity-80">
                <rect x="150" y="400" width="500" height="60" rx="8" fill="#1F2937" stroke="#4F46E5" strokeWidth="2"/>
                {[0,1,2,3,4,5,6,7].map((i) => (
                  <g key={i}>
                    <rect x={150 + i * 62.5} y="400" width="62.5" height="60" fill={i % 2 === 0 ? "#374151" : "#4B5563"}/>
                    <text x={150 + i * 62.5 + 31.25} y="435" textAnchor="middle" className="fill-white text-lg font-bold">{Math.floor(Math.random() * 100)}</text>
                    <text x={150 + i * 62.5 + 31.25} y="450" textAnchor="middle" className="fill-gray-300 text-xs">[{i}]</text>
                  </g>
                ))}
              </g>
              
              {/* Code Brackets */}
              <text x="100" y="150" className="fill-purple-300 text-6xl font-mono opacity-50">{'{'}</text>
              <text x="700" y="450" className="fill-purple-300 text-6xl font-mono opacity-50">{'}'}</text>
              
              {/* Floating Code Elements */}
              <text x="650" y="120" className="fill-blue-300 text-sm font-mono opacity-60">O(log n)</text>
              <text x="80" y="350" className="fill-green-300 text-sm font-mono opacity-60">while()</text>
              <text x="600" y="350" className="fill-yellow-300 text-sm font-mono opacity-60">sort()</text>
            </svg>
            
            {/* Feature Icons */}
            <div className="flex justify-center space-x-8 mt-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center mb-3">
                  <Code className="w-8 h-8 text-blue-300" />
                </div>
                <p className="text-white/80 text-sm">Practice</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center mb-3">
                  <Zap className="w-8 h-8 text-yellow-300" />
                </div>
                <p className="text-white/80 text-sm">Learn Fast</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center mb-3">
                  <Target className="w-8 h-8 text-green-300" />
                </div>
                <p className="text-white/80 text-sm">Master DSA</p>
              </div>
            </div>
            
            {/* Inspiring Text */}
            <div className="text-center mt-12">
              <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">
                Master Data Structures
                <span className="block text-3xl lg:text-4xl text-blue-300 mt-2">& Algorithms</span>
              </h1>
              <p className="text-white/70 text-lg max-w-md mx-auto">
                Practice, learn, and excel in your coding journey with our comprehensive DSA platform.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right Side - Sign In Form */}
      <div className="w-full lg:w-2/5 xl:w-1/3 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
            <p className="text-gray-600">Enter your credentials to continue</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="username" className="text-gray-700 text-sm font-medium mb-2 flex items-center gap-2">
                <User className="h-4 w-4 text-indigo-500" />
                Username
              </Label>
              <Input
                id="username"
                type="text"
                value={creds.username ? creds.username : username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                disabled={isLoading}
                className="h-12 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-lg"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="password" className="text-gray-700 text-sm font-medium mb-2 flex items-center gap-2">
                <Lock className="h-4 w-4 text-indigo-500" />
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={creds.password ? creds.password : password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                disabled={isLoading}
                className="h-12 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-lg"
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-all duration-200"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
              {!isLoading && <ArrowRight className="h-4 w-4" />}
            </Button>
          </form>
          
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 bg-white text-gray-500 text-sm">or continue with</span>
            </div>
          </div>
          
          <Button 
            type="button" 
            onClick={handleGoogleSignIn}
            className="w-full h-12 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium rounded-lg flex items-center justify-center gap-3 transition-all duration-200"
            disabled={isLoading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="20px" height="20px">
              <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
              <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
              <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
              <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
            </svg>
            {isLoading ? 'Connecting...' : 'Google'}
          </Button>
          
          <p className="text-center text-sm text-gray-500 mt-8">
            New to our platform? <span className="text-indigo-600 hover:text-indigo-500 cursor-pointer font-medium">Continue with Google</span>
          </p>
        </div>
      </div>
    </div>
  );
}