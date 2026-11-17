import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getMembers, findMemberBySlug } from "@/data/members";
import { getMoments } from "@/data/moments";
import MemberProfileClient from "@/components/MemberProfileClient";

interface PageProps {
  params: Promise<{ slug: string }>;
}

const RESERVED_SLUGS = [
  "admin",
  "api",
  "uploads",
  "members",
  "gallery",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
];

async function MemberContent({ params }: PageProps) {
  const { slug } = await params;

  if (RESERVED_SLUGS.includes(slug.toLowerCase())) {
    notFound();
  }

  const [allMembers, allMoments] = await Promise.all([
    getMembers(),
    getMoments(),
  ]);

  const member = findMemberBySlug(allMembers, slug);

  if (!member) {
    notFound();
  }

  return (
    <MemberProfileClient
      slug={slug}
      initialMember={member}
      initialMembers={allMembers}
      initialMoments={allMoments}
    />
  );
}

export default function MemberProfilePage({ params }: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh bg-white flex items-center justify-center text-[13px] text-[#767676]">
          Loading member profile...
        </div>
      }
    >
      <MemberContent params={params} />
    </Suspense>
  );
}
