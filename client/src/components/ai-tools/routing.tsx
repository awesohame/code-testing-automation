"use client"

import { motion } from "framer-motion"
import { BrainCircuit, BookOpen, Code2 } from "lucide-react"
import { useState, useRef, useEffect } from "react"

// Animated code background component
const AnimatedCodeBackground = ({ children }) => {
  const containerRef = useRef(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden"
      style={{
        background: "#0f172a",
        color: "#f8fafc",
      }}
    >
      {/* Animated code particles */}
      <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
        {Array.from({ length: 15 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-blue-500 font-mono text-xs opacity-50"
            initial={{
              x: Math.random() * 100 + "%",
              y: -20,
              opacity: 0.3 + Math.random() * 0.5,
            }}
            animate={{
              y: "120%",
              x: `calc(${Math.random() * 100}% + ${(mousePosition.x / 50) * (i % 2 ? 1 : -1)}px)`,
              opacity: 0,
            }}
            transition={{
              repeat: Number.POSITIVE_INFINITY,
              duration: 10 + Math.random() * 20,
              ease: "linear",
              delay: Math.random() * 5,
            }}
          >
            {
              [
                "const",
                "async",
                "await",
                "import",
                "export",
                "function",
                "return",
                "=>",
                "class",
                "interface",
                "type",
                "let",
                "if",
                "for",
                "while",
              ][i % 15]
            }
          </motion.div>
        ))}
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-900/10 via-transparent to-blue-900/5 pointer-events-none" />

      {children}
    </div>
  )
}

// Animated cursor component
const AnimatedCursor = () => {
  const cursorRef = useRef(null)

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!cursorRef.current) return
      cursorRef.current.style.left = `${e.clientX}px`
      cursorRef.current.style.top = `${e.clientY}px`
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  return (
    <motion.div
      ref={cursorRef}
      className="fixed w-6 h-6 pointer-events-none z-50 mix-blend-difference"
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{
        borderRadius: "50%",
        border: "2px solid rgba(59, 130, 246, 0.5)",
        transform: "translate(-50%, -50%)",
      }}
    />
  )
}

const CourseCard = ({ title, icon: Icon, href, description, imageSrc }) => {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.a
      href={href}
      className="block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ y: -8 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      <div className="group relative bg-gray-900/60 backdrop-blur-sm rounded-lg overflow-hidden h-[420px] transition-all duration-300 shadow-md hover:shadow-xl border border-blue-500/20">
        <div className="absolute inset-0">
          <img
            src={imageSrc || "/placeholder.svg"}
            alt={title}
            className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/60 to-transparent" />

          {/* Code overlay effect */}
          <motion.div
            className="absolute inset-0 opacity-0 group-hover:opacity-20 pointer-events-none overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 0.2 : 0 }}
          >
            <div className="absolute inset-0 font-mono text-[10px] leading-tight text-blue-400 whitespace-pre opacity-70">
              {`
import { AI } from '@vercel/ai';
import { useEffect, useState } from 'react';

export function ${title.replace(/\s+/g, "")}() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchData() {
      try {
        const ai = new AI();
        const result = await ai.run({
          model: 'gpt-4',
          prompt: '${description.substring(0, 50)}...'
        });
        setData(result);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);

  return (
    <div className="ai-tool">
      {loading ? (
        <Spinner />
      ) : (
        <Results data={data} />
      )}
    </div>
  );
}`.repeat(5)}
            </div>
          </motion.div>
        </div>

        <div className="relative h-full flex flex-col justify-end p-6">
          <motion.div
            className="absolute top-4 right-4 bg-blue-500/10 backdrop-blur-sm rounded-full p-2.5 shadow-md border border-blue-500/30"
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
          >
            <Icon className="w-5 h-5 text-blue-400" />
          </motion.div>

          <div className="space-y-3">
            <div className="flex items-center">
              <span className="text-blue-400 font-mono mr-2">{">"}</span>
              <h2 className="text-xl font-semibold text-white tracking-tight">{title}</h2>
            </div>

            <p className="text-blue-100/80 text-sm leading-relaxed line-clamp-3">{description}</p>

            <div className="pt-3">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center px-4 py-1.5 bg-blue-500/10 backdrop-blur-sm rounded-2xl text-blue-400 text-sm font-medium border border-blue-500/30"
              >
                <span className="font-mono mr-1">{"$"}</span> Explore
                <svg
                  className="w-3.5 h-3.5 ml-1.5 transition-transform group-hover:translate-x-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </motion.a>
  )
}

const AIToolsPage = () => {
  return (
    <AnimatedCodeBackground>
      <AnimatedCursor />

      <main className="relative min-h-screen flex flex-col justify-center px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-7xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12 md:mb-16"
          >
            <div className="inline-block mb-3 px-3 py-1 bg-blue-500/10 backdrop-blur-sm rounded-full text-blue-400 text-xs font-mono border border-blue-500/30">
              <span className="animate-pulse mr-1.5">●</span> AI-powered developer tools
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight">
              <span className="font-mono text-blue-400">{"{"}</span>
              AI-Tools
              <span className="font-mono text-blue-400">{"}"}</span>
            </h1>

            <motion.p
              className="mt-4 max-w-2xl mx-auto text-blue-100/80 text-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Discover intelligent tools designed to enhance your development workflow
            </motion.p>

            {/* Animated typing indicator */}
            <motion.div
              className="flex justify-center mt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <div className="inline-flex items-center px-3 py-1 bg-blue-500/10 backdrop-blur-sm rounded-full text-blue-400 text-xs font-mono border border-blue-500/30">
                <span className="mr-2">$</span>
                <span className="typing-effect">npm install @ai-tools/core</span>
              </div>
            </motion.div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            <CourseCard
              title="AI Mastery"
              icon={BrainCircuit}
              href="/ai-course"
              description="Unlock the power of Artificial Intelligence. From machine learning algorithms to neural networks, dive deep into the technology shaping our future. Perfect for aspiring data scientists and AI enthusiasts."
              imageSrc="/ai.png"
            />
            <CourseCard
              title="Resources Hub"
              icon={BookOpen}
              href="/resources"
              description="Discover a wealth of resources to enhance your learning journey. Whether it's online courses, podcasts, or books, find the perfect resource to help you grow and develop your skills."
              imageSrc="/library.png"
            />
            <CourseCard
              title="Research Assistant"
              icon={Code2}
              href="/researcher"
              description="Get the best of both worlds with our hybrid course. Combine the flexibility of online learning with the engagement of in-person workshops. Ideal for those seeking a balanced and comprehensive educational experience."
              imageSrc="/assistant.png"
            />
          </div>
        </div>
      </main>

      <style jsx>{`
        .typing-effect {
          overflow: hidden;
          border-right: 2px solid #60a5fa;
          white-space: nowrap;
          margin: 0;
          animation: typing 3.5s steps(30, end), blink-caret 0.75s step-end infinite;
        }
        
        @keyframes typing {
          from { width: 0 }
          to { width: 100% }
        }
        
        @keyframes blink-caret {
          from, to { border-color: transparent }
          50% { border-color: #60a5fa }
        }
      `}</style>
    </AnimatedCodeBackground>
  )
}

export default AIToolsPage

