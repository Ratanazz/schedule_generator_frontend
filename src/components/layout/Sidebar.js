import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from "../ui/lib/utils";
import { Button } from '../ui/button';
import { Calendar, Book, Users, ChevronDown } from 'lucide-react';

const NavItem = ({ to, label, icon }) => {
  return (
    <NavLink 
      to={to} 
      className={({ isActive }) => cn(
        "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
        isActive 
          ? "bg-primary text-primary-foreground" 
          : "hover:bg-secondary text-foreground/70 hover:text-foreground"
      )}
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
};

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={cn(
      "flex flex-col h-screen sticky top-0 bg-background border-r transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      <div className="flex items-center justify-between p-4 border-b">
        {!collapsed && (
          <h1 className="font-bold text-xl">SchoolAdmin</h1>
        )}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setCollapsed(!collapsed)}
          className={cn("rounded-full", collapsed && "mx-auto")}
        >
          <ChevronDown className={cn(
            "h-4 w-4 transition-transform",
            collapsed ? "rotate-90" : "-rotate-90"
          )} />
          <span className="sr-only">Toggle Sidebar</span>
        </Button>
      </div>

      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        <NavItem 
          to="/" 
          label={collapsed ? "" : "Dashboard"} 
          icon={<Users className="h-5 w-5" />} 
        />
        <NavItem 
          to="/teachers" 
          label={collapsed ? "" : "Teachers"} 
          icon={<Users className="h-5 w-5" />} 
        />
        <NavItem 
          to="/subjects" 
          label={collapsed ? "" : "Subjects"} 
          icon={<Book className="h-5 w-5" />} 
        />
        <NavItem 
          to="/grades" 
          label={collapsed ? "" : "Grades"} 
          icon={<Book className="h-5 w-5" />} 
        />
        <NavItem 
          to="/schedules" 
          label={collapsed ? "" : "Schedules"} 
          icon={<Calendar className="h-5 w-5" />} 
        />
      </nav>
    </div>
  );
};

export default Sidebar;