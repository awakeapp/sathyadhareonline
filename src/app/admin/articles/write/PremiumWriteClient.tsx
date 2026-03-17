"use client";

import ArticleWriteEditor from "@/components/admin/ArticleWriteEditor";
import { useRouter } from "next/navigation";

interface PremiumWriteClientProps {
  categories: { id: string; name: string }[];
  authorName: string;
  onSave: (data: any, isDraft?: boolean) => Promise<{ success: boolean; id?: string }>;
}

export default function PremiumWriteClient({ categories, authorName, onSave }: PremiumWriteClientProps) {
  const router = useRouter();

  const handleSave = async (data: any, isDraft: boolean = false) => {
    const result = await onSave(data, isDraft);
    if (result.success) {
      router.push('/admin/articles');
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <ArticleWriteEditor 
      categories={categories}
      initialData={{
        authorName: authorName,
      }}
      onSubmit={(data) => handleSave(data, false)}
      onSaveDraft={(data) => handleSave(data, true)}
      onBack={handleBack}
    />
  );
}
