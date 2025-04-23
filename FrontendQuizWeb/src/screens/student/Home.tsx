import React, { useState } from "react";

const StudentHome: React.FC = () => {
  const [roomCode, setRoomCode] = useState("");

  return (
    <div className="!relative !min-h-screen !overflow-hidden">
      {/* 3D Model Background */}
      <div className="!fixed !inset-0 !z-0">
        <iframe
          src="https://my.spline.design/creatorcafeheropage-0cabd7f72e6b730c0afb760093c82350/"
          frameBorder="0"
          width="100%"
          height="100%"
          className="!w-full !h-full"
        ></iframe>
      </div>

      

      {/* Main Content */}
      <div className="!relative top-100 right-20 !z-20 !flex !flex-col !items-center !justify-center">
        {/* Room Code Form */}
        <div className="!flex !flex-col !items-center">
          <p className="!text-[#ffffff] !text-[18px] !font-bold !mb-4">Nhập Code Room</p>
          <input
            type="text"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
            className="!w-64 !p-3 !bg-transparent !border !border-gray-700 !rounded-lg !mb-6 !text-center !text-white !focus:outline-none !focus:border-[#2196F3]"
            placeholder="Enter room code"
          />
          <button className="!w-64 !py-4 !bg-[#2196F3] !text-white !font-medium !rounded-full !hover:bg-[#1E88E5] !transition-colors">
            VÀO PHÒNG
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentHome;
