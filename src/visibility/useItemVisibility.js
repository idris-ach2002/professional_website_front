import { useContext } from "react";
import ItemVisibilityContext from "./itemVisibilityContext";

export function useItemVisibility() {
  return useContext(ItemVisibilityContext);
}
