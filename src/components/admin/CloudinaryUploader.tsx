"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Upload, X, Check, Star, AlertCircle, Loader2 } from "lucide-react";
import type { AssetRole } from "@/lib/cloudinary";

export type UploadedAsset = {
  url: string;
  public_id: string;
  alt?: string;
  color_name?: string;
  is_primary?: boolean;
  width?: number;
  height?: number;
};

interface CloudinaryUploaderProps {
  role?: AssetRole;
  multiple?: boolean;
  maxFiles?: number;
  assets: UploadedAsset[];
  onChange: (assets: UploadedAsset[]) => void;
  colors?: { name: string; hex: string }[];
}

export function CloudinaryUploader({
  role = "product",
  multiple = false,
  maxFiles = 8,
  assets = [],
  onChange,
  colors = [],
}: CloudinaryUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setErrorMsg(null);

    const validFiles: File[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (!file.type.startsWith("image/")) {
        setErrorMsg("Only image files (JPG, PNG, WebP) are allowed.");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setErrorMsg("Image size exceeds maximum limit of 10MB.");
        return;
      }
      validFiles.push(file);
    }

    if (!multiple && validFiles.length > 1) {
      validFiles.splice(1);
    }

    setUploading(true);
    setUploadProgress(10);

    const uploadedResults: UploadedAsset[] = [];

    try {
      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];

        // 1. Request secure upload signature from server endpoint
        const signRes = await fetch("/api/cloudinary/sign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role }),
        });

        if (!signRes.ok) {
          const err = await signRes.json();
          throw new Error(err.error || "Failed to obtain upload signature.");
        }

        const signData = await signRes.json();
        setUploadProgress(30 + Math.floor((i / validFiles.length) * 40));

        // 2. Upload directly to Cloudinary using signed parameters
        const formData = new FormData();
        formData.append("file", file);
        formData.append("api_key", signData.apiKey);
        formData.append("timestamp", String(signData.timestamp));
        formData.append("signature", signData.signature);
        formData.append("folder", signData.folder);

        const uploadRes = await fetch(
          `https://api.cloudinary.com/v1_1/${signData.cloudName}/image/upload`,
          {
            method: "POST",
            body: formData,
          }
        );

        if (!uploadRes.ok) {
          throw new Error("Failed to upload image to Cloudinary.");
        }

        const cData = await uploadRes.json();
        uploadedResults.push({
          url: cData.secure_url,
          public_id: cData.public_id,
          width: cData.width,
          height: cData.height,
          alt: file.name.replace(/\.[^/.]+$/, ""),
          is_primary: assets.length === 0 && uploadedResults.length === 0,
        });
      }

      setUploadProgress(100);

      if (multiple) {
        onChange([...assets, ...uploadedResults]);
      } else {
        onChange(uploadedResults);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Upload error.");
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeAsset = (index: number) => {
    const next = [...assets];
    const removed = next.splice(index, 1)[0];
    if (removed?.is_primary && next.length > 0) {
      next[0].is_primary = true;
    }
    onChange(next);
  };

  const setPrimary = (index: number) => {
    const next = assets.map((a, i) => ({
      ...a,
      is_primary: i === index,
    }));
    onChange(next);
  };

  const updateAlt = (index: number, alt: string) => {
    const next = [...assets];
    next[index] = { ...next[index], alt };
    onChange(next);
  };

  const updateColor = (index: number, color_name: string) => {
    const next = [...assets];
    next[index] = { ...next[index], color_name };
    onChange(next);
  };

  return (
    <div className="space-y-4">
      {/* Upload Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-sm p-6 sm:p-8 text-center cursor-pointer transition-all ${
          isDragging
            ? "border-[#B06F5E] bg-[#FAF6F0]"
            : "border-[#E8DDD1] hover:border-[#B06F5E] bg-white"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple={multiple}
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="w-10 h-10 rounded-full bg-[#FAF6F0] border border-[#E8DDD1] flex items-center justify-center text-[#B06F5E]">
            {uploading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Upload className="w-5 h-5 stroke-[1.6]" />
            )}
          </div>
          <div>
            <span className="text-xs font-medium text-[#2B211C] block">
              {uploading
                ? `Uploading to Cloudinary (${uploadProgress}%)...`
                : "Click or drag & drop to upload images"}
            </span>
            <span className="text-[11px] text-[#7A6A5F] mt-0.5 block font-light">
              JPG, PNG, WebP up to 10MB • Served through Cloudinary CDN
            </span>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Asset Preview Cards */}
      {assets.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {assets.map((asset, idx) => (
            <div
              key={asset.public_id || idx}
              className={`group relative bg-white border rounded-sm overflow-hidden p-2 flex flex-col shadow-xs ${
                asset.is_primary ? "border-[#B06F5E] ring-1 ring-[#B06F5E]" : "border-[#E8DDD1]"
              }`}
            >
              <div className="relative aspect-[3/4] w-full rounded-xs overflow-hidden bg-[#FAF6F0]">
                <Image
                  src={asset.url}
                  alt={asset.alt || `Uploaded image ${idx + 1}`}
                  fill
                  className="object-cover"
                  sizes="200px"
                />

                {/* Primary Badge */}
                {asset.is_primary && (
                  <span className="absolute top-2 left-2 bg-[#B06F5E] text-white text-[10px] font-sans font-semibold uppercase tracking-wider px-2 py-0.5 rounded-xs shadow-xs">
                    Primary
                  </span>
                )}

                {/* Action Buttons Top Right */}
                <div className="absolute top-2 right-2 flex items-center gap-1">
                  {!asset.is_primary && multiple && (
                    <button
                      type="button"
                      onClick={() => setPrimary(idx)}
                      title="Set as Primary Image"
                      className="w-6 h-6 rounded-full bg-white/90 hover:bg-white text-[#7A6A5F] hover:text-[#B06F5E] flex items-center justify-center shadow-xs transition-colors"
                    >
                      <Star className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removeAsset(idx)}
                    title="Remove"
                    className="w-6 h-6 rounded-full bg-white/90 hover:bg-red-50 text-[#7A6A5F] hover:text-red-600 flex items-center justify-center shadow-xs transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Alt Text Input */}
              <div className="mt-2 space-y-1.5 text-xs">
                <input
                  type="text"
                  value={asset.alt || ""}
                  onChange={(e) => updateAlt(idx, e.target.value)}
                  placeholder="Alt text description..."
                  className="w-full px-2 py-1 text-[11px] bg-[#FAF6F0] border border-[#E8DDD1] rounded-xs text-[#2B211C] focus:outline-none focus:border-[#B06F5E]"
                />

                {/* Optional Color Tag for multi-color garments */}
                {colors.length > 0 && (
                  <select
                    value={asset.color_name || ""}
                    onChange={(e) => updateColor(idx, e.target.value)}
                    className="w-full px-2 py-1 text-[11px] bg-[#FAF6F0] border border-[#E8DDD1] rounded-xs text-[#2B211C] focus:outline-none focus:border-[#B06F5E]"
                  >
                    <option value="">Color: Any / All</option>
                    {colors.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
