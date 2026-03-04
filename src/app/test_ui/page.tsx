import HeroBanner from '@/components/ui/HeroBanner';
import SectionHeader from '@/components/ui/SectionHeader';

export default function TestPage() {
  return (
    <div className="bg-[#181623] min-h-screen p-8">
      <h1 className="text-4xl font-black text-[#ffe500]">UI TEST PAGE</h1>
      <p className="text-white mt-4">If you see this with a dark background and a yellow header, then UI is working.</p>
      <div className="mt-8">
        <SectionHeader title="Testing Section Header" />
      </div>
    </div>
  );
}
