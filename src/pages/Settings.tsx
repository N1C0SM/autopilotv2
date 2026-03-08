import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Redirect to dashboard settings section
const Settings = () => {
  const navigate = useNavigate();
  useEffect(() => {
    navigate("/dashboard", { replace: true });
  }, [navigate]);
  return null;
};

export default Settings;
