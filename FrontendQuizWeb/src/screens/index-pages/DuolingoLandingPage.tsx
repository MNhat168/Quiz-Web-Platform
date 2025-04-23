import React from "react";

const DuolingoLandingPage: React.FC = () => {
  return (
    <div className="!min-h-screen !flex !flex-col !relative">
      {/* Top Section - Colorful Landscape */}
      <div className="!relative !h-80 !bg-[#fffbeb] !overflow-visible">
        {/* Floating Icons */}
        <div className="!absolute !inset-0 !w-full !h-full" style={{ zIndex: 40 }}>
         
          <div className="!absolute !left-20 !bottom-60">
            <div className=" !flex !items-center !justify-center ">
              <img src="/Background+Shadow 2.svg" alt="Learn icon" className="!w-50 !h-35" />
            </div>
          </div>

          {/* Center icon */}
          <div className="!absolute !left-1/2 !bottom-10 !transform !-translate-x-1/2 !rotate-6">
            <div className=" !flex !items-center !justify-center ">
              <img src="/Background+Shadow.svg" alt="Study icon" className="!w-50 !h-35" />
            </div>
          </div>

          {/* Right side icons */}
          <div className="!absolute !right-10 !top-16">
            <div className=" !flex !items-center !justify-center ">
              <img src="/Background+Shadow 4.svg" alt="Practice icon" className="!w-50 !h-35" />
            </div>
          </div>
          
        </div>

        {/* Pink Wavy Paths */}
        <div className="!absolute !inset-0 !w-355 !h-auto !bottom-5  " style={{ zIndex: 30 }}>
          <img 
            src="/footer-line-pink-back.png.svg" 
            alt="Pink wave background"
            className="!absolute !-bottom-24 !left-0 !w-full !scale-110"
            style={{ zIndex: 30 }}
          />
        </div>

        {/* Green Hills */}
        <div className="!absolute !inset-0 !w-full !h-full" style={{ zIndex: 20 }}>
          <img 
            src="/SVG.svg" 
            alt="Green hills background"
            className="!absolute !bottom-0 !left-0 !w-full"
          />
        </div>
      </div>

      {/* Bottom Section with Background Image */}
      <div className="!flex-grow !relative !min-h-[800px]" style={{ zIndex: 10 }}>
        {/* Background Image */}
        <div className="!absolute !inset-0 !w-full !h-full !overflow-hidden">
          <img 
            src="/Room - Relaxing - Copy@3-1488x738 2.png" 
            alt="Background"
            className="!w-full !h-full !object-cover !object-center"
          />
        </div>

        {/* Content Overlay */}
        <div className="!relative !z-20 !container !mx-auto !px-4 !py-16 top-50">
          {/* Left Side - Text and Button */}
          <div className="!w-full md:!w-1/2">
            <div className="!max-w-md">
              <p className="!text-white !text-xl !mb-2 !font-bold !uppercase !tracking-wider relative left-20">POWER UP WITH</p>
              <h1 className="!text-5xl md:!text-6xl !font-extrabold !mb-8 !uppercase" style={{ 
                background: 'linear-gradient(90deg, #4ade80 0%, #4a8dff 50%, #a855f7 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                SUPER QUIZ
              </h1>
              <button className="!bg-white !text-[#0a0e17] !font-bold !py-3 !px-6 !rounded-full relative left-10">
                DÙNG THỬ 2 TUẦN MIỄN PHÍ
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="!absolute !bottom-0 !left-0 !w-full !py-4 !px-6 !flex !items-center !justify-between !z-20">
          <a href="#" className="!text-[#f9d949]">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
          </a>
          <div className="!flex !space-x-6">
            <a href="#" className="!text-[#f9d949] !text-sm !font-medium">Terms & conditions</a>
            <a href="#" className="!text-[#f9d949] !text-sm !font-medium">Privacy policy</a>
            <a href="#" className="!text-[#f9d949] !text-sm !font-medium">Cookie policy</a>
          </div>
        </div>

        {/* Light Gradient at Bottom */}
        <div className="!absolute !bottom-0 !left-0 !w-full !h-32 !bg-gradient-to-t !from-[#8a4a00] !to-transparent !opacity-30"></div>
      </div>
    </div>
  );
};

export default DuolingoLandingPage; 