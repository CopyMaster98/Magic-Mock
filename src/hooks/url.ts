import { useLocation } from "react-router-dom";


const usePathname = () => {
  const location = useLocation();

  return location.pathname.split('/').filter(Boolean)
}

export {
  usePathname
}