import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { GraduationCap, User, Loader2, AlertCircle, CheckCircle2, BookOpen } from 'lucide-react';

export function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'educator' | 'student'>('student');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signIn, signUp } = useAuthStore();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Clear previous messages
    setError('');
    setSuccess('');

    // Validate email format
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    // Validate password length
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    // Validate full name for signup
    if (!isLogin && !fullName.trim()) {
      setError('Please enter your full name');
      return;
    }

    setIsSubmitting(true);

    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(email, password, fullName, role);
        setSuccess('Account created successfully! Please sign in with your credentials.');
        // Reset form after successful signup
        setEmail('');
        setPassword('');
        setFullName('');
        setRole('student');
      }
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes('Invalid email or password')) {
          setError('Invalid email or password. Please check your credentials and try again.');
        } else if (err.message.includes('already registered')) {
          setError('This email is already registered. Please sign in instead.');
          setIsLogin(true);
        } else if (err.message.includes('Email not confirmed')) {
          setError('Please check your email to confirm your account before signing in.');
        } else {
          setError(err.message);
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setError('');
    setSuccess('');
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setError('');
    setSuccess('');
  };

  const handleFullNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFullName(e.target.value);
    setError('');
    setSuccess('');
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setError('');
    setSuccess('');
    setIsSubmitting(false);
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    resetForm();
  };

  return (
    <div className="min-h-screen auth-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="auth-content">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-white/20 backdrop-blur-sm mb-4 float-animation">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-center text-3xl font-extrabold text-white">
              {isLogin ? 'Welcome back!' : 'Join our learning platform'}
            </h2>
            <p className="mt-2 text-center text-sm text-white/90">
              {isLogin 
                ? 'Sign in to continue your learning journey' 
                : 'Create an account to start learning today'}
            </p>
          </div>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="glass-card py-8 px-4 shadow-xl sm:rounded-xl sm:px-10">
            {success && (
              <div className="mb-4 flex items-center space-x-2 text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg p-4">
                <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                <p>{success}</p>
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
              {!isLogin && (
                <>
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                      Full Name
                    </label>
                    <div className="mt-1">
                      <input
                        id="fullName"
                        name="fullName"
                        type="text"
                        required
                        value={fullName}
                        onChange={handleFullNameChange}
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="Enter your full name"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Role</label>
                    <div className="mt-1 grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setRole('student')}
                        className={`flex items-center justify-center px-4 py-2.5 border ${
                          role === 'student' 
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700' 
                            : 'border-gray-300 bg-white text-gray-700'
                        } rounded-lg shadow-sm text-sm font-medium hover:bg-gray-50 transition-all duration-200`}
                      >
                        <GraduationCap className="w-4 h-4 mr-2" />
                        Student
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole('educator')}
                        className={`flex items-center justify-center px-4 py-2.5 border ${
                          role === 'educator' 
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700' 
                            : 'border-gray-300 bg-white text-gray-700'
                        } rounded-lg shadow-sm text-sm font-medium hover:bg-gray-50 transition-all duration-200`}
                      >
                        <User className="w-4 h-4 mr-2" />
                        Educator
                      </button>
                    </div>
                  </div>
                </>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={handleEmailChange}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete={isLogin ? "current-password" : "new-password"}
                    required
                    value={password}
                    onChange={handlePasswordChange}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder={isLogin ? "Enter your password" : "Create a password"}
                    minLength={6}
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center space-x-2 text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg p-4">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white auth-button disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {isLogin ? 'Signing in...' : 'Creating account...'}
                    </>
                  ) : (
                    isLogin ? 'Sign in' : 'Create account'
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6">
              <button
                onClick={toggleMode}
                className="w-full text-center text-sm text-indigo-600 hover:text-indigo-500 font-medium transition-colors duration-200"
              >
                {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}




// import React, { useState } from 'react';
// import { useAuthStore } from '../store/authStore';
// import { GraduationCap, User, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

// export function AuthForm() {
//   const [isLogin, setIsLogin] = useState(true);
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [fullName, setFullName] = useState('');
//   const [role, setRole] = useState<'educator' | 'student'>('student');
//   const [error, setError] = useState('');
//   const [success, setSuccess] = useState('');
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const { signIn, signUp } = useAuthStore();

//   const validateEmail = (email: string) => {
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     return emailRegex.test(email);
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (isSubmitting) return;

//     // Clear previous messages
//     setError('');
//     setSuccess('');

//     // Validate email format
//     if (!validateEmail(email)) {
//       setError('Please enter a valid email address');
//       return;
//     }

//     // Validate password length
//     if (password.length < 6) {
//       setError('Password must be at least 6 characters long');
//       return;
//     }

//     // Validate full name for signup
//     if (!isLogin && !fullName.trim()) {
//       setError('Please enter your full name');
//       return;
//     }

//     setIsSubmitting(true);

//     try {
//       if (isLogin) {
//         await signIn(email, password);
//       } else {
//         await signUp(email, password, fullName, role);
//         setSuccess('Account created successfully! Please sign in with your credentials.');
//         // Reset form after successful signup
//         setEmail('');
//         setPassword('');
//         setFullName('');
//         setRole('student');
//       }
//     } catch (err) {
//       if (err instanceof Error) {
//         if (err.message.includes('Invalid email or password')) {
//           setError('Invalid email or password. Please check your credentials and try again.');
//         } else if (err.message.includes('already registered')) {
//           setError('This email is already registered. Please sign in instead.');
//           setIsLogin(true);
//         } else if (err.message.includes('Email not confirmed')) {
//           setError('Please check your email to confirm your account before signing in.');
//         } else {
//           setError(err.message);
//         }
//       } else {
//         setError('An unexpected error occurred. Please try again.');
//       }
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setEmail(e.target.value);
//     setError('');
//     setSuccess('');
//   };

//   const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setPassword(e.target.value);
//     setError('');
//     setSuccess('');
//   };

//   const handleFullNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setFullName(e.target.value);
//     setError('');
//     setSuccess('');
//   };

//   const resetForm = () => {
//     setEmail('');
//     setPassword('');
//     setFullName('');
//     setError('');
//     setSuccess('');
//     setIsSubmitting(false);
//   };

//   const toggleMode = () => {
//     setIsLogin(!isLogin);
//     resetForm();
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      
//       <div className="sm:mx-auto sm:w-full sm:max-w-md">
//         <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
//           {isLogin ? 'Sign in to your account' : 'Create your account'}
//         </h2>
//       </div>

//       <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
//         <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
//           {success && (
//             <div className="mb-4 flex items-center space-x-2 text-sm text-green-600 bg-green-50 border border-green-100 rounded-md p-3">
//               <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
//               <p>{success}</p>
//             </div>
//           )}

//           <form className="space-y-6" onSubmit={handleSubmit}>
//             {!isLogin && (
//               <>
//                 <div>
//                   <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
//                     Full Name
//                   </label>
//                   <div className="mt-1">
//                     <input
//                       id="fullName"
//                       name="fullName"
//                       type="text"
//                       required
//                       value={fullName}
//                       onChange={handleFullNameChange}
//                       className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
//                       placeholder="Enter your full name"
//                     />
//                   </div>
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700">Role</label>
//                   <div className="mt-1 grid grid-cols-2 gap-3">
//                     <button
//                       type="button"
//                       onClick={() => setRole('student')}
//                       className={`flex items-center justify-center px-4 py-2 border ${
//                         role === 'student' 
//                           ? 'border-indigo-500 bg-indigo-50 text-indigo-700' 
//                           : 'border-gray-300 bg-white text-gray-700'
//                       } rounded-md shadow-sm text-sm font-medium hover:bg-gray-50`}
//                     >
//                       <GraduationCap className="w-4 h-4 mr-2" />
//                       Student
//                     </button>
//                     <button
//                       type="button"
//                       onClick={() => setRole('educator')}
//                       className={`flex items-center justify-center px-4 py-2 border ${
//                         role === 'educator' 
//                           ? 'border-indigo-500 bg-indigo-50 text-indigo-700' 
//                           : 'border-gray-300 bg-white text-gray-700'
//                       } rounded-md shadow-sm text-sm font-medium hover:bg-gray-50`}
//                     >
//                       <User className="w-4 h-4 mr-2" />
//                       Educator
//                     </button>
//                   </div>
//                 </div>
//               </>
//             )}

//             <div>
//               <label htmlFor="email" className="block text-sm font-medium text-gray-700">
//                 Email address
//               </label>
//               <div className="mt-1">
//                 <input
//                   id="email"
//                   name="email"
//                   type="email"
//                   autoComplete="email"
//                   required
//                   value={email}
//                   onChange={handleEmailChange}
//                   className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
//                   placeholder="Enter your email"
//                 />
//               </div>
//             </div>

//             <div>
//               <label htmlFor="password" className="block text-sm font-medium text-gray-700">
//                 Password
//               </label>
//               <div className="mt-1">
//                 <input
//                   id="password"
//                   name="password"
//                   type="password"
//                   autoComplete={isLogin ? "current-password" : "new-password"}
//                   required
//                   value={password}
//                   onChange={handlePasswordChange}
//                   className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
//                   placeholder={isLogin ? "Enter your password" : "Create a password"}
//                   minLength={6}
//                 />
//               </div>
//             </div>

//             {error && (
//               <div className="flex items-center space-x-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-md p-3">
//                 <AlertCircle className="h-4 w-4 flex-shrink-0" />
//                 <p>{error}</p>
//               </div>
//             )}

//             <div>
//               <button
//                 type="submit"
//                 disabled={isSubmitting}
//                 className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
//               >
//                 {isSubmitting ? (
//                   <>
//                     <Loader2 className="w-4 h-4 mr-2 animate-spin" />
//                     {isLogin ? 'Signing in...' : 'Creating account...'}
//                   </>
//                 ) : (
//                   isLogin ? 'Sign in' : 'Create account'
//                 )}
//               </button>
//             </div>
//           </form>

//           <div className="mt-6">
//             <button
//               onClick={toggleMode}
//               className="w-full text-center text-sm text-indigo-600 hover:text-indigo-500"
//             >
//               {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }