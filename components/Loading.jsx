"use client";

import { Loader2 } from "lucide-react";

const Loading = () => {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <div className="absolute inset-0 h-12 w-12 animate-ping rounded-full bg-primary/20" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            Loading your tasks...
          </h2>
          <p className="text-sm text-muted-foreground">
            Please wait while we prepare your workspace
          </p>
        </div>
      </div>

      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-1/2 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-1/2 right-1/2 h-96 w-96 translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
      </div>
    </div>
  );
};

export default Loading;
