import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

export default function Logout() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleLogout = async () => {
      try {
        await signOut(auth);
        console.log("User logged out successfully");
        navigate("/");
      } catch (error) {
        console.error("Error logging out:", error);
        alert("Failed to log out. Please try again.");
        // Still navigate even if there's an error
        navigate("/");
      }
    };

    handleLogout();
  }, [navigate]);

  return (
    <div style={{ 
      display: "flex", 
      justifyContent: "center", 
      alignItems: "center", 
      height: "100vh",
      fontSize: "18px",
      color: "#666"
    }}>
      Logging out...
    </div>
  );
}