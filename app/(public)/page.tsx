import { Hero } from '@/components/home/Hero';
import { Manifesto } from '@/components/home/Manifesto';
import { DropSection } from '@/components/home/DropSection';
import { TimelineSection } from '@/components/home/TimelineSection';
import { IngredientsSection } from '@/components/home/IngredientsSection';
import { HowItsMade } from '@/components/home/HowItsMade';
import { CrewSection } from '@/components/home/CrewSection';
import { MerchSection } from '@/components/home/MerchSection';
import { CommentsBand } from '@/components/home/CommentsBand';
import { SpecSection } from '@/components/home/SpecSection';
import { ListSection } from '@/components/home/ListSection';

export default function Home() {
  return (
    <>
      <Hero />
      <Manifesto />
      <DropSection />
      <TimelineSection />
      <IngredientsSection />
      <HowItsMade />
      <CrewSection />
      <MerchSection />
      <CommentsBand />
      <SpecSection />
      <ListSection />
    </>
  );
}
