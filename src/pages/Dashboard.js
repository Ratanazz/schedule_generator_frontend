import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Calendar, Book, Users, Plus } from "lucide-react";
import { useToast } from "../components/ui/use-toast";

const Dashboard = () => {
  const [stats, setStats] = useState({
    teachers: 0,
    subjects: 0,
    grades: 0,
    schedules: 0,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` },
      };

      const results = await Promise.allSettled([
        axios.get('http://localhost:8000/api/teachers', config),
        axios.get('http://localhost:8000/api/subjects', config),
        axios.get('http://localhost:8000/api/grades', config),
        axios.get('http://localhost:8000/api/schedules', config), // will fail
      ]);

      const [teachers, subjects, grades, schedules] = results;

      setStats({
        teachers: teachers.status === "fulfilled" ? teachers.value.data.length : 0,
        subjects: subjects.status === "fulfilled" ? subjects.value.data.length : 0,
        grades: grades.status === "fulfilled" ? grades.value.data.length : 0,
        schedules: schedules.status === "fulfilled" ? schedules.value.data.length : 0,
      });

      setLoading(false);
    } catch (error) {
      console.error("Unexpected error", error);
      toast({
        title: "Error",
        description: "Unable to load dashboard data.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  fetchStats();
}, [toast]);

  const statCards = [
    {
      title: "Teachers",
      value: stats.teachers,
      link: "/teachers",
      icon: <Users className="h-8 w-8 text-blue-500" />,
      color: "bg-blue-50",
    },
    {
      title: "Subjects",
      value: stats.subjects,
      link: "/subjects",
      icon: <Book className="h-8 w-8 text-green-500" />,
      color: "bg-green-50",
    },
    {
      title: "Grades",
      value: stats.grades,
      link: "/grades",
      icon: <Users className="h-8 w-8 text-amber-500" />,
      color: "bg-amber-50",
    },
    {
      title: "Schedules",
      value: stats.schedules,
      link: "/schedules",
      icon: <Calendar className="h-8 w-8 text-purple-500" />,
      color: "bg-purple-50",
    },
  ];

  const quickActions = [
    { title: "Add Teacher", link: "/teachers/create", color: "bg-blue-500 hover:bg-blue-600" },
    { title: "Add Subject", link: "/subjects/create", color: "bg-green-500 hover:bg-green-600" },
    { title: "Create Schedule", link: "/schedules/create", color: "bg-purple-500 hover:bg-purple-600" },
  ];

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-4 md:mb-0">School Dashboard</h1>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => window.print()}>
            Export Data
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {statCards.map((card) => (
          <Card key={card.title} className="overflow-hidden border-t-4 border-t-primary shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className={`${card.color} flex flex-row items-center gap-4 pb-2`}>
              <div className="p-2 rounded-full bg-white/80 shadow-sm">
                {card.icon}
              </div>
              <CardTitle className="text-xl font-medium">{card.title}</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {loading ? (
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse-soft"></div>
              ) : (
                <p className="text-3xl font-bold text-gray-800">{card.value}</p>
              )}
            </CardContent>
            <CardFooter className="pt-0">
              <Button variant="ghost" asChild className="text-primary hover:text-primary/80">
                <Link to={card.link}>
                  View All
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8 border">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">Quick Actions</h2>
        </div>
        <div className="flex flex-wrap gap-4">
          {quickActions.map((action) => (
            <Button key={action.title} asChild className={action.color + " transition-all duration-200 animate-scale-in"}>
              <Link to={action.link}>
                <Plus className="mr-2 h-4 w-4" />
                {action.title}
              </Link>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
