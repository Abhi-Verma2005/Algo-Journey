"use client"
import React, { useState } from "react";
import axios from "axios";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Eye, EyeOff, UserPlus, Users, Trophy, BookOpen, Brain } from "lucide-react";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchLatestSubmissionsCodeForces, fetchLatestSubmissionsLeetCode } from "@/serverActions/fetch";

// Validation schema remains the same
const signupSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email").refine(
    (email) => email.endsWith("@nst.rishihood.edu.in") || email.endsWith("@newtonschool.co") || email.endsWith("@sst.scaler.com") || email.endsWith("@adypu.edu.in") || email.endsWith("@gla.ac.in") || email.endsWith("@oriental.ac.in") || email.endsWith("@maimt.com") || email.endsWith("@csds.rishihood.edu.in"),
    "Must use college email"
  ),
  
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[a-z]/, "Must contain at least one lowercase letter")
    .regex(/[0-9]/, "Must contain at least one number"),
  leetcodeUsername: z.string().min(1, "Leetcode username is required"),
  codeforcesUsername: z.string().min(1, "Codeforces username is required"),
  enrollmentNum: z.string().min(1, "Enrollment number is required"),
  section: z.enum(['A', 'B', 'C', 'D', 'E'])
});

type SignupFormData = z.infer<typeof signupSchema>;

export default function Signup() {
  const Router = useRouter()
  const { data:session } = useSession()
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      username: "",
      email: email ?? '',
      password: "",
      leetcodeUsername: "",
      codeforcesUsername: "",
      enrollmentNum: "",
      section: undefined
    }
  });

  const onSubmit = async (data: SignupFormData) => {
    setIsSubmitting(true);
    try {
      const checkLeet = await fetchLatestSubmissionsLeetCode(data.leetcodeUsername)
      if(!checkLeet) return toast.error("Invalid Leetcode Username")
      const checkCodeforces = await fetchLatestSubmissionsCodeForces(data.codeforcesUsername)
      if(!checkCodeforces) return toast.error("Invalid Codeforces Username")
      const signupResponse = await axios.post("/api/auth/signup", data, {
        headers: { "Content-Type": "application/json" }
      });
      if (signupResponse.status !== 200) {
        toast.error("Failed to create account. Please try again.");
        return;
      }
      toast.success("Signup successful!");
      Router.push('/auth/signin');
    } catch (error) {
      console.error("Signup Error:", error);
      toast.error("An error occurred during signup");
    } finally {
      setIsSubmitting(false);
    }
  };

  if(session) {
    Router.push('/user/dashboard')
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Large DSA Illustration */}
      <div className="hidden lg:flex lg:w-3/5 xl:w-2/3 relative bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-800 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-16 left-16 w-40 h-40 bg-emerald-500/20 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute bottom-32 right-16 w-56 h-56 bg-cyan-500/20 rounded-full blur-xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/3 left-1/4 w-32 h-32 bg-teal-400/20 rounded-full blur-lg animate-pulse delay-500"></div>
          <div className="absolute bottom-1/4 left-1/3 w-24 h-24 bg-blue-400/20 rounded-full blur-lg animate-pulse delay-700"></div>
        </div>
        
        {/* Complex DSA Visualization */}
        <div className="relative z-10 flex items-center justify-center w-full p-8">
          <div className="max-w-3xl">
            <svg viewBox="0 0 900 700" className="w-full h-auto opacity-90">
              {/* Graph Network */}
              <g className="opacity-80">
                {/* Nodes */}
                <circle cx="150" cy="150" r="20" fill="#10B981" className="drop-shadow-lg"/>
                <circle cx="300" cy="100" r="20" fill="#059669"/>
                <circle cx="450" cy="150" r="20" fill="#047857"/>
                <circle cx="250" cy="250" r="20" fill="#065F46"/>
                <circle cx="400" cy="300" r="20" fill="#064E3B"/>
                <circle cx="550" cy="200" r="20" fill="#10B981"/>
                
                {/* Edges */}
                <line x1="150" y1="150" x2="300" y2="100" stroke="#34D399" strokeWidth="2" className="opacity-70"/>
                <line x1="300" y1="100" x2="450" y2="150" stroke="#34D399" strokeWidth="2" className="opacity-70"/>
                <line x1="150" y1="150" x2="250" y2="250" stroke="#34D399" strokeWidth="2" className="opacity-70"/>
                <line x1="250" y1="250" x2="400" y2="300" stroke="#34D399" strokeWidth="2" className="opacity-70"/>
                <line x1="450" y1="150" x2="550" y2="200" stroke="#34D399" strokeWidth="2" className="opacity-70"/>
                <line x1="400" y1="300" x2="550" y2="200" stroke="#34D399" strokeWidth="2" className="opacity-70"/>
                
                {/* Node Labels */}
                <text x="150" y="157" textAnchor="middle" className="fill-white text-xs font-bold">A</text>
                <text x="300" y="107" textAnchor="middle" className="fill-white text-xs font-bold">B</text>
                <text x="450" y="157" textAnchor="middle" className="fill-white text-xs font-bold">C</text>
                <text x="250" y="257" textAnchor="middle" className="fill-white text-xs font-bold">D</text>
                <text x="400" y="307" textAnchor="middle" className="fill-white text-xs font-bold">E</text>
                <text x="550" y="207" textAnchor="middle" className="fill-white text-xs font-bold">F</text>
              </g>
              
              {/* Stack Visualization */}
              <g className="opacity-85">
                <text x="650" y="130" className="fill-cyan-300 text-lg font-bold">Stack</text>
                {[0,1,2,3,4].map((i) => (
                  <rect key={i} x="650" y={400 - i * 40} width="120" height="35" rx="4" 
                        fill={`hsl(${180 + i * 20}, 70%, ${40 + i * 10}%)`} 
                        stroke="#06B6D4" strokeWidth="1"/>
                ))}
                <text x="710" y="385" textAnchor="middle" className="fill-white text-sm font-bold">pop()</text>
                <text x="710" y="345" textAnchor="middle" className="fill-white text-sm font-bold">25</text>
                <text x="710" y="305" textAnchor="middle" className="fill-white text-sm font-bold">17</text>
                <text x="710" y="265" textAnchor="middle" className="fill-white text-sm font-bold">8</text>
                <text x="710" y="225" textAnchor="middle" className="fill-white text-sm font-bold">3</text>
              </g>
              
              {/* Sorting Algorithm Visualization */}
              <g className="opacity-80">
                <text x="100" y="450" className="fill-emerald-300 text-lg font-bold">Merge Sort</text>
                {[45, 12, 78, 23, 67, 34, 89, 56].map((val, i) => (
                  <rect key={i} x={100 + i * 35} y={600 - val} width="30" height={val} 
                        fill={`hsl(${160 + i * 15}, 60%, ${50 + i * 5}%)`} 
                        className="opacity-90"/>
                ))}
                {[45, 12, 78, 23, 67, 34, 89, 56].map((val, i) => (
                  <text key={i} x={115 + i * 35} y="630" textAnchor="middle" className="fill-white text-xs">{val}</text>
                ))}
              </g>
              
              {/* Hash Table */}
              <g className="opacity-75">
                <text x="450" y="450" className="fill-teal-300 text-lg font-bold">Hash Table</text>
                {[0,1,2,3,4].map((i) => (
                  <g key={i}>
                    <rect x="450" y={470 + i * 30} width="200" height="25" rx="3" 
                          fill="#0F766E" stroke="#14B8A6" strokeWidth="1"/>
                    <text x="460" y={487 + i * 30} className="fill-white text-xs">[{i}]</text>
                    <text x="500" y={487 + i * 30} className="fill-cyan-200 text-xs">
                      {i === 0 ? 'key1 → value1' : i === 2 ? 'key2 → value2' : ''}
                    </text>
                  </g>
                ))}
              </g>
              
              {/* Algorithm Complexity Notation */}
              <text x="50" y="80" className="fill-emerald-300 text-2xl font-mono opacity-70">O(n log n)</text>
              <text x="700" y="80" className="fill-cyan-300 text-2xl font-mono opacity-70">O(1)</text>
              <text x="350" y="380" className="fill-teal-300 text-xl font-mono opacity-70">O(V + E)</text>
              
              {/* Code Snippets */}
              <text x="50" y="350" className="fill-yellow-300 text-sm font-mono opacity-60">while(left &lt; right)</text>
              <text x="600" y="350" className="fill-orange-300 text-sm font-mono opacity-60">return dp[n]</text>
              
              {/* Decorative Elements */}
              <text x="80" y="200" className="fill-emerald-300 text-8xl font-mono opacity-30">{'{'}</text>
              <text x="750" y="500" className="fill-cyan-300 text-8xl font-mono opacity-30">{'}'}</text>
            </svg>
            
            {/* Platform Features */}
            <div className="flex justify-center space-x-8 mt-8">
              <div className="text-center">
                <div className="w-18 h-18 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center mb-3">
                  <Users className="w-9 h-9 text-emerald-300" />
                </div>
                <p className="text-white/80 text-sm font-medium">Collaborative</p>
              </div>
              <div className="text-center">
                <div className="w-18 h-18 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center mb-3">
                  <Trophy className="w-9 h-9 text-yellow-300" />
                </div>
                <p className="text-white/80 text-sm font-medium">Competitive</p>
              </div>
              <div className="text-center">
                <div className="w-18 h-18 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center mb-3">
                  <BookOpen className="w-9 h-9 text-blue-300" />
                </div>
                <p className="text-white/80 text-sm font-medium">Comprehensive</p>
              </div>
              <div className="text-center">
                <div className="w-18 h-18 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center mb-3">
                  <Brain className="w-9 h-9 text-purple-300" />
                </div>
                <p className="text-white/80 text-sm font-medium">Challenging</p>
              </div>
            </div>
            
            {/* Main Title */}
            <div className="text-center mt-10">
              <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">
                Join the Journey
                <span className="block text-3xl lg:text-4xl text-emerald-300 mt-2">to DSA Mastery</span>
              </h1>
              <p className="text-white/70 text-lg max-w-lg mx-auto leading-relaxed">
                Connect with peers, track your progress, and master algorithms with our comprehensive learning platform.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right Side - Sign Up Form */}
      <div className="w-full lg:w-2/5 xl:w-1/3 flex items-center justify-center p-6 bg-white overflow-y-auto">
        <div className="w-full max-w-md">
          <Card className="border-0 shadow-none">
            <CardHeader className="text-center pb-6">
              <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                <UserPlus className="w-6 h-6 text-emerald-600" />
                Create Your Account
              </CardTitle>
              <CardDescription className="text-gray-600">
                Join our platform with your college credentials
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium">Username</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Choose a unique username" 
                            className="h-11 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium">College Email</FormLabel>
                        <FormControl>
                          <Input
                            className="h-11 border-gray-200 bg-gray-50"
                            {...field} 
                            disabled
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium">Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type={isPasswordVisible ? "text" : "password"}
                              placeholder="Strong password" 
                              className="h-11 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 pr-10"
                              {...field} 
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9"
                              onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                            >
                              {isPasswordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="leetcodeUsername"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium text-sm">LeetCode</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Username" 
                              className="h-11 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="codeforcesUsername"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium text-sm">Codeforces</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Username" 
                              className="h-11 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="enrollmentNum"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium text-sm">Enrollment No.</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="College ID" 
                              className="h-11 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="section"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium text-sm">Section</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="h-11 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500">
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {['A', 'B', 'C', 'D', 'E'].map((sec) => (
                                <SelectItem key={sec} value={sec}>
                                  Section {sec}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-all duration-200 mt-6"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Creating Account..." : "Create Account"}
                  </Button>
                </form>
              </Form>
              
              
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
