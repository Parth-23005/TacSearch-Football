import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type ClipInput } from "@shared/routes";

export function useClips(videoId?: number) {
  return useQuery({
    queryKey: [api.clips.list.path, videoId],
    queryFn: async () => {
      // Construct URL with query params manually since buildUrl is for path params
      const url = new URL(api.clips.list.path, window.location.origin);
      if (videoId) url.searchParams.append("videoId", videoId.toString());
      
      const res = await fetch(url.toString(), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch clips");
      return api.clips.list.responses[200].parse(await res.json());
    },
  });
}

export function useSearchClips(query: string) {
  return useQuery({
    queryKey: [api.clips.search.path, query],
    queryFn: async () => {
      const url = new URL(api.clips.search.path, window.location.origin);
      url.searchParams.append("q", query);
      
      const res = await fetch(url.toString(), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to search clips");
      return api.clips.search.responses[200].parse(await res.json());
    },
    enabled: !!query && query.length > 0,
  });
}

export function useCreateClip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: ClipInput) => {
      const res = await fetch(api.clips.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create clip");
      return api.clips.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.clips.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.clips.search.path] });
    },
  });
}
