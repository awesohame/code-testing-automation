"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { RefreshCcw, Send, ExternalLink, Bot } from "lucide-react"
import ReactMarkdown from "react-markdown"
// import { useAuth } from "./auth/Authprovider"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { motion, AnimatePresence } from "framer-motion"

interface Message {
  content: string
  role: "user" | "ai"
  resources?: Resource[]
}

interface Resource {
  title: string
  url: string
  description?: string
}

export function Researcher() {
  // const { user } = useAuth()
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [resources, setResources] = useState<Resource[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY as string)
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // Initial greeting message with enhanced design
    setMessages([
      {
        content:
          "👋 **Hello!** I'm your AI research assistant. Ask me anything, and I'll provide detailed answers with reputable resources.",
        role: "ai",
      },
    ])

  }, [])

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!inputMessage.trim()) return

    setIsLoading(true)
    const userMessage = { content: inputMessage, role: "user" as const }
    setMessages((prev) => [...prev, userMessage])
    setInputMessage("")

    try {
      const prompt = `Provide a comprehensive answer to: "${inputMessage}". 
        Include: 
        1. Detailed explanation with sections
        2. 3-5 reputable resources with URLs
        3. Key takeaways
        4. Follow-up questions
        
        Format response as JSON:
        {
          "answer": "markdown content",
          "resources": [{ "title": "...", "url": "...", "description": "..." }]
        }`

      const result = await model.generateContent(prompt)
      const responseText = result.response.text()
      const jsonMatch = responseText.match(/```json([\s\S]*?)```/)
      const responseData = jsonMatch ? JSON.parse(jsonMatch[1]) : JSON.parse(responseText)

      const aiMessage: Message = {
        content: responseData.answer,
        role: "ai",
        resources: responseData.resources,
      }
      setMessages((prev) => [...prev, aiMessage])
      setResources(responseData.resources)
    } catch (error) {
      console.error("Error:", error)
      setMessages((prev) => [
        ...prev,
        {
          content: "❌ **Oops!** Something went wrong. Please try again.",
          role: "ai",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const ResourceSkeleton = () => (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
        >
          <Card className="animate-pulse border border-indigo-100 shadow-sm rounded-lg overflow-hidden">
            <CardHeader className="p-4 flex flex-col gap-2 bg-gradient-to-r from-indigo-50/50 to-purple-50/50">
              <div className="h-5 w-3/4 bg-indigo-200/60 rounded-md" />
              <div className="h-3 w-1/2 bg-indigo-200/60 rounded-md" />
            </CardHeader>
            <CardContent className="p-4">
              <div className="h-20 w-full bg-indigo-100/60 rounded-md" />
            </CardContent>
            <CardFooter className="p-4 flex justify-between items-center">
              <div className="h-4 w-16 bg-indigo-100/60 rounded-md" />
              <div className="h-4 w-12 bg-indigo-100/60 rounded-md" />
            </CardFooter>
          </Card>
        </motion.div>
      ))}
    </div>
  )

  return (
    <motion.div
      className="flex h-screen max-h-screen overflow-hidden bg-[#0f172a]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Main Chat Area */}
      <motion.div
        className="flex-1 flex flex-col p-6 space-y-4 overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="flex flex-row gap-2 items-center justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Bot className="h-12 w-12 text-blue-400" />
          <h1 className="text-3xl flex text-center justify-center font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
            AI Research Assistant
          </h1>
        </motion.div>
        <ScrollArea className="flex-1 h-full rounded-xl bg-gray-900/60 backdrop-blur-sm shadow-lg border border-blue-500/20">
          <div className="space-y-6 p-4">
            <AnimatePresence>
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className={`flex gap-4 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {message.role === "ai" && (
                    <motion.div whileHover={{ scale: 1.1 }} transition={{ duration: 0.2 }}>
                      <Avatar className="h-8 w-8 border-2 border-blue-500/30 bg-gradient-to-br from-blue-900/50 to-blue-700/50">
                        <AvatarImage src="/ai-avatar.png" />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-700 text-white">
                          AI
                        </AvatarFallback>
                      </Avatar>
                    </motion.div>
                  )}
  
                  <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
                    <Card
                      className={`max-w-3xl shadow-md ${message.role === "user"
                          ? "bg-gradient-to-r from-blue-900/40 to-blue-800/40 border-blue-500/30"
                          : "bg-gradient-to-r from-gray-900/60 to-gray-900/30 border-blue-500/20"
                        }`}
                    >
                      <CardContent className="p-4 prose dark:prose-invert">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </CardContent>
                      {message.role === "ai" && message.resources && (
                        <CardFooter className="flex flex-wrap gap-2 p-4 pt-0">
                          {message.resources.map((resource, i) => (
                            <motion.a
                              key={i}
                              href={resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              {resource.title}
                            </motion.a>
                          ))}
                        </CardFooter>
                      )}
                    </Card>
                  </motion.div>
  
                  {message.role === "user" && (
                    <motion.div whileHover={{ scale: 1.1 }} transition={{ duration: 0.2 }}>
                      <Avatar className="h-8 w-8 border-2 border-blue-500/30 bg-gradient-to-br from-blue-900/50 to-blue-800/50">
                        <AvatarImage src="/user-avatar.png" />
                        <AvatarFallback className="bg-gradient-to-br from-blue-600 to-blue-800 text-white">
                          U
                        </AvatarFallback>
                      </Avatar>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
  
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex justify-start"
              >
                <div className="flex gap-3 max-w-[80%]">
                  <Avatar className="h-8 w-8 border-2 border-blue-500/30 bg-gradient-to-br from-blue-900/50 to-blue-700/50">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-700 text-white">
                      AI
                    </AvatarFallback>
                  </Avatar>
                  <Card className="bg-gradient-to-r from-gray-900/60 to-gray-900/30 border-blue-500/20">
                    <CardContent className="p-4">
                      <div className="flex space-x-2">
                        <motion.div
                          className="w-2 h-2 rounded-full bg-blue-400"
                          animate={{ y: [0, -5, 0] }}
                          transition={{ duration: 0.6, repeat: Number.POSITIVE_INFINITY, repeatType: "loop", delay: 0 }}
                        />
                        <motion.div
                          className="w-2 h-2 rounded-full bg-blue-500"
                          animate={{ y: [0, -5, 0] }}
                          transition={{
                            duration: 0.6,
                            repeat: Number.POSITIVE_INFINITY,
                            repeatType: "loop",
                            delay: 0.15,
                          }}
                        />
                        <motion.div
                          className="w-2 h-2 rounded-full bg-blue-600"
                          animate={{ y: [0, -5, 0] }}
                          transition={{
                            duration: 0.6,
                            repeat: Number.POSITIVE_INFINITY,
                            repeatType: "loop",
                            delay: 0.3,
                          }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            )}
  
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
  
        <motion.form
          onSubmit={handleSubmit}
          className="relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask me anything..."
            className="pr-12 h-14 rounded-2xl shadow-lg bg-gray-900/60 text-white border border-blue-500/30 focus-visible:ring-2 focus-visible:ring-blue-500/50 transition-all duration-300"
          />
          <motion.div className="absolute right-2 top-2" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              type="submit"
              disabled={isLoading}
              className="h-10 w-10 rounded-xl bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 shadow-md hover:shadow-lg transition-all duration-300"
            >
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                >
                  <RefreshCcw className="h-4 w-4 text-white" />
                </motion.div>
              ) : (
                <Send className="h-4 w-4 text-white" />
              )}
            </Button>
          </motion.div>
        </motion.form>
      </motion.div>
  
      {/* Resources Sidebar */}
      <motion.div
        className="w-96 border-l border-blue-500/20 p-6 bg-gray-900/30 backdrop-blur-sm"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <motion.h3
          className="text-lg font-semibold mb-4 text-blue-400 flex items-center"
          initial={{ y: -10 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <span className="mr-2">📚</span> References & Resources
        </motion.h3>
        <ScrollArea className="h-[calc(100vh-8rem)] pr-4">
        <AnimatePresence mode="wait">
            {resources.length > 0 ? (
              <motion.div
                className="space-y-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {resources.map((resource, index) => (
                  <motion.a
                    key={index}
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block group"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    whileHover={{ y: -5 }}
                  >
                    <Card className="hover:shadow-lg transition-shadow duration-200 border-blue-500/20 overflow-hidden bg-gray-900/60 backdrop-blur-sm">
                      <CardHeader className="text-sm font-medium text-blue-400 bg-gradient-to-r from-blue-900/30 to-blue-800/30 p-4">
                        <div className="flex justify-between items-center">
                          <span>{resource.title}</span>
                          <motion.div
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            whileHover={{ rotate: 15 }}
                          >
                            <ExternalLink className="h-4 w-4 text-blue-400" />
                          </motion.div>
                        </div>
                      </CardHeader>
                      <CardContent className="text-sm text-blue-100/80 p-4">
                        {resource.description}
                        <div className="mt-2 text-xs text-blue-400/70 truncate">
                          {new URL(resource.url).hostname}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.a>
                ))}
              </motion.div>
            ) : (
              <ResourceSkeleton />
            )}
          </AnimatePresence>
        </ScrollArea>
      </motion.div>
    </motion.div>
  )
}

