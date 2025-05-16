import React from "react";

export const Card = ({ children }) => (
  <div className="bg-white shadow rounded-lg p-6">{children}</div>
);

export const CardHeader = ({ children }) => (
  <div className="mb-4 border-b pb-2">{children}</div>
);

export const CardTitle = ({ children }) => (
  <h2 className="text-xl font-semibold">{children}</h2>
);

export const CardContent = ({ children }) => (
  <div className="mb-4">{children}</div>
);

export const CardFooter = ({ children }) => (
  <div className="pt-2 border-t">{children}</div>
);
