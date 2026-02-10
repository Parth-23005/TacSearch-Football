import { Layout } from "@/components/Layout";
import { useVideos, useCreateVideo, useDeleteVideo } from "@/hooks/use-videos";
import { Button } from "@/components/ui/button";
import { Plus, Film, Clock, Calendar, Trash2 } from "lucide-react";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertVideoSchema } from "@shared/schema";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const createVideoFormSchema = z.object({
    title: z.string().min(1, "Title is required"),
    // file is handled by state
});
type CreateVideoForm = z.infer<typeof createVideoFormSchema>;

export default function Library() {
    const { data: videos, isLoading } = useVideos();
    const createVideo = useCreateVideo();
    const deleteVideo = useDeleteVideo();
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<CreateVideoForm>({
        resolver: zodResolver(createVideoFormSchema),
        defaultValues: {
            title: ""
        }
    });

    const onSubmit = (data: CreateVideoForm) => {
        if (!selectedFile) {
            toast({ title: "Error", description: "Please select a file", variant: "destructive" });
            return;
        }

        const formData = new FormData();
        formData.append("title", data.title);
        formData.append("file", selectedFile);

        createVideo.mutate(formData as any, {
            onSuccess: () => {
                toast({ title: "Success", description: "Video uploading and processing started" });
                setOpen(false);
                reset();
                setSelectedFile(null);
            },
            onError: (error) => {
                toast({ title: "Error", description: "Upload failed: " + error.message, variant: "destructive" });
            }
        });
    };

    const handleDelete = (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm("Are you sure you want to delete this video?")) {
            deleteVideo.mutate(id, {
                onSuccess: () => {
                    toast({ title: "Deleted", description: "Video removed from library" });
                },
                onError: (error) => {
                    toast({ title: "Error", description: "Delete failed", variant: "destructive" });
                }
            });
        }
    };

    return (
        <div className="flex h-screen bg-background">
            <Layout>
                <div className="p-8 w-full max-w-7xl mx-auto">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-display font-bold text-white mb-2">Video Library</h1>
                            <p className="text-muted-foreground">Manage your match footage and processing status.</p>
                        </div>

                        <Dialog open={open} onOpenChange={setOpen}>
                            <DialogTrigger asChild>
                                <Button className="gap-2 neon-glow-hover">
                                    <Plus className="w-4 h-4" /> Upload Match
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-card border-white/10 text-white">
                                <DialogHeader>
                                    <DialogTitle className="font-display">Upload New Match Footage</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Match Title</label>
                                        <Input {...register("title")} placeholder="e.g. Finals 2024 - Home vs Away" />
                                        {errors.title && <span className="text-xs text-red-400">{errors.title.message}</span>}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Video File</label>
                                        <Input
                                            type="file"
                                            accept="video/*"
                                            onChange={(e) => {
                                                if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
                                            }}
                                            className="cursor-pointer file:text-white"
                                        />
                                    </div>
                                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                                        {isSubmitting ? "Uploading..." : "Add to Library"}
                                    </Button>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center p-12">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 h-[calc(100vh-250px)] overflow-y-auto pr-2 custom-scrollbar">
                            {videos?.map((video) => (
                                <Card key={video.id} className="group hover:border-primary/50 transition-colors relative">
                                    <button
                                        onClick={(e) => handleDelete(video.id, e)}
                                        className="absolute top-2 left-2 z-10 w-8 h-8 flex items-center justify-center bg-black/60 rounded-full text-white/50 hover:text-red-500 hover:bg-black/80 transition-all opacity-0 group-hover:opacity-100"
                                        title="Delete Video"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>

                                    <div className="aspect-video bg-black/40 relative flex items-center justify-center border-b border-white/5 cursor-pointer" onClick={() => window.location.href = `/analysis/${video.id}`}>
                                        <Film className="w-12 h-12 text-white/10 group-hover:text-primary/50 transition-colors" />
                                        <div className="absolute top-2 right-2 px-2 py-1 rounded bg-black/60 text-xs font-mono text-white">
                                            {video.processed ? "READY" : `${Math.floor((video.processingProgress || 0) * 100)}%`}
                                        </div>
                                    </div>
                                    <CardContent className="p-5">
                                        <h3 className="font-bold text-white text-lg mb-1 truncate">{video.title}</h3>
                                        <p className="text-sm text-muted-foreground font-mono mb-4 truncate">{video.filename}</p>

                                        {!video.processed && (
                                            <div className="w-full bg-white/10 rounded-full h-1.5 mb-4">
                                                <div
                                                    className="bg-primary h-1.5 rounded-full transition-all duration-500 neon-glow"
                                                    style={{ width: `${(video.processingProgress || 0) * 100}%` }}
                                                />
                                            </div>
                                        )}

                                        <div className="flex items-center gap-4 text-xs text-muted-foreground border-t border-white/5 pt-4">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {video.createdAt ? format(new Date(video.createdAt), "MMM d, yyyy") : "N/A"}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                --:--
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </Layout>
        </div>
    );
}
