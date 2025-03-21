"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import {
  Accessibility,
  Link,
  ZoomIn,
  ZoomOut,
  StretchHorizontal,
  ImageOff,
  BookOpen,
  VideoOff,
} from "lucide-react";
import LanguageSelect from "./LanguageSelect";

export default function AccessibilityMenuWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [isLinksHighlighted, setIsLinksHighlighted] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [textSpacing, setTextSpacing] = useState(0);
  const [areImagesHidden, setAreImagesHidden] = useState(false);
  const [isDyslexiaMode, setIsDyslexiaMode] = useState(false);
  const [areVideosHidden, setAreVideosHidden] = useState(false);

  // Load state from localStorage
  useEffect(() => {
    const storedFontSize = localStorage.getItem("fontSize");
    const storedTextSpacing = localStorage.getItem("textSpacing");
    const storedHighContrast = localStorage.getItem("isHighContrast");
    const storedLinksHighlighted = localStorage.getItem("isLinksHighlighted");
    const storedImagesHidden = localStorage.getItem("areImagesHidden");
    const storedDyslexiaMode = localStorage.getItem("isDyslexiaMode");
    const storedVideosHidden = localStorage.getItem("areVideosHidden");

    if (storedFontSize) setFontSize(Number(storedFontSize));
    if (storedTextSpacing) setTextSpacing(Number(storedTextSpacing));
    if (storedHighContrast) setIsHighContrast(storedHighContrast === "true");
    if (storedLinksHighlighted)
      setIsLinksHighlighted(storedLinksHighlighted === "true");
    if (storedImagesHidden) setAreImagesHidden(storedImagesHidden === "true");
    if (storedDyslexiaMode) setIsDyslexiaMode(storedDyslexiaMode === "true");
    if (storedVideosHidden) setAreVideosHidden(storedVideosHidden === "true");
  }, []);

  // Save state to localStorage
  useEffect(() => {
    localStorage.setItem("fontSize", JSON.stringify(fontSize));
    localStorage.setItem("textSpacing", JSON.stringify(textSpacing));
    localStorage.setItem("isHighContrast", JSON.stringify(isHighContrast));
    localStorage.setItem("isLinksHighlighted", JSON.stringify(isLinksHighlighted));
    localStorage.setItem("areImagesHidden", JSON.stringify(areImagesHidden));
    localStorage.setItem("isDyslexiaMode", JSON.stringify(isDyslexiaMode));
    localStorage.setItem("areVideosHidden", JSON.stringify(areVideosHidden));
  }, [
    fontSize,
    textSpacing,
    isHighContrast,
    isLinksHighlighted,
    areImagesHidden,
    isDyslexiaMode,
    areVideosHidden,
  ]);

  useEffect(() => {
    document.documentElement.style.setProperty("--font-size", `${fontSize}px`);
    document.documentElement.style.setProperty("--text-spacing", `${textSpacing}`);
    document.documentElement.classList.toggle("high-contrast", isHighContrast);
    document.documentElement.classList.toggle("links-highlighted", isLinksHighlighted);
    document.documentElement.classList.toggle("images-hidden", areImagesHidden);
    document.documentElement.classList.toggle("videos-hidden", areVideosHidden);
    document.body.classList.toggle("dyslexia-mode", isDyslexiaMode);
  }, [
    fontSize,
    textSpacing,
    isHighContrast,
    isLinksHighlighted,
    areImagesHidden,
    isDyslexiaMode,
    areVideosHidden,
  ]);

  return (
    <div>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            className="fixed bottom-6 right-6 w-[60px] h-[60px] rounded-full p-3 z-50 hover:scale-[1.05] bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
            aria-label="Accessibility options"
          >
            <Accessibility style={{ width: '25px', height: '25px' }} />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 m-4 z-[51] bg-slate-900 border border-blue-700 text-blue-50 shadow-xl">
          <h2 className="text-lg font-semibold mb-4 text-blue-200">Accessibility Options</h2>
          <div className="space-y-4">
            <Toggle
              aria-label="High contrast"
              pressed={isHighContrast}
              onPressedChange={setIsHighContrast}
              className="bg-slate-800 data-[state=on]:bg-blue-600 hover:bg-slate-700 text-blue-100"
            >
              High Contrast
            </Toggle>

            <Toggle
              aria-label="Highlight links"
              pressed={isLinksHighlighted}
              onPressedChange={setIsLinksHighlighted}
              className="bg-slate-800 data-[state=on]:bg-blue-600 hover:bg-slate-700 text-blue-100"
            >
              <Link className="h-4 w-4 mr-2" />
              Highlight Links
            </Toggle>

            <div>
              <label htmlFor="font-size" className="block text-sm font-medium mb-1 text-blue-200">
                Font Size
              </label>
              <div className="flex items-center space-x-2">
                <ZoomOut className="h-4 w-4 text-blue-300" />
                <Slider
                  id="font-size"
                  min={12}
                  max={24}
                  step={1}
                  value={[fontSize]}
                  onValueChange={(value) => setFontSize(value[0])}
                  className="flex-1"
                />
                <ZoomIn className="h-4 w-4 text-blue-300" />
              </div>
            </div>

            <div>
              <label htmlFor="text-spacing" className="block text-sm font-medium mb-1 text-blue-200">
                Text Spacing
              </label>
              <div className="flex items-center space-x-2">
                <StretchHorizontal className="h-4 w-4 text-blue-300" />
                <Slider
                  id="text-spacing"
                  min={0}
                  max={10}
                  step={1}
                  value={[textSpacing]}
                  onValueChange={(value) => setTextSpacing(value[0])}
                  className="flex-1"
                />
              </div>
            </div>

            <Separator className="bg-blue-800" />

            <Toggle
              aria-label="Hide images"
              pressed={areImagesHidden}
              onPressedChange={setAreImagesHidden}
              className="bg-slate-800 data-[state=on]:bg-blue-600 hover:bg-slate-700 text-blue-100"
            >
              <ImageOff className="h-4 w-4 mr-2" />
              Hide Images
            </Toggle>

            <Toggle
              aria-label="Dyslexia friendly"
              pressed={isDyslexiaMode}
              onPressedChange={setIsDyslexiaMode}
              className="bg-slate-800 data-[state=on]:bg-blue-600 hover:bg-slate-700 text-blue-100"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Dyslexia Friendly
            </Toggle>

            <Toggle
              aria-label="Hide videos"
              pressed={areVideosHidden}
              onPressedChange={setAreVideosHidden}
              className="bg-slate-800 data-[state=on]:bg-blue-600 hover:bg-slate-700 text-blue-100"
            >
              <VideoOff className="h-4 w-4 mr-2" />
              Hide Videos
            </Toggle>

            <Separator className="bg-blue-800" />
            <LanguageSelect />
          </div>
        </PopoverContent>
      </Popover>

      <main className="accessibility-content">{children}</main>

      <style jsx global>{`
        :root {
          --font-size: 16px;
          --text-spacing: 0;
        }
        
        body {
          font-size: var(--font-size);
        }
        
        .accessibility-content {
          letter-spacing: calc(var(--text-spacing) * 0.1em);
          word-spacing: calc(var(--text-spacing) * 0.2em);
        }

        .high-contrast {
          filter: contrast(150%);
        }
        
        .links-highlighted a {
          background-color: #3b82f6;
          color: white;
        }
        
        .images-hidden img {
          display: none;
        }
        
        .videos-hidden video {
          display: none;
        }
        
        .dyslexia-mode * {
          font-family: "Open Dyslexic", sans-serif;
          word-spacing: 0.35em;
          letter-spacing: 0.12em;
        }
      `}</style>
    </div>
  );
}