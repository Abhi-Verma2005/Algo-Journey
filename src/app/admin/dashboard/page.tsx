'use client';
import AllQuestions from '@/components/AllQuestions';
import FeedbackManagement from '@/components/FeedbackManagement';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import axios from 'axios';
import { redirect } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { MessageSquare, ListChecks } from 'lucide-react';

function Page() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const res = await axios.post('../api/checkIfAdmin');
        if (res.data.isAdmin) {
          console.log(res.data.isAdmin);
          setIsAdmin(true);
        } else {
          redirect('/user/dashboard');
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        redirect('/user/dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    checkAdmin();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-8 pt-20">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage questions, feedback, and system settings</p>
        </div>

        {isAdmin && (
          <Tabs defaultValue="questions" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
              <TabsTrigger value="questions" className="flex items-center gap-2">
                <ListChecks className="h-4 w-4" />
                Questions
              </TabsTrigger>
              <TabsTrigger value="feedback" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Feedback
              </TabsTrigger>
            </TabsList>

            <TabsContent value="questions" className="mt-0">
              <AllQuestions />
            </TabsContent>

            <TabsContent value="feedback" className="mt-0">
              <FeedbackManagement />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}

export default Page;