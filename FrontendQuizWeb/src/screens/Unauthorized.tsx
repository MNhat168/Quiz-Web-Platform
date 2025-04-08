import React from "react";
import { Link } from "react-router-dom";

const Unauthorized = () => {
  return (
    <div style={{ textAlign: "center", marginTop: "5rem" }}>
      <h1>🚫 Unauthorized</h1>
      <p>Bạn không có quyền truy cập trang này.</p>
      <Link to="/login" style={{ color: "#007bff", textDecoration: "underline" }}>
        Quay lại trang đăng nhập
      </Link>
    </div>
  );
};

export default Unauthorized;