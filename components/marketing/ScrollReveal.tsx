"use client"
import { useEffect, useRef } from "react"

interface Props {
  children: React.ReactNode
  className?: string
  delay?: number   // ms
  once?: boolean
}

export function ScrollReveal({ children, className = "", delay = 0, once = true }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.transitionDelay = delay ? `${delay}ms` : ""
          el.classList.add("sr-visible")
          if (once) observer.disconnect()
        } else if (!once) {
          el.classList.remove("sr-visible")
        }
      },
      { threshold: 0.12 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [delay, once])

  return (
    <div ref={ref} className={`sr-hidden ${className}`}>
      {children}
    </div>
  )
}
