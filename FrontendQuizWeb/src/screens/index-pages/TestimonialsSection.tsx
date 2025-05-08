import React, { useRef, useState } from "react";

const TestimonialsSection: React.FC = () => {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.pageX - (sliderRef.current?.offsetLeft || 0));
    setScrollLeft(sliderRef.current?.scrollLeft || 0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - (sliderRef.current?.offsetLeft || 0);
    const walk = (x - startX);
    if (sliderRef.current) {
      sliderRef.current.scrollLeft = scrollLeft - walk;
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="testimonials-section !bg-[#FEFCED] !py-20 !min-h-[800px]">
      <div className="container !mx-auto !px-4 !max-w-7xl !h-full">
        <div className="testimonials-header flex justify-between items-center !mb-16">
          <div>
            <h2 className="!text-[#1e293b] !text-4xl !font-bold !mb-3">
              People love Current
            </h2>
            <p className="!text-[#94a3b8] !text-2xl">
              Check out a few of our customer stories
            </p>
          </div>
          <button className="testimonials-btn !bg-[#ff3d8b] !text-white !font-semibold !py-3 !px-10 !rounded-full hover:!bg-[#e6357d] !transition-colors">
            More
          </button>
        </div>

        <div 
          ref={sliderRef}
          className="testimonials-slider !flex !overflow-hidden !gap-8 !relative"
          style={{
            cursor: isDragging ? 'grabbing' : 'grab',
            userSelect: 'none',
            transition: isDragging ? 'none' : 'all 0.3s ease'
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Testimonial 1 */}
          <div className="testimonial-card !bg-[#f9d949] !rounded-[32px] !p-8 !flex !flex-col !min-w-[300px] !max-w-[300px] !h-[420px] !transition-transform">
            <div className="!flex !text-[#ff3d8b] !mb-8">
              <StarIcon />
              <StarIcon />
              <StarIcon />
              <StarIcon />
              <StarIcon />
            </div>
            <p className="!text-[#1e293b] !text-lg !mb-auto !flex-grow">
              "Learning has never been this fun! The lessons are engaging, and I actually look forward to practicing every day."
            </p>
            <p className="!text-[#1e293b] !font-bold">
              Mark Salt
            </p>
          </div>

          {/* Testimonial 2 */}
          <div className="testimonial-card !bg-[#f9d949] !rounded-[32px] !p-8 !flex !flex-col !min-w-[300px] !max-w-[300px] !h-[420px] !transition-transform">
            <div className="!flex !text-[#ff3d8b] !mb-8">
              <StarIcon />
              <StarIcon />
              <StarIcon />
              <StarIcon />
              <StarIcon />
            </div>
            <p className="!text-[#1e293b] !text-lg !mb-auto !flex-grow">
              "The interactive quizzes keep me focused and make understanding complex topics so much easier. Highly recommend!"
            </p>
            <p className="!text-[#1e293b] !font-bold">
              Neil Bowerman
            </p>
          </div>

          {/* Testimonial 3 */}
          <div className="testimonial-card !bg-[#f9d949] !rounded-[32px] !p-8 !flex !flex-col !min-w-[300px] !max-w-[300px] !h-[420px] !transition-transform">
            <div className="!flex !text-[#ff3d8b] !mb-8">
              <StarIcon />
              <StarIcon />
              <StarIcon />
              <StarIcon />
              <StarIcon />
            </div>
            <p className="!text-[#1e293b] !text-lg !mb-auto !flex-grow">
              "A fantastic way to learn! The vibrant design and smooth experience make every session enjoyable."
            </p>
            <p className="!text-[#1e293b] !font-bold">
              Nicholas Baum
            </p>
          </div>

          {/* Testimonial 4 */}
          <div className="testimonial-card !bg-[#f9d949] !rounded-[32px] !p-8 !flex !flex-col !min-w-[300px] !max-w-[300px] !h-[420px] !transition-transform">
            <div className="!flex !text-[#ff3d8b] !mb-8">
              <StarIcon />
              <StarIcon />
              <StarIcon />
              <StarIcon />
              <StarIcon />
            </div>
            <p className="!text-[#1e293b] !text-lg !mb-auto !flex-grow">
              "I've tried many learning platforms, but this one stands out. The personalized approach has helped me progress faster than I thought possible."
            </p>
            <p className="!text-[#1e293b] !font-bold">
              Emma Johnson
            </p>
          </div>

          {/* Testimonial 5 */}
          <div className="testimonial-card !bg-[#f9d949] !rounded-[32px] !p-8 !flex !flex-col !min-w-[300px] !max-w-[300px] !h-[420px] !transition-transform">
            <div className="!flex !text-[#ff3d8b] !mb-8">
              <StarIcon />
              <StarIcon />
              <StarIcon />
              <StarIcon />
              <StarIcon />
            </div>
            <p className="!text-[#1e293b] !text-lg !mb-auto !flex-grow">
              "The quiz platform has transformed how I study. The instant feedback and progress tracking keep me motivated and help me identify areas where I need to improve."
            </p>
            <p className="!text-[#1e293b] !font-bold">
              Sarah Chen
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Star icon component
const StarIcon = () => (
  <svg 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className="!mr-1"
  >
    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
  </svg>
);

// Add this to your global CSS file
const styles = `
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;

const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

export default TestimonialsSection; 