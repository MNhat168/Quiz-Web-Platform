import React from "react";

const CoursesSection: React.FC = () => {
  return (
    <section className="bg-white min-h-screen">
      <div className="container mx-auto">
        <div className="text-center mb-20">
          <h1 className="text-6xl font-bold text-[#272343] mb-4">
            Our Courses
          </h1>
          <p className="text-3xl text-[#8a88a3] relative top-1">
            Explore our collection of interactive, courses designed
          </p>
        </div>

        <div className="max-w-7xl mx-auto px-4 relative top-25">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Cards */}
            <div className="bg-[#b8e6ff] rounded-3xl p-8 flex flex-col items-center hover:shadow-lg transition-shadow w-[320px] h-[500px] mx-auto relative">
              <div className="w-full h-48 relative overflow-visible bottom-30">
                <img 
                  src="/bird.svg" 
                  alt="Star icon" 
                  className="absolute top-2.5 right-26 -translate-x-1/2 z-10 w-[40px] h-[40px]" 
                />
                <img 
                  src="/sadness.png" 
                  alt="Blue character" 
                  className="w-[300px] h-[320px] object-contain absolute left-1/2 -translate-x-1/2" 
                />
              </div>
              <div className="w-full flex flex-col justify-start relative bottom-9">
                <div className="h-15 flex items-center justify-center">
                  <p className="text-[#272343] text-2xl text-center">
                    Level Up Your Skills
                  </p>
                </div>
                <div className="border-b border-[#272343]/10"></div>
                <div className="h-15 flex items-center justify-center">
                  <p className="text-[#272343] text-2xl text-center">
                    10 Quizzes Available
                  </p>
                </div>
                <div className="border-b border-[#272343]/10"></div>
                <div className="h-15 flex items-center justify-center">
                  <p className="text-[#272343] text-2xl text-center">
                    20 Minutes per Quiz
                  </p>
                </div>
                <div className="border-b border-[#272343]/10"></div>
                <div className="h-15 flex items-center justify-center">
                  <p className="text-[#272343] text-2xl text-center">
                    500 Learners Today
                  </p>
                </div>
             
              </div>
              <div className="mt-auto relative bottom-5">
                <button className="!bg-[#FF1F8D] !text-white !font-semibold !py-5 !px-12 !rounded-[35px] !text-xl hover:!bg-[#ff0077] !transition-colors">
                  Join now
                </button>
              </div>
            </div>

            <div className="bg-[#fff8e0] rounded-3xl p-8 flex flex-col items-center hover:shadow-lg transition-shadow w-[320px] h-[500px] mx-auto relative">
              <div className="w-full h-48 relative overflow-visible bottom-45">
                <img 
                  src="/flybook.png" 
                  alt="Orange character with book" 
                  className="w-[350px] h-[600px] object-contain relative left-44 bottom-11 -translate-x-1/2" 
                />
              </div>
              <div className="w-full flex flex-col justify-start relative bottom-9">
                <div className="h-15 flex items-center justify-center">
                  <p className="text-[#272343] text-2xl text-center">
                    Ready for a Challenge?
                  </p>
                </div>
                <div className="border-b border-[#272343]/10"></div>
                <div className="h-15 flex items-center justify-center">
                  <p className="text-[#272343] text-2xl text-center">
                    50+ Topics
                  </p>
                </div>
                <div className="border-b border-[#272343]/10"></div>
                <div className="h-15 flex items-center justify-center">
                  <p className="text-[#272343] text-2xl text-center">
                    15 Questions per Quiz
                  </p>
                </div>
                <div className="border-b border-[#272343]/10"></div>
                <div className="h-15 flex items-center justify-center">
                  <p className="text-[#272343] text-2xl text-center">
                    Join 1,000+ Players
                  </p>
                </div>
              </div>
              <div className="mt-auto relative bottom-5">
                <button className="!bg-[#272343] !text-white !font-semibold !py-5 !px-12 !rounded-[35px] !text-xl hover:!bg-[#1a1a2e] !transition-colors">
                  Join now
                </button>
              </div>
            </div>

            <div className="bg-[#d9f8f4] rounded-3xl p-8 flex flex-col items-center hover:shadow-lg transition-shadow w-[320px] h-[500px] mx-auto relative">
              <div className="w-full h-48 relative overflow-visible bottom-50">
                <img 
                  src="/nobita.png" 
                  alt="Character with glasses" 
                  className="w-[195px] h-[380px] object-contain absolute left-1/2 -translate-x-1/2" 
                />
              </div>
              <div className="w-full flex flex-col justify-start relative bottom-9">
                <div className="h-15 flex items-center justify-center">
                  <p className="text-[#272343] text-2xl text-center">
                    Boost Your Knowledge!
                  </p>
                </div>
                <div className="border-b border-[#272343]/10"></div>
                <div className="h-15 flex items-center justify-center">
                  <p className="text-[#272343] text-2xl text-center">
                    New Quizzes Daily
                  </p>
                </div>
                <div className="border-b border-[#272343]/10"></div>
                <div className="h-15 flex items-center justify-center">
                  <p className="text-[#272343] text-2xl text-center">
                    10-Minute Sessions
                  </p>
                </div>
                <div className="border-b border-[#272343]/10"></div>
                <div className="h-15 flex items-center justify-center">
                  <p className="text-[#272343] text-2xl text-center">
                    Compete with Friends
                  </p>
                </div>
              </div>
              <div className="mt-auto relative bottom-5">
                <button className="!bg-[#FF1F8D] !text-white !font-semibold !py-5 !px-12 !rounded-[35px] !text-xl hover:!bg-[#ff0077] !transition-colors">
                  Join now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CoursesSection; 