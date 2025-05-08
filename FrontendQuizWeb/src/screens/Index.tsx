import React from 'react';
import { Link } from 'react-router-dom';
import CoursesSection from './index-pages/CoursesSection';
import FocusHero from './index-pages/FocusHero';
import FlexibleLearningSection from './index-pages/FlexibleLearningSection';
import GettingStartedSection from './index-pages/GettingStartedSection';
import TestimonialsSection from './index-pages/TestimonialsSection';
import DuolingoLandingPage from './index-pages/DuolingoLandingPage';

const Index: React.FC = () => {
  return (
    <>
      {/* Hero Section with Wave */}
      <div className="min-h-screen relative overflow-hidden bg-[#f5df4d]">
        {/* Navigation */}
        <header className="container mx-auto px-6 py-6 flex justify-between items-center">
          <div className="flex items-center relative right-15">
            <div className="relative h-16 w-16 bg-[#FF9933] rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-4xl">Q</span>
            </div>
            <span className="text-[#4a8dff] text-5xl font-bold -ml-1">uiz</span>
          </div>

          <div className="hidden md:flex items-center gap-16 relative left-70">
            <Link to="/explore" className="!text-black no-underline font-bold text-xl hover:!text-black">
              Explore
            </Link>
            <Link to="/about" className="!text-black no-underline font-bold text-xl hover:!text-black">
              About Us
            </Link>
            <Link to="/help" className="!text-black no-underline font-bold text-xl hover:!text-black">
              Help
            </Link>
          </div>

          <div className="flex !space-x-8 relative left-125 flex-1">
            <Link to="/login" className="inline-block bg-[#4a8dff] !text-white !no-underline !px-9 !py-3 rounded-full font-semibold text-lg hover:bg-[#3a7dff] transition-colors cursor-pointer">
              Sign in
            </Link>
            <Link to="/signup" className="inline-block bg-[#4a8dff] !text-white !no-underline !px-9 !py-3 rounded-full font-semibold text-lg hover:bg-[#3a7dff] transition-colors cursor-pointer">
              Sign up
            </Link>
          </div>
        </header>

        {/* Hero Section */}
        <main className="container mx-auto px-4 pt-16 relative z-10 min-h-[calc(100vh-96px)]">
          <div className="relative" style={{ height: 'calc(100vh - 200px)' }}>
            <div className="relative z-20">
              <h1 className="text-center flex justify-center items-center">
                <img src="/Heading 1 → SVG.svg" alt="Current" className="w-[680px] h-auto" />
              </h1>
            </div>

            <div className="flex justify-center">
              <h2 className="text-[#FF1493] font-bold text-3xl md:text-4xl mt-8 max-w-3xl">
                The fun and easy way to level <br />
                <div className="relative left-10">up your learning journey</div>
              </h2>
            </div>

            {/* Decorative Elements */}
            <div className="absolute left-10 bottom-60">
              <img src="/backpack.png" alt="Backpack" width={200} height={180} className="object-contain rotate-12" />
            </div>

            <div className="absolute right-20 bottom-40">
              <img src="/book.png" alt="Book" width={118} height={120} className="object-contain rotate-340" />
            </div>

            <div className="absolute left-1/2 -translate-x-1/2 bottom- -1">
              <img src="/character.png" alt="Cartoon character" width={238} height={260} className="object-contain" />
            </div>

            <div className="absolute left-1/4 bottom-18">
              <img src="/pencil.png" alt="Pencil" width={110} height={100} className="object-contain rotate-11" />
            </div>
          </div>
        </main>

        {/* Pink Wave */}
        <div className="absolute bottom-0 left-0 right-0 h-48 md:h-72">
          <svg viewBox="0 0 1440 320" className="absolute bottom-0 w-full h-full" preserveAspectRatio="none">
            <path
              fill="#FF1493"
              fillOpacity="1"
              d="M0,128L48,144C96,160,192,192,288,186.7C384,181,480,139,576,138.7C672,139,768,181,864,181.3C960,181,1056,139,1152,122.7C1248,107,1344,117,1392,122.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            />
          </svg>
        </div>
      </div>


      <CoursesSection />
      <FocusHero />
      <FlexibleLearningSection />
      <GettingStartedSection/>
      <TestimonialsSection/>
      <DuolingoLandingPage/>

    </>
  );
};

export default Index;