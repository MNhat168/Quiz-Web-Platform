import React from "react";

const GettingStartedSection: React.FC = () => {
  return (
    <div className="bg-white py-20 min-h-[800px] ">
      <div className="container mx-auto px-4 max-w-7xl h-full relative top-40">
        <div className="flex flex-col md:flex-row items-center gap-12 md:gap-16 h-full">
          {/* Left side - Video */}
          <div className="w-full md:w-1/2 h-full relative right-20">
            <div className="rounded-[20px] overflow-hidden relative aspect-square max-w-lg mx-auto h-full">
              <video 
                src="/press-the-button.mp4" 
                className="w-full h-full object-cover"
                autoPlay
                loop
                muted
                playsInline
              />
            </div>
          </div>
          
          {/* Right side - Content */}
          <div className="w-full md:w-1/2 h-full">
            <h2 className="text-[#1e293b] text-4xl md:text-5xl font-bold !mb-15">
              Getting started
            </h2>
            <h3 className="text-[#94a3b8] text-2xl md:text-3xl font-medium !mb-20 relative bottom-12">
              Master New Skills in 1-2-3
            </h3>
            
            <div className="!space-y-6 relative bottom-20">
              {/* Step 1 */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 mt-1 rounded-[10px] bg-[#fff8e1] flex-shrink-0"></div>
                <p className="text-[#1e293b] text-lg">
                  <span className="font-semibold">Pick Your Path</span> — Choose a lesson or quiz 
                  that sparks your curiosity.
                </p>
              </div>
              
              {/* Step 2 */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 mt-1 rounded-[10px] bg-[#e1f5fe] flex-shrink-0"></div>
                <p className="text-[#1e293b] text-lg">
                  <span className="font-semibold">Log In or Sign Up</span> — Track your progress and 
                  unlock personalized learning.
                </p>
              </div>
              
              {/* Step 3 */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 mt-1 rounded-[10px] bg-[#fff8e1] flex-shrink-0"></div>
                <p className="text-[#1e293b] text-lg">
                  <span className="font-semibold">Dive In</span> — Start learning, earn rewards, and 
                  make every moment count!
                </p>
              </div>
            </div>
            
            <button className="mt-10 !bg-[#ff3d8b] text-white font-semibold !py-5 !px-8 !rounded-[40px] !hover:bg-[#e6357d] transition-colors">
              Start Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GettingStartedSection; 