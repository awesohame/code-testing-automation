"use client"

import { useState, useEffect } from "react"
import {
  Star,
  Clock,
  Users,
  Play,
  Share2,
  Text,
  Check,
  X,
  Square,
  BookOpen,
  FileText,
  MessageSquare,
  Award,
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import axios from "axios"
import { Card } from "@/components/ui/card"
import Groq from "groq-sdk"
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai"
import { useSearchParams } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const apiKey = "AIzaSyDlcjeiBAXsMJ5d_Wnn5h-afC5X9bKmep8"
const genAI = new GoogleGenerativeAI(apiKey!)

const groq = new Groq({
  apiKey: "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",
  dangerouslyAllowBrowser: true,
})
const questionsSchema = {
  type: SchemaType.ARRAY,
  items: {
    type: SchemaType.OBJECT,
    properties: {
      id: {
        type: SchemaType.NUMBER,
        description: "Unique identifier for the question",
        nullable: false,
      },
      question: {
        type: SchemaType.STRING,
        description: "The multiple choice question text",
        nullable: false,
      },
      answer: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.STRING,
          description: "Multiple choice options",
        },
        description: "Array of four possible answers",
        nullable: false,
      },
      correctAns: {
        type: SchemaType.STRING,
        description: "The correct answer from the options",
        nullable: false,
      },
    },
    required: ["id", "question", "answer", "correctAns"],
  },
}

interface Video {
  id: {
    videoId: string
  }
}

interface Question {
  id: string
  question: string
  answer: string[]
  correctAns: string
}

interface YoutubeSearchProps {
  title: string
}

interface Question {
  id: string
  question: string
  answer: string[]
}

interface QuestionsProps {
  ques: Question[] | null
}

export default function CoursePage() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState({ unit: 1, chapter: 1, title: "" })
  const [ques, setques] = useState([])
  const [searchParams] = useSearchParams()
  const title = searchParams.get("title")
  const data = searchParams.get("data")
  const [selectedTitle, setSelectedTitle] = useState("")
  const [dubbedVideo, setDubbedVideo] = useState("")
  const [loading, setLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState("")
  const [error, setError] = useState("")
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({})
  const [isLocked, setIsLocked] = useState<Record<string, boolean>>({})
  const [progress, setProgress] = useState(0)

  const handleAnswerSelection = (questionId: string, selectedOption: string) => {
    // Allow selection only if the answer is not locked
    if (!isLocked[questionId]) {
      setSelectedAnswers((prev) => ({
        ...prev,
        [questionId]: selectedOption,
      }))

      // Lock the question after selection
      setIsLocked((prev) => ({
        ...prev,
        [questionId]: true,
      }))
    }
  }

  const [course, setCourse] = useState([])

  useEffect(() => {
    try {
      const parsedData = JSON.parse(data)
      const modifiedData = parsedData.map((topic: { subtopics: any[] }) => {
        return {
          ...topic,
          subtopics: topic.subtopics.map((subtopic) => ({
            ...subtopic,
            completed: false,
          })),
        }
      })

      setCourse(modifiedData)
      if (parsedData.length > 0 && parsedData[0].subtopics.length > 0) {
        setSelected((prevSelected) => ({
          ...prevSelected,
          title: parsedData[0].subtopics[0],
        }))
      }
    } catch (error) {
      console.error("Error parsing JSON:", error)
    }
  }, [data])

  useEffect(() => {
    // Calculate progress based on completed subtopics
    if (course.length > 0) {
      const totalSubtopics = course.reduce((total, section) => total + section.subtopics.length, 0)

      const completedSubtopics = course.reduce(
        (total, section) => total + section.subtopics.filter((subtopic) => subtopic.completed).length,
        0,
      )

      setProgress(Math.round((completedSubtopics / totalSubtopics) * 100))
    }
  }, [course])

  const handleSubtopicClick = (unit: any, chapter: any, title: any) => {
    setSelected({ unit, chapter, title })
  }

  const [videos, setVideos] = useState<Video[]>([])
  const [videoSummary, setVideoSummary] = useState<string>("")
  const [questions, setQuestions] = useState<Question[]>([])

  const API_KEY: string = "AIzaSyBrdsClFkrQokGYbdXCVSbUTtcOanxUFBM" // Replace with your actual API key

  const handleSearch = async (titleSelected: any): Promise<void> => {
    console.log(titleSelected)

    try {
      const response = await axios.get(
        `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&q=${
          title + " " + titleSelected.title
        }&videoDuration=medium&videoEmbeddable=true&type=video&maxResults=5`,
      )

      const items: Video[] = response.data.items
      console.log("Videos: ", videos)
      setVideos(items)

      if (items.length > 0) {
        const videoId = items[0].id.videoId
        const summary = await summarizeVideo(videoId)
        setVideoSummary(summary)
      }
    } catch (error) {
      console.error("Error fetching YouTube data:", error)
    }
  }

  const summarizeVideo = async (videoId: string): Promise<string> => {
    try {
      // Generate a summary using Groq's chat completion API
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          {
            role: "user",
            content: `Write a random paragraph about the YouTube video related to ${title}. The paragraph should be at least 100 words long and it should just be the summary`,
          },
        ],
        model: "llama3-70b-8192",
        temperature: 0.2,
        max_completion_tokens: 500,
        top_p: 1,
        stream: false,
        stop: null,
      })

      // Extract the generated summary from the response
      const summary: any = chatCompletion.choices[0].message.content
      console.log("Summary:", summary)

      // Generate questions and answers based on the summary
      await generateQuestionsAndAnswers(summary)

      return summary
    } catch (error) {
      console.error("Error generating summary:", error)
      return ""
    }
  }
  const generateQuestionsAndAnswers = async (summary: string): Promise<void> => {
    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: questionsSchema,
        },
      })

      const prompt = `Based on the video summary provided, generate 5 multiple-choice questions related to the content. Each question should have four possible answers.
      Video Summary: '${summary}'`

      const result = await model.generateContent(prompt)
      const response = await result.response
      const text = response.text()
      const parsedResponse = JSON.parse(text) as Question[]

      console.log("Generated questions:", parsedResponse)
      setques(parsedResponse as any)
    } catch (error) {
      console.error("Error generating questions and answers:", error)
    }
  }

  const handlevideoDubbing = async (url: string) => {
    const messages = [
      "Transcribing video",
      "Translating to Punjabi",
      "Converting Text-to-Speech",
      "Merging Audios",
      "Replacing original video with dubbed audio",
    ]

    setLoading(true)
    let messageIndex = 0

    const messageInterval = setInterval(() => {
      setLoadingMessage(messages[messageIndex])
      messageIndex = (messageIndex + 1) % messages.length
    }, 3000)

    try {
      const response = await axios.post("http://localhost:5000/process-video", {
        url: url,
      })

      if (response.data.success) {
        setDubbedVideo(response.data.video_url)
      } else {
        alert("Failed to process the video.")
      }
    } catch (error) {
      alert("An error occurred while processing the video.")
    } finally {
      clearInterval(messageInterval)
      setLoading(false)
      setLoadingMessage("")
    }
  }

  const handleCertify = () => {
    navigate(`/certify?title=${title}`)
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200">
      <div className="flex flex-col lg:flex-row">
        {/* Main Content */}
        <div className="flex-1">
          {/* Video Player Section */}
          <div className="relative p-8">
            <div className="relative bg-black aspect-video rounded-xl overflow-hidden border border-gray-800 shadow-2xl">
              {videos.length > 0 && videos[0].id.videoId && (
                <iframe
                  className="w-full h-full"
                  title="YouTube Video"
                  src={dubbedVideo || `https://www.youtube.com/embed/${videos[0].id.videoId}`}
                  allowFullScreen
                ></iframe>
              )}
            </div>

            {/* Course Navigation */}
            <div className="mt-8">
              <Card className="rounded-xl border-gray-800 bg-gray-900 shadow-xl">
                <div className="flex items-center justify-between py-6 px-8 border-b border-gray-800">
                  <div>
                    <h1 className="text-2xl font-bold text-white">{selectedTitle}</h1>
                    <div className="flex items-center mt-2 space-x-2">
                      <Badge variant="outline" className="bg-indigo-950 text-indigo-300 border-indigo-800 px-2">
                        {title}
                      </Badge>
                      <Badge variant="outline" className="bg-gray-800 text-gray-300 border-gray-700 px-2">
                        <Clock className="w-3 h-3 mr-1" /> 37 mins
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end">
                      <div className="text-sm text-gray-400 mb-1">{progress}% complete</div>
                      <Progress value={progress} className="w-32 h-2 bg-gray-800" />
                    </div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className="text-gray-400 hover:text-white border-gray-700 hover:bg-gray-800"
                          >
                            <Share2 className="h-5 w-5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Share this course</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>

                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="bg-gray-900 border-b border-gray-800 rounded-none h-12 w-full justify-start px-6">
                    <TabsTrigger
                      value="overview"
                      className="data-[state=active]:bg-gray-800 data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-indigo-500"
                    >
                      <BookOpen className="w-4 h-4 mr-2" />
                      Overview
                    </TabsTrigger>
                    <TabsTrigger
                      value="q&a"
                      className="data-[state=active]:bg-gray-800 data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-indigo-500"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Q&A
                    </TabsTrigger>
                    <TabsTrigger
                      value="notes"
                      className="data-[state=active]:bg-gray-800 data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-indigo-500"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Notes
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="p-8 bg-gray-900">
                    <div className="space-y-6">
                      <div className="flex items-center gap-6 bg-gray-800 p-4 rounded-lg">
                        <div className="flex items-center">
                          <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                          <span className="ml-1 font-semibold text-white">4.7</span>
                          <span className="ml-1 text-gray-400">(412 reviews)</span>
                        </div>
                        <div className="flex items-center text-gray-400">
                          <Users className="w-5 h-5" />
                          <span className="ml-1">1,371 students</span>
                        </div>
                        <div className="flex items-center text-gray-400">
                          <Clock className="w-5 h-5" />
                          <span className="ml-1">61.5 minutes</span>
                        </div>
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                          <Text className="w-5 h-5 mr-2 text-indigo-400" />
                          Summary
                        </h2>
                        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                          <p className="text-gray-300 leading-relaxed">
                            {videoSummary || "No summary available. Select a topic to view its summary."}
                          </p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="q&a" className="p-8 bg-gray-900">
                    <div className="space-y-6">
                      {ques.length > 0 ? (
                        Object.values(ques).map((question: any) => (
                          <Card key={question.id} className="p-6 rounded-lg border-gray-800 bg-gray-800 shadow-lg">
                            <h3 className="text-lg font-bold text-white mb-4">{question.question}</h3>
                            <div className="mt-4 space-y-3">
                              {question.answer.map((option: any, index: any) => {
                                const isSelected = selectedAnswers[question.id] === option
                                const isCorrect = isSelected && option === question.correctAns
                                return (
                                  <div
                                    key={index}
                                    className={`flex items-center space-x-2 p-4 rounded-lg hover:bg-gray-700 cursor-pointer transition-all
                                                                            ${isLocked[question.id] ? "pointer-events-none" : ""}
                                                                            ${isSelected && isCorrect ? "bg-green-900/30 border border-green-700" : ""}
                                                                            ${isSelected && !isCorrect ? "bg-red-900/30 border border-red-700" : ""}
                                                                            ${!isSelected ? "border border-gray-700" : ""}`}
                                    onClick={() => handleAnswerSelection(question.id, option)}
                                  >
                                    {isSelected ? (
                                      isCorrect ? (
                                        <Check className="text-green-400" size={18} />
                                      ) : (
                                        <X className="text-red-400" size={18} />
                                      )
                                    ) : (
                                      <Square className="text-gray-400" size={18} />
                                    )}
                                    <span
                                      className={`${isSelected && isCorrect ? "text-green-400" : isSelected ? "text-red-400" : "text-gray-300"} font-medium`}
                                    >
                                      {option}
                                    </span>
                                  </div>
                                )
                              })}
                            </div>
                          </Card>
                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                          <MessageSquare className="w-16 h-16 text-gray-700 mb-4" />
                          <h3 className="text-xl font-bold text-gray-400">No questions available</h3>
                          <p className="text-gray-500 mt-2">Select a topic to view its questions</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="notes" className="p-8 bg-gray-900">
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <FileText className="w-16 h-16 text-gray-700 mb-4" />
                      <h3 className="text-xl font-bold text-gray-400">Notes feature coming soon</h3>
                      <p className="text-gray-500 mt-2">You'll be able to take notes while watching videos</p>
                    </div>
                  </TabsContent>
                </Tabs>
              </Card>
            </div>
          </div>
        </div>

        {/* Course Content Sidebar */}
        <div className="lg:w-[400px] bg-gray-900 border-l border-gray-800 shadow-xl">
          <div className="p-6 border-b border-gray-800">
            <h2 className="text-2xl font-bold text-white">Course Content</h2>
            <div className="flex items-center justify-between mt-2">
              <p className="text-gray-400">{title}</p>
              <Badge variant="outline" className="bg-indigo-950 text-indigo-300 border-indigo-800">
                {progress}% complete
              </Badge>
            </div>
          </div>
          <ScrollArea className="h-[calc(100vh-100px)]">
            <Accordion type="single" collapsible className="w-full">
              {course.map((section: any, index: number) => {
                const completedCount = section.subtopics.reduce(
                  (count: number, subtopic: { completed: boolean }) => (subtopic.completed ? count + 1 : count),
                  0,
                )

                return (
                  <AccordionItem key={index} value={`section-${index}`} className="border-b border-gray-800">
                    <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-gray-800 text-white">
                      <div className="flex flex-col items-start">
                        <div className="font-semibold">{section.title}</div>
                        <div className="text-sm text-gray-400 mt-1">
                          {completedCount}/{section.subtopics.length} | 37 mins
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="bg-gray-800 px-2">
                      <div className="space-y-1 p-2">
                        {section.subtopics.map((lecture: any, lectureIndex: number) => (
                          <button
                            key={lectureIndex}
                            className={`w-full px-4 py-3 text-left rounded-lg flex items-center gap-3 transition-all
                                                            ${selected.title === lecture ? "bg-indigo-900/50 text-white" : "hover:bg-gray-700 text-gray-300"}`}
                            onClick={() => {
                              handleSubtopicClick(lecture.id, lectureIndex + 1, lecture)
                              handleSearch(lecture)
                              setSelectedTitle(lecture.title)
                              setCourse((prevCourse: any) =>
                                prevCourse.map((topic: any) => ({
                                  ...topic,
                                  subtopics: topic.subtopics.map((subtopic: any) =>
                                    subtopic.id === lecture.id ? { ...subtopic, completed: true } : subtopic,
                                  ),
                                })),
                              )
                            }}
                          >
                            <div
                              className={`w-8 h-8 flex items-center justify-center rounded-full flex-shrink-0 
                                                            ${lecture.completed ? "bg-indigo-900/50 text-indigo-300" : "bg-gray-700 text-gray-400"}`}
                            >
                              {lecture.completed ? <Check className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                            </div>
                            <span className="flex-1">{lecture.title}</span>
                          </button>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )
              })}
            </Accordion>

            <div className="w-full flex justify-center p-8">
              {course.every((section: any) => section.subtopics.every((subtopic: any) => subtopic.completed)) ? (
                <Button
                  onClick={() => handleCertify()}
                  className="px-8 py-6 text-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg font-bold shadow-lg transition-all"
                >
                  <Award className="w-5 h-5 mr-2" />
                  Get Your Certificate
                </Button>
              ) : (
                <Button disabled className="px-8 py-6 text-xl bg-gray-800 text-gray-500 rounded-lg cursor-not-allowed">
                  Complete the course first
                </Button>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}

