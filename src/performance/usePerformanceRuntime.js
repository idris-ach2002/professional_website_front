import { useContext } from "react";
import PerformanceRuntimeContext from "./performanceRuntimeContextValue";

export default function usePerformanceRuntime() {
  const context = useContext(PerformanceRuntimeContext);
  if (!context) throw new Error("usePerformanceRuntime must be used inside PerformanceRuntimeProvider");
  return context;
}
