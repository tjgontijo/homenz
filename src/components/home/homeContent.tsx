import { HeroSection } from '@/components/home/HeroSection';
//import { ServiceList } from '@/components/home/ServiceList';
import { ContactInfo } from '@/components/home/ContactInfo';
import { HomeForm } from '@/components/home/homeForm';
//import { serviceItems } from '@/config/home';

export default function HomeContent() {

  return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a1427] to-[#112240] text-white flex flex-col items-center">
        <main className="w-full max-w-[600px] px-5 md:px-0 pt-16 pb-16 flex flex-col items-center text-center gap-12">
        <HeroSection />
        <HomeForm />
        {/*<ServiceList items={serviceItems} />*/}
        <ContactInfo />
      </main>
      <footer className="w-full max-w-[600px] px-5 md:px-0 pb-10 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} Homenz. Todos os direitos reservados.
      </footer>
    </div>
  );
}
