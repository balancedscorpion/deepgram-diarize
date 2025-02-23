'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function NavigationButton() {
  const pathname = usePathname();
  const isDemo = pathname === '/demo';

  return (
    <Link
      href={isDemo ? "/real-time" : "/demo"}
      className="px-3 py-1.5 text-sm rounded-lg font-medium bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors"
    >
      Switch to {isDemo ? 'Live' : 'Demo'} Mode
    </Link>
  );
} 