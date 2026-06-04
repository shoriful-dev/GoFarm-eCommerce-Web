import React, { Suspense } from "react";
import ClientHeader from "./ClientHeader";

const Header = () => {
  return (
    <Suspense
      fallback={
        <div className="h-20 bg-white border-b border-gray-100 animate-pulse" />
      }
    >
      <ClientHeader />
    </Suspense>
  );
};

export default Header;
