import React from "react";

const FocusHero: React.FC = () => {
  return (
    <div className="bg-[#6497b0ff] min-h-screen flex items-center">
      <div className="container mx-auto px-4 py-16 md:py-24 flex flex-col md:flex-row items-center justify-between">
        {/* Left side - Character */}
        <div className="w-full md:w-1/2 flex justify-center md:justify-start mb-12 md:mb-0">
          <div className="relative">
            <div className="absolute inset-0 bg-[#6497b0ff] rounded-lg"></div>
            <video 
              src="/focus.mp4" 
              className="relative w-[300px] md:w-[400px] h-auto rounded-lg"
              autoPlay
              loop
              muted
              playsInline
            />
          </div>
        </div>
        
        {/* Right side - Text */}
        <div className="w-full md:w-1/2 text-center">
          <h1 className="text-white text-6xl font-bold leading-tight mb-16">
            <span className="whitespace-nowrap">Master Your Focus, Unlock</span>
            <br />
            <span className="relative left-5">Your Potential </span>
          </h1>
          
          <p className="text-white text-[18px] max-w-3xl mx-auto font-medium text-center relative left-4 top-10">
            <span className="whitespace-nowrap block">
              Discover a smart way to learn, designed to keep you fully engaged.
            </span>
            <span className="whitespace-nowrap block">
              Transform every study session into a journey of deep concentration,
            </span>
            <span className="whitespace-nowrap block">
              where knowledge sticks and distractions fade away.
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default FocusHero; 