import React from "react";
import { Check, Dot } from "lucide-react";
import { evaluatePasswordRules } from "../../utils/passwordPolicy";

export function PasswordRequirements({ password = "" }) {
  const rules = evaluatePasswordRules(password);

  const criteria = [
    { key: "length", label: "8-16 characters", met: rules.length },
    { key: "uppercase", label: "1 uppercase (A-Z)", met: rules.uppercase },
    { key: "lowercase", label: "1 lowercase (a-z)", met: rules.lowercase },
    { key: "number", label: "1 number (0-9)", met: rules.number },
    { key: "special", label: "1 special char (!@#$)", met: rules.special },
  ];

  return (
    <div className="mt-2 pt-2 border-t border-slate-100">
      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
        Password Requirements:
      </p>
      <div className="grid grid-cols-2 gap-1 sm:gap-1.5">
        {criteria.map((item) => (
          <div
            key={item.key}
            className={`flex items-center gap-1.5 text-[11px] transition-colors ${
              item.met ? "text-emerald-600 font-medium" : "text-slate-400"
            }`}
          >
            {item.met ? (
              <Check className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 ml-1 shrink-0" />
            )}
            <span className="truncate">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
