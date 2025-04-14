import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from './components/LandingPage';
import { AuthForm } from './components/AuthForm';
import { CourseList } from './components/CourseList';
import { CourseForm } from './components/CourseForm';
import { CourseEditor } from './components/CourseEditor';
import { CourseViewer } from './components/CourseViewer';
import { CheckoutPage } from './components/CheckoutPage';
import { PaymentSuccess } from './components/PaymentSuccess';
import { Statistics } from './components/Statistics';
import { useAuthStore } from './store/authStore';
import { useCourseStore } from './store/courseStore';
import { useThemeStore } from './store/themeStore';

function AppLayout({ children }: { children: React.ReactNode }) {
  const { isDarkMode } = useThemeStore();

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {children}
    </div>
  );
}

function App() {
  const { initialize, loading, user } = useAuthStore();
  const { createCourse } = useCourseStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <AppLayout>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route 
            path="/auth" 
            element={user ? <Navigate to="/courses" replace /> : <AuthForm />} 
          />
          <Route 
            path="/courses" 
            element={user ? <CourseList /> : <Navigate to="/auth" replace />} 
          />
          <Route 
            path="/courses/new" 
            element={
              user?.role === 'educator' 
                ? <CourseForm onSubmit={createCourse} />
                : <Navigate to="/courses" replace />
            } 
          />
          <Route 
            path="/courses/:id/edit" 
            element={
              user?.role === 'educator' 
                ? <CourseEditor />
                : <Navigate to="/courses" replace />
            } 
          />
          <Route 
            path="/courses/:id/view" 
            element={user ? <CourseViewer /> : <Navigate to="/auth" replace />} 
          />
          <Route
            path="/checkout"
            element={user ? <CheckoutPage /> : <Navigate to="/auth" replace />}
          />
          <Route
            path="/payment-success"
            element={user ? <PaymentSuccess /> : <Navigate to="/auth" replace />}
          />
          <Route
            path="/statistics"
            element={
              user?.role === 'educator' 
                ? <Statistics />
                : <Navigate to="/courses" replace />
            }
          />
          <Route 
            path="*" 
            element={<Navigate to="/courses" replace />} 
          />
        </Routes>
      </AppLayout>
    </Router>
  );
}

export default App;










// import React, { useEffect } from 'react';
// import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// import { LandingPage } from './components/LandingPage';
// import { AuthForm } from './components/AuthForm';
// import { CourseList } from './components/CourseList';
// import { CourseForm } from './components/CourseForm';
// import { CourseEditor } from './components/CourseEditor';
// import { CourseViewer } from './components/CourseViewer';
// import { Cart } from './components/Cart';
// import { useAuthStore } from './store/authStore';
// import { useCourseStore } from './store/courseStore';
// import { useThemeStore } from './store/themeStore';

// function AppLayout({ children }: { children: React.ReactNode }) {
//   const { user } = useAuthStore();
//   const { isDarkMode } = useThemeStore();

//   return (
//     <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
//       {user?.role === 'student' && (
//         <div className="fixed top-4 right-4 z-50">
//           <Cart />
//         </div>
//       )}
//       {children}
//     </div>
//   );
// }

// function App() {
//   const { initialize, loading, user } = useAuthStore();
//   const { createCourse } = useCourseStore();

//   useEffect(() => {
//     initialize();
//   }, [initialize]);

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
//       </div>
//     );
//   }

//   return (
//     <Router>
//       <AppLayout>
//         <Routes>
//           <Route path="/" element={<LandingPage />} />
//           <Route 
//             path="/auth" 
//             element={user ? <Navigate to="/courses" replace /> : <AuthForm />} 
//           />
//           <Route 
//             path="/courses" 
//             element={user ? <CourseList /> : <Navigate to="/auth" replace />} 
//           />
//           <Route 
//             path="/courses/new" 
//             element={
//               user?.role === 'educator' 
//                 ? <CourseForm onSubmit={createCourse} />
//                 : <Navigate to="/courses" replace />
//             } 
//           />
//           <Route 
//             path="/courses/:id/edit" 
//             element={
//               user?.role === 'educator' 
//                 ? <CourseEditor />
//                 : <Navigate to="/courses" replace />
//             } 
//           />
//           <Route 
//             path="/courses/:id/view" 
//             element={user ? <CourseViewer /> : <Navigate to="/auth" replace />} 
//           />
//           <Route 
//             path="/" 
//             element={<Navigate to="/courses" replace />} 
//           />
//         </Routes>
//       </AppLayout>
//     </Router>
//   );
// }

// export default App;












// import React, { useEffect } from 'react';
// import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// import { LandingPage } from './components/LandingPage';
// import { AuthForm } from './components/AuthForm';
// import { CourseList } from './components/CourseList';
// import { CourseForm } from './components/CourseForm';
// import { CourseEditor } from './components/CourseEditor';
// import { CourseViewer } from './components/CourseViewer';
// import { useAuthStore } from './store/authStore';
// import { useCourseStore } from './store/courseStore';

// function App() {
//   const { initialize, loading, user } = useAuthStore();
//   const { createCourse } = useCourseStore();

//   useEffect(() => {
//     initialize();
//   }, [initialize]);

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
//       </div>
//     );
//   }

//   return (
//     <Router>
//       <Routes>
//         <Route path="/" element={<LandingPage />} />
//         <Route 
//           path="/auth" 
//           element={user ? <Navigate to="/courses" replace /> : <AuthForm />} 
//         />
//         <Route 
//           path="/courses" 
//           element={user ? <CourseList /> : <Navigate to="/auth" replace />} 
//         />
//         <Route 
//           path="/courses/new" 
//           element={
//             user?.role === 'educator' 
//               ? <CourseForm onSubmit={createCourse} />
//               : <Navigate to="/courses" replace />
//           } 
//         />
//         <Route 
//           path="/courses/:id/edit" 
//           element={
//             user?.role === 'educator' 
//               ? <CourseEditor />
//               : <Navigate to="/courses" replace />
//           } 
//         />
//         <Route 
//           path="/courses/:id/view" 
//           element={user ? <CourseViewer /> : <Navigate to="/auth" replace />} 
//         />
//         <Route 
//           path="/" 
//           element={<Navigate to="/courses" replace />} 
//         />
//       </Routes>
//     </Router>
//   );
// }

// export default App;













// import React, { useEffect } from 'react';
// import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// import { AuthForm } from './components/AuthForm';
// import { CourseList } from './components/CourseList';
// import { CourseForm } from './components/CourseForm';
// import { CourseEditor } from './components/CourseEditor';
// import { useAuthStore } from './store/authStore';
// import { useCourseStore } from './store/courseStore';

// function App() {
//   const { initialize, loading, user } = useAuthStore();
//   const { createCourse } = useCourseStore();

//   useEffect(() => {
//     initialize();
//   }, [initialize]);

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
//       </div>
//     );
//   }

//   return (
//     <Router>
//       <Routes>
//         <Route 
//           path="/auth" 
//           element={user ? <Navigate to="/courses" replace /> : <AuthForm />} 
//         />
//         <Route 
//           path="/courses" 
//           element={user ? <CourseList /> : <Navigate to="/auth" replace />} 
//         />
//         <Route 
//           path="/courses/new" 
//           element={
//             user?.role === 'educator' 
//               ? <CourseForm onSubmit={createCourse} />
//               : <Navigate to="/courses" replace />
//           } 
//         />
//         <Route 
//           path="/courses/:id/edit" 
//           element={user ? <CourseEditor /> : <Navigate to="/auth" replace />} 
//         />
//         <Route 
//           path="/" 
//           element={<Navigate to="/courses" replace />} 
//         />
//       </Routes>
//     </Router>
//   );
// }

// export default App;