import { Hero } from '@/components/home/Hero';
import { Manifesto } from '@/components/home/Manifesto';
import { DropSection } from '@/components/home/DropSection';
import { CrewSection } from '@/components/home/CrewSection';
import { SpecSection } from '@/components/home/SpecSection';
import { ListSection } from '@/components/home/ListSection';

export default function Home() {
  return (
    <>
      <Hero />
      <Manifesto />
      <DropSection />
      <CrewSection />
      <SpecSection />
      <ListSection />
    </>
  );
}
