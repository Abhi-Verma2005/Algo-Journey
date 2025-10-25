'use client'
import React from 'react';

const ThinkingLoader = () => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-none p-6 max-w-md w-full transform transition-all">
        <div className="flex flex-col items-center">
          {/* Brain animation container */}
          <div className="relative w-24 h-24 mb-4">
            {/* Brain outline */}
            <div className="absolute inset-0 border-4 border-blue-400 rounded-full"></div>
            
            {/* Circular neurons/synapses */}
            <div className="absolute top-2 left-6 w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            <div className="absolute top-4 right-5 w-2 h-2 bg-blue-300 rounded-full animate-pulse delay-100"></div>
            <div className="absolute bottom-3 right-8 w-4 h-4 bg-blue-600 rounded-full animate-pulse delay-300"></div>
            <div className="absolute bottom-6 left-3 w-3 h-3 bg-blue-400 rounded-full animate-pulse delay-200"></div>
            <div className="absolute inset-0 m-auto w-2 h-2 bg-blue-700 rounded-full animate-pulse delay-500"></div>
            
            {/* Connection lines with animated pulse effect */}
            <div className="absolute top-8 left-0 right-0 mx-auto w-16 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-pulse"></div>
            <div className="absolute left-8 top-0 bottom-0 my-auto h-16 w-0.5 bg-gradient-to-b from-transparent via-blue-400 to-transparent animate-pulse delay-200"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 border-2 border-blue-200 rounded-full opacity-60 animate-ping"></div>
          </div>
          
          <h3 className="text-lg font-medium text-gray-900 mb-2">Analyzing Project</h3>
          
          {/* Thinking text with dots animation */}
          <div className="flex items-center justify-center mb-3">
            <span className="text-blue-500 font-medium">Thinking</span>
            <span className="inline-flex ml-1">
              <span className="animate-bounce delay-0 mr-0.5">.</span>
              <span className="animate-bounce delay-100 mr-0.5">.</span>
              <span className="animate-bounce delay-200">.</span>
            </span>
          </div>
          
          {/* Thinking progress bar */}
          <div className="w-full bg-gray-100 rounded-full h-2 mb-4 overflow-hidden">
            <div className="bg-blue-500 h-full rounded-full animate-thinking-progress"></div>
          </div>
          
          {/* Random thoughts appearing and fading */}
          <div className="flex flex-wrap justify-center gap-2 max-w-xs animate-fade-in-out">
            <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md">Code Quality</span>
            <span className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-md">Performance</span>
            <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-md">Architecture</span>
            <span className="px-2 py-1 bg-yellow-50 text-yellow-700 text-xs rounded-md">Best Practices</span>
            <span className="px-2 py-1 bg-red-50 text-red-700 text-xs rounded-md">Potential Issues</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThinkingLoader;