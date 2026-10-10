"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  Search,
  Sparkles,
  Command,
  ArrowRight,
  Baby,
  Users,
  HeartHandshake,
  FolderOpen,
  AlertCircle,
  TrendingUp,
  X,
  CornerDownLeft,
  Loader2,
  HelpCircle,
  ChevronLeft
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { naturalLanguageQuery, AISearchResult } from "@/app/actions/ai-search-actions"

const QUICK_PROMPTS = [
  "الأيتام غير المكفولين",
  "أسر الفقر الشديد",
  "كفالات تنتهي قريباً",
  "أيتام بدون حساب كريمي",
  "كم عدد الأيتام الإناث؟",
  "إحصائيات المنظومة",
]

export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [answer, setAnswer] = useState<string | null>(null)
  const [intent, setIntent] = useState<string | null>(null)
  const [results, setResults] = useState<AISearchResult[]>([])
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  // Listen to keyboard shortcut Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Auto focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100)
    } else {
      setQuery("")
      setAnswer(null)
      setResults([])
    }
  }, [open])

  // Execute Search
  const handleSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) return
    setLoading(true)
    setAnswer(null)
    setResults([])

    try {
      const res = await naturalLanguageQuery(searchTerm)
      if (res.success) {
        setAnswer(res.answer)
        setResults(res.results || [])
        setIntent(res.interpretedIntent || null)
      }
    } catch (err) {
      console.error("Search failed:", err)
    } finally {
      setLoading(false)
    }
  }

  // Trigger search on Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch(query)
    }
  }

  const handleSelectPrompt = (prompt: string) => {
    setQuery(prompt)
    handleSearch(prompt)
  }

  const navigateTo = (url?: string) => {
    if (url) {
      setOpen(false)
      router.push(url)
    }
  }

  const getResultIcon = (type: string) => {
    switch (type) {
      case "ORPHANS":
        return <Baby className="h-4 w-4 text-purple-400" />
      case "FAMILIES":
        return <Users className="h-4 w-4 text-blue-400" />
      case "SPONSORSHIPS":
        return <HeartHandshake className="h-4 w-4 text-pink-400" />
      case "STAT":
        return <TrendingUp className="h-4 w-4 text-emerald-400" />
      default:
        return <Sparkles className="h-4 w-4 text-amber-400" />
    }
  }

  return (
    <>
      {/* ── Trigger Button in Header ───────────────────────────── */}
      <button
        onClick={() => setOpen(true)}
        className="group relative flex w-full max-w-sm sm:max-w-md items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card/60 hover:bg-card px-3.5 py-1.5 text-xs text-muted-foreground shadow-sm backdrop-blur-md transition-all hover:border-emerald-500/40 hover:shadow-emerald-500/5 active:scale-[0.99]"
      >
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground group-hover:text-emerald-500 transition-colors" />
          <span className="font-medium text-slate-400 group-hover:text-foreground transition-colors">
            اسأل المساعد الذكي أو ابحث...
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="flex items-center gap-1 rounded-md border border-border/60 bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
            <Sparkles className="h-3 w-3 text-emerald-500" />
            <kbd className="font-mono">Ctrl</kbd>
            <span>+</span>
            <kbd className="font-mono">K</kbd>
          </span>
        </div>
      </button>

      {/* ── Interactive Command & AI Assistant Dialog ─────────── */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-w-2xl overflow-hidden p-0 gap-0 border-border bg-card/95 backdrop-blur-xl shadow-2xl rounded-3xl"
          dir="rtl"
        >
          <DialogHeader className="sr-only">
            <DialogTitle>المساعد الذكي والبحث المتقدم</DialogTitle>
          </DialogHeader>

          {/* Search Header Input */}
          <div className="relative flex items-center border-b border-border/80 px-4 py-3 bg-muted/20">
            <Sparkles className="h-5 w-5 text-emerald-500 shrink-0 ml-3 animate-pulse" />
            <Input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="اكتب استفسارك باللغة الطبيعية (مثال: الأيتام غير المكفولين، كفالات تنتهي قريباً)..."
              className="h-10 border-0 bg-transparent p-0 text-sm font-semibold focus-visible:ring-0 placeholder:text-muted-foreground/70"
            />
            {query ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setQuery("")
                  setAnswer(null)
                  setResults([])
                }}
                className="h-7 w-7 rounded-full text-muted-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </Button>
            ) : null}
            <Button
              onClick={() => handleSearch(query)}
              disabled={loading || !query.trim()}
              size="sm"
              className="mr-2 h-8 rounded-xl px-3 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shrink-0 gap-1.5"
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <>
                  <span>استعلام</span>
                  <CornerDownLeft className="h-3 w-3" />
                </>
              )}
            </Button>
          </div>

          {/* Dialog Body Content */}
          <div className="max-h-[65vh] overflow-y-auto p-4 space-y-4">
            {/* Quick Prompts (If no active results or at start) */}
            {!answer && !loading && (
              <div className="space-y-2.5">
                <p className="text-[11px] font-bold text-muted-foreground flex items-center gap-1.5">
                  <HelpCircle className="h-3.5 w-3.5 text-emerald-500" />
                  أسئلة واستعلامات مقترحة سريعة:
                </p>
                <div className="flex flex-wrap gap-2">
                  {QUICK_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => handleSelectPrompt(prompt)}
                      className="rounded-xl border border-border/70 bg-muted/40 hover:bg-emerald-500/10 hover:border-emerald-500/30 px-3 py-1.5 text-xs font-medium text-foreground transition-all hover:text-emerald-500 active:scale-95 text-right flex items-center gap-1.5"
                    >
                      <span>{prompt}</span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground opacity-60" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* AI Assistant Answer Card */}
            {answer && (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-500">
                      <Sparkles className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      إجابة المساعد الذكي
                    </span>
                  </div>
                  {intent && (
                    <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5">
                      {intent}
                    </Badge>
                  )}
                </div>
                <p className="text-xs font-semibold leading-relaxed text-foreground pr-8">
                  {answer}
                </p>
              </div>
            )}

            {/* Results Grid / List */}
            {results.length > 0 && (
              <div className="space-y-2">
                <p className="text-[11px] font-bold text-muted-foreground px-1">
                  السجلات والنتائج المرتبطة ({results.length}):
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {results.map((res, idx) => (
                    <div
                      key={idx}
                      onClick={() => navigateTo(res.actionUrl)}
                      className="group flex items-center justify-between rounded-xl border border-border/60 bg-card/60 p-3 hover:bg-muted/40 hover:border-emerald-500/30 cursor-pointer transition-all active:scale-[0.99]"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 rounded-lg bg-muted p-2 group-hover:bg-emerald-500/10 transition-colors">
                          {getResultIcon(res.type)}
                        </div>
                        <div className="space-y-0.5 text-right">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-foreground group-hover:text-emerald-500 transition-colors">
                              {res.title}
                            </h4>
                            {res.badge && (
                              <span className="rounded-md bg-muted px-1.5 py-0.5 text-[9px] font-bold text-muted-foreground border border-border/50">
                                {res.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            {res.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 opacity-80 group-hover:opacity-100 shrink-0 mr-2">
                        <span>{res.actionLabel || "فتح"}</span>
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Dialog Footer Instructions */}
          <div className="flex items-center justify-between border-t border-border/60 bg-muted/40 px-4 py-2 text-[10px] text-muted-foreground">
            <div className="flex items-center gap-3">
              <span>للإغلاق اضغط <kbd className="font-mono bg-muted border rounded px-1">ESC</kbd></span>
              <span>للتنقل <kbd className="font-mono bg-muted border rounded px-1">Tab</kbd></span>
            </div>
            <div className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
              <Sparkles className="h-3 w-3" />
              <span>نظام المساعد الذكي المدعوم بقواعد البيانات المباشرة</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
