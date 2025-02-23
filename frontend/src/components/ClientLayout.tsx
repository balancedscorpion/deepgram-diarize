'use client'

import MeetingObjective from "@/components/MeetingObjective";

interface Props {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: Props) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto p-6">
          <h1 className="text-3xl font-light">Meeting Intelligence</h1>
          <div className="text-gray-500">
            <MeetingObjective />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {children}
      </main>
    </div>
  );
} 