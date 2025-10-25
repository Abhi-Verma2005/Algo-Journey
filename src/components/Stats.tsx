'use client'
import React, { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import toast from 'react-hot-toast';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Users, UserCheck, Award, Target, ChevronRight } from 'lucide-react';
import useStore from '@/store/store';
import SearchBar, { ServerSideSearchConfig } from './SearchBarGenX';

interface User {
  id: string;
  username: string;
  email: string;
  section: string;
  group: {
    name: string
  };
  leetcodeUsername: string;
  codeforcesUsername: string;
  individualPoints: number;
  createdAt: Date;
  updatedAt: Date;
}

const StatsCard = ({ 
  title, 
  value, 
  description, 
  icon, 
  loading, 
  color 
}: { 
  title: string, 
  value: string, 
  description: string, 
  icon: React.ReactNode, 
  loading: boolean,
  color: string 
}) => (
  <Card className={`bg-white border-l-4 ${color} shadow-none hover:shadow-none transition-all`}>
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
        {icon}
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent>
      {loading ? (
        <Skeleton className="h-8 w-[100px]" />
      ) : (
        <>
          <div className="text-3xl font-bold text-gray-800">{value}</div>
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        </>
      )}
    </CardContent>
  </Card>
);



const UserList = ({ loading, users }: { loading: boolean, users: User[] }) => {
  const { isAdmin } = useStore()
  
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {users && users.length > 0 ? users.map((u) => (
        <Card key={u.id} className="bg-white/90 shadow-none hover:shadow-none transition-all border-gray-100">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
              {u.username.charAt(0).toUpperCase()}
              </div>
              <div className="space-y-1">
                {isAdmin ? <Link href={`/user/updateProfile/${u.username}`} target='_blank'>
                  <h4 className="font-medium text-indigo-700 hover:text-indigo-800 transition-colors">{u.email.split('@nst')[0].split('.')[0].toUpperCase()} {u.email.split('@nst')[0].split('.')[1].split('2024')[0].toUpperCase()}</h4>
                </Link> : <h4 className="font-medium text-indigo-700 hover:text-indigo-800 transition-colors">{u.email.split('@nst')[0].split('.')[0].toUpperCase()} {u.email.split('@nst')[0].split('.')[1].split('2024')[0].toUpperCase()}</h4>}
                <p className="text-sm text-gray-600">Section {u.section}</p>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                    {u.individualPoints} points
                  </span>
                  <span className="text-sm text-gray-500">{u.email}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )) : (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-100 shadow-none">
          <p className="text-gray-600">No users found</p>
        </div>
      )}
    </div>
  );
};

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>(users);
  const [numbers, setNumbers] = useState({
    totalUsers: 0,
    totalGroups: 0,
    activeContests: 0
  });
  const router = useRouter();
  const { isAdmin } = useStore()

  const getNumbers = useCallback(async () => {
    try {
      setLoading(true);
      if(!isAdmin) return 
      const response = await axios.post('/api/getNumbers');
      setNumbers({
        totalUsers: response.data.totalUsers,
        totalGroups: response.data.totalGroups,
        activeContests: response.data.totalContests
      });
      setUsers(response.data.usersArray);
      setFilteredUsers(response.data.usersArray);
    } catch (error) {
      console.log(error);
      toast.error('Some error occurred');
    } finally {
      setLoading(false);
    }
  }, [router, setUsers, setNumbers]);

  useEffect(() => {
    getNumbers();
  }, [getNumbers]);

  const serverConfig: ServerSideSearchConfig<string> = {
    mode: "serverSide",
    endpoint: '/api/getNumbers/users/search',
    debounceMs: 300,
    minQueryLength: 2,
    responsePath: "formattedUsers",
    placeholder: 'Search users...',
    onResultSelect: async (name: string) => {
      try {
        const res = await axios.post('/api/getNumbers/users/search/result', { name })
        if(res.status !== 200) {
          toast.error('Some error occured while searching')
        }
        setFilteredUsers(res.data.formattedUsers)
      } catch (error) {
        console.error('Error in onResultSelect function in allquestions: ', error)
      }
    },
  renderItem: (userName: string) => (
    <div className="flex flex-col">
      <span className="font-medium">{userName}</span>
    </div>
  )
}

  return (
    <div className="min-h-screen bg-gray-50"> 
      <div className="container mx-auto p-8 pt-20 space-y-8">
        {/* Welcome header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Admin <span className="text-indigo-600">Dashboard</span>
            </h1>
            <p className="text-gray-600 mt-1">Monitor platform activity and manage users</p>
          </div>
         
          <Button className='bg-indigo-600 text-white' onClick={() => router.push('/leaderboard/admin')} variant="link" size="sm">Arena Leaderboard <ChevronRight className="h-6 w-6 text-white" /></Button>
        </div>
        
        {/* Stats cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <StatsCard
            title="Total Users"
            value={numbers.totalUsers.toString()}
            description="Active students"
            icon={<Users className="h-4 w-4 text-blue-500" />}
            loading={loading}
            color="border-l-blue-400"
          />
          <StatsCard
            title="Total Teams"
            value={numbers.totalGroups.toString()}
            description="Active groups"
            icon={<UserCheck className="h-4 w-4 text-amber-500" />}
            loading={loading}
            color="border-l-amber-400"
          />
          <StatsCard
            title="All Contests"
            value={numbers.activeContests.toString()}
            description="Platform contests"
            icon={<Award className="h-4 w-4 text-rose-500" />}
            loading={loading}
            color="border-l-rose-400"
          />
        </div>

        {/* Main Content Tabs */}
        <Card className="bg-white/90 shadow-none border-gray-100">
          <CardHeader className="border-b border-gray-100 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Target className="h-5 w-5 text-indigo-500" />
                  Student Management
                </CardTitle>
                <CardDescription className="text-gray-500">
                  View and manage all registered students
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="mb-6">
              <SearchBar 
              config={serverConfig}
              />
            </div>
            <ScrollArea className="h-[550px] pr-4">
              <UserList loading={loading} users={filteredUsers} />
            </ScrollArea>
          </CardContent>
          <CardFooter className="border-t border-gray-100 pt-4">
            <div className="text-sm text-gray-500">
              Showing {filteredUsers.length} of {users.length} users
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;