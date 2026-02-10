import { Layout } from "@/components/Layout";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { Loader2, Search, Play, Pause, ChevronRight, Clock, Target } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";

export default function VideoAnalysis() {
    const { id } = useParams();
    const videoId = parseInt(id || "0");
    const [searchQuery, setSearchQuery] = useState("");
    const [isPlaying, setIsPlaying] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [currentVideoUrl, setCurrentVideoUrl] = useState<string>("");
    // Track target timestamp for seeking when video loads
    const [targetTimestamp, setTargetTimestamp] = useState<number | null>(null);
    // Track which search result is currently active for visual feedback
    const [activeResultId, setActiveResultId] = useState<string | null>(null);
    // Track if video source has changed (to handle onLoadedData vs immediate seek)
    const [isVideoSourceNew, setIsVideoSourceNew] = useState(false);

    // Fetch Video Details
    const { data: video, isLoading: loadingVideo } = useQuery({
        queryKey: [`/api/videos/${videoId}`],
        queryFn: async () => {
            const res = await fetch(`/api/videos/${videoId}`);
            if (!res.ok) throw new Error("Video not found");
            return res.json();
        }
    });

    // Search Query
    const { data: searchResults, isFetching: searching } = useQuery({
        queryKey: ["search", searchQuery],
        queryFn: async () => {
            if (!searchQuery) return [];
            // Backend search endpoint (GET)
            const res = await fetch(`/api/clips/search?q=${encodeURIComponent(searchQuery)}`);
            if (!res.ok) throw new Error("Search failed");
            return res.json();
        },
        enabled: !!searchQuery && searchQuery.length > 2
    });

    const [videoError, setVideoError] = useState<string | null>(null);

    // Initial Load Effect
    useEffect(() => {
        if (video?.filepath) {
            const url = `http://localhost:8000/${video.filepath.replace(/\\/g, "/")}`;
            setCurrentVideoUrl(url);
            setIsVideoSourceNew(true);
        }
    }, [video]);

    const handleResultClick = (videoPath: string, rawTimestamp: number, resultId: string) => {
        // Apply context buffer: subtract 2-3 seconds so user sees the buildup to the event
        // but never seek before the start of the video
        const seekTime = Math.max(0, rawTimestamp - 2);
        setActiveResultId(resultId);

        const videoElement = videoRef.current;

        // CRITICAL LOGIC: If video file is NEW, change src and wait for onLoadedData
        // If video file is ALREADY LOADED, seek immediately
        if (currentVideoUrl !== videoPath) {
            // New video: set flag, update URL, store target timestamp
            setIsVideoSourceNew(true);
            setTargetTimestamp(seekTime);
            setCurrentVideoUrl(videoPath);
            return;
        }

        // Same video: seek immediately without waiting for reload
        if (videoElement) {
            // Ensure video is ready before seeking
            if (videoElement.readyState >= 2) {
                // HAVE_CURRENT_DATA or better - safe to seek
                videoElement.currentTime = seekTime;
                setTargetTimestamp(null);
                videoElement
                    .play()
                    .then(() => {
                        setIsPlaying(true);
                        videoElement.scrollIntoView({ behavior: "smooth", block: "center" });
                    })
                    .catch((e) => console.error("Play error:", e));
            } else {
                // Video not ready yet, store target and wait for onLoadedData
                setTargetTimestamp(seekTime);
            }
        } else {
            // Fallback: ref not ready, store target time
            setTargetTimestamp(seekTime);
        }
    };

    // onLoadedData fires when enough data is loaded to start playback
    // This is more reliable than onLoadedMetadata for seeking
    const onVideoLoadedData = () => {
        const videoElement = videoRef.current;
        if (!videoElement) return;

        // If we have a target timestamp (from clicking a result or new video load), seek to it
        if (targetTimestamp !== null) {
            console.log("Video data loaded, seeking to target timestamp:", targetTimestamp);
            videoElement.currentTime = targetTimestamp;
            setTargetTimestamp(null);
            
            // Auto-play after seeking
            videoElement
                .play()
                .then(() => setIsPlaying(true))
                .catch((e) => console.error("Auto-play error:", e));
        }

        // Reset the "new source" flag after first load
        if (isVideoSourceNew) {
            setIsVideoSourceNew(false);
        }
    };

    if (loadingVideo) {
        return (
            <div className="h-screen flex items-center justify-center bg-[#0a192f]">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    if (!video) return <div>Video not found</div>;

    // Filter results for THIS video
    const currentVideoResults = searchResults?.filter((r: any) => Number(r.video_id) === videoId) || [];
    
    // Get active result for tactical insight panel
    const activeResult = currentVideoResults.find((r: any) => r.id === activeResultId);

    return (
        <div className="h-screen bg-background flex flex-col overflow-hidden">
            <Layout>
                <div className="flex flex-1 overflow-hidden">
                    {/* Main Content: Video Player */}
                    <div className="flex-1 p-6 flex flex-col overflow-y-auto">
                        <div className="mb-4">
                            <h1 className="text-2xl font-bold text-white">{video.title}</h1>
                            <div className="flex gap-4 text-sm text-gray-400 mt-1">
                                <span>{video.filename}</span>
                                <span>|</span>
                                <span>Processed: {video.processed ? "Yes" : "No"}</span>
                            </div>
                        </div>

                        <div className="relative aspect-video bg-black rounded-lg overflow-hidden border border-white/10 shadow-2xl">
                            {videoError ? (
                                <div className="flex flex-col items-center justify-center h-full text-red-400 p-4 text-center">
                                    <p className="font-bold mb-2">Video Playback Error</p>
                                    <p className="text-sm">{videoError}</p>
                                    <p className="text-xs text-gray-500 mt-2">Try refreshing the page or checking if the file exists.</p>
                                </div>
                            ) : currentVideoUrl ? (
                                <video
                                    ref={videoRef}
                                    src={currentVideoUrl}
                                    className="w-full h-full object-contain"
                                    controls
                                    onLoadedData={onVideoLoadedData}
                                    onPlay={() => setIsPlaying(true)}
                                    onPause={() => setIsPlaying(false)}
                                    onError={(e: any) => {
                                        console.error("Video Error Event:", e);
                                        const err = e.target.error;
                                        let msg = "Unknown Error";
                                        if (err) {
                                            if (err.code === 1) msg = "Aborted";
                                            if (err.code === 2) msg = "Network Error";
                                            if (err.code === 3) msg = "Decode Error";
                                            if (err.code === 4) msg = "Source Not Supported";
                                        }
                                        setVideoError(msg);
                                    }}
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full text-red-400">
                                    Video file not accessible. Check backend static serving.
                                </div>
                            )}
                        </div>

                        {/* Tactical Insight Panel */}
                        {activeResult && (
                            <Card className="mt-6 bg-gradient-to-r from-[#CD122D]/10 to-[#CD122D]/5 border-[#CD122D]/30">
                                <CardContent className="p-5">
                                    <div className="flex items-center gap-3 mb-3">
                                        <Target className="w-5 h-5 text-[#CD122D]" />
                                        <h3 className="text-lg font-bold text-white">Tactical Insight</h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Event Type</div>
                                            <div className="text-lg font-semibold text-white capitalize">
                                                {activeResult.description || searchQuery}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Confidence</div>
                                            <div className="text-lg font-semibold text-white">
                                                {Math.round(activeResult.confidenceScore * 100)}%
                                                {activeResult.confidenceScore > 0.7 && (
                                                    <span className="ml-2 text-xs text-[#CD122D] font-bold">HIGH PROBABILITY</span>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Timestamp</div>
                                            <div className="text-lg font-mono text-white">
                                                {Math.floor(activeResult.startTime / 60)}:
                                                {String(Math.floor(activeResult.startTime % 60)).padStart(2, "0")}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Duration</div>
                                            <div className="text-lg font-mono text-white">
                                                {Math.round((activeResult.endTime - activeResult.startTime) * 10) / 10}s
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Metadata / Stats Section */}
                        <div className="grid grid-cols-3 gap-4 mt-6">
                            <Card className="bg-white/5 border-white/10">
                                <CardContent className="p-4">
                                    <div className="text-sm text-gray-400">Duration</div>
                                    <div className="text-xl font-mono text-white">
                                        {videoRef.current?.duration ? Math.floor(videoRef.current.duration) + "s" : "--"}
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="bg-white/5 border-white/10">
                                <CardContent className="p-4">
                                    <div className="text-sm text-gray-400">FPS</div>
                                    <div className="text-xl font-mono text-white">30 (Est)</div>
                                </CardContent>
                            </Card>
                            <Card className="bg-white/5 border-white/10">
                                <CardContent className="p-4">
                                    <div className="text-sm text-gray-400">Events Found</div>
                                    <div className="text-xl font-mono text-primary">{currentVideoResults.length}</div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Sidebar: Search & Analysis */}
                    <div className="w-[450px] bg-[#020c1b] border-l border-white/10 flex flex-col">
                        <div className="p-6 border-b border-white/10">
                            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <Search className="w-5 h-5 text-primary" /> Semantic Search
                            </h2>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="e.g. 'goal', 'offside', 'pass', 'card'"
                                    className="bg-white/5 border-white/10 text-white"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                            {searching ? (
                                <div className="text-center py-10 text-gray-500">
                                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                                    Analyzing semantics...
                                </div>
                            ) : currentVideoResults.length > 0 ? (
                                currentVideoResults.map((result: any) => {
                                    const isActive = activeResultId === result.id;
                                    const minutes = Math.floor(result.startTime / 60);
                                    const seconds = Math.floor(result.startTime % 60);
                                    
                                    return (
                                        <Card
                                            key={result.id}
                                            className={`cursor-pointer transition-all group border-2 ${
                                                isActive
                                                    ? "border-[#CD122D] bg-[#CD122D]/10 shadow-lg shadow-[#CD122D]/20"
                                                    : "border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10"
                                            }`}
                                            onClick={() => {
                                                const targetUrl = `http://localhost:8000/${video.filepath.replace(/\\/g, "/")}`;
                                                handleResultClick(targetUrl, result.startTime, result.id);
                                            }}
                                        >
                                            <CardContent className="p-4">
                                                {/* Event Card Header */}
                                                <div className="flex justify-between items-start mb-3">
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="w-4 h-4 text-primary" />
                                                        <span className="text-primary font-mono text-sm font-bold">
                                                            {minutes}:{String(seconds).padStart(2, "0")}
                                                        </span>
                                                    </div>
                                                    <span className={`text-[10px] px-2 py-1 rounded font-semibold ${
                                                        result.confidenceScore > 0.7
                                                            ? "bg-[#CD122D]/30 text-[#CD122D]"
                                                            : result.confidenceScore > 0.5
                                                            ? "bg-primary/20 text-primary"
                                                            : "bg-yellow-500/20 text-yellow-500"
                                                    }`}>
                                                        {Math.round(result.confidenceScore * 100)}%
                                                    </span>
                                                </div>
                                                
                                                {/* Event Description */}
                                                <p className="text-sm text-gray-300 line-clamp-2 font-medium">
                                                    {result.description || searchQuery}
                                                </p>
                                                
                                                {/* Thumbnail Placeholder (can be enhanced later with actual thumbnails) */}
                                                {result.thumbnailUrl ? (
                                                    <img 
                                                        src={result.thumbnailUrl} 
                                                        alt="Event thumbnail" 
                                                        className="mt-3 w-full h-24 object-cover rounded border border-white/10"
                                                    />
                                                ) : (
                                                    <div className="mt-3 w-full h-24 bg-gradient-to-br from-primary/20 to-[#CD122D]/20 rounded border border-white/10 flex items-center justify-center">
                                                        <Play className="w-6 h-6 text-white/40" />
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    );
                                })
                            ) : searchQuery.length > 2 ? (
                                <div className="text-center py-10 text-gray-500">
                                    No matches found in this video.
                                </div>
                            ) : (
                                <div className="text-center py-10 text-gray-500 text-sm">
                                    Type to search for events like "goal", "offside", "pass", or "card".
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </Layout>
        </div>
    );
}
