"use client";

import type React from "react";
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { setTokens, setUser } from "../utils/auth";
import api from "../services/api";
import toast from "react-hot-toast";

export const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    const refresh = searchParams.get("refresh");
    const error = searchParams.get("error");

    if (error) {
      toast.error("Authentication failed");
      navigate("/login");
      return;
    }

    if (token && refresh) {
      setTokens(token, refresh);
      // Fetch user info using the token
      api
        .get("/auth/me")
        .then((res) => {
          setUser(res.data.user);
          toast.success("Successfully logged in!");
          navigate("/");
        })
        .catch(() => {
          toast.error("Failed to fetch user info");
          navigate("/login");
        });
    } else {
      toast.error("Invalid authentication response");
      navigate("/login");
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Completing authentication...</p>
      </div>
    </div>
  );
};
