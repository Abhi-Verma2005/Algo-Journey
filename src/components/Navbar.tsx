"use client";
import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Home,
  Users,
  Trophy,
  Swords,
  Info,
  LogOut,
  Settings,
  ShieldCheck,
  ChartNoAxesColumnIcon,
  UserCog,
  LucideSword,
  Brain,
  User,
} from "lucide-react";
import useTagStore from "@/store/tagsStore";
import useStore from "@/store/store";
import useMessageStore from "@/store/messages";
import useDemo from "@/store/demoCreds";
import { AnimatedGradientText } from "./ui/animated-gradient-text";

const Navbar = () => {
  const router = useRouter();
  const { status } = useSession();
  const { isAdmin, setIsAdmin, setDarkMode } = useStore();
  const { username, setUsername } = useMessageStore();
  const { setTags } = useTagStore();
  const { setCreds } = useDemo();
  const { isDarkMode } = useStore();

  useEffect(() => {
    const checkIfAdmin = async () => {
      try {
        const [adminResponse, usernameResponse] = await Promise.all([
          axios.post("/api/checkIfAdmin"),
          axios.post("/api/getUsername"),
        ]);
        //  const usernames = await axios.get<{
        //     leetcodeUsername: string;
        //     codeforcesUsername: string;
        //   }>('/api/user/username');

        // setPUsernames(usernames.data)

        setUsername(usernameResponse.data.username);
        setIsAdmin(adminResponse.data.isAdmin);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    if (status === "authenticated") {
      checkIfAdmin();
    }
  }, [status, setIsAdmin]);
  const fn = async () => {
    const res = await axios.get("/api/getTags");
    //@ts-expect-error: not needed here.
    const tags = res.data.map((p) => p.name);
    setTags(tags);
  };

  useEffect(() => {
    fn();
  }, []);

  const navigationItems = [
    {
      href: "/user/dashboard",
      label: "Home",
      icon: Home,
      color: "text-indigo-500",
    },
    {
      href: "/groupCreation",
      label: "Teams",
      icon: Users,
      color: "text-amber-500",
    },
    {
      href: "/leaderboard/user",
      label: "Leaderboard",
      icon: Trophy,
      color: "text-teal-500",
    },
    { href: "/arena", label: "Arena", icon: Swords, color: "text-rose-500" },
    {
      href: "/contestsPage",
      label: "Contests",
      icon: LucideSword,
      color: "text-blue-500",
    },
  ];

  const handleSignOut = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setCreds({ username: "", password: "" });
    try {
      await signOut({ redirect: false });
      router.push("/");
    } catch (error) {
      console.error("Error during sign out:", error);
    }
  };

  if (status === "unauthenticated") {
    return <div />;
  }

  return (
    <nav
      className={`fixed top-0 left-0 w-full h-16 z-50 flex items-center justify-between px-4 md:px-8 transition-colors duration-300 ${
        isDarkMode
          ? "bg-[#0A0A0A]"
          : "bg-white border-white"
      }`}
    >
      <div className="flex items-center space-x-4">
        <Link href={"/"}>
          <AnimatedGradientText
            className="text-xl font-bold tracking-tight"
            speed={1}
          >
            AlgoJourney
          </AnimatedGradientText>
        </Link>
      </div>

      {status === "authenticated" ? (
        <div className="flex items-center space-x-2 md:space-x-4">
          <div className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  className={`flex items-center space-x-1 ${
                    isDarkMode ? "hover:bg-[#1c1c1c]" : "hover:bg-zinc-200"
                  }`}
                >
                  <item.icon className={`h-4 w-4 ${item.color}`} />
                  <span
                    className={`font-medium ${
                      isDarkMode ? "text-gray-200" : "text-gray-700"
                    }`}
                  >
                    {item.label}
                  </span>
                </Button>
              </Link>
            ))}
            <Button
              onClick={() => setDarkMode(!isDarkMode)}
              variant="ghost"
              size="sm"
              aria-pressed={isDarkMode}
              aria-label="Toggle dark mode"
              className={`relative w-14 h-8 p-0 rounded-full transition-colors duration-300 flex items-center focus:outline-none focus:ring-offset-1 ${
                isDarkMode
                  ? "bg-[#262626] hover:bg-[#262626]"
                  : "bg-zinc-100"
              }`}
            >
              <span className="sr-only">Toggle dark mode</span>

              {/* sliding knob */}
              <span
                className={`absolute left-1 top-1 w-6 h-6 rounded-full flex items-center justify-center text-sm transition-transform duration-300 ${
                  isDarkMode
                    ? "translate-x-6 bg-zinc-900 text-yellow-300"
                    : "translate-x-0 bg-zinc-200 text-yellow-600"
                }`}
              >
                {isDarkMode ? "🌙" : "🌝"}
              </span>

              {/* subtle decorative icons for context (non-interactive) */}
              {/* <span className="pointer-events-none absolute left-2 text-xs opacity-0 md:opacity-100 text-yellow-600">
              🌞
              </span>
              <span className="pointer-events-none absolute right-2 text-xs opacity-0 md:opacity-100 text-gray-300">
              🌙
              </span> */}
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className={`flex items-center rounded-xl gap-2 px-2 shadow-none ${
                    isDarkMode
                      ? "border-zinc-900 hover:bg-zinc-900 bg-[#262626]"
                      : "border-gray-200 hover:bg-gray-50 bg-zinc-100"
                  }`}
                >
                  <div
                    className={`h-6 w-6 rounded-full flex items-center justify-center font-medium ${
                      isDarkMode
                        ? "bg-[#3C3C3C] text-green-500"
                        : "bg-zinc-200 text-zinc-700"
                    }`}
                  >
                    {username?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                  <span
                    className={`text-sm font-medium hidden sm:inline-block ${
                      isDarkMode ? "text-gray-200" : "text-gray-700"
                    }`}
                  >
                    {username}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className={`w-52 rounded-lg p-1 ${
                  isDarkMode
                    ? "bg-[#262626] border-[#3C3C3C]"
                    : "bg-white border-gray-100"
                }`}
              >
                <DropdownMenuLabel className="px-3 py-2">
                  <div className="flex flex-col space-y-1">
                    <p
                      className={`text-sm font-medium ${
                        isDarkMode ? "text-gray-100" : "text-gray-800"
                      }`}
                    >
                      Hi, {username}
                    </p>
                    <p
                      className={`text-xs ${
                        isDarkMode ? "text-zinc-400" : "text-gray-500"
                      }`}
                    >
                      Logged in
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator
                  className={isDarkMode ? "bg-[#3C3C3C]" : "bg-gray-100"}
                />

                <div className="md:hidden py-1">
                  {navigationItems.map((item) => (
                    <Link key={item.href} href={item.href}>
                      <DropdownMenuItem
                        className={`flex justify-between cursor-pointer ${
                          isDarkMode ? "focus:bg-[#404040]" : "hover:bg-gray-50"
                        }`}
                      >
                        
                        <span
                          className={
                            isDarkMode ? "text-gray-200" : "text-gray-700"
                          }
                        >
                          {item.label}
                        </span>
                        <item.icon className={`h-4 w-4 text-[#8d8d8d]`} />
                      </DropdownMenuItem>
                    </Link>
                  ))}

                  <DropdownMenuSeparator
                    className={isDarkMode ? "bg-[#3C3C3C]" : "bg-gray-100"}
                  />
                </div>

                {isAdmin && (
                  <>
                    <Link href="/admin/dashboard">
                      <DropdownMenuItem
                        className={`flex justify-between cursor-pointer ${
                          isDarkMode ? "focus:bg-[#404040]" : "hover:bg-gray-50"
                        }`}
                      >
                        
                        <span
                          className={
                            isDarkMode ? "text-white" : "text-gray-700"
                          }
                        >
                          Admin Dashboard
                        </span>
                        <ShieldCheck className=" h-4 w-4 text-[#8d8d8d]" />
                      </DropdownMenuItem>
                    </Link>
                    <Link href="/admin/Stats">
                      <DropdownMenuItem
                        className={`flex justify-between cursor-pointer ${
                          isDarkMode ? "focus:bg-[#404040]" : "hover:bg-gray-50"
                        }`}
                      >
                        
                        <span
                          className={
                            isDarkMode ? "text-white" : "text-gray-700"
                          }
                        >
                          Stats
                        </span>
                        <ChartNoAxesColumnIcon className="h-4 w-4 text-[#8d8d8d]" />
                      </DropdownMenuItem>
                    </Link>

                    <DropdownMenuSeparator
                      className={isDarkMode ? "bg-[#3C3C3C]" : "bg-gray-100"}
                    />
                  </>
                )}

                <Link href={"/chat/false"}>
                  <DropdownMenuItem
                    className={`flex justify-between cursor-pointer ${
                      isDarkMode ? "focus:bg-[#404040]" : "hover:bg-gray-50"
                    }`}
                  >
                    
                    <span
                      className={isDarkMode ? "text-white" : "text-gray-700"}
                    >
                      Chat/Rate with Gemini
                    </span>
                    <Brain className="h-4 w-4 text-[#8d8d8d]" />
                  </DropdownMenuItem>
                </Link>

                <Link href="/about">
                  <DropdownMenuItem
                    className={`flex justify-between cursor-pointer ${
                      isDarkMode ? "focus:bg-[#404040]" : "hover:bg-gray-50"
                    }`}
                  >
                    
                    <span
                      className={isDarkMode ? "text-white" : "text-gray-700"}
                    >
                      About AlgoJourney
                    </span>
                    <Info className="h-4 w-4 text-[#8d8d8d]" />
                  </DropdownMenuItem>
                </Link>

                <Link href={`/user/updateProfile/${username}`}>
                  <DropdownMenuItem
                    className={`flex justify-between cursor-pointer ${
                      isDarkMode ? "focus:bg-[#404040]" : "hover:bg-gray-50"
                    }`}
                  >
                    
                    <span
                      className={isDarkMode ? "text-white" : "text-gray-700"}
                    >
                      Profile
                    </span>
                    <User
                      className='h-4 w-4 text-[#8d8d8d]'
                    />
                  </DropdownMenuItem>
                </Link>

                <DropdownMenuItem
                  className={`flex justify-between cursor-pointer ${
                    isDarkMode ? "focus:bg-[#404040]" : "hover:bg-rose-50"
                  }`}
                  //@ts-expect-error: don't know what to do here
                  onSelect={(e) => handleSignOut(e)}
                >
                  
                  <span
                    className='text-red-500'
                  >
                    Sign out
                  </span>
                  <LogOut className="h-4 w-4 text-red-500" />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      ) : (
        <Button
          variant="default"
          onClick={() => signIn()}
          className={`rounded-xl transition-all flex items-center space-x-2 ${
            isDarkMode
              ? "bg-[#262626] text-white"
              : "bg-zinc-200 text-black"
          }`}
        >
          <Settings className="h-4 w-4" />
          <span>Sign In</span>
        </Button>
      )}
    </nav>
  );
};

export default Navbar;
