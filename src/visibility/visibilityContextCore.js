import { createContext } from "react";

const ItemVisibilityContext = createContext({
  ready: false,
  hidden: new Set(),
  isVisible: () => true,
  refresh: () => Promise.resolve(),
});

export default ItemVisibilityContext;
