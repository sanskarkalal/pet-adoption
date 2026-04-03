"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Props = {
  petId?: string;
  existingPhotoUrls?: string[];
  existingVideoUrls?: string[];
  onPhotosChange: (urls: string[]) => void;
  onVideosChange: (urls: string[]) => void;
};

const MAX_PHOTO_MB = 5;
const MAX_VIDEO_MB = 50;
const BUCKET = "pet-media";

export default function MediaUpload({
  petId,
  existingPhotoUrls = [],
  existingVideoUrls = [],
  onPhotosChange,
  onVideosChange,
}: Props) {
  const [photoUrls, setPhotoUrls] = useState<string[]>(existingPhotoUrls);
  const [videoUrls, setVideoUrls] = useState<string[]>(existingVideoUrls);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  const photoRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (
    file: File,
    type: "photo" | "video",
  ): Promise<string | null> => {
    const maxMB = type === "photo" ? MAX_PHOTO_MB : MAX_VIDEO_MB;
    if (file.size > maxMB * 1024 * 1024) {
      toast.error(
        `${type === "photo" ? "Photo" : "Video"} must be under ${maxMB}MB`,
      );
      return null;
    }

    const supabase = createClient();
    const folder = petId ? `pets/${petId}` : `pets/temp`;
    const ext = file.name.split(".").pop();
    const filename = `${folder}/${type}_${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(filename, file, { upsert: false });

    if (error) {
      toast.error(`Failed to upload ${type}: ${error.message}`);
      return null;
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(filename);
    return data.publicUrl;
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    setUploadingPhoto(true);
    const newUrls: string[] = [];

    for (const file of files) {
      const url = await uploadFile(file, "photo");
      if (url) newUrls.push(url);
    }

    const updated = [...photoUrls, ...newUrls];
    setPhotoUrls(updated);
    onPhotosChange(updated);
    setUploadingPhoto(false);

    if (newUrls.length > 0) {
      toast.success(
        `${newUrls.length} photo${newUrls.length > 1 ? "s" : ""} uploaded`,
      );
    }
    if (photoRef.current) photoRef.current.value = "";
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    setUploadingVideo(true);
    const newUrls: string[] = [];

    for (const file of files) {
      const url = await uploadFile(file, "video");
      if (url) newUrls.push(url);
    }

    const updated = [...videoUrls, ...newUrls];
    setVideoUrls(updated);
    onVideosChange(updated);
    setUploadingVideo(false);

    if (newUrls.length > 0) {
      toast.success(
        `${newUrls.length} video${newUrls.length > 1 ? "s" : ""} uploaded`,
      );
    }
    if (videoRef.current) videoRef.current.value = "";
  };

  const removePhoto = (url: string) => {
    const updated = photoUrls.filter((u) => u !== url);
    setPhotoUrls(updated);
    onPhotosChange(updated);
  };

  const removeVideo = (url: string) => {
    const updated = videoUrls.filter((u) => u !== url);
    setVideoUrls(updated);
    onVideosChange(updated);
  };

  return (
    <div className="space-y-5">
      {/* Photos */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-700">Photos</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => photoRef.current?.click()}
            disabled={uploadingPhoto}
          >
            {uploadingPhoto ? "Uploading..." : "+ Add Photos"}
          </Button>
          <input
            ref={photoRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handlePhotoUpload}
          />
        </div>

        {photoUrls.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {photoUrls.map((url, i) => (
              <div key={i} className="relative group">
                <img
                  src={url}
                  alt={`Photo ${i + 1}`}
                  className="w-full h-28 object-cover rounded-lg border border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(url)}
                  className="absolute top-1 right-1 bg-black bg-opacity-60 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div
            className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"
            onClick={() => photoRef.current?.click()}
          >
            <p className="text-gray-400 text-sm">
              Click to upload photos (JPG, PNG · max 5MB each)
            </p>
          </div>
        )}
      </div>

      {/* Videos */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-700">Videos</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => videoRef.current?.click()}
            disabled={uploadingVideo}
          >
            {uploadingVideo ? "Uploading..." : "+ Add Video"}
          </Button>
          <input
            ref={videoRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={handleVideoUpload}
          />
        </div>

        {videoUrls.length > 0 ? (
          <div className="space-y-2">
            {videoUrls.map((url, i) => (
              <div key={i} className="relative group">
                <video
                  src={url}
                  controls
                  className="w-full rounded-lg border border-gray-200 max-h-40"
                />
                <button
                  type="button"
                  onClick={() => removeVideo(url)}
                  className="absolute top-2 right-2 bg-black bg-opacity-60 text-white rounded-full w-6 h-6 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div
            className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"
            onClick={() => videoRef.current?.click()}
          >
            <p className="text-gray-400 text-sm">
              Click to upload a video (MP4, MOV · max 50MB)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
