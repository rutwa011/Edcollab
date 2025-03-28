import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, BookOpen, AlertCircle, CheckCircle } from 'lucide-react';
import { useCourseStore } from '../store/courseStore';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';

export function CourseForm() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { createCourse } = useCourseStore();
  const { isDarkMode } = useThemeStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (user && user.role !== 'educator') {
      navigate('/courses');
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  const validateForm = () => {
    const trimmedTitle = String(title || '').trim();
    const trimmedDescription = String(description || '').trim();

    if (!trimmedTitle) {
      setError('Title is required');
      return false;
    }
    if (!trimmedDescription) {
      setError('Description is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    setError('');
    setShowSuccess(false);
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await createCourse(String(title).trim(), String(description).trim());
      setShowSuccess(true);
      setTimeout(() => {
        navigate('/courses');
      }, 1500);
    } catch (err) {
      console.error('Course creation error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while creating the course');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value || '');
    if (error === 'Title is required') {
      setError('');
    }
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value || '');
    if (error === 'Description is required') {
      setError('');
    }
  };

  const backgroundStyle = {
    backgroundImage: isDarkMode 
      ? `linear-gradient(to bottom, rgba(17, 24, 39, 0.8), rgba(17, 24, 39, 0.9)),
        url("https://images.unsplash.com/photo-1524178232363-1fb2b075b655?ixlib=rb-1.2.1&auto=format&fit=crop&w=2000&q=80")`
      : `linear-gradient(to bottom, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.9)),
        url("https://images.unsplash.com/photo-1524178232363-1fb2b075b655?ixlib=rb-1.2.1&auto=format&fit=crop&w=2000&q=80")`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed'
  };

  return (
    <div 
      className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}
      style={backgroundStyle}
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate('/courses')}
          className={`inline-flex items-center text-sm transition-colors ${
            isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
          } mb-6`}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to courses
        </button>

        <div className={`${
          isDarkMode 
            ? 'bg-[#1A2337] border border-gray-700' 
            : 'bg-white'
        } rounded-xl shadow-xl backdrop-blur-sm transition-all duration-300`}>
          <div className={`px-6 py-4 border-b ${
            isDarkMode ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div className="flex items-center">
              <BookOpen className={`h-6 w-6 ${
                isDarkMode ? 'text-indigo-400' : 'text-indigo-600'
              } mr-2`} />
              <h2 className={`text-xl font-bold ${
                isDarkMode ? 'text-gray-100' : 'text-gray-900'
              }`}>
                Create New Course
              </h2>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <label htmlFor="title" className={`block text-sm font-medium ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Course Title
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={handleTitleChange}
                  onBlur={() => {
                    if (!String(title).trim()) {
                      setError('Title is required');
                    }
                  }}
                  className={`block w-full rounded-lg shadow-sm sm:text-sm transition-colors duration-200 ${
                    isDarkMode
                      ? 'bg-[#232F45] border-[#2A3754] text-gray-100 placeholder-gray-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  } ${
                    error === 'Title is required'
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                      : isDarkMode
                        ? 'focus:border-indigo-500 focus:ring-indigo-500'
                        : 'focus:border-indigo-500 focus:ring-indigo-500'
                  }`}
                  placeholder="Enter course title"
                  maxLength={100}
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="description" className={`block text-sm font-medium ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Description
              </label>
              <div className="mt-1">
                <textarea
                  id="description"
                  rows={4}
                  value={description}
                  onChange={handleDescriptionChange}
                  onBlur={() => {
                    if (!String(description).trim()) {
                      setError('Description is required');
                    }
                  }}
                  className={`block w-full rounded-lg shadow-sm sm:text-sm transition-colors duration-200 resize-none ${
                    isDarkMode
                      ? 'bg-[#232F45] border-[#2A3754] text-gray-100 placeholder-gray-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  } ${
                    error === 'Description is required'
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                      : isDarkMode
                        ? 'focus:border-indigo-500 focus:ring-indigo-500'
                        : 'focus:border-indigo-500 focus:ring-indigo-500'
                  }`}
                  placeholder="Enter course description"
                  maxLength={500}
                  required
                />
              </div>
              <p className={`mt-2 text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {description.length}/500 characters
              </p>
            </div>

            {error && (
              <div className={`flex items-center text-sm text-red-600 ${
                isDarkMode ? 'bg-red-900/50' : 'bg-red-50'
              } border ${
                isDarkMode ? 'border-red-800' : 'border-red-100'
              } rounded-lg p-4 transition-all duration-200`}>
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                {error}
              </div>
            )}

            {showSuccess && (
              <div className={`flex items-center text-sm text-green-600 ${
                isDarkMode ? 'bg-green-900/50' : 'bg-green-50'
              } border ${
                isDarkMode ? 'border-green-800' : 'border-green-100'
              } rounded-lg p-4 transition-all duration-200`}>
                <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                Course created successfully! Redirecting...
              </div>
            )}

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`inline-flex items-center justify-center py-2.5 px-6 border border-transparent rounded-lg text-sm font-medium shadow-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  isDarkMode
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white focus:ring-indigo-500'
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white focus:ring-indigo-500'
                } disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating Course...
                  </>
                ) : (
                  'Create Course'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}