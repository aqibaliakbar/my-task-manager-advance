"use client";
import { useState, useEffect } from "react";

function DragDropProvider({ children }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  return children;
}

export default DragDropProvider;
