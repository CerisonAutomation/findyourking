'use client'

import {useState} from 'react'
import {AnimatePresence, motion} from 'framer-motion'
import {Features} from '@/lib/feature-registry'
import {Activity, Search, ShieldCheck, Terminal, X, Zap} from 'lucide-react'
import {Badge} from '@/components/ui/badge'
import {Input} from '@/components/ui/input'

export function DevHub() {
    const [isOpen, setIsOpen] = useState(false)
    const [search, setSearch] = useState('')
    const [filter, setFilter] = useState<string | null>(null)

    const filteredFeatures = Features.filter(f => {
        const matchesSearch = f.file.toLowerCase().includes(search.toLowerCase()) ||
            f.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
        const matchesFilter = !filter || f.tags.includes(filter as any)
        return matchesSearch && matchesFilter
    })

    const allTags = Array.from(new Set(Features.flatMap(f => f.tags))).sort()

    return (
        <>
            {/* Floating Trigger */}
            <motion.button
                whileHover={{scale: 1.1}}
                whileTap={{scale: 0.9}}
                onClick={() => setIsOpen(true)}
                className="fixed bottom-24 right-6 w-12 h-12 bg-primary/20 backdrop-blur-md border border-primary/30 rounded-full flex items-center justify-center text-primary z-[9998] shadow-lg hover:bg-primary/30 transition-all"
            >
                <Terminal className="w-6 h-6"/>
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{opacity: 0, x: 100}}
                        animate={{opacity: 1, x: 0}}
                        exit={{opacity: 0, x: 100}}
                        className="fixed inset-y-0 right-0 w-full max-w-lg bg-card/95 backdrop-blur-2xl border-l border-border z-[10000] shadow-2xl flex flex-col pt-safe-area"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-border flex items-center justify-between bg-black/20">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <Activity className="w-5 h-5 text-primary"/>
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold tracking-tight">Feature Discovery Hub</h2>
                                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">
                                        Find Your King-HORUS v4.0 • {Features.length} Modules
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 hover:bg-muted rounded-full transition-colors"
                            >
                                <X className="w-5 h-5"/>
                            </button>
                        </div>

                        {/* Controls */}
                        <div className="p-6 space-y-4 border-b border-border/50 bg-black/10">
                            <div className="relative">
                                <Search
                                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
                                <Input
                                    placeholder="Search 94+ features..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-10 bg-background/50"
                                />
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Badge
                                    variant={!filter ? "default" : "outline"}
                                    className="cursor-pointer px-3 py-1"
                                    onClick={() => setFilter(null)}
                                >
                                    All
                                </Badge>
                                {allTags.map(tag => (
                                    <Badge
                                        key={tag}
                                        variant={filter === tag ? "default" : "outline"}
                                        className="cursor-pointer px-3 py-1 capitalize"
                                        onClick={() => setFilter(tag)}
                                    >
                                        {tag.replace('-', ' ')}
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        {/* Feature List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 hide-scrollbar">
                            {filteredFeatures.map((f, i) => (
                                <motion.div
                                    initial={{opacity: 0, y: 10}}
                                    animate={{opacity: 1, y: 0}}
                                    transition={{delay: i * 0.02}}
                                    key={f.file}
                                    className="p-4 rounded-xl border border-border/50 bg-background/40 hover:bg-background/60 transition-colors group"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <code
                                            className="text-[10px] text-primary/80 font-mono bg-primary/5 px-2 py-0.5 rounded">
                                            {f.file.split('/').pop()}
                                        </code>
                                        <div className="flex gap-1">
                                            {f.tags.slice(0, 2).map(t => (
                                                <span key={t}
                                                      className="text-[8px] uppercase tracking-tighter text-muted-foreground">
                          • {t}
                        </span>
                                            ))}
                                        </div>
                                    </div>
                                    <p className="text-xs font-medium text-foreground mb-3 truncate">
                                        {f.file}
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                        {f.exports.map(exp => (
                                            <span key={exp}
                                                  className="text-[9px] px-1.5 py-0.5 bg-muted rounded border border-border/50 text-muted-foreground group-hover:text-foreground transition-colors">
                        {exp}
                      </span>
                                        ))}
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Footer */}
                        <div
                            className="p-4 border-t border-border bg-black/40 flex items-center justify-between text-[10px]">
                            <div className="flex gap-4">
                <span className="flex items-center gap-1 text-green-500 font-bold">
                  <ShieldCheck className="w-3 h-3"/> SECURE
                </span>
                                <span className="flex items-center gap-1 text-primary font-bold">
                  <Zap className="w-3 h-3"/> FAST
                </span>
                            </div>
                            <span className="text-muted-foreground italic">
                Awaiting Omni-Meta Integration
              </span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
