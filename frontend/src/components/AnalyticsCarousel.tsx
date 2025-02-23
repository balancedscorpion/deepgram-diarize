'use client'

import { useState } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

interface Props {
  children: React.ReactNode[]
}

export default function AnalyticsCarousel({ children }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0)

  const next = () => {
    setCurrentIndex((current) => (current + 1) % children.length)
  }

  const previous = () => {
    setCurrentIndex((current) => (current - 1 + children.length) % children.length)
  }

  return (
    <div className="relative h-[400px]">
      {/* Main carousel container */}
      <div className="relative h-full overflow-hidden rounded-xl">
        {children.map((child, index) => (
          <div
            key={index}
            className={`absolute w-full h-full transition-transform duration-300 ease-in-out ${
              index === currentIndex ? 'translate-x-0' : 
              index < currentIndex ? '-translate-x-full' : 'translate-x-full'
            }`}
          >
            {child}
          </div>
        ))}
      </div>

      {/* Navigation buttons */}
      <button
        onClick={previous}
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-all"
      >
        <ChevronLeftIcon className="w-6 h-6 text-gray-600" />
      </button>
      <button
        onClick={next}
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-all"
      >
        <ChevronRightIcon className="w-6 h-6 text-gray-600" />
      </button>

      {/* Dots indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
        {children.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentIndex ? 'bg-blue-600 w-4' : 'bg-gray-300'
            }`}
          />
        ))}
      </div>
    </div>
  )
} 