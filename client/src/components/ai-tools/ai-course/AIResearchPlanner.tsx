"use client"

import { useState, useEffect } from "react"
import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai"
import { ChevronRight, Plus, Trash, Lightbulb, Heart, GraduationCap } from "lucide-react"
import { useUserData } from "@/hooks/useUserData"

// Add custom scrollbar styles
const scrollbarStyles = `
  .scrollbar-thin::-webkit-scrollbar {
    width: 6px;
  }
  .scrollbar-thin::-webkit-scrollbar-track {
    background: var(--scrollbar-track, #0f172a);
  }
  .scrollbar-thin::-webkit-scrollbar-thumb {
    background: var(--scrollbar-thumb, #3b82f6);
    border-radius: 3px;
  }
  .scrollbar-blue::-webkit-scrollbar {
    width: 6px;
  }
  .scrollbar-blue::-webkit-scrollbar-track {
    background: #0f172a;
  }
  .scrollbar-blue::-webkit-scrollbar-thumb {
    background: #3b82f6;
    border-radius: 3px;
  }
  .scrollbar-normal::-webkit-scrollbar {
    width: 8px;
  }
  .scrollbar-normal::-webkit-scrollbar-track {
    background: #0f172a;
  }
  .scrollbar-normal::-webkit-scrollbar-thumb {
    background: #334155;
    border-radius: 3px;
  }
`

// Optional: You can use framer-motion if you want the animations
import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"

const genAI = new GoogleGenerativeAI("AIzaSyDlcjeiBAXsMJ5d_Wnn5h-afC5X9bKmep8")

// Define the schema for research outline
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

// Define schema for recommended topics
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

export default function AIResearchPlanner() {
  const { user } = useUserData()
  const navigate = useNavigate()
  const [title, setTitle] = useState("")
  const [inputFields, setInputFields] = useState([{ value: "" }, { value: "" }])
  const [generatedContent, setGeneratedContent] = useState<string | null>(null)
  const [complexity, setComplexity] = useState(50)
  const [recommendedTopics, setRecommendedTopics] = useState([])
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false)

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

      setGeneratedContent(responseGemini)
      console.log(responseGemini)
      navigate(`/ai-course/aivideo?title=${encodeURIComponent(title)}&data=${encodeURIComponent(responseGemini)}`)
    } catch (error) {
      console.error("Error generating research outline:", error)
    }
  }

  const handleCardClick = (topic: any) => {
    setTitle(topic.title)
    const newInputFields = topic.subtopics.map((subtopic: string) => ({
      value: subtopic,
    }))
    setInputFields(newInputFields.length > 1 ? newInputFields : [...newInputFields, { value: "" }])
  }

  // Function to get icon component based on icon type string
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

  // Fetch personalized recommended topics focused on testing, system design and development
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
        // Transform the response to include the icon component
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
    // Inject custom scrollbar styles
    const styleElement = document.createElement("style")
    styleElement.textContent = scrollbarStyles
    document.head.appendChild(styleElement)

    return () => {
      document.head.removeChild(styleElement)
    }
  }, [])

  // Effect to fetch personalized recommendations when user data changes
  useEffect(() => {
    if (user) {
      fetchPersonalizedTopics()
    }
  }, [user])

  return (
    <div className="flex h-screen bg-[#0f172a] text-[#f8fafc] overflow-hidden font-sans">
      {/* Left Section - Course Generator */}
      <div className="w-2/3 h-full relative">
        <div className="absolute inset-0 flex flex-col bg-gradient-to-b from-blue-900/10 via-transparent to-blue-900/5">
          {/* Modified scrollbar for the middle section */}
          <div id="left-scroll-container" className="flex-1 overflow-y-auto scrollbar-blue p-8">
            <div className="max-w-2xl mx-auto">
              <h1 className="text-5xl font-bold text-blue-400 mb-4 pt-10">AI Course Generator 🚀</h1>
              <p className="text-xl text-blue-100/80 mb-8 font-light">
                Create personalized learning paths powered by AI. Specify your course focus and key topics to generate a
                comprehensive curriculum.
              </p>

              <Card className="bg-[#1a365d] rounded-3xl shadow-xl p-8 space-y-6 border border-blue-400/30 backdrop-filter backdrop-blur-lg">
                <div>
                  <Label htmlFor="title" className="text-2xl font-semibold text-cyan-300 mb-2 block">
                    Course Title 📚
                  </Label>
                  <Input
                    id="title"
                    placeholder="Enter course title (e.g., 'Advanced System Testing')"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="rounded-xl text-xl py-6 bg-[#0f172a] placeholder-blue-100/60 text-[#f8fafc] border-cyan-500/40 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30"
                  />
                </div>

                {inputFields.map((field, index) => (
                  <div key={index}>
                    <Label htmlFor={`section-${index}`} className="text-2xl font-semibold text-cyan-300 mb-2 block">
                      {`Topic ${index + 1} 🔍`}
                    </Label>
                    <Input
                      id={`section-${index}`}
                      placeholder="Enter a key topic to cover"
                      value={field.value}
                      onChange={(event) => handleInputChange(index, event)}
                      className="rounded-xl text-xl py-6 bg-[#0f172a] placeholder-blue-100/60 text-[#f8fafc] border-cyan-500/40 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30"
                    />
                  </div>
                ))}

                <div className="flex gap-4 pt-4">
                  <Button
                    onClick={addSection}
                    className="flex-1 rounded-xl py-6 text-xl bg-emerald-800/80 hover:bg-emerald-700/80 transition-all text-[#f8fafc] border border-emerald-500/40 shadow-inner shadow-emerald-500/5"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Add Topic
                  </Button>
                  <Button
                    onClick={deleteSection}
                    className="flex-1 rounded-xl py-6 text-xl bg-rose-800/80 hover:bg-rose-700/80 transition-all text-[#f8fafc] border border-rose-500/40 shadow-inner shadow-rose-500/5"
                  >
                    <Trash className="w-5 h-5 mr-2" />
                    Remove Topic
                  </Button>
                </div>

                <Button
                  onClick={handleGenerate}
                  className="w-full rounded-xl py-6 text-2xl bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 transition-all text-[#f8fafc] font-bold shadow-lg border-none"
                >
                  Generate Course Content ✨
                </Button>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Right Section - Recommended Topics (focused on testing/system design) */}
      <div className="w-1/3 h-full relative">
        <div className="absolute inset-0 flex flex-col">
          <div className="flex justify-between items-center px-8 py-4 border-b border-blue-500/30 bg-[#0f172a] shadow-md">
            <h2 className="text-2xl font-bold text-cyan-400">
              {user ? "Testing & Development Topics" : "Testing & Development Topics"}
            </h2>
          </div>
          <div
            id="right-scroll-container"
            className="flex-1 overflow-y-auto scrollbar-normal p-8 border-l border-blue-500/20 bg-gradient-to-b from-gray-900/90 via-gray-900/60 to-transparent"
          >
            <div className="space-y-6">
              {isLoadingRecommendations ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
                </div>
              ) : (
                recommendedTopics.map((topic, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Card
                      className="rounded-xl gap-0 py-0 hover:shadow-cyan-500/10 hover:shadow-xl transition-all duration-300 cursor-pointer bg-[#164e68] border border-cyan-500/40"
                      onClick={() => handleCardClick(topic)}
                    >
                      <CardHeader className="bg-gradient-to-r from-cyan-950 to-blue-950 rounded-t-xl p-4">
                        <CardTitle className="text-2xl font-bold text-[#f8fafc] flex items-center">
                          <span className="">{topic.title}</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6 bg-gradient-to-b from-cyan-900 to-cyan-950">
                        <ul className="space-y-2">
                          {topic.subtopics.map((t, i) => (
                            <li key={i} className="flex items-center text-white text-lg">
                              <ChevronRight className="w-4 h-4 mr-2 text-white" />
                              {t}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

