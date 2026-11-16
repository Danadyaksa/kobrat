"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import TransitionLink from "@/components/TransitionLink";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { Member } from "@/data/members";
import ThreePixelEye from "@/components/ThreePixelEye";
import ImageCropperModal from "@/components/ImageCropperModal";

function RollingText({ text }: { text: string }) {
  return (
    <span className="chars-inner" aria-hidden="true">
      {text.split("").map((char, index) => (
        <span
          key={index}
          style={{ "--i": index } as React.CSSProperties}
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </span>
  );
}

function RollingWordmark({ text }: { text: string }) {
  return (
    <span className="wordmark-chars" aria-hidden="true">
      {text.split("").map((char, index) => (
        <span
          key={index}
          style={{ "--i": index } as React.CSSProperties}
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </span>
  );
}

function AdminContent() {
  const searchParams = useSearchParams();
  const editQueryId = searchParams.get("edit");

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form states for modal
  const [formData, setFormData] = useState<{
    name: string;
    nickname: string;
    role: string;
    instagram: string;
    bio: string;
  }>({
    name: "",
    nickname: "",
    role: "",
    instagram: "",
    bio: "",
  });

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isCropperOpen, setIsCropperOpen] = useState<boolean>(false);
  const [rawImageToCrop, setRawImageToCrop] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch members on load
  const loadMembers = async () => {
    try {
      const res = await fetch("/api/members", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setMembers(data);
      }
    } catch (err) {
      console.error("Error fetching members:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  // Handle ?edit=id query param (only once per query value)
  const handledEditQueryRef = useRef<string | null>(null);
  useEffect(() => {
    if (editQueryId && members.length > 0 && handledEditQueryRef.current !== editQueryId) {
      const target = members.find((m) => m.id === Number(editQueryId));
      if (target) {
        handledEditQueryRef.current = editQueryId;
        openEditModal(target);
      }
    }
  }, [editQueryId, members]);

  const openEditModal = (member: Member) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      nickname: member.nickname,
      role: member.role,
      instagram: member.instagram || "",
      bio: member.bio || "",
    });
    setPreviewUrl(member.image);
    setUploadedFile(null);
  };

  const closeEditModal = () => {
    if (isSaving || isUploading) return;
    setEditingMember(null);
    setUploadedFile(null);
    setPreviewUrl("");
    setIsCropperOpen(false);
    setRawImageToCrop(null);
    if (typeof window !== "undefined" && window.location.search) {
      window.history.replaceState(null, "", "/admin");
    }
  };

  // Directly select image file and open cropper
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setRawImageToCrop(objectUrl);
      setIsCropperOpen(true);
    }
    // Reset so re-selecting same file triggers onChange
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const objectUrl = URL.createObjectURL(file);
      setRawImageToCrop(objectUrl);
      setIsCropperOpen(true);
    }
  };

  // When user applies crop in ImageCropperModal
  const handleCropComplete = (croppedFile: File, croppedPreviewUrl: string) => {
    setUploadedFile(croppedFile);
    setPreviewUrl(croppedPreviewUrl);
    setIsCropperOpen(false);
    setRawImageToCrop(null);
    showToast("Foto berhasil di-crop (rasio 3:4)");
  };

  const openExistingImageCropper = () => {
    if (previewUrl) {
      setRawImageToCrop(previewUrl);
      setIsCropperOpen(true);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;

    setIsSaving(true);
    let finalImageUrl = editingMember.image;

    try {
      // 1. Upload new image if a file was selected or cropped
      if (uploadedFile) {
        setIsUploading(true);
        const uploadForm = new FormData();
        uploadForm.append("file", uploadedFile);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: uploadForm,
        });

        if (!uploadRes.ok) {
          throw new Error("Failed to upload image");
        }

        const uploadData = await uploadRes.json();
        finalImageUrl = uploadData.url;
        setIsUploading(false);
      }

      // 2. Save member data
      const updatedMember: Member = {
        ...editingMember,
        name: formData.name.trim(),
        nickname: formData.nickname.trim(),
        role: formData.role.trim(),
        instagram: formData.instagram.trim(),
        bio: formData.bio.trim(),
        image: finalImageUrl,
      };

      const saveRes = await fetch("/api/members", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedMember),
      });

      if (!saveRes.ok) {
        throw new Error("Failed to save member");
      }

      const saveData = await saveRes.json();
      if (saveData.members) {
        setMembers(saveData.members);
      } else {
        await loadMembers();
      }

      showToast(`Berhasil menyimpan data ${updatedMember.name}`);
      closeEditModal();
    } catch (err: unknown) {
      console.error("Save error:", err);
      const errorMessage = err instanceof Error ? err.message : "Gagal menyimpan data";
      alert(errorMessage);
    } finally {
      setIsSaving(false);
      setIsUploading(false);
    }
  };

  const filteredMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.nickname.toLowerCase().includes(search.toLowerCase()) ||
      m.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative min-h-screen bg-[#fafafa] text-[#0c0c0c] flex flex-col selection:bg-[#0c0c0c] selection:text-white cursor-default">
      {/* Top Header */}
      <header className="sticky top-0 z-[70] bg-white/90 backdrop-blur-md border-b border-[#e5e7eb]">
        <div className="h-[56px] px-[3vw] grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          {/* Brand Back */}
          <div className="flex items-center gap-3 justify-self-start">
            <TransitionLink
              href="/"
              className="nav-item !px-0 text-[#0c0c0c] hover:opacity-75 transition-opacity flex items-center"
            >
              <span className="font-mono text-[11px] tracking-[0.04em]">←</span>
              <span
                style={{ fontFamily: "var(--font-wordmark)" }}
                className="text-[20px] lowercase leading-none inline-block ml-1"
              >
                <RollingWordmark text="kobrat" />
              </span>
            </TransitionLink>
            <span className="text-[#d4d4d8] font-mono text-[11px]">/</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#767676]">
              ADMIN
            </span>
          </div>

          {/* Center Status Badge */}
          <div className="font-mono text-[10px] uppercase tracking-[0.06em] text-[#767676] select-none hidden sm:flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>SYSTEM ACTIVE // {members.length} MEMBERS</span>
          </div>

          {/* Right Action */}
          <div className="justify-self-end flex items-center gap-4">
            <TransitionLink href="/" className="nav-item text-[#0c0c0c]">
              <span className="sr-only">Live Site</span>
              <RollingText text="VIEW LIVE SITE" />
              <span className="text-[10px] ml-1">↗</span>
            </TransitionLink>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-[1300px] mx-auto px-6 md:px-10 py-10">
        
        {/* Admin Title & Toolbar */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-6 border-b border-[#e5e7eb]">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#f4f4f5] text-[#0c0c0c] text-[10px] font-mono uppercase tracking-[0.06em] mb-2.5">
              <ThreePixelEye size={12} />
              <span>ROSTER MANAGEMENT</span>
            </div>
            <h1
              style={{ fontFamily: "var(--font-wordmark)" }}
              className="text-[38px] md:text-[50px] leading-tight text-[#0c0c0c] lowercase tracking-tight"
            >
              member dashboard
            </h1>
            <p className="text-[13px] font-mono text-[#767676] mt-1">
              Update member portraits, names, roles, and credentials in real-time.
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-[280px]">
            <input
              type="text"
              placeholder="FILTER BY NAME / ROLE..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-[38px] px-3.5 bg-white border border-[#e4e4e7] rounded-[6px] text-[11px] font-mono tracking-[0.04em] uppercase text-[#0c0c0c] placeholder:text-[#a1a1aa] focus:outline-none focus:border-[#0c0c0c] transition-colors"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-[#767676] hover:text-[#0c0c0c]"
              >
                CLEAR
              </button>
            )}
          </div>
        </div>

        {/* Member Grid */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-[#767676] font-mono text-[11px] uppercase tracking-[0.08em]">
            <span className="animate-spin inline-block w-4 h-4 border border-[#767676] border-t-transparent rounded-full" />
            <span>LOADING MEMBERS...</span>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="py-20 text-center font-mono text-[12px] uppercase text-[#767676] tracking-[0.04em]">
            No members found matching &quot;{search}&quot;.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredMembers.map((member) => (
              <motion.div
                key={member.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="group relative bg-white border border-[#e5e7eb] rounded-[8px] p-4 flex flex-col justify-between shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:border-[#d4d4d8] transition-all"
              >
                <div>
                  {/* Photo Preview Container */}
                  <div className="relative w-full aspect-[3/4] rounded-[6px] overflow-hidden bg-[#f4f4f5] mb-4 border border-[#f0f0f0]">
                    <Image
                      src={member.image}
                      alt={member.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-[4px] bg-black/60 backdrop-blur-sm text-white font-mono text-[9px] uppercase tracking-[0.06em]">
                      0{member.id}
                    </div>
                  </div>

                  {/* Member Meta */}
                  <div className="space-y-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <h3
                        style={{ fontFamily: "var(--font-wordmark)" }}
                        className="text-[22px] leading-tight text-[#0c0c0c] lowercase"
                      >
                        {member.name}
                      </h3>
                      <span className="font-mono text-[10px] uppercase tracking-[0.04em] text-[#767676] bg-[#f4f4f5] px-1.5 py-0.5 rounded-[3px]">
                        {member.nickname}
                      </span>
                    </div>

                    <p className="font-mono text-[11px] text-[#767676] leading-snug line-clamp-1">
                      {member.role}
                    </p>

                    {member.instagram && (
                      <p className="font-mono text-[10px] text-[#a1a1aa] pt-0.5">
                        {member.instagram}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-5 pt-3 border-t border-[#f4f4f5] flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => openEditModal(member)}
                    className="flex-1 h-[32px] rounded-[5px] bg-[#0c0c0c] text-white hover:bg-[#27272a] text-[10px] font-mono uppercase tracking-[0.06em] font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>EDIT</span>
                  </button>

                  <TransitionLink
                    href={`/members/${member.id}`}
                    className="h-[32px] px-3 rounded-[5px] border border-[#e4e4e7] hover:border-[#0c0c0c] text-[#0c0c0c] text-[10px] font-mono uppercase tracking-[0.06em] transition-colors flex items-center justify-center"
                    title="View Profile"
                  >
                    <span>VIEW ↗</span>
                  </TransitionLink>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Edit Member Modal / Drawer */}
      <AnimatePresence>
        {editingMember && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeEditModal}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal Dialog Card with Fixed Header & Sticky Footer */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-[640px] max-h-[92vh] bg-white rounded-[10px] shadow-[0_25px_60px_rgba(0,0,0,0.22)] border border-[#e5e7eb] flex flex-col z-10 overflow-hidden"
            >
              {/* Modal Header - Fixed at Top */}
              <div className="shrink-0 px-6 sm:px-8 py-4 sm:py-5 border-b border-[#e5e7eb] flex items-start justify-between gap-4 bg-white">
                <div>
                  <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.08em] text-[#767676] mb-1">
                    <span>EDIT MEMBER PROFILE</span>
                    <span>//</span>
                    <span>0{editingMember.id}</span>
                  </div>
                  <h2
                    style={{ fontFamily: "var(--font-wordmark)" }}
                    className="text-[28px] sm:text-[34px] leading-tight text-[#0c0c0c] lowercase"
                  >
                    {formData.name || "edit profile"}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={isSaving}
                  className="w-8 h-8 rounded-full border border-[#e5e7eb] hover:bg-[#f4f4f5] text-[#767676] hover:text-[#0c0c0c] flex items-center justify-center font-mono text-[12px] transition-colors"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              {/* Form Body - Scrollable */}
              <form
                id="edit-member-form"
                onSubmit={handleSave}
                className="flex-1 overflow-y-auto px-6 sm:px-8 py-5 space-y-5"
              >
                {/* Photo Upload & Cropping Section */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] font-mono uppercase tracking-[0.06em] text-[#767676]">
                      FOTO PROFIL // 3:4 PORTRAIT
                    </label>
                    <span className="text-[9px] font-mono text-[#a1a1aa] uppercase">
                      RATIO: 3:4
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-[130px_1fr] gap-4 sm:gap-5 items-start bg-[#f9fafb] border border-[#e5e7eb] rounded-[8px] p-4">
                    {/* Portrait Preview Box with Click-to-Change */}
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="group relative w-full aspect-[3/4] max-w-[130px] mx-auto sm:mx-0 rounded-[6px] overflow-hidden bg-[#f4f4f5] border border-[#e5e7eb] shadow-sm cursor-pointer"
                      title="Klik untuk memilih foto"
                    >
                      {previewUrl ? (
                        <Image
                          src={previewUrl}
                          alt="Preview"
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-[10px] font-mono text-[#a1a1aa] gap-1 p-2 text-center">
                          <span>NO PHOTO</span>
                        </div>
                      )}
                      
                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/65 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-2 text-center text-white">
                        <span className="text-[15px]">📷</span>
                        <span className="font-mono text-[9px] uppercase tracking-[0.06em] font-medium leading-tight">
                          GANTI FOTO
                        </span>
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="space-y-3 flex flex-col justify-center">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />

                      {/* Prominent Action Buttons */}
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="h-[36px] px-4 rounded-[5px] bg-[#0c0c0c] hover:bg-[#27272a] text-white font-mono text-[11px] uppercase tracking-[0.06em] font-medium flex items-center gap-2 cursor-pointer shadow-sm transition-colors"
                        >
                          <span>📁 PILIH FOTO LANGSUNG</span>
                        </button>

                        {previewUrl && (
                          <button
                            type="button"
                            onClick={openExistingImageCropper}
                            className="h-[36px] px-3.5 rounded-[5px] border border-[#d4d4d8] hover:border-[#0c0c0c] bg-white text-[#0c0c0c] font-mono text-[10px] uppercase tracking-[0.06em] flex items-center gap-1.5 cursor-pointer transition-colors"
                          >
                            <span>✂ SESUAIKAN / CROP</span>
                          </button>
                        )}
                      </div>

                      <div
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className="border border-dashed border-[#d4d4d8] hover:border-[#0c0c0c] bg-white rounded-[5px] p-3 text-center cursor-pointer transition-colors"
                      >
                        <div className="font-mono text-[10px] text-[#71717a] font-medium">
                          {uploadedFile ? `✓ ${uploadedFile.name} (siap disimpan)` : "Atau drag & drop file foto ke sini"}
                        </div>
                        <div className="font-mono text-[9px] text-[#a1a1aa] mt-0.5 uppercase">
                          JPG, PNG, WEBP • OTOMATIS BUKA CROPPER 3:4
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Name & Nickname row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-[0.06em] text-[#767676] mb-1.5">
                      NAMA LENGKAP / PANGGILAN *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Aksa"
                      className="w-full h-[38px] px-3 bg-white border border-[#e5e7eb] rounded-[5px] text-[13px] text-[#0c0c0c] focus:outline-none focus:border-[#0c0c0c] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-[0.06em] text-[#767676] mb-1.5">
                      NICKNAME / IDENTITY *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.nickname}
                      onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                      placeholder="e.g. The Architect"
                      className="w-full h-[38px] px-3 bg-white border border-[#e5e7eb] rounded-[5px] text-[13px] text-[#0c0c0c] focus:outline-none focus:border-[#0c0c0c] transition-colors"
                    />
                  </div>
                </div>

                {/* Role & Instagram row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-[0.06em] text-[#767676] mb-1.5">
                      ROLE *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      placeholder="e.g. Vision & Direction"
                      className="w-full h-[38px] px-3 bg-white border border-[#e5e7eb] rounded-[5px] text-[13px] text-[#0c0c0c] focus:outline-none focus:border-[#0c0c0c] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-[0.06em] text-[#767676] mb-1.5">
                      INSTAGRAM HANDLE
                    </label>
                    <input
                      type="text"
                      value={formData.instagram}
                      onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                      placeholder="@username"
                      className="w-full h-[38px] px-3 bg-white border border-[#e5e7eb] rounded-[5px] text-[13px] text-[#0c0c0c] focus:outline-none focus:border-[#0c0c0c] transition-colors"
                    />
                  </div>
                </div>

                {/* Bio / Persona Statement */}
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-[0.06em] text-[#767676] mb-1.5">
                    BIO / KUTIPAN PROFIL
                  </label>
                  <textarea
                    rows={3}
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Deskripsi singkat yang tampil di halaman profil anggota..."
                    className="w-full p-3 bg-white border border-[#e5e7eb] rounded-[5px] text-[13px] text-[#0c0c0c] focus:outline-none focus:border-[#0c0c0c] transition-colors resize-none"
                  />
                </div>
              </form>

              {/* Modal Footer - STICKY AT BOTTOM, 100% ALWAYS VISIBLE */}
              <div className="shrink-0 px-6 sm:px-8 py-4 bg-[#fbfbfb] border-t border-[#e5e7eb] flex items-center justify-between gap-3 z-20">
                <div className="font-mono text-[10px] text-[#767676] uppercase hidden sm:block">
                  {uploadedFile ? "● FOTO DISESUAIKAN (3:4)" : "SIAP SIMPAN PERUBAHAN"}
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={closeEditModal}
                    disabled={isSaving}
                    className="h-[40px] px-5 rounded-[5px] border border-[#e5e7eb] hover:bg-white text-[#0c0c0c] text-[11px] font-mono uppercase tracking-[0.04em] transition-colors cursor-pointer"
                  >
                    BATAL
                  </button>

                  <button
                    type="submit"
                    form="edit-member-form"
                    disabled={isSaving}
                    className="h-[40px] px-7 rounded-[5px] bg-[#0c0c0c] hover:bg-[#27272a] text-white text-[11px] font-mono uppercase tracking-[0.06em] font-medium transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-md"
                  >
                    {isSaving && (
                      <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />
                    )}
                    <span>{isSaving ? "MENYIMPAN..." : "SIMPAN PERUBAHAN"}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Interactive 3:4 Image Cropper Modal */}
      <AnimatePresence>
        {isCropperOpen && rawImageToCrop && (
          <ImageCropperModal
            imageSrc={rawImageToCrop}
            onCropComplete={handleCropComplete}
            onCancel={() => {
              setIsCropperOpen(false);
              setRawImageToCrop(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Floating Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-[120] bg-[#0c0c0c] text-white px-4 py-2.5 rounded-[6px] shadow-[0_12px_32px_rgba(0,0,0,0.2)] flex items-center gap-3 border border-white/10"
          >
            <ThreePixelEye size={12} />
            <span className="font-mono text-[11px] uppercase tracking-[0.04em]">
              {toastMessage}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#fafafa] flex items-center justify-center font-mono text-[11px] text-[#767676] uppercase">
          INITIALIZING ADMIN DASHBOARD...
        </div>
      }
    >
      <AdminContent />
    </Suspense>
  );
}
