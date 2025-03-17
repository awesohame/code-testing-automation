import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  BookOpen, 
  Stars, 
  GraduationCap, 
  Sparkles,
  Calculator,
  Code,
  Wrench,
  ChevronRight,
  MoveRight,
  TestTube
} from "lucide-react";


const getRandomRating = () => (Math.random() * (5 - 3.5) + 3.5).toFixed(1);

async function searchBooks(query: string) {
    const url = `http://localhost:5000/api/search?query=${query}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch books");
    return res.json();
}

function BookCard({ book }: { book: any }) {
    return (
        <Card className="group relative overflow-hidden transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl rounded-2xl border border-blue-500/20 bg-gray-900/60 backdrop-blur-sm">
            <div className="absolute -top-2 -right-2 z-10">
                {book.position <= 3 && (
                    <Badge className="bg-gradient-to-r from-orange-400 to-pink-500 text-white border-0 shadow-md">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Top Pick
                    </Badge>
                )}
            </div>
            <CardHeader className="space-y-2 p-6">
                <div className="flex items-center space-x-2">
                    <div className="bg-blue-500/10 p-2 rounded-lg">
                        <GraduationCap className="w-4 h-4 text-blue-400" />
                    </div>
                    <span className="text-sm font-medium text-blue-400">{book.source}</span>
                </div>
                <h3 className="text-lg font-semibold text-white line-clamp-2 group-hover:text-blue-400 transition-colors">
                    {book.title}
                </h3>
            </CardHeader>
            <CardContent className="space-y-4 p-6 pt-0">
                <p className="text-sm text-blue-100/80 line-clamp-3">{book.snippet}</p>
                <div className="flex justify-between items-center">
                    <a
                        href={book.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-sm font-medium text-blue-400 hover:text-blue-300 transition-all group/link"
                    >
                        <span>View Details</span>
                        <MoveRight className="ml-1 w-4 h-4 transform transition-transform duration-300 group-hover/link:translate-x-1" />
                    </a>
                    <Badge variant="secondary" className="flex items-center space-x-1 bg-blue-500/10 text-blue-400">
                        <Stars className="w-3 h-3" />
                        <span>{book.rating}</span>
                    </Badge>
                </div>
            </CardContent>
        </Card>
    );
}

function SearchBar({ onSearch }: { onSearch: (query: string) => void }) {
    const [query, setQuery] = useState("");
    const [isTyping, setIsTyping] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            onSearch(query.trim());
            setIsTyping(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto bg-gray-900/60 backdrop-blur-sm rounded-2xl shadow-lg p-2 border border-blue-500/20">
            <div className="relative group">
                <Input
                    type="text"
                    placeholder="Search for academic resources..."
                    className={`w-full h-12 pl-12 pr-24 rounded-xl text-white bg-gray-900/60 transition-all duration-300 border
                    ${isTyping ? 'border-blue-400 ring-2 ring-blue-500/10' : 'border-blue-500/20'}`}
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsTyping(true);
                    }}
                    onBlur={() => setIsTyping(false)}
                />
                <Search
                    className={`absolute left-4 top-1/2 transform -translate-y-1/2 transition-colors duration-300
                    ${isTyping ? 'text-blue-400' : 'text-blue-100/80'}`}
                    size={20}
                />
                <Button
                    type="submit"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-500/10 hover:bg-blue-500/20
                    transition-all duration-300 rounded-lg px-4 py-1.5 text-blue-400 border border-blue-500/30"
                >
                    Search
                </Button>
            </div>
        </form>
    );
}

function SubjectCategories({ onSearch }: { onSearch: (query: string) => void }) {
    const subjects = [
        {
            name: "Mathematics",
            topics: ["Calculus", "Statistics", "Linear Algebra"],
            icon: <Calculator className="w-6 h-6 text-white" />,
            gradient: "from-blue-900 to-blue-700"
        },
        {
            name: "Computer Science",
            topics: ["Programming", "Data Structures", "Algorithms"],
            icon: <Code className="w-6 h-6 text-white" />,
            gradient: "from-blue-800 to-blue-600"
        },
        {
            name: "Engineering",
            topics: ["Mechanical", "Electrical", "Civil"],
            icon: <Wrench className="w-6 h-6 text-white" />,
            gradient: "from-blue-700 to-blue-500"
        },
        {
            name: "Sciences",
            topics: ["Physics", "Chemistry", "Biology"],
            icon: <TestTube className="w-6 h-6 text-white" />, 
            gradient: "from-blue-600 to-blue-400",
        }
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {subjects.map((subject) => (
                <div
                    key={subject.name}
                    className={`p-6 rounded-xl bg-gradient-to-br ${subject.gradient} transform hover:-translate-y-1
                    transition-all duration-300 cursor-pointer shadow-lg border border-blue-500/20`}
                >
                    <div className="flex items-center mb-4">
                        <div className="bg-white/10 rounded-lg p-2 mr-3">
                            {subject.icon}
                        </div>
                        <h3 className="text-xl font-bold text-white">{subject.name}</h3>
                    </div>
                    <ul className="space-y-2">
                        {subject.topics.map((topic) => (
                            <li
                                key={topic}
                                onClick={() => onSearch(`${subject.name} ${topic} textbook`)}
                                className="text-blue-100/80 hover:text-white transition-colors flex items-center text-sm group"
                            >
                                <ChevronRight className="w-4 h-4 mr-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                                {topic}
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
    );
}

export default function BookSearchPage() {
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchBooks = async (query: string) => {
        setLoading(true);
        setError(null);
        try {
            const data = await searchBooks(query);
            const booksWithRating = (data.organic_results || []).map((book: any) => ({
                ...book,
                rating: getRandomRating(),
            }));
            setBooks(booksWithRating);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBooks("academic textbooks");
    }, []);

    return (
        <div className="min-h-screen bg-[#0f172a]">
            <div className="w-full bg-gray-900/60 backdrop-blur-sm border-b border-blue-500/20">
                <header className="container mx-auto px-4 py-16">
                    <h1 className="text-4xl md:text-5xl font-bold text-center mb-4 bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                        Academic Resource Hub
                    </h1>
                    <p className="text-center text-lg text-blue-100/80 mb-12 max-w-2xl mx-auto">
                        Find comprehensive textbooks and academic resources for your studies
                    </p>
                    <SearchBar onSearch={fetchBooks} />
                </header>
            </div>

            <main className="container mx-auto px-4 py-12">
                <section className="mb-16">
                    <div className="flex items-center mb-8">
                        <div className="bg-blue-500/10 p-2 rounded-lg mr-3">
                            <GraduationCap className="w-6 h-6 text-blue-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white">Browse by Subject</h2>
                    </div>
                    <SubjectCategories onSearch={fetchBooks} />
                </section>

                {loading && (
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-400"></div>
                    </div>
                )}

                {error && (
                    <div className="bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded-lg mb-6">
                        <p className="text-blue-400">{error}</p>
                    </div>
                )}

                {!loading && books.length > 0 && (
                    <section>
                        <div className="flex items-center mb-8">
                            <div className="bg-blue-500/10 p-2 rounded-lg mr-3">
                                <BookOpen className="w-6 h-6 text-blue-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-white">Recommended Resources</h2>
                        </div>
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {books.map((book: any) => (
                                <BookCard key={book.position} book={book} />
                            ))}
                        </div>
                    </section>
                )}
            </main>
        </div>
    );
}