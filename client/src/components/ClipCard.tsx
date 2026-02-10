import { motion } from "framer-motion";
import { Play, Clock, Hash, Activity } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ClipResponse } from "@shared/schema";

interface ClipCardProps {
  clip: ClipResponse;
  onClick: (clip: ClipResponse) => void;
  isActive?: boolean;
}

export function ClipCard({ clip, onClick, isActive }: ClipCardProps) {
  // Format seconds to MM:SS
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const confidenceLevel = 
    clip.confidenceScore > 0.8 ? "high" : 
    clip.confidenceScore > 0.5 ? "medium" : "low";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      <Card 
        className={`group cursor-pointer overflow-hidden transition-all duration-300 border ${
          isActive 
            ? "border-primary shadow-[0_0_20px_rgba(100,255,218,0.15)] bg-card" 
            : "border-white/5 hover:border-primary/50 hover:bg-white/5"
        }`}
        onClick={() => onClick(clip)}
      >
        <div className="relative aspect-video bg-black/40 overflow-hidden">
          {clip.thumbnailUrl ? (
            <img 
              src={clip.thumbnailUrl} 
              alt={clip.description} 
              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
              <Activity className="w-8 h-8 text-primary/40" />
            </div>
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          
          <div className="absolute top-2 right-2">
            <Badge variant={confidenceLevel} className="backdrop-blur-md">
              {(clip.confidenceScore * 100).toFixed(0)}% Match
            </Badge>
          </div>

          <div className="absolute top-2 left-2">
            <Badge variant="secondary" className="bg-blue-600/20 border-blue-500/30 text-blue-300 backdrop-blur-md text-[10px] uppercase">
              {clip.teamId || "Unknown"}
            </Badge>
          </div>

          <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
            <div className="w-10 h-10 rounded-full bg-primary text-background flex items-center justify-center shadow-lg shadow-primary/25">
              <Play className="w-4 h-4 fill-current ml-0.5" />
            </div>
          </div>
          
          <div className="absolute bottom-2 left-2 text-xs font-mono text-white/80 flex items-center gap-1">
             <Clock className="w-3 h-3" />
             {formatTime(clip.startTime)} - {formatTime(clip.endTime)}
          </div>
        </div>

        <CardContent className="p-4">
          <h3 className="font-display font-semibold text-lg leading-tight text-white mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {clip.description}
          </h3>
          
          <div className="flex flex-wrap gap-2 mt-3">
            {clip.tags?.slice(0, 3).map((tag, i) => (
              <span key={i} className="text-[10px] uppercase tracking-wider text-muted-foreground bg-white/5 px-2 py-1 rounded border border-white/5 flex items-center gap-1">
                <Hash className="w-2.5 h-2.5 opacity-50" />
                {tag}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
