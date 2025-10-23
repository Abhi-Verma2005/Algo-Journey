'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { X, AlertCircle } from 'lucide-react';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import useStore from '@/store/store';

interface CodeforcesApiBannerProps {
  onClose?: () => void;
}

const CodeforcesApiBanner: React.FC<CodeforcesApiBannerProps> = ({ onClose }) => {
  const { data: session } = useSession();
  const [username, setUsername] = useState<string>('');
  const { isDarkMode } = useStore();

  useEffect(() => {
    const fetchUsername = async () => {
      if (session?.user?.email) {
        try {
          const response = await axios.post('/api/getUsername');
          setUsername(response.data.username);
        } catch (error) {
          console.error('Error fetching username:', error);
        }
      }
    };

    fetchUsername();
  }, [session?.user?.email]);

  const profileLink = username ? `/user/updateProfile/${username}` : '/user/updateProfile';

  return (
    <div className={`rounded-2xl ${isDarkMode ? "bg-[#262626]" : "bg-zinc-100"}`}>
      <div className="max-w-7xl mx-auto py-2 px-4">
        <div className="flex items-center justify-between flex-wrap">
          <div className="w-0 flex-1 flex items-center">
            <span className={`flex p-2 rounded-2xl ${isDarkMode ? "bg-[#404040]" : "bg-blue-500"}`}>
              <AlertCircle className="h-5 w-5 text-white" aria-hidden="true" />
            </span>
            <p className={`ml-3 font-medium ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>
              <span className="md:hidden">Add your Codeforces API key!</span>
              <span className="hidden md:inline">
                ⚡ Add your Codeforces API key to get faster and more reliable submission verification.
              </span>
            </p>
          </div>
          <div className="order-3 mt-2 shrink-0 w-full sm:order-2 sm:mt-0 sm:w-auto">
            <Link
              href={profileLink}
              className={`flex items-center rounded-xl justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium text-white ${isDarkMode ? "bg-[#404040] hover:bg-[#434343]" : "bg-blue-600 hover:bg-blue-700"} transition-colors`}
            >
              Add API Key
            </Link>
          </div>
          {onClose && (
            <div className="order-2 shrink-0 sm:order-3 sm:ml-3">
              <button
                type="button"
                onClick={onClose}
                className={`-mr-1 flex p-2 rounded-md ${isDarkMode ? "text-white" : "text-black"} sm:-mr-2 transition-colors`}
              >
                <span className="sr-only">Dismiss</span>
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CodeforcesApiBanner;
