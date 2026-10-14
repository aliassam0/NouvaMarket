import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

export interface RouteMatch {
  matches: boolean;
  params: Record<string, string>;
}

interface RouterContextType {
  path: string;
  searchParams: URLSearchParams;
  navigate: (to: string, options?: { replace?: boolean }) => void;
  goBack: () => void;
  matchRoute: (pattern: string) => RouteMatch;
}

const RouterContext = createContext<RouterContextType | null>(null);

function getNormalizedPath(): string {
  if (typeof window === 'undefined') return '/';
  const pathname = window.location.pathname || '/';
  // Remove trailing slash if longer than 1 character
  return pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
}

export function RouterProvider({ children }: { children: React.ReactNode }) {
  const [path, setPath] = useState<string>(getNormalizedPath);
  const [search, setSearch] = useState<string>(() => (typeof window !== 'undefined' ? window.location.search : ''));

  useEffect(() => {
    const handlePopState = () => {
      setPath(getNormalizedPath());
      setSearch(window.location.search);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const navigate = useCallback((to: string, options?: { replace?: boolean }) => {
    if (typeof window === 'undefined') return;

    // Handle relative or full path
    const url = new URL(to, window.location.origin);
    const targetPath = url.pathname.length > 1 && url.pathname.endsWith('/') ? url.pathname.slice(0, -1) : url.pathname;
    const targetSearch = url.search;

    if (options?.replace) {
      window.history.replaceState({}, '', `${targetPath}${targetSearch}${url.hash}`);
    } else {
      window.history.pushState({}, '', `${targetPath}${targetSearch}${url.hash}`);
    }

    setPath(targetPath);
    setSearch(targetSearch);
    // Scroll to top on page change if desired
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const goBack = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.history.back();
    }
  }, []);

  const searchParams = useMemo(() => new URLSearchParams(search), [search]);

  // Pattern matcher: e.g. "/p/:productId" or "/dashboard/:tab"
  const matchRoute = useCallback((pattern: string): RouteMatch => {
    const patternSegments = pattern.split('/').filter(Boolean);
    const pathSegments = path.split('/').filter(Boolean);

    if (patternSegments.length !== pathSegments.length) {
      return { matches: false, params: {} };
    }

    const params: Record<string, string> = {};

    for (let i = 0; i < patternSegments.length; i++) {
      const pSegment = patternSegments[i];
      const curSegment = pathSegments[i];

      if (pSegment.startsWith(':')) {
        const paramName = pSegment.slice(1);
        params[paramName] = decodeURIComponent(curSegment);
      } else if (pSegment !== curSegment) {
        return { matches: false, params: {} };
      }
    }

    return { matches: true, params };
  }, [path]);

  const value = useMemo<RouterContextType>(() => ({
    path,
    searchParams,
    navigate,
    goBack,
    matchRoute,
  }), [path, searchParams, navigate, goBack, matchRoute]);

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

export function useRouter() {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('useRouter must be used within a RouterProvider');
  }
  return context;
}

export function Link({
  to,
  children,
  className,
  replace,
  onClick,
  ...rest
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  to: string;
  replace?: boolean;
}) {
  const { navigate } = useRouter();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onClick) onClick(e);
    if (!e.defaultPrevented && e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
      e.preventDefault();
      navigate(to, { replace });
    }
  };

  return (
    <a href={to} onClick={handleClick} className={className} {...rest}>
      {children}
    </a>
  );
}
