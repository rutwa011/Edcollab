import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, BookOpen, GraduationCap, TrendingUp, RefreshCw } from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { useThemeStore } from '../store/themeStore';
import { supabase } from '../lib/supabase';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

interface Stats {
  totalEducators: number;
  totalStudents: number;
  totalCourses: number;
  publishedCourses: number;
  draftCourses: number;
  coursesByMonth: {
    [key: string]: number;
  };
}

export function Statistics() {
  const navigate = useNavigate();
  const { isDarkMode } = useThemeStore();
  const [stats, setStats] = useState<Stats>({
    totalEducators: 0,
    totalStudents: 0,
    totalCourses: 0,
    publishedCourses: 0,
    draftCourses: 0,
    coursesByMonth: {},
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch user stats
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('role');

      if (usersError) throw usersError;

      const educators = users?.filter(user => user.role === 'educator').length || 0;
      const students = users?.filter(user => user.role === 'student').length || 0;

      // Fetch course stats
      const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select('published, created_at');

      if (coursesError) throw coursesError;

      const published = courses?.filter(course => course.published).length || 0;
      const drafts = courses?.filter(course => !course.published).length || 0;

      // Calculate courses by month
      const coursesByMonth: { [key: string]: number } = {};
      courses?.forEach(course => {
        const date = new Date(course.created_at);
        const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
        coursesByMonth[monthYear] = (coursesByMonth[monthYear] || 0) + 1;
      });

      setStats({
        totalEducators: educators,
        totalStudents: students,
        totalCourses: courses?.length || 0,
        publishedCourses: published,
        draftCourses: drafts,
        coursesByMonth,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      setError('Failed to load statistics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const userDistributionData = {
    labels: ['Educators', 'Students'],
    datasets: [
      {
        data: [stats.totalEducators, stats.totalStudents],
        backgroundColor: ['#818cf8', '#34d399'],
        borderColor: ['#6366f1', '#10b981'],
        borderWidth: 1,
      },
    ],
  };

  const courseStatusData = {
    labels: ['Published', 'Draft'],
    datasets: [
      {
        data: [stats.publishedCourses, stats.draftCourses],
        backgroundColor: ['#60a5fa', '#f472b6'],
        borderColor: ['#3b82f6', '#ec4899'],
        borderWidth: 1,
      },
    ],
  };

  const monthlyCoursesData = {
    labels: Object.keys(stats.coursesByMonth).slice(-6),
    datasets: [
      {
        label: 'Courses Created',
        data: Object.values(stats.coursesByMonth).slice(-6),
        backgroundColor: isDarkMode ? '#818cf8' : '#6366f1',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: isDarkMode ? '#e5e7eb' : '#1f2937',
          padding: 20,
          font: {
            size: 12,
          },
        },
      },
    },
  };

  const barOptions = {
    ...chartOptions,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: isDarkMode ? '#e5e7eb' : '#1f2937',
          font: {
            size: 12,
          },
        },
        grid: {
          color: isDarkMode ? '#374151' : '#e5e7eb',
        },
      },
      x: {
        ticks: {
          color: isDarkMode ? '#e5e7eb' : '#1f2937',
          font: {
            size: 12,
          },
        },
        grid: {
          color: isDarkMode ? '#374151' : '#e5e7eb',
        },
      },
    },
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className={`max-w-md w-full mx-auto p-6 rounded-xl ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        } shadow-xl text-center`}>
          <p className={`text-lg font-medium mb-4 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
            {error}
          </p>
          <button
            onClick={fetchStats}
            className="inline-flex items-center px-4 py-2 rounded-lg text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`sticky top-0 z-10 ${isDarkMode ? 'bg-gray-900/80' : 'bg-white/80'} backdrop-blur-sm border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/courses')}
                className={`inline-flex items-center text-sm transition-colors ${
                  isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to courses
              </button>
              <h1 className={`ml-4 text-xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                Platform Statistics
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={fetchStats}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                }`}
                title="Refresh statistics"
              >
                <RefreshCw className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              </button>
              <TrendingUp className={`h-6 w-6 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
            <div className="flex items-center justify-between">
              <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                Total Educators
              </h3>
              <GraduationCap className={`h-6 w-6 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
            </div>
            <p className={`text-3xl font-bold mt-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
              {stats.totalEducators}
            </p>
          </div>

          <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
            <div className="flex items-center justify-between">
              <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                Total Students
              </h3>
              <Users className={`h-6 w-6 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
            </div>
            <p className={`text-3xl font-bold mt-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
              {stats.totalStudents}
            </p>
          </div>

          <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
            <div className="flex items-center justify-between">
              <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                Published Courses
              </h3>
              <BookOpen className={`h-6 w-6 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
            <p className={`text-3xl font-bold mt-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
              {stats.publishedCourses}
            </p>
          </div>

          <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
            <div className="flex items-center justify-between">
              <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                Draft Courses
              </h3>
              <BookOpen className={`h-6 w-6 ${isDarkMode ? 'text-pink-400' : 'text-pink-600'}`} />
            </div>
            <p className={`text-3xl font-bold mt-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
              {stats.draftCourses}
            </p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              User Distribution
            </h3>
            <div className="h-[300px] flex items-center justify-center">
              <Doughnut data={userDistributionData} options={chartOptions} />
            </div>
          </div>

          <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              Course Status
            </h3>
            <div className="h-[300px] flex items-center justify-center">
              <Doughnut data={courseStatusData} options={chartOptions} />
            </div>
          </div>

          <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg lg:col-span-2`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              Courses Created (Last 6 Months)
            </h3>
            <div className="h-[300px]">
              <Bar data={monthlyCoursesData} options={barOptions} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}