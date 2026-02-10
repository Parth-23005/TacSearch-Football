import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Search, Filter, Loader2, Play } from "lucide-react";
import { useSearchClips } from "@/hooks/use-clips";
import { useAuth } from "@/hooks/use-auth";
import { Layout } from "@/components/Layout";
import { ClipCard } from "@/components/ClipCard";
import { VideoPlayer } from "@/components/VideoPlayer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ClipResponse } from "@shared/schema";

export default function Dashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const [query, setQuery] = useState("");
  const [activeClip, setActiveClip] = useState<ClipResponse | null>(null);

  // Debounce could be added here, but for simplicity relying on Search button or Enter key
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: clips, isLoading, isError } = useSearchClips(searchQuery);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(query);
  };

  if (authLoading) return null;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
        {/* Sidebar Navigation */}
        <Layout>
            <main className="flex-1 flex flex-col h-full overflow-hidden relative">
                {/* Header / Search Area */}
                <div className="h-24 border-b border-white/5 bg-card/50 backdrop-blur-sm flex items-center px-8 shrink-0 z-20">
                    <form onSubmit={handleSearch} className="w-full max-w-3xl mx-auto relative flex gap-4">
                        <div className="relative flex-1 group">
                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                <Search className="w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            </div>
                            <Input 
                                placeholder="Search tactics: 'Counter attack', 'Corner kick', 'High press'..." 
                                className="pl-12 h-12 bg-black/40 border-white/10 text-lg rounded-xl focus-visible:ring-primary/50 transition-all shadow-inner"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                            <div className="absolute inset-y-0 right-4 flex items-center gap-2">
                                <span className="text-[10px] uppercase font-mono text-muted-foreground border border-white/10 px-2 py-0.5 rounded">CMD+K</span>
                            </div>
                        </div>
                        <Button type="submit" size="lg" className="h-12 px-8 shadow-lg shadow-primary/20">
                            ANALYZE
                        </Button>
                        <Button type="button" variant="outline" size="icon" className="h-12 w-12 border-white/10">
                            <Filter className="w-5 h-5 text-muted-foreground" />
                        </Button>
                    </form>
                </div>

                {/* Main Content Area - Split View */}
                <div className="flex-1 flex overflow-hidden">
                    
                    {/* Results Grid */}
                    <div className={`flex-1 transition-all duration-500 ease-in-out p-6 ${activeClip ? 'w-1/2 max-w-2xl' : 'w-full'}`}>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
                                {searchQuery ? `RESULTS FOR "${searchQuery.toUpperCase()}"` : "RECENT CLIPS"}
                                {clips && <span className="text-sm font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-full">{clips.length}</span>}
                            </h2>
                            {/* Sorting options could go here */}
                        </div>

                        {isLoading ? (
                            <div className="flex items-center justify-center h-64">
                                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                            </div>
                        ) : isError ? (
                            <div className="text-center p-12 glass-panel rounded-xl">
                                <div className="text-red-400 font-bold mb-2">Error loading clips</div>
                                <p className="text-muted-foreground">Please try again later.</p>
                            </div>
                        ) : clips?.length === 0 ? (
                            <div className="text-center p-12 glass-panel rounded-xl border-dashed border-2 border-white/10">
                                <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                                <h3 className="text-xl font-bold text-white mb-2">No Clips Found</h3>
                                <p className="text-muted-foreground">Try adjusting your search terms.</p>
                            </div>
                        ) : (
                            <ScrollArea className="h-[calc(100vh-180px)] pr-4">
                                <div className={`grid gap-6 pb-20 ${activeClip ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
                                    {clips?.map((clip) => (
                                        <ClipCard 
                                            key={clip.id} 
                                            clip={clip} 
                                            onClick={setActiveClip}
                                            isActive={activeClip?.id === clip.id}
                                        />
                                    ))}
                                    {/* Empty state prompt if no search yet */}
                                    {!searchQuery && !clips && (
                                        <div className="col-span-full text-center py-20 opacity-50">
                                            <Search className="w-16 h-16 mx-auto mb-4 text-primary" />
                                            <p className="text-xl font-display text-white">ENTER A TACTICAL QUERY TO BEGIN</p>
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        )}
                    </div>

                    {/* Active Clip Player & Details Panel - Slides in */}
                    {activeClip && (
                        <div className="w-[500px] xl:w-[600px] border-l border-white/10 bg-card/95 backdrop-blur-xl flex flex-col shadow-2xl z-30 animate-in slide-in-from-right duration-300">
                            <div className="p-6 border-b border-white/10 flex justify-between items-start">
                                <div>
                                    <h2 className="text-lg font-bold text-white font-display leading-tight">{activeClip.description}</h2>
                                    <p className="text-xs font-mono text-primary mt-1">CONFIDENCE: {(activeClip.confidenceScore * 100).toFixed(1)}%</p>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => setActiveClip(null)} className="h-8 w-8 hover:bg-white/10 -mr-2 -mt-2">
                                    <span className="sr-only">Close</span>
                                    <span aria-hidden>×</span>
                                </Button>
                            </div>
                            
                            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                                <VideoPlayer clip={activeClip} />
                                
                                <div className="glass-panel p-4 rounded-xl">
                                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">AI Analysis Tags</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {activeClip.tags?.map((tag, i) => (
                                            <span key={i} className="px-3 py-1.5 rounded-md bg-secondary/10 text-secondary border border-secondary/20 text-xs font-medium">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="glass-panel p-4 rounded-xl">
                                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Clip Metadata</h3>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="block text-muted-foreground text-xs">Duration</span>
                                            <span className="font-mono text-white">{(activeClip.endTime - activeClip.startTime).toFixed(2)}s</span>
                                        </div>
                                        <div>
                                            <span className="block text-muted-foreground text-xs">Team</span>
                                            <span className="font-mono text-white">{activeClip.teamId || "N/A"}</span>
                                        </div>
                                        <div>
                                            <span className="block text-muted-foreground text-xs">Match ID</span>
                                            <span className="font-mono text-white">#{activeClip.videoId}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-white/10 bg-black/20">
                                <Button className="w-full neon-glow-hover font-bold">
                                    EXPORT ANALYSIS REPORT
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </Layout>
    </div>
  );
}
