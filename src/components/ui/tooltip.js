import React from "react";

export const Tooltip = ({ message, children }) => {
  return (
    <div className="relative group inline-block">
      {children}
      <div className="absolute bottom-full mb-2 hidden group-hover:block px-2 py-1 text-sm text-white bg-black rounded">
        {message}
      </div>
    </div>
  );
};
