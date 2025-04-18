import React, { useState } from "react";
import axios from "axios";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        "http://localhost:8080/api/auth/login",
        {
          email,
          password,
        },
        {
          withCredentials: true, // để gửi cookie nếu backend dùng cookie
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
        }
      );
  
      const token = response.data.token;
      const role = response.data.role;
      const name = response.data.name;

      localStorage.setItem("token", token);
      localStorage.setItem("role", role);
      localStorage.setItem("username", name);
  
      setMessage("Đăng nhập thành công!");
      console.log("Token:", token);
      console.log("Role:", role);
      console.log("UserName:", name);
  
      // ✅ Chuyển hướng theo role
      if (role === "ADMIN") {
        window.location.href = "/admin";
      } else if (role === "TEACHER") {
        window.location.href = "/teacher";
      } else if (role === "STUDENT") {
        window.location.href = "/student";
      }
  
    } catch (error) {
      setMessage("Đăng nhập thất bại!");
      console.error("Login error:", error);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "auto", marginTop: "100px" }}>
      <h2>Đăng nhập</h2>
      <form onSubmit={handleLogin}>
        <div>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            required
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%" }}
          />
        </div>
        <div>
          <label>Mật khẩu:</label>
          <input
            type="password"
            value={password}
            required
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%" }}
          />
        </div>
        <button type="submit" style={{ marginTop: 10 }}>Đăng nhập</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}

export default Login;
