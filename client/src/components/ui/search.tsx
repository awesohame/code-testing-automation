"use client"

import { Search } from "lucide-react"
import { Input } from "./input"

interface SearchProps {
  placeholder?: string
  className?: string
}

export function SearchInput({ placeholder = "Search...", className }: SearchProps) {
  return (
    <div className="relative">
      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        className={`pl-8 ${className}`}
      />
    </div>
  )
}