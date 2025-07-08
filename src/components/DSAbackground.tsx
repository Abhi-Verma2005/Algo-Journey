"use client"
import React from 'react';
import { motion } from 'framer-motion';

const DSAHeroBackground = () => {
  // Binary tree nodes
  const treeNodes = [
    { id: 1, x: 50, y: 20, value: '8' },
    { id: 2, x: 30, y: 35, value: '3' },
    { id: 3, x: 70, y: 35, value: '10' },
    { id: 4, x: 20, y: 50, value: '1' },
    { id: 5, x: 40, y: 50, value: '6' },
    { id: 6, x: 80, y: 50, value: '14' },
  ];

  // Graph connections
  const connections = [
    { from: 1, to: 2 },
    { from: 1, to: 3 },
    { from: 2, to: 4 },
    { from: 2, to: 5 },
    { from: 3, to: 6 },
  ];

  // Array visualization
  const arrayElements = ['5', '2', '8', '1', '9', '3'];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Blur overlay to make background more subtle */}
      <div className="absolute inset-0 backdrop-blur-[2px] bg-white/20" />
      {/* Main gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50" />
      
      {/* Floating Binary Tree - Keep on left */}
      <motion.div
        className="absolute top-1/4 left-4 md:left-1/6 w-60 md:w-80 h-48 md:h-60 opacity-15"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ 
          opacity: [0.15, 0.25, 0.15],
          scale: [0.8, 1, 0.8],
          rotate: [0, 5, 0]
        }}
        transition={{ 
          duration: 20, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
      >
        <svg viewBox="0 0 100 70" className="w-full h-full">
          {/* Tree connections */}
          {connections.map((conn, index) => {
            const fromNode = treeNodes.find(n => n.id === conn.from);
            const toNode = treeNodes.find(n => n.id === conn.to);
            if (!fromNode || !toNode) return null;
            return (
              <motion.line
                key={index}
                x1={fromNode.x}
                y1={fromNode.y}
                x2={toNode.x}
                y2={toNode.y}
                stroke="rgb(59, 130, 246)"
                strokeWidth="2"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, delay: index * 0.3 }}
              />
            );
          })}
          
          {/* Tree nodes */}
          {treeNodes.map((node, index) => (
            <motion.g key={node.id}>
              <motion.circle
                cx={node.x}
                cy={node.y}
                r="4"
                fill="rgb(59, 130, 246)"
                stroke="white"
                strokeWidth="2"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
              />
              <motion.text
                x={node.x}
                y={node.y + 1.5}
                fill="white"
                fontSize="4"
                textAnchor="middle"
                fontWeight="bold"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: index * 0.2 + 0.3 }}
              >
                {node.value}
              </motion.text>
            </motion.g>
          ))}
        </svg>
      </motion.div>

      {/* Floating Array Visualization - Moved to right side */}
      <motion.div
        className="absolute top-1/3 right-4 md:right-1/6 w-48 md:w-72 h-12 md:h-16 opacity-15"
        initial={{ opacity: 0, x: 50 }}
        animate={{ 
          opacity: [0.15, 0.25, 0.15],
          x: [50, 0, 50],
          y: [0, -10, 0]
        }}
        transition={{ 
          duration: 15, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
      >
        <div className="flex space-x-1 md:space-x-2">
          {arrayElements.map((element, index) => (
            <motion.div
              key={index}
              className="w-6 h-6 md:w-10 md:h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-mono text-xs md:text-sm shadow-lg"
              initial={{ y: 0 }}
              animate={{ 
                y: [0, -5, 0],
                scale: [1, 1.05, 1]
              }}
              transition={{ 
                duration: 2, 
                delay: index * 0.2, 
                repeat: Infinity,
                repeatDelay: 5
              }}
            >
              {element}
            </motion.div>
          ))}
        </div>
        <div className="flex space-x-1 md:space-x-2 mt-1 text-xs text-blue-600 font-mono justify-center">
          {arrayElements.map((_, index) => (
            <span key={index} className="w-6 md:w-10 text-center">{index}</span>
          ))}
        </div>
      </motion.div>

      {/* Floating Algorithm Complexity - Keep on left but adjust positioning */}
      <motion.div
        className="absolute top-1/2 left-2 md:left-1/12 opacity-15"
        initial={{ opacity: 0, rotate: -10 }}
        animate={{ 
          opacity: [0.15, 0.3, 0.15],
          rotate: [-10, 0, -10],
          scale: [0.9, 1, 0.9]
        }}
        transition={{ 
          duration: 25, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
      >
        <div className="text-blue-600 font-mono space-y-1 md:space-y-2">
          <div className="text-lg md:text-2xl font-bold">O(log n)</div>
          <div className="text-sm md:text-lg font-bold">O(n²)</div>
          <div className="text-base md:text-xl font-bold">O(n log n)</div>
          <div className="text-sm md:text-lg font-bold">O(1)</div>
        </div>
      </motion.div>

      {/* Floating Hash Table - Moved to right side */}
      <motion.div
        className="absolute top-1/2 right-8 md:right-1/4 w-32 md:w-64 h-24 md:h-32 opacity-20"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ 
          opacity: [0.2, 0.4, 0.2],
          scale: [0.9, 1.1, 0.9],
          rotate: [0, 2, 0]
        }}
        transition={{ 
          duration: 18, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
      >
        <div className="grid grid-cols-3 md:grid-cols-4 gap-1">
          {Array.from({ length: 12 }, (_, i) => (
            <motion.div
              key={i}
              className="w-4 h-4 md:w-8 md:h-6 bg-blue-600 rounded-sm flex items-center justify-center text-white text-xs font-mono"
              initial={{ opacity: 0.3 }}
              animate={{ 
                opacity: [0.3, 0.8, 0.3],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 3, 
                delay: i * 0.15, 
                repeat: Infinity,
                repeatDelay: 4
              }}
            >
              {i % 3 === 0 ? String.fromCharCode(65 + (i % 8)) : ''}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Floating Graph Nodes - Moved to upper right */}
      <motion.div
        className="absolute top-1/6 right-4 md:right-1/3 w-32 md:w-48 h-32 md:h-48 opacity-20"
        initial={{ opacity: 0 }}
        animate={{ 
          opacity: [0.2, 0.4, 0.2],
          rotate: [0, 360, 0]
        }}
        transition={{ 
          duration: 30, 
          repeat: Infinity, 
          ease: "linear" 
        }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Graph edges */}
          <motion.line x1="20" y1="20" x2="80" y2="20" stroke="rgb(59, 130, 246)" strokeWidth="2" />
          <motion.line x1="80" y1="20" x2="80" y2="80" stroke="rgb(59, 130, 246)" strokeWidth="2" />
          <motion.line x1="80" y1="80" x2="20" y2="80" stroke="rgb(59, 130, 246)" strokeWidth="2" />
          <motion.line x1="20" y1="80" x2="20" y2="20" stroke="rgb(59, 130, 246)" strokeWidth="2" />
          <motion.line x1="20" y1="20" x2="80" y2="80" stroke="rgb(59, 130, 246)" strokeWidth="2" />
          
          {/* Graph nodes */}
          <motion.circle cx="20" cy="20" r="5" fill="rgb(59, 130, 246)" stroke="white" strokeWidth="2" />
          <motion.circle cx="80" cy="20" r="5" fill="rgb(59, 130, 246)" stroke="white" strokeWidth="2" />
          <motion.circle cx="80" cy="80" r="5" fill="rgb(59, 130, 246)" stroke="white" strokeWidth="2" />
          <motion.circle cx="20" cy="80" r="5" fill="rgb(59, 130, 246)" stroke="white" strokeWidth="2" />
        </svg>
      </motion.div>

      {/* Floating Stack/Queue Visualization - Moved to bottom right */}
      <motion.div
        className="absolute bottom-1/4 right-4 md:right-1/6 opacity-25"
        initial={{ opacity: 0, y: 20 }}
        animate={{ 
          opacity: [0.25, 0.45, 0.25],
          y: [20, 0, 20]
        }}
        transition={{ 
          duration: 12, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
      >
        <div className="space-y-1">
          {['push()', 'pop()', 'peek()', 'isEmpty()'].map((operation, index) => (
            <motion.div
              key={index}
              className="px-2 py-1 md:px-3 md:py-1 bg-blue-600 text-white text-xs font-mono rounded shadow-lg"
              initial={{ x: -20, opacity: 0 }}
              animate={{ 
                x: 0, 
                opacity: 1,
                scale: [1, 1.05, 1]
              }}
              transition={{ 
                duration: 0.5, 
                delay: index * 0.3,
                scale: {
                  duration: 2,
                  delay: index * 0.5,
                  repeat: Infinity,
                  repeatDelay: 3
                }
              }}
            >
              {operation}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Animated Code Snippets - Keep on right but adjust for mobile */}
      <motion.div
        className="absolute top-2/3 right-2 md:top-1/6 md:right-1/12 opacity-25 font-mono text-xs text-blue-600"
        initial={{ opacity: 0 }}
        animate={{ 
          opacity: [0.25, 0.45, 0.25]
        }}
        transition={{ 
          duration: 20, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
      >
        <div className="space-y-1 bg-white/80 p-2 md:p-3 rounded-lg shadow-lg max-w-xs">
          <div className="text-xs">while (left &lt; right) &#123;</div>
          <div className="ml-2 text-xs">mid = (left + right) / 2</div>
          <div className="ml-2 text-xs">if (arr[mid] == target)</div>
          <div className="ml-4 text-xs">return mid</div>
          <div className="text-xs">&#125;</div>
        </div>
      </motion.div>

      {/* Additional elements on right side for better balance */}
      {/* Linked List visualization */}
      <motion.div
        className="absolute bottom-1/3 right-2 md:right-1/5 w-40 md:w-56 h-8 md:h-12 opacity-20"
        initial={{ opacity: 0, x: 30 }}
        animate={{ 
          opacity: [0.2, 0.35, 0.2],
          x: [30, 0, 30]
        }}
        transition={{ 
          duration: 14, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
      >
        <div className="flex items-center space-x-2">
          {[1, 2, 3, 4].map((value, index) => (
            <div key={index} className="flex items-center">
              <motion.div
                className="w-6 h-6 md:w-8 md:h-8 bg-blue-600 rounded border-2 border-white flex items-center justify-center text-white text-xs font-mono shadow"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
              >
                {value}
              </motion.div>
              {index < 3 && (
                <motion.div
                  className="w-3 md:w-4 h-0.5 bg-blue-600 relative"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.2 + 0.5 }}
                >
                  <div className="absolute right-0 top-0 w-0 h-0 border-l-2 border-l-blue-600 border-t border-b border-t-transparent border-b-transparent transform -translate-y-0.5"></div>
                </motion.div>
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: 
              `linear-gradient(rgba(59, 130, 246, 0.8) 1px, transparent 1px),
               linear-gradient(90deg, rgba(59, 130, 246, 0.8) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      {/* Floating particles for extra visual interest */}
      <div className="absolute inset-0">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-blue-400 rounded-full opacity-30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.3, 0.7, 0.3],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default DSAHeroBackground;
