"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { Member } from "@/data/members";
import CustomCursor from "@/components/CustomCursor";
import ThreePixelEye from "@/components/ThreePixelEye";

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
    image: string;
  }>({
    name: "",
    nickname: "",
    role: "",
    instagram: "",
    bio: "",
    image: "",
  });

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState<boolean>(false);
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

  // Handle ?edit=id query param
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
      image: member.image,
    });
    setPreviewUrl(member.image);
    setUploadedFile(null);
  };

  const closeEditModal = () => {
    if (isSaving || isUploading) return;
    setEditingMember(null);
    setUploadedFile(null);
    setPreviewUrl("");
    if (typeof window !== "undefined" && window.location.search) {
      window.history.replaceState(null, "", "/admin");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setUploadedFile(file);
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
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
    let finalImageUrl = formData.image;

    try {
      // 1. Upload new image if a file was selected
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

      showToast(`Saved changes for ${updatedMember.name}`);
      closeEditModal();
    } catch (err: unknown) {
      console.error("Save error:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to save";
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
      <CustomCursor />

      {/* Top Header */}
      <header className="sticky top-0 z-[70] bg-white/90 backdrop-blur-md border-b border-[#e5e7eb]">
        <div className="h-[56px] px-[3vw] grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          {/* Brand Back */}
          <div className="flex items-center gap-3 justify-self-start">
            <Link
              href="/"
              className="nav-item !px-0 text-[#0c0c0c] hover:opacity-75 transition-opacity"
            >
              <span className="font-mono text-[11px] tracking-[0.04em]">←</span>
              <span
                style={{ fontFamily: "var(--font-wordmark)" }}
                className="text-[20px] lowercase leading-none inline-block ml-1"
              >
                kobrat
              </span>
            </Link>
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
            <Link href="/" className="nav-item text-[#0c0c0c]">
              <span className="sr-only">Live Site</span>
              <RollingText text="VIEW LIVE SITE" />
              <span className="text-[10px] ml-1">↗</span>
            </Link>
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
                  <div className="relative w-full aspect-[4/5] rounded-[6px] overflow-hidden bg-[#f4f4f5] mb-4 border border-[#f0f0f0]">
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

                  <Link
                    href={`/members/${member.id}`}
                    className="h-[32px] px-3 rounded-[5px] border border-[#e4e4e7] hover:border-[#0c0c0c] text-[#0c0c0c] text-[10px] font-mono uppercase tracking-[0.06em] transition-colors flex items-center justify-center"
                    title="View Profile"
                  >
                    <span>VIEW ↗</span>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Edit Member Modal / Drawer */}
      <AnimatePresence>
        {editingMember && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeEditModal}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            />

            {/* Modal Dialog Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-[620px] max-h-[90vh] overflow-y-auto bg-white rounded-[10px] shadow-[0_20px_50px_rgba(0,0,0,0.18)] border border-[#e5e7eb] p-6 sm:p-8 z-10"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between gap-4 pb-5 border-b border-[#e5e7eb]">
                <div>
                  <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.08em] text-[#767676] mb-1">
                    <span>EDIT MEMBER</span>
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

              {/* Form */}
              <form onSubmit={handleSave} className="mt-6 space-y-5">
                
                {/* Photo Upload & Preview Section */}
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-[0.06em] text-[#767676] mb-2">
                    MEMBER PORTRAIT PHOTO
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-4 items-center">
                    {/* Portrait Preview Box */}
                    <div className="relative w-full aspect-[3/4] max-w-[140px] rounded-[6px] overflow-hidden bg-[#f4f4f5] border border-[#e5e7eb] shadow-sm">
                      {previewUrl ? (
                        <Image
                          src={previewUrl}
                          alt="Preview"
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] font-mono text-[#a1a1aa]">
                          NO PHOTO
                        </div>
                      )}
                    </div>

                    {/* Upload Controls */}
                    <div className="space-y-3">
                      {/* Drag and Drop Zone */}
                      <div
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className="border border-dashed border-[#d4d4d8] hover:border-[#0c0c0c] bg-[#fafafa] hover:bg-[#f4f4f5] rounded-[6px] p-4 text-center cursor-pointer transition-colors"
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        <div className="font-mono text-[11px] text-[#0c0c0c] font-medium">
                          {uploadedFile ? uploadedFile.name : "CHOOSE IMAGE FILE OR DROP HERE"}
                        </div>
                        <div className="font-mono text-[9px] text-[#a1a1aa] mt-0.5 uppercase">
                          PNG, JPG, WEBP UP TO 10MB
                        </div>
                      </div>

                      {/* Direct URL Alternative */}
                      <div>
                        <span className="block text-[9px] font-mono text-[#a1a1aa] uppercase mb-1">
                          OR DIRECT IMAGE URL:
                        </span>
                        <input
                          type="url"
                          placeholder="https://..."
                          value={formData.image}
                          onChange={(e) => {
                            setFormData({ ...formData, image: e.target.value });
                            setPreviewUrl(e.target.value);
                            setUploadedFile(null);
                          }}
                          className="w-full h-[34px] px-3 bg-white border border-[#e5e7eb] rounded-[5px] text-[11px] font-mono text-[#0c0c0c] focus:outline-none focus:border-[#0c0c0c] transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Name & Nickname row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-[0.06em] text-[#767676] mb-1.5">
                      NAME *
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
                    BIO / STATEMENT
                  </label>
                  <textarea
                    rows={3}
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Short narrative or quote shown on the member profile page..."
                    className="w-full p-3 bg-white border border-[#e5e7eb] rounded-[5px] text-[13px] text-[#0c0c0c] focus:outline-none focus:border-[#0c0c0c] transition-colors resize-none"
                  />
                </div>

                {/* Action Buttons */}
                <div className="pt-4 border-t border-[#e5e7eb] flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeEditModal}
                    disabled={isSaving}
                    className="h-[38px] px-5 rounded-[5px] border border-[#e5e7eb] hover:bg-[#f4f4f5] text-[#0c0c0c] text-[11px] font-mono uppercase tracking-[0.04em] transition-colors"
                  >
                    CANCEL
                  </button>

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="h-[38px] px-6 rounded-[5px] bg-[#0c0c0c] hover:bg-[#27272a] text-white text-[11px] font-mono uppercase tracking-[0.06em] font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSaving && (
                      <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />
                    )}
                    <span>{isSaving ? "SAVING..." : "SAVE CHANGES"}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
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
