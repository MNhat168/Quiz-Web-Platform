import React, { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";

const StudentLayout: React.FC = () => {
  const [activeNav, setActiveNav] = useState("CLASS");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    if (path === "/student") {
      setActiveNav("CLASS");
    } else if (path === "/student/profile") {
      setActiveNav("PROFILE");
    }
  }, [location]);

  const handleNavClick = (navText: string) => {
    setActiveNav(navText);
    if (navText === "PROFILE") {
      navigate("/student/profile");
    } else if (navText === "CLASS") {
      navigate("/student");
    }
  };

  return (
    <>
      <nav className="!fixed !left-0 !top-0 !h-screen !w-48 !z-50">
        <div className="!p-6">
          {/* Logo */}
          <div className="!mb-12">
            <span className="!text-[#FF9933] !text-4xl !font-bold">Q</span>
            <span className="!text-[#2196F3] !text-4xl !font-bold">uiz</span>
          </div>

          {/* Navigation Items */}
          <div className="!space-y-7">
            <NavItem 
              icon={<img src="/class.svg" alt="Home" className="!w-10 !h-10 !mr-3.5 relative left-1" />} 
              text="CLASS" 
              active={activeNav === "CLASS"}
              onClick={() => handleNavClick("CLASS")}
            />
            <NavItem 
              icon={<img src="/game controller.svg" alt="Game" className="relative !w-10 !h-12 left-2 !mr-4" />} 
              text="EXPLORE"
              active={activeNav === "EXPLORE"}
              onClick={() => handleNavClick("EXPLORE")}
            />
            <NavItem 
              icon={<img src="/profile.svg" alt="Profile" className="!w-12 !h-10 !mr-2" />} 
              text="PROFILE"
              active={activeNav === "PROFILE"}
              onClick={() => handleNavClick("PROFILE")}
            />
            <NavItem 
              icon={<img src="/History.svg" alt="History" className="!w-10 !h-10 relative left-2 !mr-3.5" />} 
              text="HISTORY"
              active={activeNav === "HISTORY"}
              onClick={() => handleNavClick("HISTORY")}
            />
            <NavItem 
              icon={<img src="/rank.svg" alt="Ranking" className="!w-9 !h-10 relative left-2.5 !mr-5" />} 
              text="RANKING"
              active={activeNav === "RANKING"}
              onClick={() => handleNavClick("RANKING")}
            />
            <NavItem 
              icon={<img src="/more.svg" alt="More" className="!w-11 !h-10 !mr-3 relative left-2" />} 
              text="MORE"
              active={activeNav === "MORE"}
              onClick={() => handleNavClick("MORE")}
            />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="!ml-48">
        <Outlet />
      </main>
    </>
  );
};

interface NavItemProps {
  icon: React.ReactNode;
  text: string;
  active?: boolean;
  onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, text, active = false, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`!flex !items-center !space-x-3 ${
        active
          ? "!bg-[#E3F2FD] !text-[#2196F3] !px-2 !py-3 !rounded-lg"
          : "!text-gray-400"
      } !cursor-pointer !transition-colors !duration-200`}
    >
      <div className={`${active ? "!text-[#2196F3]" : "!text-gray-400"}`}>
        {icon}
      </div>
      <span className="!font-medium">{text}</span>
    </div>
  );
};

export default StudentLayout; 