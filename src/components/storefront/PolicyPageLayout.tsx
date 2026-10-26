import Link from "next/link";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { getSiteSettings, getContentPage } from "@/lib/data/public";
import { getCurrentUser } from "@/lib/auth";

interface PolicyPageLayoutProps {
  slug: string;
  defaultTitle: string;
  defaultContent: React.ReactNode;
}

export async function PolicyPageLayout({
  slug,
  defaultTitle,
  defaultContent,
}: PolicyPageLayoutProps) {
  const [settings, pageContent, user] = await Promise.all([
    getSiteSettings(),
    getContentPage(slug),
    getCurrentUser(),
  ]);

  const title = pageContent?.title || defaultTitle;

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF6F0]">
      <Header
        customLogoUrl={settings.brand.logo_url}
        userEmail={user?.email}
      />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16 w-full">
        <nav className="flex items-center space-x-2 text-xs text-[#7A6A5F] mb-6 font-sans">
          <Link href="/" className="hover:text-[#2B211C]">Home</Link>
          <span>/</span>
          <span className="text-[#2B211C] font-medium">{title}</span>
        </nav>

        <div className="mb-10 pb-6 border-b border-[#E8DDD1]">
          <span className="text-[11px] font-sans font-semibold uppercase tracking-[0.25em] text-[#B06F5E]">
            Haya Information
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[#2B211C] font-normal tracking-tight mt-1">
            {title}
          </h1>
        </div>

        <div className="bg-[#FFFDF9] border border-[#E8DDD1] rounded-sm p-8 sm:p-12 shadow-xs text-xs sm:text-sm text-[#7A6A5F] leading-relaxed space-y-6">
          {pageContent?.body ? (
            <div className="whitespace-pre-line font-light text-[#2B211C]/90">
              {pageContent.body}
            </div>
          ) : (
            defaultContent
          )}
        </div>
      </main>

      <Footer
        customLogoUrl={settings.brand.logo_url}
        contact={settings.contact}
        social={settings.social}
      />
    </div>
  );
}
