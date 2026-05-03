'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface CarouselItem {
  id: string
  title: string
  description: string
  image?: string
  color?: string
}

interface CarouselSectionProps {
  title: string
  items: CarouselItem[]
  onItemClick?: (item: CarouselItem) => void
}

export function CarouselSection({ title, items, onItemClick }: CarouselSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlay, setIsAutoPlay] = useState(true)

  useEffect(() => {
    if (!isAutoPlay) return

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length)
    }, 5000)

    return () => clearInterval(timer)
  }, [isAutoPlay, items.length])

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length)
    setIsAutoPlay(false)
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length)
    setIsAutoPlay(false)
  }

  const currentItem = items[currentIndex]

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-foreground">{title}</h2>

      <Card
        className="relative w-full h-96 bg-gradient-to-br from-primary/20 via-accent/20 to-secondary/20 border-border overflow-hidden cursor-pointer group"
        onClick={() => onItemClick?.(currentItem)}
      >
        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-end p-6 bg-gradient-to-t from-black/40 to-transparent">
          <h3 className="text-2xl font-bold text-white mb-2">{currentItem.title}</h3>
          <p className="text-white/90 text-sm line-clamp-2">{currentItem.description}</p>
        </div>

        {/* Navigation Buttons */}
        <div className="absolute inset-0 flex items-center justify-between p-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="icon"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation()
              goToPrev()
            }}
            className="bg-white/20 hover:bg-white/30 text-white rounded-full"
          >
            <ChevronLeft size={24} />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation()
              goToNext()
            }}
            className="bg-white/20 hover:bg-white/30 text-white rounded-full"
          >
            <ChevronRight size={24} />
          </Button>
        </div>

        {/* Dots */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
          {items.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation()
                setCurrentIndex(index)
                setIsAutoPlay(false)
              }}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex ? 'bg-white w-8' : 'bg-white/80'
              }`}
            />
          ))}
        </div>
      </Card>
    </div>
  )
}
