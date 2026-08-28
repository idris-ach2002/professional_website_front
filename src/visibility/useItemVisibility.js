import { useContext } from "react";
import ItemVisibilityContext from "./visibilityContextCore";

export function useItemVisibility() {
  return useContext(ItemVisibilityContext);
}
