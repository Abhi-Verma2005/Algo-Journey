'use client'
import React, { useCallback, useEffect } from 'react';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { User, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import axios from 'axios';
import toast from 'react-hot-toast';
import Profile from '@/components/Profile';
import { useParams } from 'next/navigation';
import useStore from '@/store/store';

type UserProfile = {
  username: string;
  email: string;
  leetcodeUsername: string | null;
  codeforcesUsername: string | null;
  section: string;
  enrollmentNum: string;
  profileUrl: string | null;
  individualPoints: number;
  oldPassword?: string;
  newPassword?: string;
};

const ProfilePage = () => {
  const [profile, setProfile] = useState<UserProfile>({
    username: "john_doe",
    email: "john@example.com",
    leetcodeUsername: "leetcoder123",
    codeforcesUsername: "coder456",
    section: "A1",
    enrollmentNum: "2021CS1234",
    profileUrl: "https://example.com/profile",
    individualPoints: 150
  });

  const { isDarkMode } = useStore()
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [ifCurrentUser, setIfCurrentUser] = useState(false);
  const params = useParams();

 

  const getInitialDetails = useCallback(async() => {
    try {
      setIsLoading(true);
      const res = await axios.get('/api/user/getDetails');
      
      if(!res.data.user) return;
      
      setProfile(res.data.user);
      
      if (Array.isArray(params?.username)) return;

      const username = decodeURIComponent(params?.username as string || '');

      if (res.data.user.username === username) {
        setIfCurrentUser(true);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error('Failed to load profile data');
    } finally {
      setIsLoading(false);
    }
  }, [params?.username]);

  useEffect(() => {
    getInitialDetails();
  }, [getInitialDetails]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const dataToSend = { ...profile };
      
      if (profile.oldPassword && profile.newPassword) {
        dataToSend.oldPassword = profile.oldPassword;
        dataToSend.newPassword = profile.newPassword;
      } else {
        delete dataToSend.oldPassword;
        delete dataToSend.newPassword;
      }

      const res = await axios.patch('/api/user/updateProfile', {
        profile: dataToSend
      });

      if(res.status === 200){
        toast.success('Changes Saved, LogIn again!');
      }
      setSuccessMessage("Profile updated successfully!");
      setIsEditing(false);
      setShowPasswordFields(false);
      
      setProfile(prev => ({
        ...prev,
        oldPassword: '',
        newPassword: ''
      }));
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error('Some Error Occurred');
    } finally {
      setIsSaving(false);
    }
  };

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="container mx-auto py-8 max-w-2xl mt-12">
      <Card className="w-full border dark:border-gray-700 bg-white dark:bg-gray-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-gray-200 dark:bg-gray-700 p-3 rounded-full animate-pulse">
                <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded"></div>
              </div>
              <div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2 animate-pulse"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse"></div>
              </div>
            </div>
            <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </div>
            ))}
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      {ifCurrentUser && (
        <div className="container mx-auto py-8 max-w-2xl">
          <Card className="w-full border mt-12 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-none transition-colors duration-300">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="bg-primary/10 dark:bg-primary/20 p-3 rounded-full transition-colors duration-300">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-gray-900 dark:text-gray-100">Profile Settings</CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-400">
                      View and update your profile information
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {successMessage && (
                <Alert className="mb-6 bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 transition-colors duration-300">
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    {successMessage}
                  </AlertDescription>
                </Alert>
              )}
              
              {!isEditing ? (
                <div className="space-y-6">
                  <div className="grid gap-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border dark:border-gray-600 transition-colors duration-300">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Current Profile</h3>
                      <div className="grid gap-3 text-sm">
                        <div><span className="font-medium text-gray-700 dark:text-gray-300">Username:</span> <span className="text-gray-900 dark:text-gray-100">{profile.username}</span></div>
                        <div><span className="font-medium text-gray-700 dark:text-gray-300">Email:</span> <span className="text-gray-900 dark:text-gray-100">{profile.email}</span></div>
                        <div><span className="font-medium text-gray-700 dark:text-gray-300">Section:</span> <span className="text-gray-900 dark:text-gray-100">{profile.section}</span></div>
                        <div><span className="font-medium text-gray-700 dark:text-gray-300">Enrollment:</span> <span className="text-gray-900 dark:text-gray-100">{profile.enrollmentNum}</span></div>
                        <div><span className="font-medium text-gray-700 dark:text-gray-300">Points:</span> <span className="text-gray-900 dark:text-gray-100">{profile.individualPoints}</span></div>
                      </div>
                    </div>
                  </div>
                  <Button 
                  variant={isDarkMode ? "outline" : "ghost"}
                    onClick={() => setIsEditing(true)}
                  >
                    Edit Profile
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="username" className="text-gray-700 dark:text-gray-300">Username</Label>
                      <Input
                        id="username"
                        name="username"
                        value={profile.username}
                        onChange={handleInputChange}
                        placeholder="Enter your username"
                        className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-300"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={profile.email}
                        onChange={handleInputChange}
                        placeholder="Enter your email"
                        className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-300"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="leetcodeUsername" className="text-gray-700 dark:text-gray-300">LeetCode Username</Label>
                      <Input
                        id="leetcodeUsername"
                        name="leetcodeUsername"
                        value={profile.leetcodeUsername || ""}
                        onChange={handleInputChange}
                        placeholder="Enter your LeetCode username"
                        className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-300"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="codeforcesUsername" className="text-gray-700 dark:text-gray-300">CodeForces Username</Label>
                      <Input
                        id="codeforcesUsername"
                        name="codeforcesUsername"
                        value={profile.codeforcesUsername || ""}
                        onChange={handleInputChange}
                        placeholder="Enter your CodeForces username"
                        className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-300"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="section" className="text-gray-700 dark:text-gray-300">Section</Label>
                      <Select 
                        value={profile.section}
                        onValueChange={(value) => setProfile(prev => ({ ...prev, section: value }))}
                      >
                        <SelectTrigger className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors duration-300">
                          <SelectValue placeholder="Select your section" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                          <SelectItem value="A" className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700">A</SelectItem>
                          <SelectItem value="B" className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700">B</SelectItem>
                          <SelectItem value="C" className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700">C</SelectItem>
                          <SelectItem value="D" className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700">D</SelectItem>
                          <SelectItem value="E" className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700">E</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="enrollmentNum" className="text-gray-700 dark:text-gray-300">Enrollment Number</Label>
                      <Input
                        id="enrollmentNum"
                        name="enrollmentNum"
                        value={profile.enrollmentNum}
                        onChange={handleInputChange}
                        placeholder="Enter your enrollment number"
                        className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-300"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="profileUrl" className="text-gray-700 dark:text-gray-300">Profile URL</Label>
                      <Input
                        id="profileUrl"
                        name="profileUrl"
                        value={profile.profileUrl || ""}
                        onChange={handleInputChange}
                        placeholder="Enter your profile URL"
                        className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-300"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label className="text-gray-700 dark:text-gray-300">Individual Points</Label>
                      <Input
                        value={profile.individualPoints}
                        disabled
                        className="bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 transition-colors duration-300"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Button 
                        type="button" 
                        variant={isDarkMode ? "outline" : "ghost"}
                        onClick={() => setShowPasswordFields(!showPasswordFields)}
                      >
                        {showPasswordFields ? "Hide Password Fields" : "Change Password"}
                      </Button>
                    </div>

                    {showPasswordFields && (
                      <>
                        <div className="grid gap-2">
                          <Label htmlFor="oldPassword" className="text-gray-700 dark:text-gray-300">Current Password</Label>
                          <Input
                            id="oldPassword"
                            name="oldPassword"
                            type="password"
                            value={profile.oldPassword || ""}
                            onChange={handleInputChange}
                            placeholder="Enter your current password"
                            className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-300"
                          />
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="newPassword" className="text-gray-700 dark:text-gray-300">New Password</Label>
                          <Input
                            id="newPassword"
                            name="newPassword"
                            type="password"
                            value={profile.newPassword || ""}
                            onChange={handleInputChange}
                            placeholder="Enter your new password"
                            className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-300"
                          />
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex justify-end space-x-4">
                    <Button 
                      type="button" 
                      variant={isDarkMode ? "outline" : "ghost"}
                      onClick={() => {
                        setIsEditing(false);
                        setSuccessMessage("");
                        setShowPasswordFields(false);
                        setProfile(prev => ({
                          ...prev,
                          oldPassword: '',
                          newPassword: ''
                        }));
                      }}
                      disabled={isSaving}
                    >
                      Cancel
                    </Button>
                    <Button 
                    variant={isDarkMode ? "outline" : "ghost"}
                      type="submit"
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      )}
      <>
        <Profile isDarkMode={isDarkMode}/>
      </>
    </div>
  );
};

export default ProfilePage;