import "material-icons/iconfont/material-icons.css";
import { useState, useEffect } from "react";
import { usePathname } from "components/Navigation";
import ApplicationMenu from "./ApplicationMenu";
import Link from "components/Link";



const Sidebar = (props) => {
  const pathname = usePathname();

  useEffect(() => {

  }, [pathname]);

 

  return (
    <div
 
      className={`container-sidebar position-sticky`}
    >

      <ApplicationMenu />

      <div style={{ height: 70 }}></div>
    </div>
  );
};

export default Sidebar;
