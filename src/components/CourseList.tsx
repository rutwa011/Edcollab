import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Book, Plus, Edit2, Trash2, LogOut, ChevronDown, Star, Eye, 
  Sparkles, Search, ShoppingCart, Heart, DollarSign, TrendingUp 
} from 'lucide-react';
import { useCourseStore } from '../store/courseStore';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { useCartStore } from '../store/cartStore';
import { useWishlistStore } from '../store/wishlistStore';
import { FeedbackSection } from './FeedbackSection';
import { ThemeToggle } from './ThemeToggle';
import { Cart } from './Cart';
import { Wishlist } from '../components/Wishlist';

const courseImages = [
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1513258496099-48168024aec0?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1501504905252-473c47e087f8?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
];

const getRandomImage = () => {
  const randomIndex = Math.floor(Math.random() * courseImages.length);
  return courseImages[randomIndex];
};

export function CourseList() {
  const navigate = useNavigate();
  const { user, signOut } = useAuthStore();
  const { courses, loading, error, fetchCourses, deleteCourse } = useCourseStore();
  const { isDarkMode } = useThemeStore();
  const { addToCart } = useCartStore();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlistStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [viewingCourse, setViewingCourse] = useState<string | null>(null);
  const [courseImageMap, setCourseImageMap] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  useEffect(() => {
    if (courses.length > 0) {
      const imageMap: Record<string, string> = {};
      courses.forEach(course => {
        if (course.id) {
          imageMap[course.id] = getRandomImage();
        }
      });
      setCourseImageMap(imageMap);
    }
  }, [courses]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleViewCourse = (courseId: string) => {
    setViewingCourse(courseId);
    navigate(`/courses/${courseId}/view`);
  };

  const handleAddToCart = (course: any) => {
    addToCart({ ...course, imageUrl: courseImageMap[course.id] });
  };

  const filteredCourses = courses.filter(course => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      course.title?.toLowerCase().includes(query) || 
      course.description?.toLowerCase().includes(query)
    );
  });

  const backgroundStyle = {
    backgroundImage: isDarkMode 
      ? `linear-gradient(to bottom, rgba(15, 23, 42, 0.85), rgba(30, 41, 59, 0.85)),
        url('https://images.unsplash.com/photo-1524178232363-1fb2b075b655?ixlib=rb-1.2.1&auto=format&fit=crop&w=2000&q=80')`
      : `linear-gradient(to bottom, rgba(255, 255, 255, 0.85), rgba(249, 250, 251, 0.85)),
        url('https://images.unsplash.com/photo-1524178232363-1fb2b075b655?ixlib=rb-1.2.1&auto=format&fit=crop&w=2000&q=80')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed',
    backgroundRepeat: 'no-repeat',
    position: 'relative' as const,
  };

  const overlayStyle = {
    content: '""',
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: isDarkMode
      ? 'radial-gradient(circle at 20% 20%, rgba(99, 102, 241, 0.15) 0%, rgba(99, 102, 241, 0) 50%), radial-gradient(circle at 80% 80%, rgba(168, 85, 247, 0.15) 0%, rgba(168, 85, 247, 0) 50%)'
      : 'radial-gradient(circle at 20% 20%, rgba(99, 102, 241, 0.08) 0%, rgba(99, 102, 241, 0) 50%), radial-gradient(circle at 80% 80%, rgba(168, 85, 247, 0.08) 0%, rgba(168, 85, 247, 0) 50%)',
    pointerEvents: 'none' as const,
  };

  if (loading) {
    return (
      <div style={backgroundStyle} className="min-h-screen flex items-center justify-center">
        <div style={overlayStyle} />
        <div className="flex flex-col items-center space-y-4 z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-t-transparent border-indigo-500"></div>
          <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Loading courses...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={backgroundStyle} className="min-h-screen flex items-center justify-center">
        <div style={overlayStyle} />
        <div className={`max-w-md w-full mx-auto p-6 rounded-xl ${
          isDarkMode ? 'bg-[#1E293B]/70' : 'bg-white/70'
        } shadow-xl backdrop-blur-sm z-10`}>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
              <X className="h-8 w-8 text-red-600" />
            </div>
            <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'} mb-2`}>
              Error Loading Courses
            </h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => fetchCourses()}
              className="inline-flex items-center px-4 py-2 rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={backgroundStyle} className="min-h-screen">
      <div style={overlayStyle} />
      
      {/* Navigation Bar */}
      <nav className={`fixed top-0 left-0 right-0 z-[60] ${
        isDarkMode ? 'bg-[#1E293B]/70' : 'bg-white/70'
      } backdrop-blur-md shadow-lg`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Sparkles className={`h-6 w-6 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
              <h1 className={`ml-2 text-xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                EduCollab
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              {user?.role === 'student' && (
                <>
                  <Wishlist />
                  <Cart />
                </>
              )}
              {user?.role === 'educator' && (
                <button
                  onClick={() => navigate('/statistics')}
                  className={`inline-flex items-center px-6 py-3 rounded-full text-white transition-all transform hover:scale-105 ${
                    isDarkMode 
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600' 
                      : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'
                  } shadow-lg`}
                >
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Statistics
                </button>
              )}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className={`flex items-center space-x-3 px-4 py-2 rounded-full transition-all ${
                    isDarkMode 
                      ? 'bg-[#0F172A]/40 hover:bg-[#0F172A]/60' 
                      : 'bg-gray-100/80 hover:bg-gray-200/80'
                  }`}
                >
                  <div className="flex flex-col items-end">
                    <span className={`font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                      {user?.full_name}
                    </span>
                    <span className={`text-xs capitalize ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {user?.role}
                    </span>
                  </div>
                  <ChevronDown className={`h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                </button>

                {showUserMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-[65]"
                      onClick={() => setShowUserMenu(false)}
                    />
                    <div 
                      className={`absolute right-0 mt-2 w-48 rounded-xl shadow-lg z-[70] ${
                        isDarkMode ? 'bg-[#1E293B]/90' : 'bg-white/90'
                      } backdrop-blur-sm ring-1 ring-black ring-opacity-5 transform transition-all duration-200 ease-out`}
                    >
                      <button
                        onClick={handleSignOut}
                        className={`flex items-center w-full px-4 py-3 text-sm rounded-xl ${
                          isDarkMode 
                            ? 'text-gray-300 hover:bg-[#0F172A]/40' 
                            : 'text-gray-700 hover:bg-gray-100/80'
                        }`}
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-24 pb-12 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h2 className={`text-3xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                Courses
              </h2>
              <p className={`mt-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {user?.role === 'educator' 
                  ? 'Create and manage engaging courses for your students'
                  : 'Discover and enroll in our collection of courses'}
              </p>
            </div>
            <div className="flex items-center gap-4 mt-4 md:mt-0">
              <div className={`p-2 rounded-lg ${
                isDarkMode ? 'bg-[#232F45]/50' : 'bg-white/50'
              } backdrop-blur-sm shadow-lg`}>
                <ThemeToggle />
              </div>
              {user?.role === 'educator' && (
                <button
                  onClick={() => navigate('/courses/new')}
                  className={`inline-flex items-center px-6 py-3 rounded-full text-white transition-all transform hover:scale-105 ${
                    isDarkMode 
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600' 
                      : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'
                  } shadow-lg`}
                >
                  <Plus className="h-5 w-5 mr-2" />
                  New Course
                </button>
              )}
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-8">
            <div className={`relative rounded-xl shadow-lg ${
              isDarkMode ? 'bg-[#0F172A]/40' : 'bg-white/40'
            } backdrop-blur-sm`}>
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search courses by title or description..."
                className={`block w-full pl-11 pr-4 py-3 border-0 ${
                  isDarkMode 
                    ? 'bg-transparent text-gray-100 placeholder-gray-500' 
                    : 'bg-transparent text-gray-900 placeholder-gray-400'
                } rounded-xl focus:ring-2 focus:ring-indigo-500`}
              />
            </div>
          </div>

          {/* Course Grid */}
          {filteredCourses.length === 0 ? (
            <div className={`text-center py-16 rounded-2xl ${
              isDarkMode ? 'bg-[#1E293B]/40' : 'bg-white/40'
            } shadow-xl backdrop-blur-md`}>
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${
                isDarkMode ? 'bg-[#0F172A]/40' : 'bg-gray-100/80'
              } mb-4`}>
                <Book className={`h-8 w-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              </div>
              <h3 className={`text-lg font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                {searchQuery ? 'No matching courses found' : 'No courses yet'}
              </h3>
              <p className={`mt-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {searchQuery 
                  ? 'Try adjusting your search terms or browse all courses'
                  : user?.role === 'educator'
                    ? 'Get started by creating your first course'
                    : 'Check back later for new courses'}
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredCourses.map((course) => (
                <div
                  key={course.id}
                  className={`group rounded-xl overflow-hidden transform transition-all duration-300 hover:scale-[1.02] ${
                    isDarkMode ? 'bg-[#1E293B]/40' : 'bg-white/40'
                  } shadow-lg backdrop-blur-md hover:shadow-2xl`}
                >
                  {/* Course Image */}
                  <div className="relative h-48 overflow-hidden">
                    <img 
                      src={courseImageMap[course.id] || courseImages[0]} 
                      alt={course.title}
                      className="w-full h-full object-cover transform transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className={`absolute inset-0 bg-gradient-to-t ${
                      isDarkMode ? 'from-[#1E293B]' : 'from-black/50'
                    } to-transparent`}></div>
                    
                    {/* Price Badge */}
                    <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-white/90 backdrop-blur-sm shadow-lg">
                      <div className="flex items-center text-gray-900 font-semibold">
                        <DollarSign className="h-4 w-4 mr-1" />
                        <span>29.99</span>
                      </div>
                    </div>
                  </div>

                  {/* Course Content */}
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className={`text-xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                        {course.title}
                      </h3>
                      {course.published && (
                        <span className="px-3 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full">
                          Published
                        </span>
                      )}
                    </div>
                    <p className={`text-sm mb-6 line-clamp-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {course.description}
                    </p>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3">
                      {user?.role === 'educator' ? (
                        <>
                          <button
                            onClick={() => navigate(`/courses/${course.id}/edit`)}
                            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium ${
                              isDarkMode 
                                ? 'bg-[#0F172A]/40 text-gray-100 hover:bg-[#0F172A]/60' 
                                : 'bg-gray-100/80 text-gray-900 hover:bg-gray-200/80'
                            } backdrop-blur-sm`}
                          >
                            <Edit2 className="h-4 w-4 mr-2" />
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this course?')) {
                                deleteCourse(course.id);
                              }
                            }}
                            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium text-red-600 hover:text-red-700 ${
                              isDarkMode ? 'hover:bg-[#0F172A]/40' : 'hover:bg-red-50/80'
                            } backdrop-blur-sm`}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleViewCourse(course.id)}
                            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium ${
                              isDarkMode 
                                ? 'bg-[#0F172A]/40 text-gray-100 hover:bg-[#0F172A]/60' 
                                : 'bg-gray-100/80 text-gray-900 hover:bg-gray-200/80'
                            } backdrop-blur-sm`}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Course
                          </button>
                          <button
                            onClick={() => handleAddToCart(course)}
                            className="flex items-center px-4 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 backdrop-blur-sm"
                          >
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Add to Cart
                          </button>
                          <button
                            onClick={() => {
                              const inWishlist = isInWishlist(course.id);
                              if (inWishlist) {
                                removeFromWishlist(course.id);
                              } else {
                                addToWishlist({ ...course, imageUrl: courseImageMap[course.id] });
                              }
                            }}
                            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium ${
                              isInWishlist(course.id)
                                ? 'text-red-500 hover:text-red-600'
                                : isDarkMode 
                                  ? 'bg-[#0F172A]/40 text-gray-100 hover:bg-[#0F172A]/60' 
                                  : 'bg-gray-100/80 text-gray-900 hover:bg-gray-200/80'
                            } backdrop-blur-sm`}
                          >
                            <Heart 
                              className={`h-4 w-4 mr-2 ${isInWishlist(course.id) ? 'fill-current' : ''}`} 
                            />
                            {isInWishlist(course.id) ? 'In Wishlist' : 'Add to Wishlist'}
                          </button>
                          <button
                            onClick={() => setSelectedCourse(selectedCourse === course.id ? null : course.id)}
                            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium ${
                              isDarkMode 
                                ? 'bg-[#0F172A]/40 text-gray-100 hover:bg-[#0F172A]/60' 
                                : 'bg-gray-100/80 text-gray-900 hover:bg-gray-200/80'
                            } backdrop-blur-sm`}
                          >
                            <Star className="h-4 w-4 mr-2" />
                            {selectedCourse === course.id ? 'Close' : 'Feedback'}
                          </button>
                        </>
                      )}
                    </div>

                    {/* Feedback Section */}
                    {selectedCourse === course.id && user?.role === 'student' && (
                      <div className={`mt-6 pt-6 border-t ${isDarkMode ? 'border-[#0F172A]' : 'border-gray-200'}`}>
                        <FeedbackSection course={course} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}