import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { b2cApi } from "../../services/b2cApi";

/**
 * Route guard ensuring students cannot manually navigate via URL bar
 * to features locked behind future Beta phases.
 */
export function PhaseGuardRoute({ featureKey, children }) {
  const [locked, setLocked] = useState(null);

  useEffect(() => {
    let isMounted = true;
    b2cApi.getBetaConfig()
      .then((res) => {
        if (!isMounted) return;
        if (res && res.success && res.featureFlags) {
          const flags = res.featureFlags;
          if (featureKey === "ROADMAP") setLocked(!flags.roadmap);
          else if (featureKey === "INTERVIEW") setLocked(!flags.mockInterviews);
          else if (featureKey === "GD") setLocked(!flags.groupDiscussion);
          else if (featureKey === "STORE") setLocked(!flags.storeCheckout);
          else setLocked(false);
        } else {
          // Default Phase 1 safety: locked
          setLocked(true);
        }
      })
      .catch(() => {
        if (isMounted) setLocked(true);
      });

    return () => {
      isMounted = false;
    };
  }, [featureKey]);

  if (locked === null) {
    // Waiting for config check, don't flash locked or unlocked UI
    return null;
  }

  if (locked) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default PhaseGuardRoute;
