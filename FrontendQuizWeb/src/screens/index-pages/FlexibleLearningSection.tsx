import React from "react";

const FlexibleLearningSection: React.FC = () => {
  return (
    <div className="bg-white relative overflow-hidden min-h-screen flex items-center">
      {/* Content Container */}
      <div className="container mx-auto px-4  py-16 md:py-24 relative z-10 bottom-60 right-15">
        <div className="max-w-4xl mx-auto bg-[#FEFCED] rounded-3xl !px-14 !py-10">
          <h2 className="text-[#ff3d8b] text-5xl font-bold mb-6">
            Flexible Learning, Stress-Free
          </h2>
          <p className="text-[#272343] text-[20px] leading-relaxed relative top-5">
            We understand that life can be unpredictable, so we offer full flexibility. You  can reschedule 
            or cancel any lesson up to 24 hours in advance with a full refund. Check out our terms and 
            FAQs for more details!
          </p>
        </div>
      </div>

      {/* Pink Wave */}
      <div className="absolute bottom-0 left-0 w-full z-30">
        <img 
          src="/pink-wave.svg" 
          alt="Pink wave background" 
          className="w-370 h-auto"
        />

        {/* Yellow Icon */}
        <div className="absolute left-[4.5%] bottom-[8%]">
          <div className=" flex items-center justify-center transform rotate-12 ">
            <img 
              src="/Background+Shadow.svg" 
              alt="Yellow icon" 
              className="w-40 h-50"
            />
          </div>
        </div>

        {/* Teal Icon */}
        <div className="absolute left-[65%] bottom-[10%]">
          <div className=" flex items-center justify-center transform -rotate-30 ">
            <img 
              src="/Background+Shadow 2.svg" 
              alt="Teal icon" 
              className="w-40 h-50"
            />
          </div>
        </div>

        {/* Green Icon */}
        <div className="absolute right-[1%] bottom-[15%]">
          <div className=" flex items-center justify-center transform rotate-6 ">
            <img 
              src="/Background+Shadow 3.svg" 
              alt="Green icon" 
              className="w-40 h-50"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlexibleLearningSection; 