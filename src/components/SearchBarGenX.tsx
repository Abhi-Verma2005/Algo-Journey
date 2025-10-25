'use client'
import axios from 'axios';
import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, X } from 'lucide-react';


type SearchMode = 'clientSide' | 'serverSide';

interface BaseSearchConfig<T> {
  mode: SearchMode;
  debounceMs?: number;
  placeholder?: string;
  minQueryLength?: number;
  onResultSelect?: (item: T) => void;
  renderItem?: (item: T) => React.ReactNode;
}

interface ClientSideSearchConfig<T> extends BaseSearchConfig<T> {
  mode: 'clientSide';
  data: T[];
  filterFn: (item: T, query: string) => boolean;
}

interface ServerSideSearchConfig<T> extends BaseSearchConfig<T> {
  mode: 'serverSide';
  endpoint?: string;
  fetchFn?: (query: string) => Promise<T[]>;
  headers?: Record<string, string>;
  responsePath?: string;
}

type SearchConfig<T> = ClientSideSearchConfig<T> | ServerSideSearchConfig<T>;

// Type for the hook return
interface UseSearchResult<T> {
  query: string;
  setQuery: React.Dispatch<React.SetStateAction<string>>;
  results: T[];
  loading: boolean;
  error: Error | null;
  selectedIndex: number;
  setSelectedIndex: React.Dispatch<React.SetStateAction<number>>;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  handleItemClick: (item: T) => void;
}

// Helper function to extract data using a path string (e.g. "data.items")
//@ts-expect-error: expect error here
function getDataFromPath(obj, path?: string) {
  if (!path) return obj;
  
  return path.split('.').reduce((acc, part) => {
    return acc && typeof acc === 'object' ? acc[part] : undefined;
  }, obj);
}


function useSearch<T>(config: SearchConfig<T>): UseSearchResult<T> {
  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<T[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);


  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Main search effect
  useEffect(() => {
    const minLength = config.minQueryLength || 1;
    
    // Reset results if query is too short
    if (!query || query.length < minLength) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set up debounced search
    const debounceTime = config.debounceMs || 300;
    
    timeoutRef.current = setTimeout(async () => {
      setLoading(true);
      setError(null);
      
      try {
        if (config.mode === 'clientSide') {
          // Client-side filtering
          const filteredResults = config.data.filter(item => 
            config.filterFn(item, query)
          );
          setResults(filteredResults);
        } else {
          // Server-side search
          let searchResults: T[] = [];
          
          if (config.fetchFn) {
            // Use custom fetch function if provided
            searchResults = await config.fetchFn(query);
          } else if (config.endpoint) {
            // Use Axios with request body instead of URL parameters
            try {
              const headers = config.headers || {
                'Content-Type': 'application/json'
              };
              
              const response = await axios.post(
                config.endpoint,
                { query: query },
                { headers }
              );
              
              // Extract data using the provided response path or use the whole response.data
              const extractedData = getDataFromPath(response.data, config.responsePath);
              
              if (Array.isArray(extractedData)) {
                searchResults = extractedData;
              } else {
                console.warn('Data extracted from response is not an array:', extractedData);
                searchResults = [];
              }
            } catch (axiosError) {
              throw new Error(`Search request failed: ${axiosError}`);
            }
          } else {
            throw new Error('Either fetchFn or endpoint must be provided for serverSide mode');
          }
          
          setResults(searchResults);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('An unknown error occurred'));
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, debounceTime);
  }, [query, config]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
        break;
      case 'Enter':
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          e.preventDefault();
          handleItemClick(results[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setQuery('');
        setResults([]);
        break;
    }
  };

  // Handle item click
  const handleItemClick = (item: T) => {
    if (config.onResultSelect) {
      config.onResultSelect(item);
    }
    setQuery('');
    setResults([]);
  };

  return {
    query,
    setQuery,
    results,
    loading,
    error,
    selectedIndex,
    setSelectedIndex,
    handleKeyDown,
    handleItemClick
  };
}

// The redesigned SearchBar component
interface SearchBarProps<T> {
  config: SearchConfig<T>;
  className?: string;
  inputClassName?: string;
  resultsClassName?: string;
  resultItemClassName?: string;
  loadingComponent?: React.ReactNode;
  noResultsComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
}

function SearchBar<T>({
  config,
  className = '',
  inputClassName = '',
  resultsClassName = '',
  resultItemClassName = '',
  loadingComponent = <div className="py-4 text-center text-gray-500 text-sm">Searching...</div>,
  noResultsComponent = <div className="py-4 text-center text-gray-500 text-sm">No results found</div>,
  errorComponent = <div className="py-4 text-center text-gray-500 text-sm">An error occurred while searching</div>
}: SearchBarProps<T>) {
  const {
    query,
    setQuery,
    results,
    loading,
    error,
    selectedIndex,
    setSelectedIndex,
    handleKeyDown,
    handleItemClick
  } = useSearch<T>(config);

  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  const handleClearSearch = () => {
    setQuery('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const renderResults = () => {
    if (loading) return loadingComponent;
    if (error) return errorComponent;
    if (results.length === 0 && query.length >= (config.minQueryLength || 1)) {
      return noResultsComponent;
    }

    return results.map((item, index) => (
      <div
        key={index}
        className={`${resultItemClassName} ${index === selectedIndex ? 'bg-indigo-50' : 'hover:bg-gray-50'} px-4 py-3 cursor-pointer transition-colors duration-100`}
        onClick={() => handleItemClick(item)}
        onMouseEnter={() => setSelectedIndex(index)}
      >
        {config.renderItem ? config.renderItem(item) : JSON.stringify(item)}
      </div>
    ));
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative flex items-center">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 150)}
          placeholder={config.placeholder || 'Search...'}
          className={`w-full py-2 pl-10 pr-10 rounded-md border border-gray-200 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 focus:outline-none transition-shadow text-sm ${inputClassName}`}
        />
        {query && (
          <div className="absolute inset-y-0 right-10 flex items-center">
            <button
              onClick={handleClearSearch}
              className="h-4 w-4 text-gray-400 hover:text-gray-600 transition-colors duration-150 focus:outline-none"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        {loading && (
          <div className="absolute inset-y-0 right-3 flex items-center">
            <Loader2 className="h-4 w-4 text-indigo-500 animate-spin" />
          </div>
        )}
      </div>
      
      {(isFocused || loading) && query.length >= (config.minQueryLength || 1) && (
        <div className={`absolute z-50 mt-1 w-full bg-white rounded-md border border-gray-100 shadow-none overflow-hidden divide-y divide-gray-100 ${resultsClassName}`}>
          {renderResults()}
        </div>
      )}
    </div>
  );
}

export default SearchBar;
export { useSearch };
export type { 
  SearchConfig, 
  ClientSideSearchConfig, 
  ServerSideSearchConfig,
  SearchBarProps,
  UseSearchResult
};