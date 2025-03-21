"use client"

import { useEffect } from "react"
import { Globe } from "lucide-react"
import type React from "react" // Added import for React

const LanguageSelect = () => {
    useEffect(() => {
        const script = document.createElement("script")
        script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
        script.type = "text/javascript"
        document.body.appendChild(script)

        window.googleTranslateElementInit = () => {
            new window.google.translate.TranslateElement(
                {
                    pageLanguage: "en",
                },
                "google_translate_element",
            )
        }

        return () => {
            document.body.removeChild(script)
        }
    }, [])

    const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const languageCode = event.target.value
        const selectBox = document.querySelector(".goog-te-combo") as HTMLSelectElement
        if (selectBox) {
            selectBox.value = languageCode
            selectBox.dispatchEvent(new Event("change"))
        }
    }

    return (
        <div className="p-2 z-[100] relative flex start rounded-md bg-slate-800 border border-blue-800">
            <select
                onChange={handleLanguageChange}
                aria-label="Select language"
                className="cursor-pointer bg-transparent border-none pr-6 pl-2 py-1 focus:outline-none text-blue-100 appearance-none w-full"
                defaultValue="en"
            >
                <option value="en" disabled hidden>
                </option>
                <option value="en" className="bg-slate-800 text-blue-100">English</option>
                <option value="mr" className="bg-slate-800 text-blue-100">Marathi</option>
                <option value="hi" className="bg-slate-800 text-blue-100">Hindi</option>
                <option value="pa" className="bg-slate-800 text-blue-100">Punjabi</option>
                <option value="ta" className="bg-slate-800 text-blue-100">Tamil</option>
            </select>
            <Globe className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none h-6 w-6 text-blue-300" size={18} />
            <div id="google_translate_element" style={{ display: "none" }}></div>
        </div>
    )
}

export default LanguageSelect