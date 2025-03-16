"use client"

import { useState, useEffect } from "react"
import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai"
import { ChevronUp, ChevronDown, Plus, Trash, ChevronRightIcon, Lightbulb, Heart, GraduationCap } from "lucide-react"

// Add custom scrollbar styles
const scrollbarStyles = `
  .scrollbar-thin::-webkit-scrollbar {
    width: 6px;
  }
  .scrollbar-thin::-webkit-scrollbar-track {
    background: var(--scrollbar-track, #1f2937);
  }
  .scrollbar-thin::-webkit-scrollbar-thumb {
    background: var(--scrollbar-thumb, #4f46e5);
    border-radius: 3px;
  }
  .scrollbar-purple::-webkit-scrollbar {
    width: 6px;
  }
  .scrollbar-purple::-webkit-scrollbar-track {
    background: #1f2937;
  }
  .scrollbar-purple::-webkit-scrollbar-thumb {
    background: #7c3aed;
    border-radius: 3px;
  }
  .scrollbar-normal::-webkit-scrollbar {
    width: 8px;
  }
  .scrollbar-normal::-webkit-scrollbar-track {
    background: #1f2937;
  }
  .scrollbar-normal::-webkit-scrollbar-thumb {
    background: #4b5563;
    border-radius: 3px;
  }
`

// Optional: You can use framer-motion if you want the animations
// If you want to remove it, just remove the motion imports and replace motion.div with regular div
import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"

const genAI = new GoogleGenerativeAI("AIzaSyCKCRR56-u5ENjCQ0IfwefNENVslKxKRoY")

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


export default function AIResearchPlanner() {
  const navigate=useNavigate();
  const [title, setTitle] = useState("")
  const [inputFields, setInputFields] = useState([{ value: "" }, { value: "" }])
  const [generatedContent, setGeneratedContent] = useState<string | null>(null)
  const [complexity, setComplexity] = useState(50)
  const [recommendedTopics] = useState([
    {
      title: "Sign Language Linguistics",
      subtopics: ["Syntax and Grammar", "Regional Variations"],
      icon: <Lightbulb className="w-6 h-6 text-purple-400" />,
    },
    {
      title: "Sign Language Education",
      subtopics: ["Teaching Methods", "E-learning for Sign Language"],
      icon: <GraduationCap className="w-6 h-6 text-purple-400" />,
    },
    {
      title: "Real-Time Sign Language Translation",
      subtopics: ["Motion Tracking", "Natural Language Processing"],
      icon: <Heart className="w-6 h-6 text-purple-400" />,
    },
  ])

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

  const handleCardClick = (topic: (typeof recommendedTopics)[0]) => {
    setTitle(topic.title)
    const newInputFields = topic.subtopics.map((subtopic) => ({
      value: subtopic,
    }))
    setInputFields(newInputFields.length > 1 ? newInputFields : [...newInputFields, { value: "" }])
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

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100 overflow-hidden">
      {/* Left Section - Course Generator */}
      <div className="w-2/3 h-full relative">
        <div className="absolute inset-0 flex flex-col">
          {/* Modified top header - removed partition, centered buttons */}
          
          {/* Modified scrollbar for the middle section */}
          <div
            id="left-scroll-container"
            className="flex-1 overflow-y-auto scrollbar-purple p-8"
          >
            <div className="max-w-2xl mx-auto">
              <h1 className="text-5xl font-bold text-purple-400 mb-4 pt-10 font-sans">AI Course Generator 🚀</h1>
              <p className="text-xl text-gray-400 mb-8 font-light">
                Create personalized learning paths powered by AI. Specify your course focus and key topics to generate a
                comprehensive curriculum.
              </p>

              <Card className="bg-gray-800 rounded-3xl shadow-2xl p-8 space-y-6 border-gray-700">
                <div>
                  <Label htmlFor="title" className="text-2xl font-semibold text-purple-400 mb-2 block">
                    Course Title 📚
                  </Label>
                  <Input
                    id="title"
                    placeholder="Enter course title (e.g., 'Business ASL Basics')"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="rounded-xl text-xl py-6 bg-gray-700 placeholder-gray-500 text-gray-100 border-gray-600"
                  />
                </div>

                {inputFields.map((field, index) => (
                  <div key={index}>
                    <Label htmlFor={`section-${index}`} className="text-2xl font-semibold text-purple-400 mb-2 block">
                      {`Topic ${index + 1} 🔍`}
                    </Label>
                    <Input
                      id={`section-${index}`}
                      placeholder="Enter a key topic to cover"
                      value={field.value}
                      onChange={(event) => handleInputChange(index, event)}
                      className="rounded-xl text-xl py-6 bg-gray-700 placeholder-gray-500 text-gray-100 border-gray-600"
                    />
                  </div>
                ))}

                

                <div className="flex gap-4 pt-4">
                  <Button
                    onClick={addSection}
                    className="flex-1 rounded-xl py-6 text-xl bg-green-700 hover:bg-green-800 transition-all text-white"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Add Topic
                  </Button>
                  <Button
                    onClick={deleteSection}
                    className="flex-1 rounded-xl py-6 text-xl bg-red-700 hover:bg-red-800 transition-all text-white"
                  >
                    <Trash className="w-5 h-5 mr-2" />
                    Remove Topic
                  </Button>
                </div>

                <Button
                  onClick={handleGenerate}
                  className="w-full rounded-xl py-6 text-2xl bg-gradient-to-r from-purple-700 to-indigo-900 hover:from-purple-800 hover:to-indigo-950 transition-all text-white font-bold shadow-lg"
                >
                  Generate Course Content ✨
                </Button>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Right Section - Recommended Topics (kept as is) */}
      <div className="w-1/3 h-full relative">
        <div className="absolute inset-0 flex flex-col">
          <div className="flex justify-between items-center px-8 py-4 border-b border-gray-700 bg-gray-800">
            <h2 className="text-2xl font-bold text-purple-400">Popular Templates 🌟</h2>
          </div>
          <div
            id="right-scroll-container"
            className="flex-1 overflow-y-auto scrollbar-normal p-8 border-l border-gray-700"
          >
            <div className="space-y-6">
              {recommendedTopics.map((topic, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card
                    className="rounded-xl hover:shadow-2xl transition-all duration-300 cursor-pointer bg-gray-700 border-gray-600"
                    onClick={() => handleCardClick(topic)}
                  >
                    <CardHeader className="bg-gradient-to-r from-purple-900 to-indigo-900 rounded-t-xl p-6">
                      <CardTitle className="text-2xl font-bold text-gray-100 flex items-center">
                        {topic.icon}
                        <span className="ml-2">{topic.title}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <ul className="space-y-2">
                        {topic.subtopics.map((t, i) => (
                          <li key={i} className="flex items-center text-gray-300 text-lg">
                            <ChevronRightIcon className="w-4 h-4 mr-2 text-purple-400" />
                            {t}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}