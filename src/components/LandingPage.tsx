import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Users, History, MessageSquare, Zap, Shield } from 'lucide-react';
import { Footer } from './Footer';

export function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <header className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white relative overflow-hidden">
        {/* Background pattern overlay */}
        <div className="absolute inset-0 opacity-10 bg-pattern-dark"></div>
        
        <nav className="container mx-auto px-6 py-4 flex justify-between items-center relative z-10">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-8 w-8" />
            <span className="text-xl font-bold">EduCollab</span>
          </div>
          <div className="space-x-4">
            <Link to="/auth" className="px-4 py-2 rounded-md bg-white text-indigo-600 font-medium hover:bg-opacity-90 transition duration-200">
              Sign In
            </Link>
            <Link to="/auth" className="px-4 py-2 rounded-md border border-white text-white font-medium hover:bg-white hover:bg-opacity-10 transition duration-200">
              Sign Up
            </Link>
          </div>
        </nav>

        <div className="container mx-auto px-6 py-20 md:py-28 text-center relative z-10">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
            Collaborative Course Creation
          </h1>
          <p className="text-xl mb-10 max-w-2xl mx-auto text-indigo-100">
            Transform how educators develop and manage course content
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/auth" className="px-8 py-3 rounded-lg bg-white text-indigo-600 font-bold text-lg hover:bg-opacity-90 transition duration-200 shadow-lg btn-glow">
              Get Started
            </Link>
            <a href="#features" className="px-8 py-3 rounded-lg border border-white text-white font-bold text-lg hover:bg-white hover:bg-opacity-10 transition duration-200">
              Learn More
            </a>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute bottom-0 left-0 w-full h-16 bg-white" style={{ clipPath: 'polygon(0 100%, 100% 100%, 100% 0)' }}></div>
      </header>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white relative">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-16 text-gray-800">Key Features</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-xl transition duration-300 course-card border-t-4 border-indigo-500">
              <div className="bg-indigo-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-6 mx-auto">
                <Users className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800 text-center">Real-time Collaboration</h3>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-xl transition duration-300 course-card border-t-4 border-purple-500">
              <div className="bg-purple-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-6 mx-auto">
                <History className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800 text-center">Version Control</h3>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-xl transition duration-300 course-card border-t-4 border-blue-500">
              <div className="bg-blue-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-6 mx-auto">
                <MessageSquare className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800 text-center">Inline Commenting</h3>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-xl transition duration-300 course-card border-t-4 border-green-500">
              <div className="bg-green-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-6 mx-auto">
                <Zap className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800 text-center">Structured Workflow</h3>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-xl transition duration-300 course-card border-t-4 border-red-500">
              <div className="bg-red-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-6 mx-auto">
                <Shield className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800 text-center">Role-based Access</h3>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-xl transition duration-300 course-card border-t-4 border-yellow-500">
              <div className="bg-yellow-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-6 mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800 text-center">Student Feedback</h3>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-indigo-600 text-white relative">
        <div className="absolute inset-0 opacity-10 bg-pattern-dark"></div>
        <div className="container mx-auto px-6 text-center relative z-10">
          <h2 className="text-3xl font-bold mb-8">Ready to transform your course creation?</h2>
          <Link to="/auth" className="px-8 py-4 rounded-lg bg-white text-indigo-600 font-bold text-lg hover:bg-opacity-90 transition duration-200 shadow-lg inline-block btn-glow">
            Create Your Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}