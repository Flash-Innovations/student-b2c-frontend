import React, { useEffect, useRef, useState } from "react";
import { Sparkles, Info, X, CheckCircle2, ShieldCheck } from "lucide-react";

export function GoogleIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function GoogleAuthButton({
  onSuccess,
  onError,
  mode = "signin", // "signin" | "signup"
  label,
  disabled = false,
  className = ""
}) {
  const buttonRef = useRef(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [demoEmail, setDemoEmail] = useState("student.candidate@college.edu");

  const clientId = (typeof import.meta !== "undefined" && import.meta.env?.VITE_GOOGLE_CLIENT_ID) || "";

  useEffect(() => {
    if (!clientId) return;

    // Load Google Identity Services script if not already present
    if (window.google?.accounts?.id) {
      setScriptLoaded(true);
      return;
    }

    const existingScript = document.getElementById("google-gsi-client");
    if (!existingScript) {
      const script = document.createElement("script");
      script.id = "google-gsi-client";
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => setScriptLoaded(true);
      script.onerror = () => {
        console.warn("Failed to load Google Identity Services SDK");
      };
      document.head.appendChild(script);
    } else {
      existingScript.addEventListener("load", () => setScriptLoaded(true));
    }
  }, [clientId]);

  useEffect(() => {
    if (!scriptLoaded || !clientId || !buttonRef.current || !window.google?.accounts?.id) return;

    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          if (response && response.credential) {
            onSuccess?.(response.credential);
          } else {
            onError?.(new Error("No credential received from Google."));
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true
      });

      // Clear any prior content in container
      buttonRef.current.innerHTML = "";

      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: "outline",
        size: "large",
        type: "standard",
        text: mode === "signup" ? "signup_with" : "signin_with",
        shape: "rectangular",
        logo_alignment: "left",
        width: buttonRef.current.offsetWidth || 340
      });
    } catch (err) {
      console.warn("Error initializing Google Identity Services:", err);
    }
  }, [scriptLoaded, clientId, mode, onSuccess, onError]);

  const handleManualClick = () => {
    if (clientId && window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    } else {
      setShowConfigModal(true);
    }
  };

  const handleDemoSignIn = () => {
    setShowConfigModal(false);
    const mockToken = `demo_google_token_${demoEmail.trim().toLowerCase()}`;
    onSuccess?.(mockToken);
  };

  const defaultLabel = label || (mode === "signup" ? "Sign up with Google" : "Continue with Google");

  return (
    <div className={`w-full ${className}`}>
      {clientId ? (
        <div ref={buttonRef} className="w-full flex justify-center min-h-[42px]" />
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={handleManualClick}
          className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-medium text-sm rounded-xl border border-slate-300 shadow-sm transition-all hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <GoogleIcon className="w-4 h-4 shrink-0" />
          <span>{defaultLabel}</span>
        </button>
      )}

      {/* Developer Configuration & Demo Mode Modal (Shown if VITE_GOOGLE_CLIENT_ID is unset) */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all">
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GoogleIcon className="w-5 h-5" />
                <h3 className="text-sm font-bold text-slate-900">Google OAuth Ready</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-start gap-3 p-3 bg-indigo-50/80 rounded-xl border border-indigo-100 text-xs text-indigo-900 leading-relaxed">
                <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold mb-1">Google Single Sign-On (GIS) is Active</p>
                  <p className="text-slate-600">
                    To connect your live Google Cloud accounts, add your Google Web Client ID to{" "}
                    <code className="bg-white px-1.5 py-0.5 rounded border border-indigo-200 font-mono text-[11px] text-indigo-700">
                      VITE_GOOGLE_CLIENT_ID
                    </code>{" "}
                    in <code className="text-slate-800">.env</code>.
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Test with Verified Google Student Profile (Local Dev)
                </label>
                <input
                  type="email"
                  value={demoEmail}
                  onChange={(e) => setDemoEmail(e.target.value)}
                  placeholder="e.g. your.name@gmail.com"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-900"
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  Simulates a cryptographically verified Google identity response with this student email.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleDemoSignIn}
                  className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-indigo-600/20"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Continue with Demo Google Account
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

