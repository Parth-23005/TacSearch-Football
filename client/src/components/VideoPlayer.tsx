import { useRef, useEffect, useState } from "react";
import ReactPlayer from "react-player";
import { Maximize2, SkipBack, SkipForward, Play, Pause, Volume2, VolumeX } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import type { ClipResponse } from "@shared/schema";

interface VideoPlayerProps {
  clip: ClipResponse;
  url?: string; // Optional URL override
}

export function VideoPlayer({ clip, url }: VideoPlayerProps) {
  const playerRef = useRef<ReactPlayer>(null);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [played, setPlayed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isReady, setIsReady] = useState(false);

  // Auto-play when clip changes
  useEffect(() => {
    setPlaying(true);
    setPlayed(0);
    // In a real app, we might need to handle seeking to start time here if not handled by url params
    if (playerRef.current) {
        playerRef.current.seekTo(clip.startTime, 'seconds');
    }
  }, [clip]);

  const handleProgress = (state: { played: number; playedSeconds: number }) => {
    // Loop specifically within the clip bounds if strictly playing just a clip
    if (state.playedSeconds >= clip.endTime) {
        playerRef.current?.seekTo(clip.startTime);
    }
    setPlayed(state.played);
  };

  const handleDuration = (d: number) => {
    setDuration(d);
  };

  const togglePlay = () => setPlaying(!playing);
  const toggleMute = () => setMuted(!muted);

  // If we don't have a direct URL, fallback to placeholder or construct one
  // In real app, clip.video.filepath would be a cloud URL
  const videoSource = url || clip.video?.filepath || "https://media.w3.org/2010/05/sintel/trailer_hd.mp4"; 

  return (
    <div className="relative group bg-black rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10">
      <div className="aspect-video w-full bg-slate-950 relative">
        <ReactPlayer
          ref={playerRef}
          url={videoSource}
          width="100%"
          height="100%"
          playing={playing}
          volume={volume}
          muted={muted}
          onProgress={handleProgress}
          onDuration={handleDuration}
          onReady={() => setIsReady(true)}
          progressInterval={100}
        />
        
        {/* Loading Overlay */}
        {!isReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm z-10">
            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Custom Controls Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="flex flex-col gap-2">
          {/* Progress Bar */}
          <div className="w-full h-1 bg-white/20 rounded-full cursor-pointer overflow-hidden hover:h-2 transition-all">
            <div 
              className="h-full bg-primary relative" 
              style={{ width: `${(played * 100)}%` }}
            >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100" />
            </div>
          </div>

          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-4">
              <button onClick={togglePlay} className="text-white hover:text-primary transition-colors">
                {playing ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              </button>
              
              <div className="flex items-center gap-2 text-white/80 group/vol">
                <button onClick={toggleMute}>
                  {muted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <div className="w-0 overflow-hidden group-hover/vol:w-20 transition-all duration-300">
                  <Slider 
                    value={[muted ? 0 : volume]} 
                    max={1} 
                    step={0.1} 
                    onValueChange={(val) => {
                        setVolume(val[0]);
                        setMuted(val[0] === 0);
                    }} 
                    className="w-20"
                  />
                </div>
              </div>
              
              <div className="text-xs font-mono text-white/60">
                {/* Simple time display */}
                {Math.floor(clip.startTime / 60)}:{Math.floor(clip.startTime % 60).toString().padStart(2, '0')} / 
                {Math.floor(clip.endTime / 60)}:{Math.floor(clip.endTime % 60).toString().padStart(2, '0')}
              </div>
            </div>

            <div className="flex items-center gap-2">
                <Button size="icon" variant="ghost" className="h-8 w-8 text-white/70 hover:text-white">
                    <SkipBack className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-white/70 hover:text-white">
                    <SkipForward className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-white/70 hover:text-white">
                    <Maximize2 className="w-4 h-4" />
                </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
