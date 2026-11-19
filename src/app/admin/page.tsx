"use client";

import { Suspense, useEffect, useRef, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import TransitionLink from "@/components/TransitionLink";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { Member, getMemberSlug } from "@/data/members";
import { Moment } from "@/data/moments";
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


function AdminContent() {
  const searchParams = useSearchParams();
  const editQueryId = searchParams.get("edit");
  const tabQuery = searchParams.get("tab");

  // Tab state: "members" | "moments"
  const [activeTab, setActiveTab] = useState<"members" | "moments">(
    tabQuery === "moments" ? "moments" : "members"
  );

  // ─── Members State ────────────────────────────────────────────────────────
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState<boolean>(true);
  const [memberSearch, setMemberSearch] = useState<string>("" );
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [isMemberSaving, setIsMemberSaving] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [memberFormData, setMemberFormData] = useState<{
    name: string;
    nickname: string;
    instagram: string;
    website: string;
    github: string;
    bio: string;
  }>({
    name: "",
    nickname: "",
    instagram: "",
    website: "",
    github: "",
    bio: "",
  });

  const [memberUploadedFile, setMemberUploadedFile] = useState<File | null>(null);
  const [memberPreviewUrl, setMemberPreviewUrl] = useState<string>("");
  const [isMemberCropperOpen, setIsMemberCropperOpen] = useState<boolean>(false);
  const [rawMemberImageToCrop, setRawMemberImageToCrop] = useState<string | null>(null);
  const memberFileInputRef = useRef<HTMLInputElement>(null);

  // ─── Moments State ────────────────────────────────────────────────────────
  const [moments, setMoments] = useState<Moment[]>([]);
  const [loadingMoments, setLoadingMoments] = useState<boolean>(true);
  const [momentSearch, setMomentSearch] = useState<string>("");
  const [editingMoment, setEditingMoment] = useState<Moment | null>(null);
  const [isMomentSaving, setIsMomentSaving] = useState<boolean>(false);

  const [momentFormData, setMomentFormData] = useState<{
    title: string;
    category: string;
    year: string;
    date: string;
    location: string;
    camera: string;
    description: string;
    highlightSlot: 1 | 2 | 3 | 0;
    imageUrl: string;
    members: string[];
  }>({
    title: "",
    category: "STUDIO",
    year: "2025",
    date: "",
    location: "",
    camera: "",
    description: "",
    highlightSlot: 0,
    imageUrl: "",
    members: [],
  });

  const [momentUploadedFile, setMomentUploadedFile] = useState<File | null>(null);
  const [momentPreviewUrl, setMomentPreviewUrl] = useState<string>("");
  const [isMomentCropperOpen, setIsMomentCropperOpen] = useState<boolean>(false);
  const [rawMomentImageToCrop, setRawMomentImageToCrop] = useState<string | null>(null);
  const momentFileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // ─── Load Data ────────────────────────────────────────────────────────────
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
      setLoadingMembers(false);
    }
  };

  const loadMoments = async () => {
    try {
      const res = await fetch("/api/moments", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setMoments(data);
      }
    } catch (err) {
      console.error("Error fetching moments:", err);
    } finally {
      setLoadingMoments(false);
    }
  };

  useEffect(() => {
    loadMembers();
    loadMoments();
  }, []);

  // Handle ?edit=id query param
  const handledEditQueryRef = useRef<string | null>(null);
  useEffect(() => {
    if (editQueryId && members.length > 0 && handledEditQueryRef.current !== editQueryId) {
      const target = members.find((m) => m.id === Number(editQueryId));
      if (target) {
        handledEditQueryRef.current = editQueryId;
        openEditMemberModal(target);
      }
    }
  }, [editQueryId, members]);

  // ─── Member Actions ───────────────────────────────────────────────────────
  const openEditMemberModal = (member: Member) => {
    setEditingMember(member);
    setMemberFormData({
      name: member.name,
      nickname: member.nickname,
      instagram: member.instagram || "",
      website: member.website || "",
      github: member.github || "",
      bio: member.bio || "",
    });
    setMemberPreviewUrl(member.image);
    setMemberUploadedFile(null);
  };

  const closeEditMemberModal = () => {
    if (isMemberSaving) return;
    setEditingMember(null);
    setMemberUploadedFile(null);
    setMemberPreviewUrl("");
    setIsMemberCropperOpen(false);
    setRawMemberImageToCrop(null);
    if (typeof window !== "undefined" && window.location.search) {
      window.history.replaceState(null, "", "/admin");
    }
  };

  const handleMemberFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setRawMemberImageToCrop(objectUrl);
      setIsMemberCropperOpen(true);
    }
    e.target.value = "";
  };

  const handleMemberCropComplete = (croppedFile: File, croppedPreviewUrl: string) => {
    setMemberUploadedFile(croppedFile);
    setMemberPreviewUrl(croppedPreviewUrl);
    setIsMemberCropperOpen(false);
    setRawMemberImageToCrop(null);
    showToast("Foto profil berhasil di-crop (3:4)");
  };

  const handleMemberSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;

    setIsMemberSaving(true);
    let finalImageUrl = editingMember.image;

    try {
      if (memberUploadedFile) {
        const uploadForm = new FormData();
        uploadForm.append("file", memberUploadedFile);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: uploadForm,
        });

        if (!uploadRes.ok) throw new Error("Gagal mengunggah foto profil");
        const uploadData = await uploadRes.json();
        finalImageUrl = uploadData.url;
      }

      const updatedMember: Member = {
        ...editingMember,
        name: memberFormData.name.trim(),
        nickname: memberFormData.nickname.trim(),
        instagram: memberFormData.instagram.trim(),
        website: memberFormData.website.trim(),
        github: memberFormData.github.trim(),
        bio: memberFormData.bio.trim(),
        image: finalImageUrl,
      };

      const saveRes = await fetch("/api/members", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedMember),
      });

      if (!saveRes.ok) throw new Error("Gagal menyimpan data anggota");
      const saveData = await saveRes.json();
      if (saveData.members) setMembers(saveData.members);
      else await loadMembers();

      showToast(`Berhasil menyimpan data ${updatedMember.name}`);
      closeEditMemberModal();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Gagal menyimpan data";
      alert(errorMessage);
    } finally {
      setIsMemberSaving(false);
    }
  };

  // ─── Moment Actions ───────────────────────────────────────────────────────
  const openEditMomentModal = (moment: Moment) => {
    setEditingMoment(moment);
    // Sanitize initial members against active members list so phantom/dummy names are stripped immediately
    const validSlugs = new Set(
      members.flatMap((m) => [
        getMemberSlug(m).toLowerCase(),
        (m.nickname || "").toLowerCase(),
      ]).filter(Boolean)
    );
    const initialMembers = (Array.isArray(moment.members) ? moment.members : [])
      .map((s) => s.toLowerCase().trim())
      .filter((s) => validSlugs.has(s));

    setMomentFormData({
      title: moment.title,
      category: moment.category || "STUDIO",
      year: moment.year || "2025",
      date: moment.date || "",
      location: moment.location || "",
      camera: moment.camera || "",
      description: moment.description || "",
      highlightSlot: (moment.highlightSlot as 1 | 2 | 3) || 0,
      imageUrl: moment.image || "",
      members: initialMembers,
    });
    setMomentPreviewUrl(moment.image);
    setMomentUploadedFile(null);
  };

  const handleMomentDelete = async (momentId: number, momentTitle: string) => {
    const ok = window.confirm(
      `Apakah Anda yakin ingin menghapus moment "${momentTitle}"? Tindakan ini permanen dan foto akan dihapus dari arsip.`
    );
    if (!ok) return;

    try {
      const res = await fetch(`/api/moments?id=${momentId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Gagal menghapus moment");
      }
      const data = await res.json();
      if (data.moments) setMoments(data.moments);
      else await loadMoments();

      showToast(`Moment "${momentTitle}" berhasil dihapus`);
      closeEditMomentModal();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menghapus moment";
      alert(msg);
    }
  };

  const closeEditMomentModal = () => {
    if (isMomentSaving) return;
    setEditingMoment(null);
    setMomentUploadedFile(null);
    setMomentPreviewUrl("");
    setIsMomentCropperOpen(false);
    setRawMomentImageToCrop(null);
  };

  const handleMomentFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMomentUploadedFile(file);
      const objectUrl = URL.createObjectURL(file);
      setMomentPreviewUrl(objectUrl);
      setMomentFormData((prev) => ({ ...prev, imageUrl: "" }));
      showToast("Foto berhasil dimuat. Klik 'SESUAIKAN CROP' jika ingin memotong.");
    }
    e.target.value = "";
  };

  const handleMomentCropComplete = (croppedFile: File, croppedPreviewUrl: string) => {
    setMomentUploadedFile(croppedFile);
    setMomentPreviewUrl(croppedPreviewUrl);
    setMomentFormData((prev) => ({ ...prev, imageUrl: croppedPreviewUrl }));
    setIsMomentCropperOpen(false);
    setRawMomentImageToCrop(null);
    showToast("Foto moment berhasil disesuaikan (16:9)");
  };

  const handleMomentSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMoment) return;

    setIsMomentSaving(true);
    let finalImageUrl = editingMoment.image;

    try {
      if (momentUploadedFile) {
        const uploadForm = new FormData();
        uploadForm.append("file", momentUploadedFile);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: uploadForm,
        });

        if (!uploadRes.ok) throw new Error("Gagal mengunggah foto moment");
        const uploadData = await uploadRes.json();
        finalImageUrl = uploadData.url;
      } else if (momentPreviewUrl && !momentPreviewUrl.startsWith("blob:")) {
        finalImageUrl = momentPreviewUrl;
      }

      // Automatically derive year from date (e.g. "OCTOBER 14, 2024" -> "2024") if present, or keep existing year
      const parsedYear =
        (momentFormData.date.match(/\b(20\d\d)\b/) || [])[1] ||
        momentFormData.year?.trim() ||
        editingMoment.year ||
        "2025";

      // Strictly sanitize members before saving against actual roster members
      const validSlugs = new Set(
        members.flatMap((m) => [
          getMemberSlug(m).toLowerCase(),
          (m.nickname || "").toLowerCase(),
        ]).filter(Boolean)
      );
      const cleanMembers = Array.from(
        new Set(
          momentFormData.members
            .map((s) => s.toLowerCase().trim())
            .filter((s) => validSlugs.has(s))
        )
      );

      const updatedMoment: Moment = {
        ...editingMoment,
        title: momentFormData.title.trim(),
        category: (editingMoment.category || "MOMENT").toUpperCase(),
        year: parsedYear,
        date: momentFormData.date.trim(),
        location: momentFormData.location.trim(),
        camera: momentFormData.camera.trim(),
        description: momentFormData.description.trim(),
        members: cleanMembers,
        image: finalImageUrl,
        highlightSlot:
          momentFormData.highlightSlot === 0 ? null : momentFormData.highlightSlot,
        featured: momentFormData.highlightSlot > 0 || editingMoment.featured,
      };

      const saveRes = await fetch("/api/moments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedMoment),
      });

      if (!saveRes.ok) throw new Error("Gagal menyimpan moment");
      const saveData = await saveRes.json();
      if (saveData.moments) setMoments(saveData.moments);
      else await loadMoments();

      showToast(`Berhasil menyimpan moment "${updatedMoment.title}"`);
      closeEditMomentModal();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Gagal menyimpan moment";
      alert(errorMessage);
    } finally {
      setIsMomentSaving(false);
    }
  };

  // Computed flagship moments for highlights preview
  const flagshipCard1 = useMemo(
    () => moments.find((m) => m.highlightSlot === 1) || moments[0],
    [moments]
  );
  const flagshipCard2 = useMemo(
    () => moments.find((m) => m.highlightSlot === 2) || moments[1],
    [moments]
  );
  const flagshipCard3 = useMemo(
    () => moments.find((m) => m.highlightSlot === 3) || moments[5] || moments[2],
    [moments]
  );

  const filteredMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
      m.nickname.toLowerCase().includes(memberSearch.toLowerCase())
  );

  const filteredMoments = moments.filter(
    (m) =>
      m.title.toLowerCase().includes(momentSearch.toLowerCase()) ||
      m.location.toLowerCase().includes(momentSearch.toLowerCase()) ||
      m.category.toLowerCase().includes(momentSearch.toLowerCase())
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
              className="text-[#0c0c0c] hover:opacity-75 transition-opacity flex items-center gap-1.5"
            >
              <span className="font-mono text-[11px] tracking-[0.04em]">←</span>
              <span
                style={{ fontFamily: "var(--font-wordmark)" }}
                className="text-[22px] lowercase leading-normal inline-block"
              >
                kobrat
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
            <span>
              SYSTEM ACTIVE // {members.length} MEMBERS // {moments.length} MOMENTS
            </span>
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
      <main className="flex-1 w-full max-w-[1300px] mx-auto px-6 md:px-10 py-8">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-4 border-b border-[#e5e7eb]">
          <div className="inline-flex p-1 rounded-lg bg-[#f0f0f2] border border-[#e4e4e7]">
            <button
              type="button"
              onClick={() => setActiveTab("members")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md font-mono text-[11px] uppercase tracking-[0.06em] transition-all cursor-pointer ${
                activeTab === "members"
                  ? "bg-white text-[#0c0c0c] shadow-sm font-semibold"
                  : "text-[#767676] hover:text-[#0c0c0c]"
              }`}
            >
              <span>ROSTER MEMBERS</span>
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                  activeTab === "members"
                    ? "bg-[#0c0c0c] text-white"
                    : "bg-[#e4e4e7] text-[#71717a]"
                }`}
              >
                {members.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("moments")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md font-mono text-[11px] uppercase tracking-[0.06em] transition-all cursor-pointer ${
                activeTab === "moments"
                  ? "bg-white text-[#0c0c0c] shadow-sm font-semibold"
                  : "text-[#767676] hover:text-[#0c0c0c]"
              }`}
            >
              <span>GALLERY & HIGHLIGHTS</span>
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                  activeTab === "moments"
                    ? "bg-[#0c0c0c] text-white"
                    : "bg-[#e4e4e7] text-[#71717a]"
                }`}
              >
                {moments.length}
              </span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-[280px]">
            <input
              type="text"
              placeholder={
                activeTab === "members" ? "FILTER MEMBER..." : "FILTER MOMENTS..."
              }
              value={activeTab === "members" ? memberSearch : momentSearch}
              onChange={(e) =>
                activeTab === "members"
                  ? setMemberSearch(e.target.value)
                  : setMomentSearch(e.target.value)
              }
              className="w-full h-[38px] px-3.5 bg-white border border-[#e4e4e7] rounded-[6px] text-[11px] font-mono tracking-[0.04em] uppercase text-[#0c0c0c] placeholder:text-[#a1a1aa] focus:outline-none focus:border-[#0c0c0c] transition-colors"
            />
            {(activeTab === "members" ? memberSearch : momentSearch) && (
              <button
                type="button"
                onClick={() =>
                  activeTab === "members" ? setMemberSearch("") : setMomentSearch("")
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-[#767676] hover:text-[#0c0c0c]"
              >
                CLEAR
              </button>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* TAB 1: MEMBERS ROSTER MANAGEMENT */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {activeTab === "members" && (
          <div>
            <div className="mb-8">
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
                Update member portraits (3:4 ratio), names, and profiles in real-time.
              </p>
            </div>

            {loadingMembers ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-[#767676] font-mono text-[11px] uppercase tracking-[0.08em]">
                <span className="animate-spin inline-block w-4 h-4 border border-[#767676] border-t-transparent rounded-full" />
                <span>LOADING MEMBERS...</span>
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="py-20 text-center font-mono text-[12px] uppercase text-[#767676] tracking-[0.04em]">
                No members found matching &quot;{memberSearch}&quot;.
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
                      </div>

                      {/* Member Meta */}
                      <div className="space-y-1">
                        <h3
                          style={{ fontFamily: "var(--font-wordmark)" }}
                          className="text-[24px] leading-[1.08] text-[#0c0c0c] lowercase"
                        >
                          {member.nickname || member.name}
                        </h3>
                        <p className="text-[12px] text-[#3f3f46] font-medium truncate">
                          {member.name}
                        </p>

                        {(member.instagram || member.github || member.website) && (
                          <div className="flex flex-wrap items-center gap-1.5 pt-1 font-mono text-[10px] text-[#767676]">
                            {member.instagram && <span>{member.instagram}</span>}
                            {member.github && (
                              <span className="px-1.5 py-0.5 rounded bg-[#f4f4f5] text-[#0c0c0c]">
                                GH
                              </span>
                            )}
                            {member.website && (
                              <span className="px-1.5 py-0.5 rounded bg-[#f4f4f5] text-[#0c0c0c]">
                                WEB
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-5 pt-3 border-t border-[#f4f4f5] flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => openEditMemberModal(member)}
                        className="flex-1 h-[32px] rounded-[5px] bg-[#0c0c0c] text-white hover:bg-[#27272a] text-[10px] font-mono uppercase tracking-[0.06em] font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>EDIT</span>
                      </button>

                      <TransitionLink
                        href={`/${getMemberSlug(member)}`}
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
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* TAB 2: GALLERY & HIGHLIGHTS MANAGEMENT */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {activeTab === "moments" && (
          <div>
            <div className="mb-10">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#f4f4f5] text-[#0c0c0c] text-[10px] font-mono uppercase tracking-[0.06em] mb-2.5">
                <ThreePixelEye size={12} />
                <span>COLLECTIVE GALLERY CURATION</span>
              </div>
              <h1
                style={{ fontFamily: "var(--font-wordmark)" }}
                className="text-[38px] md:text-[50px] leading-tight text-[#0c0c0c] lowercase tracking-tight"
              >
                gallery & highlights
              </h1>
              <p className="text-[13px] font-mono text-[#767676] mt-1 max-w-2xl">
                Kelola 3 card highlight utama di landing page scroll dan seluruh foto
                arsip dokumenter 35mm. Ganti foto langsung dari komputermu atau via URL.
              </p>
            </div>

            {loadingMoments ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-[#767676] font-mono text-[11px] uppercase tracking-[0.08em]">
                <span className="animate-spin inline-block w-4 h-4 border border-[#767676] border-t-transparent rounded-full" />
                <span>LOADING GALLERY MOMENTS...</span>
              </div>
            ) : (
              <div className="space-y-14">
                {/* ── Spotlight: 3 Flagship Highlight Cards ── */}
                <section className="bg-white border border-[#e5e7eb] rounded-2xl p-6 md:p-8 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-6 mb-6 border-b border-[#f0f0f0]">
                    <div>
                      <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-emerald-600 font-semibold flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>LANDING PAGE SCROLL STACK</span>
                      </div>
                      <h2
                        style={{ fontFamily: "var(--font-wordmark)" }}
                        className="text-[26px] lowercase text-[#0c0c0c] mt-1"
                      >
                        the 3 flagship cards
                      </h2>
                    </div>
                    <p className="font-mono text-[11px] text-[#767676] max-w-sm sm:text-right">
                      Ketiga foto ini yang langsung tampil berurutan dalam animasi
                      stacking card di halaman depan.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Card 1 */}
                    {flagshipCard1 && (
                      <div className="flex flex-col justify-between bg-[#fbfbfb] border border-[#e5e7eb] hover:border-[#0c0c0c] rounded-xl p-4 transition-all">
                        <div>
                          <div className="flex items-center justify-between mb-2.5 font-mono text-[10px] uppercase tracking-[0.06em]">
                            <span className="px-2 py-0.5 rounded bg-[#0c0c0c] text-white font-medium">
                              CARD 01 // FIRST
                            </span>
                            <span className="text-[#767676]">{flagshipCard1.year}</span>
                          </div>

                          <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden bg-[#111] mb-3 group cursor-pointer" onClick={() => openEditMomentModal(flagshipCard1)}>
                            <Image
                              src={flagshipCard1.image}
                              alt={flagshipCard1.title}
                              fill
                              sizes="(max-width: 768px) 100vw, 33vw"
                              className="object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-mono text-[11px] uppercase tracking-wider">
                              📷 GANTI FOTO
                            </div>
                          </div>

                          <h3
                            style={{ fontFamily: "var(--font-wordmark)" }}
                            className="text-[22px] lowercase leading-tight text-[#0c0c0c]"
                          >
                            {flagshipCard1.title}
                          </h3>
                          <p className="font-mono text-[10px] text-[#767676] mt-1">
                            {flagshipCard1.location}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => openEditMomentModal(flagshipCard1)}
                          className="mt-4 w-full h-[36px] rounded-lg bg-[#0c0c0c] hover:bg-[#27272a] text-white font-mono text-[10px] uppercase tracking-[0.06em] font-medium transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <span>✎ GANTI FOTO CARD 1</span>
                        </button>
                      </div>
                    )}

                    {/* Card 2 */}
                    {flagshipCard2 && (
                      <div className="flex flex-col justify-between bg-[#fbfbfb] border border-[#e5e7eb] hover:border-[#0c0c0c] rounded-xl p-4 transition-all">
                        <div>
                          <div className="flex items-center justify-between mb-2.5 font-mono text-[10px] uppercase tracking-[0.06em]">
                            <span className="px-2 py-0.5 rounded bg-[#0c0c0c] text-white font-medium">
                              CARD 02 // MIDDLE
                            </span>
                            <span className="text-[#767676]">{flagshipCard2.year}</span>
                          </div>

                          <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden bg-[#111] mb-3 group cursor-pointer" onClick={() => openEditMomentModal(flagshipCard2)}>
                            <Image
                              src={flagshipCard2.image}
                              alt={flagshipCard2.title}
                              fill
                              sizes="(max-width: 768px) 100vw, 33vw"
                              className="object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-mono text-[11px] uppercase tracking-wider">
                              📷 GANTI FOTO
                            </div>
                          </div>

                          <h3
                            style={{ fontFamily: "var(--font-wordmark)" }}
                            className="text-[22px] lowercase leading-tight text-[#0c0c0c]"
                          >
                            {flagshipCard2.title}
                          </h3>
                          <p className="font-mono text-[10px] text-[#767676] mt-1">
                            {flagshipCard2.location}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => openEditMomentModal(flagshipCard2)}
                          className="mt-4 w-full h-[36px] rounded-lg bg-[#0c0c0c] hover:bg-[#27272a] text-white font-mono text-[10px] uppercase tracking-[0.06em] font-medium transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <span>✎ GANTI FOTO CARD 2</span>
                        </button>
                      </div>
                    )}

                    {/* Card 3 */}
                    {flagshipCard3 && (
                      <div className="flex flex-col justify-between bg-[#fbfbfb] border border-[#e5e7eb] hover:border-[#0c0c0c] rounded-xl p-4 transition-all">
                        <div>
                          <div className="flex items-center justify-between mb-2.5 font-mono text-[10px] uppercase tracking-[0.06em]">
                            <span className="px-2 py-0.5 rounded bg-[#0c0c0c] text-white font-medium">
                              CARD 03 // FINAL
                            </span>
                            <span className="text-[#767676]">{flagshipCard3.year}</span>
                          </div>

                          <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden bg-[#111] mb-3 group cursor-pointer" onClick={() => openEditMomentModal(flagshipCard3)}>
                            <Image
                              src={flagshipCard3.image}
                              alt={flagshipCard3.title}
                              fill
                              sizes="(max-width: 768px) 100vw, 33vw"
                              className="object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-mono text-[11px] uppercase tracking-wider">
                              📷 GANTI FOTO
                            </div>
                          </div>

                          <h3
                            style={{ fontFamily: "var(--font-wordmark)" }}
                            className="text-[22px] lowercase leading-tight text-[#0c0c0c]"
                          >
                            {flagshipCard3.title}
                          </h3>
                          <p className="font-mono text-[10px] text-[#767676] mt-1">
                            {flagshipCard3.location}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => openEditMomentModal(flagshipCard3)}
                          className="mt-4 w-full h-[36px] rounded-lg bg-[#0c0c0c] hover:bg-[#27272a] text-white font-mono text-[10px] uppercase tracking-[0.06em] font-medium transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <span>✎ GANTI FOTO CARD 3</span>
                        </button>
                      </div>
                    )}
                  </div>
                </section>

                {/* ── Complete Archive Moments Grid (All 8 Frames) ── */}
                <section>
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-6">
                    <div>
                      <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#767676]">
                        FULL COLLECTION
                      </span>
                      <h2
                        style={{ fontFamily: "var(--font-wordmark)" }}
                        className="text-[28px] lowercase text-[#0c0c0c]"
                      >
                        all archive frames ({moments.length})
                      </h2>
                    </div>
                    <span className="font-mono text-[11px] text-[#767676]">
                      Klik salah satu untuk mengganti foto atau detail
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {filteredMoments.map((moment, idx) => {
                      const isSlot1 = moment.highlightSlot === 1;
                      const isSlot2 = moment.highlightSlot === 2;
                      const isSlot3 = moment.highlightSlot === 3;
                      const isHighlight = isSlot1 || isSlot2 || isSlot3;

                      return (
                        <div
                          key={moment.id}
                          className="group relative bg-white border border-[#e5e7eb] hover:border-[#0c0c0c] rounded-xl p-3.5 flex flex-col justify-between shadow-sm hover:shadow-md transition-all"
                        >
                          <div>
                            {/* Photo Thumbnail */}
                            <div
                              onClick={() => openEditMomentModal(moment)}
                              className="relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-[#161616] mb-3 cursor-pointer"
                            >
                              <Image
                                src={moment.image}
                                alt={moment.title}
                                fill
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                              />

                              {/* Highlight Slot Badge */}
                              <div className="absolute top-2 left-2 flex items-center gap-1">
                                {isHighlight ? (
                                  <span className="px-2 py-0.5 rounded bg-emerald-500 text-white font-mono text-[9px] uppercase tracking-wider font-semibold shadow">
                                    {isSlot1 ? "CARD 1" : isSlot2 ? "CARD 2" : "CARD 3"}
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-white/80 font-mono text-[9px] uppercase">
                                    FRAME 0{idx + 1}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Meta */}
                            <div className="space-y-1">
                              <div className="flex items-center justify-between font-mono text-[9px] text-[#767676] uppercase">
                                <span className="font-medium text-[#0c0c0c]">
                                  {moment.date || moment.year}
                                </span>
                                <span>{moment.year}</span>
                              </div>

                              <h4
                                style={{ fontFamily: "var(--font-wordmark)" }}
                                className="text-[20px] lowercase text-[#0c0c0c] leading-tight"
                              >
                                {moment.title}
                              </h4>

                              <p className="font-mono text-[10px] text-[#767676] truncate pt-0.5">
                                {moment.location}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 pt-3 border-t border-[#f4f4f5] flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openEditMomentModal(moment)}
                              className="flex-1 h-[32px] rounded-md bg-[#0c0c0c] hover:bg-[#27272a] text-white font-mono text-[10px] uppercase tracking-[0.06em] transition-colors cursor-pointer flex items-center justify-center gap-1"
                            >
                              <span>EDIT FOTO & INFO</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMomentDelete(moment.id, moment.title);
                              }}
                              title="Hapus foto ini dari galeri"
                              className="w-[32px] h-[32px] rounded-md border border-[#fecaca] bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center font-mono text-[12px] cursor-pointer transition-colors"
                            >
                              🗑
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* MODAL: EDIT MEMBER PROFILE */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {editingMember && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeEditMemberModal}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-[640px] max-h-[92vh] bg-white rounded-[10px] shadow-[0_25px_60px_rgba(0,0,0,0.22)] border border-[#e5e7eb] flex flex-col z-10 overflow-hidden"
            >
              <div className="shrink-0 px-6 sm:px-8 py-4 sm:py-5 border-b border-[#e5e7eb] flex items-start justify-between gap-4 bg-white">
                <div>
                  <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.08em] text-[#767676] mb-2.5">
                    <span>EDIT MEMBER PROFILE</span>
                  </div>
                  <h2
                    style={{ fontFamily: "var(--font-wordmark)" }}
                    className="text-[28px] sm:text-[34px] leading-[1.08] text-[#0c0c0c] lowercase"
                  >
                    {memberFormData.nickname || memberFormData.name || "edit profile"}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={closeEditMemberModal}
                  disabled={isMemberSaving}
                  className="w-8 h-8 rounded-full border border-[#e5e7eb] hover:bg-[#f4f4f5] text-[#767676] hover:text-[#0c0c0c] flex items-center justify-center font-mono text-[12px] transition-colors"
                >
                  ✕
                </button>
              </div>

              <form
                id="edit-member-form"
                onSubmit={handleMemberSave}
                className="flex-1 overflow-y-auto px-6 sm:px-8 py-5 space-y-5"
              >
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
                    <div
                      onClick={() => memberFileInputRef.current?.click()}
                      className="group relative w-full aspect-[3/4] max-w-[130px] mx-auto sm:mx-0 rounded-[6px] overflow-hidden bg-[#f4f4f5] border border-[#e5e7eb] shadow-sm cursor-pointer"
                      title="Klik untuk memilih foto"
                    >
                      {memberPreviewUrl ? (
                        <Image
                          src={memberPreviewUrl}
                          alt="Preview"
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-[10px] font-mono text-[#a1a1aa] gap-1 p-2 text-center">
                          <span>NO PHOTO</span>
                        </div>
                      )}

                      <div className="absolute inset-0 bg-black/65 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-2 text-center text-white">
                        <span className="text-[15px]">📷</span>
                        <span className="font-mono text-[9px] uppercase tracking-[0.06em] font-medium leading-tight">
                          GANTI FOTO
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3 flex flex-col justify-center">
                      <input
                        ref={memberFileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleMemberFileChange}
                        className="hidden"
                      />

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => memberFileInputRef.current?.click()}
                          className="h-[36px] px-4 rounded-[5px] bg-[#0c0c0c] hover:bg-[#27272a] text-white font-mono text-[11px] uppercase tracking-[0.06em] font-medium flex items-center gap-2 cursor-pointer shadow-sm transition-colors"
                        >
                          <span>📁 PILIH FOTO DARI KOMPUTER</span>
                        </button>

                        {memberPreviewUrl && (
                          <button
                            type="button"
                            onClick={() => {
                              setRawMemberImageToCrop(memberPreviewUrl);
                              setIsMemberCropperOpen(true);
                            }}
                            className="h-[36px] px-3.5 rounded-[5px] border border-[#d4d4d8] hover:border-[#0c0c0c] bg-white text-[#0c0c0c] font-mono text-[10px] uppercase tracking-[0.06em] flex items-center gap-1.5 cursor-pointer transition-colors"
                          >
                            <span>✂ SESUAIKAN CROP</span>
                          </button>
                        )}
                      </div>

                      <div className="font-mono text-[10px] text-[#71717a]">
                        {memberUploadedFile
                          ? `✓ ${memberUploadedFile.name} (siap disimpan)`
                          : "Format JPG, PNG, WEBP. Otomatis membuka crop 3:4."}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-[0.06em] text-[#767676] mb-1.5">
                      NAMA PANGGILAN (TAMPIL BESAR DI KARTU) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Aksa"
                      value={memberFormData.nickname}
                      onChange={(e) =>
                        setMemberFormData({ ...memberFormData, nickname: e.target.value })
                      }
                      className="w-full h-[38px] px-3 bg-white border border-[#e5e7eb] rounded-[5px] text-[13px] text-[#0c0c0c] focus:outline-none focus:border-[#0c0c0c] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-[0.06em] text-[#767676] mb-1.5">
                      NAMA PANJANG (TAMPIL KECIL DI BAWAH) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Muhammad Aksa Pratama"
                      value={memberFormData.name}
                      onChange={(e) =>
                        setMemberFormData({ ...memberFormData, name: e.target.value })
                      }
                      className="w-full h-[38px] px-3 bg-white border border-[#e5e7eb] rounded-[5px] text-[13px] text-[#0c0c0c] focus:outline-none focus:border-[#0c0c0c] transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-[0.06em] text-[#767676] mb-1.5">
                      INSTAGRAM HANDLE
                    </label>
                    <input
                      type="text"
                      value={memberFormData.instagram}
                      onChange={(e) =>
                        setMemberFormData({ ...memberFormData, instagram: e.target.value })
                      }
                      placeholder="@username"
                      className="w-full h-[38px] px-3 bg-white border border-[#e5e7eb] rounded-[5px] text-[13px] text-[#0c0c0c] focus:outline-none focus:border-[#0c0c0c] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-[0.06em] text-[#767676] mb-1.5">
                      GITHUB (OPSIONAL)
                    </label>
                    <input
                      type="text"
                      value={memberFormData.github}
                      onChange={(e) =>
                        setMemberFormData({ ...memberFormData, github: e.target.value })
                      }
                      placeholder="username / github.com/..."
                      className="w-full h-[38px] px-3 bg-white border border-[#e5e7eb] rounded-[5px] text-[13px] text-[#0c0c0c] focus:outline-none focus:border-[#0c0c0c] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-[0.06em] text-[#767676] mb-1.5">
                      WEBSITE PORTOFOLIO (OPSIONAL)
                    </label>
                    <input
                      type="text"
                      value={memberFormData.website}
                      onChange={(e) =>
                        setMemberFormData({ ...memberFormData, website: e.target.value })
                      }
                      placeholder="https://namadomain.com"
                      className="w-full h-[38px] px-3 bg-white border border-[#e5e7eb] rounded-[5px] text-[13px] text-[#0c0c0c] focus:outline-none focus:border-[#0c0c0c] transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-[0.06em] text-[#767676] mb-1.5">
                    BIO / KUTIPAN PROFIL
                  </label>
                  <textarea
                    rows={3}
                    value={memberFormData.bio}
                    onChange={(e) =>
                      setMemberFormData({ ...memberFormData, bio: e.target.value })
                    }
                    placeholder="Deskripsi singkat yang tampil di halaman profil anggota..."
                    className="w-full p-3 bg-white border border-[#e5e7eb] rounded-[5px] text-[13px] text-[#0c0c0c] focus:outline-none focus:border-[#0c0c0c] transition-colors resize-none"
                  />
                </div>
              </form>

              <div className="shrink-0 px-6 sm:px-8 py-4 bg-[#fbfbfb] border-t border-[#e5e7eb] flex items-center justify-between gap-3 z-20">
                <div className="font-mono text-[10px] text-[#767676] uppercase hidden sm:block">
                  {memberUploadedFile ? "● FOTO BARU SIAP SIMPAN" : "DATA SIAP DISIMPAN"}
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={closeEditMemberModal}
                    disabled={isMemberSaving}
                    className="h-[40px] px-5 rounded-[5px] border border-[#e5e7eb] hover:bg-white text-[#0c0c0c] text-[11px] font-mono uppercase tracking-[0.04em] transition-colors cursor-pointer"
                  >
                    BATAL
                  </button>

                  <button
                    type="submit"
                    form="edit-member-form"
                    disabled={isMemberSaving}
                    className="h-[40px] px-7 rounded-[5px] bg-[#0c0c0c] hover:bg-[#27272a] text-white text-[11px] font-mono uppercase tracking-[0.06em] font-medium transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-md"
                  >
                    {isMemberSaving && (
                      <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />
                    )}
                    <span>{isMemberSaving ? "MENYIMPAN..." : "SIMPAN PERUBAHAN"}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* MODAL: EDIT MOMENT & GANTI FOTO */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {editingMoment && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeEditMomentModal}
              className="fixed inset-0 bg-black/65 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-[720px] max-h-[92vh] bg-white rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.25)] border border-[#e5e7eb] flex flex-col z-10 overflow-hidden"
            >
              {/* Modal Header */}
              <div className="shrink-0 px-6 sm:px-8 py-4 sm:py-5 border-b border-[#e5e7eb] flex items-start justify-between gap-4 bg-white">
                <div>
                  <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.08em] text-emerald-600 font-semibold mb-1">
                    <span>● EDIT FOTO & MOMENT ARSIP</span>
                  </div>
                  <h2
                    style={{ fontFamily: "var(--font-wordmark)" }}
                    className="text-[28px] sm:text-[34px] leading-tight text-[#0c0c0c] lowercase"
                  >
                    {momentFormData.title || "edit moment"}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={closeEditMomentModal}
                  disabled={isMomentSaving}
                  className="w-8 h-8 rounded-full border border-[#e5e7eb] hover:bg-[#f4f4f5] text-[#767676] hover:text-[#0c0c0c] flex items-center justify-center font-mono text-[12px] transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Form Body */}
              <form
                id="edit-moment-form"
                onSubmit={handleMomentSave}
                className="flex-1 overflow-y-auto px-6 sm:px-8 py-5 space-y-6"
              >
                {/* Photo Upload & Preview Section */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] font-mono uppercase tracking-[0.06em] text-[#767676]">
                      FOTO ARSIP // LANDSCAPE (16:9 / 16:10)
                    </label>
                    <span className="text-[9px] font-mono text-[#a1a1aa] uppercase">
                      RESOLUSI TINGGI • LANDING PAGE
                    </span>
                  </div>

                  <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-xl p-4 sm:p-5 space-y-4">
                    {/* Big Artwork Preview Box */}
                    <div
                      onClick={() => momentFileInputRef.current?.click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const file = e.dataTransfer.files?.[0];
                        if (file && file.type.startsWith("image/")) {
                          setMomentUploadedFile(file);
                          const objectUrl = URL.createObjectURL(file);
                          setMomentPreviewUrl(objectUrl);
                          setMomentFormData((prev) => ({ ...prev, imageUrl: "" }));
                          showToast("Foto berhasil dimuat dalam rasio asli.");
                        }
                      }}
                      className="group relative w-full aspect-[16/9] max-h-[260px] rounded-lg overflow-hidden bg-[#111] border border-[#e5e7eb] shadow-sm cursor-pointer"
                      title="Klik atau drag & drop foto baru ke sini"
                    >
                      {momentPreviewUrl ? (
                        <Image
                          src={momentPreviewUrl}
                          alt="Preview"
                          fill
                          sizes="(max-width: 768px) 100vw, 650px"
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-[11px] font-mono text-[#a1a1aa] gap-1 p-4 text-center">
                          <span>BELUM ADA FOTO</span>
                        </div>
                      )}

                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 text-white">
                        <span className="text-[22px]">📷</span>
                        <span className="font-mono text-[11px] uppercase tracking-[0.06em] font-medium">
                          GANTI FOTO INI
                        </span>
                        <span className="font-mono text-[9px] text-white/70">
                          Klik untuk upload dari komputermu
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons & Input Options */}
                    <div className="flex flex-wrap items-center gap-3">
                      <input
                        ref={momentFileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleMomentFileChange}
                        className="hidden"
                      />

                      <button
                        type="button"
                        onClick={() => momentFileInputRef.current?.click()}
                        className="h-[38px] px-5 rounded-lg bg-[#0c0c0c] hover:bg-[#27272a] text-white font-mono text-[11px] uppercase tracking-[0.06em] font-medium flex items-center gap-2 cursor-pointer shadow-sm transition-colors"
                      >
                        <span>📁 UPLOAD FOTO DARI KOMPUTER</span>
                      </button>

                      {momentPreviewUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            setRawMomentImageToCrop(momentPreviewUrl);
                            setIsMomentCropperOpen(true);
                          }}
                          className="h-[38px] px-4 rounded-lg border border-[#d4d4d8] hover:border-[#0c0c0c] bg-white text-[#0c0c0c] font-mono text-[10px] uppercase tracking-[0.06em] flex items-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <span>✂ SESUAIKAN CROP (16:9 / BEBAS)</span>
                        </button>
                      )}
                    </div>

                    <div className="font-mono text-[10px] text-[#71717a] pt-1">
                      {momentUploadedFile
                        ? `✓ ${momentUploadedFile.name} (siap disimpan)`
                        : "Upload foto dari komputermu (JPG, PNG, WEBP). Gunakan crop 16:9 agar pas di layar."}
                    </div>
                  </div>
                </div>

                {/* Highlight Slot Position */}
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-[0.06em] text-[#767676] mb-1.5">
                    POSISI TAMPILAN DI LANDING PAGE *
                  </label>
                  <select
                    value={momentFormData.highlightSlot}
                    onChange={(e) =>
                      setMomentFormData({
                        ...momentFormData,
                        highlightSlot: Number(e.target.value) as 1 | 2 | 3 | 0,
                      })
                    }
                    className="w-full h-[40px] px-3 bg-white border border-[#e5e7eb] rounded-lg text-[12px] font-mono uppercase text-[#0c0c0c] focus:outline-none focus:border-[#0c0c0c] transition-colors cursor-pointer"
                  >
                    <option value={1}>⚡ CARD 01 // HIGHLIGHT UTAMA (MUNCUL PERTAMA DI SCROLL)</option>
                    <option value={2}>⚡ CARD 02 // HIGHLIGHT KEDUA (SLIDE TENGAH DI SCROLL)</option>
                    <option value={3}>⚡ CARD 03 // HIGHLIGHT KETIGA (SLIDE TERAKHIR DI SCROLL)</option>
                    <option value={0}>📁 ARSIP DOKUMENTER (HANYA MUNCUL DI MODAL FULL ARCHIVE)</option>
                  </select>
                  <p className="font-mono text-[9px] text-[#767676] mt-1">
                    Jika memilih Card 1, 2, atau 3, foto ini akan otomatis menjadi kartu
                    unggulan di scroll landing page.
                  </p>
                </div>

                {/* Title & Preview */}
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-[0.06em] text-[#767676] mb-1.5">
                    JUDUL MOMENT *
                  </label>
                  <input
                    type="text"
                    required
                    value={momentFormData.title}
                    onChange={(e) =>
                      setMomentFormData({ ...momentFormData, title: e.target.value })
                    }
                    placeholder="Contoh: The Midnight Brainstorm"
                    className="w-full h-[38px] px-3 bg-white border border-[#e5e7eb] rounded-lg text-[13px] text-[#0c0c0c] focus:outline-none focus:border-[#0c0c0c] transition-colors"
                  />
                  {momentFormData.title && (
                    <div className="mt-2 p-2.5 bg-[#f4f4f5] rounded-lg border border-[#e4e4e7] flex items-center justify-between">
                      <span className="font-mono text-[9px] uppercase text-[#767676]">
                        PREVIEW FONT GOTHIC KOBRAT:
                      </span>
                      <span
                        style={{ fontFamily: "var(--font-wordmark)" }}
                        className="text-[20px] lowercase text-[#0c0c0c]"
                      >
                        {momentFormData.title}
                      </span>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-[0.06em] text-[#767676] mb-1.5">
                    DESKRIPSI / CATATAN MOMENT
                  </label>
                  <textarea
                    rows={2}
                    value={momentFormData.description}
                    onChange={(e) =>
                      setMomentFormData({ ...momentFormData, description: e.target.value })
                    }
                    placeholder="Cerita atau kenangan singkat saat momen ini difoto..."
                    className="w-full p-3 bg-white border border-[#e5e7eb] rounded-lg text-[12px] text-[#0c0c0c] focus:outline-none focus:border-[#0c0c0c] transition-colors resize-none"
                  />
                </div>

                {/* Location & Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-[0.06em] text-[#767676] mb-1.5">
                      TEMPAT / LOKASI
                    </label>
                    <input
                      type="text"
                      value={momentFormData.location}
                      onChange={(e) =>
                        setMomentFormData({ ...momentFormData, location: e.target.value })
                      }
                      placeholder="Contoh: HQ LAB // JAKARTA SELATAN"
                      className="w-full h-[38px] px-3 bg-white border border-[#e5e7eb] rounded-lg text-[11px] font-mono uppercase text-[#0c0c0c] focus:outline-none focus:border-[#0c0c0c] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-[0.06em] text-[#767676] mb-1.5">
                      TANGGAL
                    </label>
                    <input
                      type="text"
                      value={momentFormData.date}
                      onChange={(e) =>
                        setMomentFormData({ ...momentFormData, date: e.target.value })
                      }
                      placeholder="Contoh: 14 OKTOBER 2024"
                      className="w-full h-[38px] px-3 bg-white border border-[#e5e7eb] rounded-lg text-[11px] font-mono uppercase text-[#0c0c0c] focus:outline-none focus:border-[#0c0c0c] transition-colors"
                    />
                  </div>
                </div>

                {/* Camera (Optional) */}
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-[0.06em] text-[#767676] mb-1.5">
                    KAMERA & LENSA (OPSIONAL)
                  </label>
                  <input
                    type="text"
                    value={momentFormData.camera}
                    onChange={(e) =>
                      setMomentFormData({ ...momentFormData, camera: e.target.value })
                    }
                    placeholder="Contoh: LEICA M6 // 35MM (bisa dikosongkan)"
                    className="w-full h-[38px] px-3 bg-white border border-[#e5e7eb] rounded-lg text-[11px] font-mono uppercase text-[#0c0c0c] focus:outline-none focus:border-[#0c0c0c] transition-colors"
                  />
                </div>

                {/* Tag Anggota dalam Foto (Dynamic Member Tagging) */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <label className="text-[10px] font-mono uppercase tracking-[0.06em] text-[#767676]">
                        TAG ANGGOTA DALAM FOTO
                      </label>
                      <span className="text-[9px] font-mono text-[#a1a1aa] uppercase font-semibold">
                        ({momentFormData.members.length} dari {members.length} terpilih)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const allSlugs = members.map((m) => getMemberSlug(m).toLowerCase());
                          setMomentFormData((prev) => ({ ...prev, members: allSlugs }));
                        }}
                        className="text-[10px] font-mono text-[#52525b] hover:text-[#0c0c0c] underline cursor-pointer"
                      >
                        Pilih Semua
                      </button>
                      <span className="text-[#d4d4d8]">·</span>
                      <button
                        type="button"
                        onClick={() => {
                          setMomentFormData((prev) => ({ ...prev, members: [] }));
                        }}
                        className="text-[10px] font-mono text-[#52525b] hover:text-[#0c0c0c] underline cursor-pointer"
                      >
                        Kosongkan
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 p-3.5 bg-[#f9fafb] border border-[#e5e7eb] rounded-xl">
                    {members.map((m) => {
                      const slug = getMemberSlug(m).toLowerCase();
                      const nick = (m.nickname || "").toLowerCase();
                      const isSelected =
                        momentFormData.members.includes(slug) ||
                        momentFormData.members.includes(nick);

                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            setMomentFormData((prev) => {
                              const already =
                                prev.members.includes(slug) ||
                                prev.members.includes(nick);
                              const next = already
                                ? prev.members.filter(
                                    (s) => s !== slug && s !== nick
                                  )
                                : [...prev.members, slug];
                              return { ...prev, members: next };
                            });
                          }}
                          className={`px-3 py-1.5 rounded-full font-mono text-[11px] transition-all cursor-pointer flex items-center gap-1.5 ${
                            isSelected
                              ? "bg-[#0c0c0c] text-white shadow-sm ring-1 ring-[#0c0c0c]"
                              : "bg-white border border-[#e5e7eb] text-[#71717a] hover:border-[#0c0c0c] hover:text-[#0c0c0c]"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isSelected ? "bg-emerald-400" : "bg-[#d4d4d8]"
                            }`}
                          />
                          <span>{m.nickname || m.name}</span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="font-mono text-[9px] text-[#767676] mt-1.5">
                    Pilih siapa saja kawan yang ada di foto ini. Tag nama mereka akan muncul secara dinamis di galeri.
                  </p>
                </div>
              </form>

              {/* Modal Sticky Footer */}
              <div className="shrink-0 px-6 sm:px-8 py-4 bg-[#fbfbfb] border-t border-[#e5e7eb] flex items-center justify-between gap-3 z-20">
                {/* Delete Button */}
                <button
                  type="button"
                  onClick={() =>
                    handleMomentDelete(editingMoment.id, editingMoment.title)
                  }
                  disabled={isMomentSaving}
                  className="h-[40px] px-4 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-[11px] font-mono uppercase tracking-[0.04em] transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span>🗑 HAPUS MOMENT</span>
                </button>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={closeEditMomentModal}
                    disabled={isMomentSaving}
                    className="h-[40px] px-5 rounded-lg border border-[#e5e7eb] hover:bg-white text-[#0c0c0c] text-[11px] font-mono uppercase tracking-[0.04em] transition-colors cursor-pointer"
                  >
                    BATAL
                  </button>

                  <button
                    type="submit"
                    form="edit-moment-form"
                    disabled={isMomentSaving}
                    className="h-[40px] px-7 rounded-lg bg-[#0c0c0c] hover:bg-[#27272a] text-white text-[11px] font-mono uppercase tracking-[0.06em] font-medium transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-md"
                  >
                    {isMomentSaving && (
                      <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />
                    )}
                    <span>{isMomentSaving ? "MENYIMPAN..." : "SIMPAN MOMENT"}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Member 3:4 Cropper Modal */}
      <AnimatePresence>
        {isMemberCropperOpen && rawMemberImageToCrop && (
          <ImageCropperModal
            imageSrc={rawMemberImageToCrop}
            onCropComplete={handleMemberCropComplete}
            aspectRatio={3 / 4}
            cropTitle="ADJUST & CROP PHOTO // 3:4 PORTRAIT"
            onCancel={() => {
              setIsMemberCropperOpen(false);
              setRawMemberImageToCrop(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Moment 16:9 Cropper Modal */}
      <AnimatePresence>
        {isMomentCropperOpen && rawMomentImageToCrop && (
          <ImageCropperModal
            imageSrc={rawMomentImageToCrop}
            onCropComplete={handleMomentCropComplete}
            aspectRatio={16 / 9}
            cropTitle="ADJUST & CROP MOMENT // LANDSCAPE 16:9"
            onCancel={() => {
              setIsMomentCropperOpen(false);
              setRawMomentImageToCrop(null);
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
