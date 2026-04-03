"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import ImageCropper from "@/components/ui/ImageCropper";
import { toast } from "sonner";

type Props = {
  petId?: string;
  existingPhotoUrls?: string[];
  existingVideoUrls?: string[];
  onPhotosChange: (urls: string[]) => void;
  onVideosChange: (urls: string[]) => void;
  onUploadStateChange?: (isUploading: boolean) => void;
};

const MAX_VIDEO_MB = 50;
const BUCKET = "pet-media";

function extractStoragePath(url: string): string | null {
  try {
    const marker = `/object/public/${BUCKET}/`;
    const idx = url.indexOf(marker);
    if (idx === -1) return null;
    return url.slice(idx + marker.length);
  } catch {
    return null;
  }
}

export default function MediaUpload({
  petId,
  existingPhotoUrls = [],
  existingVideoUrls = [],
  onPhotosChange,
  onVideosChange,
  onUploadStateChange,
}: Props) {
  const [photoUrls, setPhotoUrls] = useState<string[]>(existingPhotoUrls);
  const [videoUrls, setVideoUrls] = useState<string[]>(existingVideoUrls);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [removingUrl, setRemovingUrl] = useState<string | null>(null);

  // Cropper state
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const photoRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const photoUrlsRef = useRef<string[]>(existingPhotoUrls);
  const videoUrlsRef = useRef<string[]>(existingVideoUrls);

  useEffect(() => {
    setPhotoUrls(existingPhotoUrls);
    photoUrlsRef.current = existingPhotoUrls;
  }, [existingPhotoUrls]);

  useEffect(() => {
    setVideoUrls(existingVideoUrls);
    videoUrlsRef.current = existingVideoUrls;
  }, [existingVideoUrls]);

  useEffect(() => {
    onUploadStateChange?.(uploadingPhoto || uploadingVideo);
  }, [onUploadStateChange, uploadingPhoto, uploadingVideo]);

  // When user picks a photo, show the cropper first
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      toast.error("Photo must be under 20MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      setCropSrc(ev.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Reset input so same file can be selected again
    if (photoRef.current) photoRef.current.value = "";
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setCropSrc(null);
    setUploadingPhoto(true);

    const supabase = createClient();
    const folder = petId ? `pets/${petId}` : `pets/temp`;
    const filename = `${folder}/photo_${Date.now()}.jpg`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(filename, croppedBlob, {
        contentType: "image/jpeg",
        upsert: false,
      });

    if (error) {
      toast.error(`Upload failed: ${error.message}`);
      setUploadingPhoto(false);
      return;
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(filename);
    const updated = [...photoUrlsRef.current, data.publicUrl];
    photoUrlsRef.current = updated;
    setPhotoUrls(updated);
    onPhotosChange(updated);
    toast.success("Photo uploaded");
    setUploadingPhoto(false);
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_VIDEO_MB * 1024 * 1024) {
      toast.error(`Video must be under ${MAX_VIDEO_MB}MB`);
      return;
    }

    setUploadingVideo(true);
    const supabase = createClient();
    const folder = petId ? `pets/${petId}` : `pets/temp`;
    const ext = file.name.split(".").pop();
    const filename = `${folder}/video_${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(filename, file, { upsert: false });

    if (error) {
      toast.error(`Upload failed: ${error.message}`);
      setUploadingVideo(false);
      return;
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(filename);
    const updated = [...videoUrlsRef.current, data.publicUrl];
    videoUrlsRef.current = updated;
    setVideoUrls(updated);
    onVideosChange(updated);
    toast.success("Video uploaded");
    setUploadingVideo(false);

    if (videoRef.current) videoRef.current.value = "";
  };

  const deleteFromStorage = async (url: string): Promise<boolean> => {
    const path = extractStoragePath(url);
    if (!path) return true;
    const supabase = createClient();
    const { error } = await supabase.storage.from(BUCKET).remove([path]);
    if (error) {
      toast.error(`Failed to delete: ${error.message}`);
      return false;
    }
    return true;
  };

  const handleRemovePhoto = async (url: string) => {
    setRemovingUrl(url);
    const success = await deleteFromStorage(url);
    if (success) {
      const updated = photoUrlsRef.current.filter((u) => u !== url);
      photoUrlsRef.current = updated;
      setPhotoUrls(updated);
      onPhotosChange(updated);
      toast.success("Photo removed");
    }
    setRemovingUrl(null);
  };

  const handleRemoveVideo = async (url: string) => {
    setRemovingUrl(url);
    const success = await deleteFromStorage(url);
    if (success) {
      const updated = videoUrlsRef.current.filter((u) => u !== url);
      videoUrlsRef.current = updated;
      setVideoUrls(updated);
      onVideosChange(updated);
      toast.success("Video removed");
    }
    setRemovingUrl(null);
  };

  return (
    <>
      {/* Cropper modal */}
      {cropSrc && (
        <ImageCropper
          imageSrc={cropSrc}
          onCropComplete={handleCropComplete}
          onCancel={() => {
            setCropSrc(null);
          }}
        />
      )}

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
              {uploadingPhoto ? "Uploading..." : "+ Add Photo"}
            </Button>
            <input
              ref={photoRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoSelect}
            />
          </div>

          {photoUrls.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {photoUrls.map((url, i) => (
                <div key={i} className="relative group h-28">
                  <Image
                    src={url}
                    alt={`Photo ${i + 1}`}
                    fill
                    className="object-cover rounded-lg border border-gray-200"
                    sizes="(max-width: 768px) 33vw, 20vw"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(url)}
                    disabled={removingUrl === url}
                    className="absolute top-1 right-1 bg-black bg-opacity-70 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 disabled:opacity-50"
                  >
                    {removingUrl === url ? "…" : "✕"}
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
                Click to upload a photo — you can crop it before saving
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
                    onClick={() => handleRemoveVideo(url)}
                    disabled={removingUrl === url}
                    className="absolute top-2 right-2 bg-black bg-opacity-70 text-white rounded-full w-6 h-6 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 disabled:opacity-50"
                  >
                    {removingUrl === url ? "…" : "✕"}
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
    </>
  );
}
