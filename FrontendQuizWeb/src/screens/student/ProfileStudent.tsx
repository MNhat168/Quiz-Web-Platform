import React from "react";
import { Search, ChevronDown, ArrowRight } from 'lucide-react';

const ProfileStudent: React.FC = () => {
  return (
    <div className="!flex-1 !p-8 !bg-white">
      {/* Header */}
      <div className="!flex !justify-end !mb-6">
        <span className="!text-gray-800 !font-medium">20 Sep 2020, Monday</span>
      </div>
      
      {/* Welcome Banner */}
      <div className="!bg-[#fff2f2] !rounded-3xl !p-8 !mb-12 !flex !justify-between !items-center">
        <div>
          <h2 className="!text-[#ff8a80] !text-3xl !font-bold !mb-4">Welcome back Anna!</h2>
          <p className="!text-gray-800 !text-lg">
            You've learned 80% of your goal this week!<br />
            Keep it up and improve your results!
          </p>
        </div>
        <div>
          <img 
            src="/OBJECT 1.png" 
            alt="Student with laptop" 
            className="!h-48"
          />
        </div>
      </div>
      
      {/* Results and Time Spent Sections */}
      <div className="!flex !gap-16">
        {/* Latest Results */}
        <div className="!w-1/2">
          <div className="!flex !justify-between !items-center !mb-8">
            <h3 className="!text-gray-800 !font-bold !text-xl">Latest results</h3>
            <div className="!text-gray-500 !flex !items-center !cursor-pointer !hover:text-[#2196F3]">
              More <ArrowRight size={20} className="!ml-2" />
            </div>
          </div>
          
          {/* Unit Progress Bars */}
          <div className="!space-y-8">
            <ProgressItem unit="5" subject="Technology" progress={25} color="pink" />
            <ProgressItem unit="12" subject="Ecology" progress={44} color="blue" />
            <ProgressItem unit="9" subject="Real estate" progress={40} color="blue" />
            <ProgressItem unit="8" subject="Education" progress={15} color="pink" />
            <ProgressItem unit="16" subject="Job market" progress={75} color="blue" />
          </div>
        </div>
        
        {/* Time Spent on Learning */}
        <div className="!w-1/2">
          <div className="!flex !justify-between !items-center !mb-8">
            <h3 className="!text-gray-800 !font-bold !text-xl">Time Spent on Learning</h3>
            <div className="!text-gray-500 !flex !items-center !cursor-pointer !hover:text-[#2196F3]">
              Last week <ChevronDown size={20} className="!ml-2" />
            </div>
          </div>
          
          {/* Weekly Chart */}
          <div className="!h-80">
            <div className="!flex !justify-between !mb-4">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                <div key={day} className="!text-gray-400 !text-sm">{day}</div>
              ))}
            </div>
            
            <div className="!relative !h-56 !flex !justify-between">
              {[65, 75, 70, 40, 80, 60, 85].map((height, index) => (
                <div key={index} className="!w-10 !bg-gray-100 !rounded-full !relative">
                  <div 
                    className="!absolute !bottom-0 !left-0 !right-0 !rounded-full"
                    style={{ 
                      height: `${height}%`,
                      background: 'linear-gradient(180deg, #ff5252 0%, #2196f3 100%)'
                    }}
                  ></div>
                </div>
              ))}
            </div>
            
            {/* Legend */}
            <div className="!flex !justify-start !mt-6 !space-x-8">
              <LegendItem color="#ff5252" label="Vocabulary" />
              <LegendItem color="#3f51b5" label="Grammar" />
              <LegendItem color="#2196f3" label="Listening" />
              <LegendItem color="#e0e0ff" label="Writing" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Progress Item Component
interface ProgressItemProps {
  unit: string;
  subject: string;
  progress: number;
  color: 'blue' | 'pink';
}

const ProgressItem: React.FC<ProgressItemProps> = ({ unit, subject, progress, color }) => {
  return (
    <div>
      <div className="!flex !items-center !mb-3">
        <span className="!font-bold !text-gray-800 !mr-2">Unit {unit} -</span>
        <span className="!text-gray-400">{subject}</span>
      </div>
      <div className="!h-2 !bg-gray-100 !rounded-full !w-full">
        <div 
          className={`!h-full !rounded-full ${
            color === 'pink' ? '!bg-[#ff5252]' : '!bg-[#2196F3]'
          }`}
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <div className="!text-right !mt-2">
        <span className={`!text-sm ${
          color === 'pink' ? '!text-[#ff5252]' : '!text-[#2196F3]'
        }`}>
          {progress}%
        </span>
      </div>
      <div className="!border-b !border-gray-100 !mt-6"></div>
    </div>
  );
};

// Legend Item Component
interface LegendItemProps {
  color: string;
  label: string;
}

const LegendItem: React.FC<LegendItemProps> = ({ color, label }) => {
  return (
    <div className="!flex !items-center">
      <div className="!w-3 !h-3 !rounded-full !mr-3" style={{ backgroundColor: color }}></div>
      <span className="!text-gray-400 !text-sm">{label}</span>
    </div>
  );
};

export default ProfileStudent; 