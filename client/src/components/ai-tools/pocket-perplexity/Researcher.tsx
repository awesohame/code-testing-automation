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

  const genAI = new GoogleGenerativeAI("AIzaSyCKCRR56-u5ENjCQ0IfwefNENVslKxKRoY")
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
      className="flex h-screen bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Main Chat Area */}
      <motion.div
        className="flex-1 flex flex-col p-6 space-y-4"
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
          <Bot className="h-12 w-12 text-indigo-600" />
          <h1 className="text-3xl flex text-center justify-center font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            AI Research Assistant
          </h1>
        </motion.div>
        <ScrollArea className="flex-1 rounded-xl bg-white/80 dark:bg-gray-900/30 shadow-lg border border-indigo-100 dark:border-indigo-800">
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
                      <Avatar className="h-8 w-8 border-2 border-purple-200 bg-gradient-to-br from-indigo-100 to-purple-100">
                        <AvatarImage src="/ai-avatar.png" />
                        <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white">
                          AI
                        </AvatarFallback>
                      </Avatar>
                    </motion.div>
                  )}

                  <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
                    <Card
                      className={`max-w-3xl shadow-md ${
                        message.role === "user"
                          ? "bg-gradient-to-r from-indigo-100 to-indigo-50 border-indigo-200 dark:from-indigo-900/40 dark:to-indigo-800/40 dark:border-indigo-700"
                          : "bg-gradient-to-r from-purple-50 to-white border-purple-200 dark:from-purple-900/40 dark:to-gray-900/40 dark:border-purple-700"
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
                              className="text-sm px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-800/50 transition-colors"
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
                      <Avatar className="h-8 w-8 border-2 border-indigo-200 bg-gradient-to-br from-indigo-100 to-indigo-50">
                        <AvatarImage src="/user-avatar.png" />
                        <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
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
                  <Avatar className="h-8 w-8 border-2 border-purple-200 bg-gradient-to-br from-indigo-100 to-purple-100">
                    <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white">
                      AI
                    </AvatarFallback>
                  </Avatar>
                  <Card className="bg-gradient-to-r from-purple-50 to-white border-purple-200 dark:from-purple-900/40 dark:to-gray-900/40 dark:border-purple-700">
                    <CardContent className="p-4">
                      <div className="flex space-x-2">
                        <motion.div
                          className="w-2 h-2 rounded-full bg-indigo-400"
                          animate={{ y: [0, -5, 0] }}
                          transition={{ duration: 0.6, repeat: Number.POSITIVE_INFINITY, repeatType: "loop", delay: 0 }}
                        />
                        <motion.div
                          className="w-2 h-2 rounded-full bg-indigo-500"
                          animate={{ y: [0, -5, 0] }}
                          transition={{
                            duration: 0.6,
                            repeat: Number.POSITIVE_INFINITY,
                            repeatType: "loop",
                            delay: 0.15,
                          }}
                        />
                        <motion.div
                          className="w-2 h-2 rounded-full bg-indigo-600"
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
            className="pr-12 h-14 rounded-2xl shadow-lg border border-indigo-200 dark:border-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-500 transition-all duration-300"
          />
          <motion.div className="absolute right-2 top-2" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              type="submit"
              disabled={isLoading}
              className="h-10 w-10 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-md hover:shadow-lg transition-all duration-300"
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
        className="w-96 border-l border-indigo-200 dark:border-indigo-800 p-6 bg-white/50 dark:bg-gray-900/30"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <motion.h3
          className="text-lg font-semibold mb-4 text-indigo-900 dark:text-indigo-300 flex items-center"
          initial={{ y: -10 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <span className="mr-2">📚</span> References & Resources
        </motion.h3>
        <ScrollArea className="h-full pr-4">
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
                    <Card className="hover:shadow-lg transition-shadow duration-200 border-indigo-100 dark:border-indigo-800 overflow-hidden">
                      <CardHeader className="text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 p-4">
                        <div className="flex justify-between items-center">
                          <span>{resource.title}</span>
                          <motion.div
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            whileHover={{ rotate: 15 }}
                          >
                            <ExternalLink className="h-4 w-4 text-indigo-500" />
                          </motion.div>
                        </div>
                      </CardHeader>
                      <CardContent className="text-sm text-indigo-700 dark:text-indigo-300 p-4">
                        {resource.description}
                        <div className="mt-2 text-xs text-indigo-500/70 dark:text-indigo-400/70 truncate">
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

