"use client"

import { useState, useEffect } from "react"
import type React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai"
import { ChevronRight, Plus, Trash, Lightbulb, Heart, GraduationCap, Sparkles, Code, Terminal } from "lucide-react"
import { useUserData } from "@/hooks/useUserData"
import { motion, AnimatePresence } from "framer-motion"
import { useNavigate } from "react-router-dom"

const genAI = new GoogleGenerativeAI("AIzaSyDlcjeiBAXsMJ5d_Wnn5h-afC5X9bKmep8")

const researchSchema = {
  type: SchemaType.ARRAY,
  items: {
    type: SchemaType.OBJECT,
    properties: {
      id: {
        type: SchemaType.NUMBER,
        description: "Unique identifier for the research area",
        nullable: false,
      },
      title: {
        type: SchemaType.STRING,
        description: "Title of the research area",
        nullable: false,
      },
      subtopics: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            title: {
              type: SchemaType.STRING,
              description: "Title of the subtopic",
              nullable: false,
            },
            description: {
              type: SchemaType.STRING,
              description: "Description of the subtopic",
              nullable: false,
            },
            completed: {
              type: SchemaType.BOOLEAN,
              description: "Completion status of the subtopic",
              nullable: false,
            },
          },
          required: ["title", "description", "completed"],
        },
        description: "Array of subtopics for the research area",
        nullable: false,
      },
    },
    required: ["id", "title", "subtopics"],
  },
}

const recommendedTopicsSchema = {
  type: SchemaType.ARRAY,
  items: {
    type: SchemaType.OBJECT,
    properties: {
      title: {
        type: SchemaType.STRING,
        description: "Title of the recommended course topic",
        nullable: false,
      },
      subtopics: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.STRING,
          description: "Name of a subtopic",
        },
        description: "Array of subtopics for the recommended course",
        nullable: false,
      },
      iconType: {
        type: SchemaType.STRING,
        description: "Type of icon to display (one of: 'lightbulb', 'heart', 'graduation')",
        nullable: false,
      },
    },
    required: ["title", "subtopics", "iconType"],
  },
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100
    }
  }
}

const pulseAnimation = {
  scale: [1, 1.02, 1],
  transition: {
    duration: 1.5,
    repeat: Infinity,
    ease: "easeInOut"
  }
}

export default function AIResearchPlanner() {
  const { user } = useUserData()
  const navigate = useNavigate()
  const [title, setTitle] = useState("")
  const [inputFields, setInputFields] = useState([{ value: "" }, { value: "" }])
  const [generatedContent, setGeneratedContent] = useState<string | null>(null)
  const [complexity, setComplexity] = useState(50)
  const [recommendedTopics, setRecommendedTopics] = useState([])
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false)
  const [activeSection, setActiveSection] = useState<number | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const addSection = () => {
    setInputFields([...inputFields, { value: "" }])
  }

  const deleteSection = () => {
    if (inputFields.length > 1) {
      setInputFields(inputFields.slice(0, -1))
    }
  }

  const handleInputChange = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const values = [...inputFields]
    values[index].value = event.target.value
    setInputFields(values)
  }

  const handleGenerate = async () => {
    try {
      setIsGenerating(true)
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: researchSchema,
        },
      })

      const fieldValues = inputFields.map((field) => field.value).join(" and ")
      const prompt = `Generate a structured research outline with key areas and subtopics for a study on ${title}, focusing on '${fieldValues}'. The complexity level should be ${complexity}% (where 0% is beginner and 100% is advanced).`

      const result = await model.generateContent(prompt)
      const responseGemini = result.response.text()

      await new Promise(resolve => setTimeout(resolve, 800)) // Minimum animation time

      setGeneratedContent(responseGemini)
      console.log(responseGemini)
      navigate(`/ai-course/aivideo?title=${encodeURIComponent(title)}&data=${encodeURIComponent(responseGemini)}`)
    } catch (error) {
      console.error("Error generating research outline:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCardClick = (topic: any) => {
    setTitle(topic.title)
    const newInputFields = topic.subtopics.map((subtopic: string) => ({
      value: subtopic,
    }))
    setInputFields(newInputFields.length > 1 ? newInputFields : [...newInputFields, { value: "" }])
  }

  const getIconComponent = (iconType: string) => {
    switch (iconType.toLowerCase()) {
      case "lightbulb":
        return <Lightbulb className="w-6 h-6 text-amber-300" />
      case "heart":
        return <Heart className="w-6 h-6 text-rose-400" />
      case "graduation":
      default:
        return <GraduationCap className="w-6 h-6 text-emerald-400" />
    }
  }

  const fetchPersonalizedTopics = async () => {
    if (!user) return
    if (!user.onboardingCompleted) return

    try {
      setIsLoadingRecommendations(true)

      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: recommendedTopicsSchema,
        },
      })

      const prompt = `
        Generate 3 course topic recommendations focused specifically on software testing, system design, and development only.
        
        For each recommended course, provide:
        1. A descriptive title related to testing, system design, or development
        2. 2-3 subtopics that should be covered in the course
        3. An appropriate icon type (choose from: lightbulb, heart, graduation)
        
        The recommendations should be valuable learning opportunities in software testing, system design, or development fields.
      `

      const result = await model.generateContent(prompt)
      const response = result.response.text()
      const parsedResponse = JSON.parse(response)

      if (Array.isArray(parsedResponse) && parsedResponse.length > 0) {
        const formattedTopics = parsedResponse.map((topic) => ({
          ...topic,
          icon: getIconComponent(topic.iconType),
        }))

        setRecommendedTopics(formattedTopics)
      }
    } catch (error) {
      console.error("Error generating topic recommendations:", error)
    } finally {
      setIsLoadingRecommendations(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchPersonalizedTopics()
    }
  }, [user])

  return (
    <div className="flex h-screen bg-[#0a0f1a] text-[#f8fafc] overflow-hidden font-sans">
      {/* Left Section - Course Generator */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-2/3 h-full relative"
      >
        <div className="absolute inset-0 flex flex-col bg-gradient-to-br from-blue-900/10 via-transparent to-purple-900/5">
          <div className="flex-1 overflow-y-auto scrollbar-blue p-6">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="max-w-2xl mx-auto"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 mb-3 pt-6"
              >
                <Code className="w-8 h-8 text-blue-400" />
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  AI Course Generator
                </h1>
              </motion.div>

              <motion.p
                variants={itemVariants}
                className="text-lg text-blue-100/80 mb-6 font-light"
              >
                Create personalized learning paths powered by AI. Specify your course focus and key topics to generate a
                comprehensive curriculum.
              </motion.p>

              <motion.div
                variants={itemVariants}
                whileHover={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <Card className="bg-gray-900/60 shadow-lg border border-blue-500/30 backdrop-filter backdrop-blur-lg relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5" />
                  <div className="p-6 space-y-4 relative">
                    <motion.div variants={itemVariants}>
                      <Label htmlFor="title" className="text-lg font-semibold text-blue-400 mb-2 block">
                        Course Title
                      </Label>
                      <Input
                        id="title"
                        placeholder="Enter course title (e.g., 'Advanced System Testing')"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="text-base py-3 bg-[#0f172a]/80 placeholder-blue-100/60 text-[#f8fafc] border-blue-500/40 
                          focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 transition-all duration-300"
                      />
                    </motion.div>

                    <AnimatePresence>
                      {inputFields.map((field, index) => (
                        <motion.div
                          key={index}
                          variants={itemVariants}
                          initial="hidden"
                          animate="visible"
                          exit={{ opacity: 0, y: -20 }}
                          className="space-y-2"
                          onFocus={() => setActiveSection(index)}
                          onBlur={() => setActiveSection(null)}
                        >
                          <Label
                            htmlFor={`section-${index}`}
                            className="text-lg font-semibold text-blue-400 mb-2 block flex items-center gap-2"
                          >
                            <Terminal className="w-4 h-4" />
                            {`Topic ${index + 1}`}
                          </Label>
                          <div className="relative">
                            <Input
                              id={`section-${index}`}
                              placeholder="Enter a key topic to cover"
                              value={field.value}
                              onChange={(event) => handleInputChange(index, event)}
                              className={`text-base py-3 bg-[#0f172a]/80 placeholder-blue-100/60 text-[#f8fafc] 
                                border-blue-500/40 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 
                                transition-all duration-300 ${activeSection === index ? 'shadow-lg shadow-blue-500/20' : ''}`}
                            />
                            {activeSection === index && (
                              <motion.div
                                className="absolute inset-0 border-2 border-blue-400/20 rounded-lg pointer-events-none"
                                animate={pulseAnimation}
                              />
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    <motion.div
                      variants={itemVariants}
                      className="flex gap-3 pt-3"
                    >
                      <Button
                        onClick={addSection}
                        className="flex-1 py-2 text-sm bg-blue-500/10 hover:bg-blue-500/20 transition-all text-[#f8fafc] 
                          border border-blue-500/40 hover:border-blue-400 group"
                      >
                        <Plus className="w-4 h-4 mr-2 group-hover:rotate-180 transition-transform duration-300" />
                        Add Topic
                      </Button>
                      <Button
                        onClick={deleteSection}
                        className="flex-1 py-2 text-sm bg-red-500/10 hover:bg-red-500/20 transition-all text-[#f8fafc] 
                          border border-red-500/40 hover:border-red-400 group"
                      >
                        <Trash className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-300" />
                        Remove Topic
                      </Button>
                    </motion.div>

                    <motion.div variants={itemVariants}>
                      <Button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="w-full py-3 text-base bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 
                          hover:to-purple-500 transition-all text-[#f8fafc] font-medium relative overflow-hidden group"
                      >
                        {isGenerating ? (
                          <motion.div
                            className="flex items-center gap-2"
                            animate={{ opacity: [1, 0.5, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          >
                            <Sparkles className="w-5 h-5" />
                            Generating...
                          </motion.div>
                        ) : (
                          <span className="flex items-center gap-2">
                            <Code className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
                            Generate Course Content
                          </span>
                        )}
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20"
                          initial={{ x: '-100%' }}
                          animate={isGenerating ? { x: '100%' } : { x: '-100%' }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        />
                      </Button>
                    </motion.div>
                  </div>
                </Card>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Right Section - Recommended Topics */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-1/3 h-full relative"
      >
        <div className="absolute inset-0 flex flex-col">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-between items-center px-8 py-4 border-b border-cyan-500/30 bg-[#0a0f1a] shadow-lg"
          >
            <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent flex items-center gap-2">
              <Terminal className="w-6 h-6 text-cyan-400" />
              Developer Topics
            </h2>
          </motion.div>

          <div className="flex-1 overflow-y-auto scrollbar-normal p-8 border-l border-cyan-500/20 
            bg-gradient-to-b from-gray-900/90 via-gray-900/60 to-transparent">
            <AnimatePresence>
              {isLoadingRecommendations ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex justify-center items-center h-32"
                >
                  <motion.div
                    className="w-12 h-12 border-2 border-cyan-500 rounded-full border-t-transparent"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                </motion.div>
              ) : (
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-6"
                >
                  {recommendedTopics.map((topic, index) => (
                    <motion.div
                      key={index}
                      variants={itemVariants}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      <Card
                        onClick={() => handleCardClick(topic)}
                        className="rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer 
                          bg-gradient-to-br from-[#0f2d4a] to-[#1a1f3c] border border-cyan-500/40 relative group"
                      >
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100"
                          transition={{ duration: 0.3 }}
                        />

                        <CardHeader className="bg-gradient-to-r from-cyan-950 to-blue-950 p-4 relative">
                          <CardTitle className="text-2xl font-bold text-[#f8fafc] flex items-center gap-3">
                            {topic.icon}
                            <span className="bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
                              {topic.title}
                            </span>
                          </CardTitle>
                        </CardHeader>

                        <CardContent className="p-6 bg-gradient-to-b from-cyan-900/20 to-cyan-950/20">
                          <ul className="space-y-3">
                            {topic.subtopics.map((t, i) => (
                              <motion.li
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="flex items-center text-white/90 text-lg group/item"
                              >
                                <ChevronRight className="w-4 h-4 mr-2 text-cyan-400 group-hover/item:translate-x-1 transition-transform" />
                                {t}
                              </motion.li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  )
}