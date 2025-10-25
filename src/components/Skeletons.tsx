import React from 'react';

// Stats Card Skeleton
export const StatsCardSkeleton = () => (
  <div className="bg-white border-l-4 border-l-gray-200 shadow-none p-4 rounded-lg animate-pulse">
    <div className="flex items-center gap-2 mb-2">
      <div className="h-4 w-4 bg-gray-200 rounded-full"></div>
      <div className="h-4 w-24 bg-gray-200 rounded"></div>
    </div>
    <div className="h-8 w-16 bg-gray-200 rounded mb-1"></div>
    <div className="h-3 w-28 bg-gray-100 rounded"></div>
  </div>
);

// LeetCode Card Skeleton
export const LeetCodeSkeleton = () => (
  <div className="bg-white/90 shadow-none rounded-lg border border-gray-100 animate-pulse">
    <div className="border-b border-gray-100 p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 bg-gray-200 rounded-full"></div>
          <div className="h-6 w-36 bg-gray-200 rounded"></div>
        </div>
        <div className="h-4 w-4 bg-gray-200 rounded-full"></div>
      </div>
      <div className="h-4 w-48 bg-gray-100 rounded"></div>
    </div>
    <div className="p-4">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-4 w-24 bg-gray-200 rounded"></div>
          <div className="h-5 w-20 bg-gray-200 rounded"></div>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2.5"></div>
        
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="h-3 w-10 bg-gray-200 rounded mb-2"></div>
            <div className="h-5 w-12 bg-gray-200 rounded mb-1"></div>
            <div className="w-full bg-gray-200 rounded-full h-1.5"></div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="h-3 w-10 bg-gray-200 rounded mb-2"></div>
            <div className="h-5 w-12 bg-gray-200 rounded mb-1"></div>
            <div className="w-full bg-gray-200 rounded-full h-1.5"></div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="h-3 w-10 bg-gray-200 rounded mb-2"></div>
            <div className="h-5 w-12 bg-gray-200 rounded mb-1"></div>
            <div className="w-full bg-gray-200 rounded-full h-1.5"></div>
          </div>
        </div>
      </div>
    </div>
    <div className="border-t border-gray-100 p-4 flex justify-between items-center">
      <div className="h-4 w-32 bg-gray-200 rounded"></div>
      <div className="h-8 w-24 bg-gray-200 rounded"></div>
    </div>
  </div>
);

// Codeforces Card Skeleton
export const CodeforcesSkeleton = () => (
  <div className="bg-white/90 shadow-none rounded-lg border border-gray-100 animate-pulse">
    <div className="border-b border-gray-100 p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 bg-gray-200 rounded-full"></div>
          <div className="h-6 w-36 bg-gray-200 rounded"></div>
        </div>
        <div className="h-4 w-4 bg-gray-200 rounded-full"></div>
      </div>
      <div className="h-4 w-48 bg-gray-100 rounded"></div>
    </div>
    <div className="p-4">
      <div className="flex flex-col items-center justify-center p-6">
        <div className="relative w-32 h-32 rounded-full flex items-center justify-center mb-4">
          <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
          <div className="h-10 w-16 bg-gray-200 rounded"></div>
        </div>
        <div className="h-4 w-48 bg-gray-200 rounded mt-2"></div>
        <div className="w-full bg-gray-100 rounded-full h-1.5 mt-6"></div>
        <div className="flex justify-between w-full mt-1">
          <div className="h-3 w-5 bg-gray-200 rounded"></div>
          <div className="h-3 w-5 bg-gray-200 rounded"></div>
          <div className="h-3 w-5 bg-gray-200 rounded"></div>
          <div className="h-3 w-5 bg-gray-200 rounded"></div>
          <div className="h-3 w-5 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
    <div className="border-t border-gray-100 p-4 flex justify-end">
      <div className="h-8 w-24 bg-gray-200 rounded"></div>
    </div>
  </div>
);

// Contests Skeleton
export const ContestsSkeleton = () => (
  <div className="bg-white/90 shadow-none rounded-lg border border-gray-100 animate-pulse">
    <div className="border-b border-gray-100 p-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="h-6 w-36 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 w-48 bg-gray-100 rounded"></div>
        </div>
        <div className="h-8 w-8 bg-gray-200 rounded"></div>
      </div>
    </div>
    <div className="p-4">
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-gray-200"></div>
                <div>
                  <div className="h-5 w-32 bg-gray-200 rounded mb-1"></div>
                  <div className="h-3 w-24 bg-gray-100 rounded"></div>
                </div>
              </div>
              <div className="h-5 w-16 bg-gray-200 rounded-full"></div>
            </div>
            <div className="px-4 py-3 bg-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="h-12 w-20 bg-gray-200 rounded-lg"></div>
                <div className="h-12 w-20 bg-gray-200 rounded-lg"></div>
              </div>
              <div className="h-9 w-28 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Team Members Skeleton
export const TeamMembersSkeleton = () => (
  <div className="bg-white/90 shadow-none rounded-lg border border-gray-100 animate-pulse">
    <div className="border-b border-gray-100 p-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="h-6 w-36 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 w-32 bg-gray-100 rounded"></div>
        </div>
        <div className="h-5 w-5 bg-gray-200 rounded"></div>
      </div>
    </div>
    <div className="p-4">
      <div className="overflow-hidden rounded-lg border border-gray-100">
        <div className="py-3 bg-gray-50 grid grid-cols-4 px-4">
          <div className="h-4 w-8 bg-gray-200 rounded"></div>
          <div className="h-4 w-16 bg-gray-200 rounded"></div>
          <div className="h-4 w-16 bg-gray-200 rounded justify-self-end"></div>
          <div className="h-4 w-24 bg-gray-200 rounded justify-self-end"></div>
        </div>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="px-4 py-3 border-t border-gray-50 grid grid-cols-4 items-center">
            <div className="h-5 w-5 bg-gray-200 rounded-full justify-self-center"></div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
              <div className="h-4 w-24 bg-gray-200 rounded"></div>
            </div>
            <div className="h-4 w-12 bg-gray-200 rounded justify-self-end"></div>
            <div className="flex items-center justify-self-end gap-2">
              <div className="h-4 w-8 bg-gray-200 rounded"></div>
              <div className="w-16 bg-gray-100 rounded-full h-1.5">
                <div className="bg-gray-200 h-1.5 rounded-full" style={{ width: '50%' }}></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
    <div className="border-t border-gray-100 p-4">
      <div className="h-8 w-32 bg-gray-200 rounded"></div>
    </div>
  </div>
);

// Join Team Skeleton
export const JoinTeamSkeleton = () => (
  <div className="bg-white/90 shadow-none rounded-lg border border-gray-100 animate-pulse">
    <div className="p-4">
      <div className="h-6 w-36 bg-gray-200 rounded mb-2"></div>
      <div className="h-4 w-48 bg-gray-100 rounded"></div>
    </div>
    <div className="p-8 flex flex-col items-center">
      <div className="h-24 w-24 bg-gray-200 rounded-full mb-4"></div>
      <div className="h-6 w-48 bg-gray-200 rounded mb-2"></div>
      <div className="h-16 w-full max-w-md bg-gray-100 rounded"></div>
    </div>
  </div>
);