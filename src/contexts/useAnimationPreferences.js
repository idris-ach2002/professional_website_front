import { useContext } from "react";
import AnimationPreferencesContext from "./animationPreferencesContextValue";

export default function useAnimationPreferences() {
  const context = useContext(AnimationPreferencesContext);
  if (!context) throw new Error("useAnimationPreferences must be used inside AnimationPreferencesProvider");
  return context;
}
