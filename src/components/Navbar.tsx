'use client'
import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { signIn, signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
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
  Brain
} from 'lucide-react';
import useTagStore from '@/store/tagsStore';
import useStore from '@/store/store';
import useMessageStore from '@/store/messages';
import useDemo from '@/store/demoCreds';

const Navbar = () => {
  const router = useRouter();
  const { status } = useSession();
  const { isAdmin, setIsAdmin, setDarkMode } = useStore();
  const { username, setUsername } = useMessageStore();
  const { setTags } = useTagStore()
  const { setCreds } = useDemo()
  const { isDarkMode } = useStore();

  
  useEffect(() => {
    const checkIfAdmin = async () => {
      try {
        const [adminResponse, usernameResponse] = await Promise.all([
          axios.post('/api/checkIfAdmin'),
          axios.post('/api/getUsername')
        ]);
        //  const usernames = await axios.get<{
        //     leetcodeUsername: string;
        //     codeforcesUsername: string;  
        //   }>('/api/user/username');

        // setPUsernames(usernames.data)
        
        setUsername(usernameResponse.data.username);
        setIsAdmin(adminResponse.data.isAdmin);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    if (status === 'authenticated') {
      checkIfAdmin();
    }
  }, [status, setIsAdmin]);
  const fn = async () => {
    const res = await axios.get('/api/getTags')
    //@ts-expect-error: not needed here.
    const tags = res.data.map((p) => p.name)
    setTags(tags)
  }

  useEffect(() => {
    fn()
  }, []);


  const navigationItems = [
    { href: '/user/dashboard', label: 'Home', icon: Home, color: 'text-indigo-500' },
    { href: '/groupCreation', label: 'Teams', icon: Users, color: 'text-amber-500' },
    { href: '/leaderboard/user', label: 'Leaderboard', icon: Trophy, color: 'text-teal-500' },
    { href: '/arena', label: 'Arena', icon: Swords, color: 'text-rose-500' },
    { href: '/contestsPage', label: 'Contests', icon: LucideSword, color: 'text-blue-500' }
  ];

  const handleSignOut = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setCreds({ username: "", password: "" })
    try {
      await signOut({ redirect: false });
      router.push('/');
    } catch (error) {
      console.error('Error during sign out:', error);
    }
  };

  if(status === "unauthenticated"){
    return <div/>

  }

  return (
  <nav className={`fixed top-0 left-0 w-full h-16 z-50 flex items-center justify-between px-4 md:px-8 border-b shadow-sm transition-colors duration-300 ${
    isDarkMode 
      ? 'bg-gray-800/95 backdrop-blur supports-[backdrop-filter]:bg-gray-800/60 border-gray-700' 
      : 'bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-gray-200'
  }`}>
    <div className="flex items-center space-x-4">
      <Link href={'/'}>
        <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-teal-500 bg-clip-text text-transparent">
          AlgoJourney
        </span>
      </Link>
    </div>

    {status === 'authenticated' ? (
      <div className="flex items-center space-x-2 md:space-x-4">
        <div className="hidden md:flex items-center space-x-1">
          {navigationItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button variant="ghost" className={`flex items-center space-x-1 ${
                isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
              }`}>
                <item.icon className={`h-4 w-4 ${item.color}`} />
                <span className={`font-medium ${
                  isDarkMode ? 'text-gray-200' : 'text-gray-700'
                }`}>{item.label}</span>
              </Button>
            </Link>
          ))}
          <Button
            onClick={() => setDarkMode(!isDarkMode)}
            variant={!isDarkMode ? "outline" : "ghost"}
            size="sm"
            className={`${
              isDarkMode 
                ? 'border-gray-600 text-indigo-400 hover:bg-gray-700' 
                : 'border-indigo-200 text-indigo-700 hover:bg-indigo-50'
            }`}
          >
            {isDarkMode ? '☀️' : '🌙'}
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className={`flex items-center gap-2 px-3 ${
                isDarkMode 
                  ? 'border-gray-600 hover:bg-gray-700 bg-gray-800' 
                  : 'border-gray-200 hover:bg-gray-50 bg-white'
              }`}>
                <div className={`h-8 w-8 rounded-full flex items-center justify-center font-medium ${
                  isDarkMode 
                    ? 'bg-gray-700 text-indigo-400' 
                    : 'bg-indigo-100 text-indigo-700'
                }`}>
                  {username?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <span className={`text-sm font-medium hidden sm:inline-block ${
                  isDarkMode ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  {username}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className={`w-56 shadow-lg rounded-lg p-1 ${
              isDarkMode 
                ? 'bg-gray-800 border-gray-600' 
                : 'bg-white border-gray-100'
            }`}>
              <DropdownMenuLabel className="px-3 py-2">
                <div className="flex flex-col space-y-1">
                  <p className={`text-sm font-medium ${
                    isDarkMode ? 'text-gray-200' : 'text-gray-800'
                  }`}>Hi, {username}</p>
                  <p className={`text-xs ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>Logged in</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className={isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} />
              
              <div className="md:hidden py-1">
                {navigationItems.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <DropdownMenuItem className={`px-3 py-2 cursor-pointer ${
                      isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                    }`}>
                      <item.icon className={`mr-2 h-4 w-4 ${item.color}`} />
                      <span className={isDarkMode ? 'text-gray-200' : 'text-gray-700'}>{item.label}</span>
                    </DropdownMenuItem>
                  </Link>
                ))}
                
                <DropdownMenuSeparator className={isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} />
              </div>

              {isAdmin && (
                <>
                  <Link href="/admin/dashboard">
                    <DropdownMenuItem className={`px-3 py-2 cursor-pointer ${
                      isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                    }`}>
                      <ShieldCheck className="mr-2 h-4 w-4 text-indigo-500" />
                      <span className={isDarkMode ? 'text-gray-200' : 'text-gray-700'}>Admin Dashboard</span>
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/admin/Stats">
                    <DropdownMenuItem className={`px-3 py-2 cursor-pointer ${
                      isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                    }`}>
                      <ChartNoAxesColumnIcon className="mr-2 h-4 w-4 text-teal-500" />
                      <span className={isDarkMode ? 'text-gray-200' : 'text-gray-700'}>Stats</span>
                    </DropdownMenuItem>
                  </Link>
                 
                  <DropdownMenuSeparator className={isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} />
                </>
                
              )}

                 <Link href={'/chat/false'}>
                    <DropdownMenuItem className={`px-3 py-2 cursor-pointer ${
                      isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                    }`}>
                      <Brain className="mr-2 h-4 w-4 text-amber-500" />
                      <span className={isDarkMode ? 'text-gray-200' : 'text-gray-700'}>Chat/Rate with Gemini</span>
                    </DropdownMenuItem>
                  </Link>
               
                  <Link href='/about'>
                    <DropdownMenuItem className={`px-3 py-2 cursor-pointer ${
                      isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                    }`}>
                      <Info className="mr-2 h-4 w-4 text-blue-500" />
                      <span className={isDarkMode ? 'text-gray-200' : 'text-gray-700'}>About AlgoJourney</span>
                    </DropdownMenuItem>
                  </Link>
              
              <Link href={`/user/updateProfile/${username}`}>
                <DropdownMenuItem className={`px-3 py-2 cursor-pointer ${
                  isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                }`}>
                  <UserCog className={`mr-2 h-4 w-4 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`} />
                  <span className={isDarkMode ? 'text-gray-200' : 'text-gray-700'}>Profile</span>
                </DropdownMenuItem>
              </Link>
            
              <DropdownMenuItem 
                className={`px-3 py-2 cursor-pointer ${
                  isDarkMode ? 'hover:bg-rose-900/50' : 'hover:bg-rose-50'
                }`}
                //@ts-expect-error: don't know what to do here
                onSelect={(e) => handleSignOut(e)}
              >
                <LogOut className="mr-2 h-4 w-4 text-rose-500" />
                <span className={`font-medium ${
                  isDarkMode ? 'text-rose-400' : 'text-rose-600'
                }`}>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    ) : (
      <Button 
        variant="default" 
        onClick={() => signIn()} 
        className={`shadow-sm transition-all flex items-center space-x-2 ${
          isDarkMode 
            ? 'bg-indigo-500 hover:bg-indigo-400 text-white' 
            : 'bg-indigo-500 hover:bg-indigo-600 text-white'
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
