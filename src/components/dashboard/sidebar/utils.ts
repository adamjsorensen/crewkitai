
import { Location } from "react-router-dom";

export const isNavItemActive = (path: string, location: Location, isParent = false) => {
  if (isParent) {
    return location.pathname.startsWith(path) && location.pathname !== path;
  }
  return location.pathname === path;
};
