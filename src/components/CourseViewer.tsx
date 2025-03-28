import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, FileText, Download, File, Image, Video, 
  Link as LinkIcon, FileQuestion, Music, Film,
  BookOpen, Folder
} from 'lucide-react';
import { useCourseStore } from '../store/courseStore';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { supabase } from '../lib/supabase';

interface UploadedFile {
  url: string;
  name: string;
  originalName: string;
  type: string;
  size: number;
}

interface ContentLink {
  url: string;
  title: string;
  isGoogleForm: boolean;
  isVideo: boolean;
}

const ALLOWED_FILE_TYPES = {
  'courseMaterial': [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
  ],
  'audio': [
    'audio/mpeg',
    'audio/wav',
    'audio/ogg'
  ],
  'video': [
    'video/mp4',
    'video/webm',
    'video/ogg'
  ]
};

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 KB';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function extractLinksFromContent(content: string): ContentLink[] {
  if (!content) return [];

  const parser = new DOMParser();
  const doc = parser.parseFromString(content, 'text/html');
  
  const links = Array.from(doc.querySelectorAll('a'));
  
  const extractedLinks = links
    .map(link => {
      const url = link.getAttribute('href') || '';
      const title = link.textContent?.trim() || url;
      const linkType = link.getAttribute('data-link-type');
      const linkClass = link.getAttribute('class');
      
      if (!url || url.startsWith('javascript:') || url === '#') {
        return null;
      }

      try {
        new URL(url);
      } catch {
        return null;
      }

      return {
        url,
        title,
        isGoogleForm: linkType === 'google-form' || url.includes('docs.google.com/forms'),
        isVideo: isYouTubeUrl(url) || url.includes('vimeo.com')
      };
    })
    .filter((link): link is ContentLink => link !== null);

  const iframes = Array.from(doc.querySelectorAll('iframe'));
  const embeddedLinks = iframes
    .map(iframe => {
      const url = iframe.getAttribute('src') || '';
      const title = iframe.getAttribute('title')?.trim() || 'Embedded content';
      
      if (!url) return null;

      try {
        new URL(url);
      } catch {
        return null;
      }

      return {
        url,
        title,
        isGoogleForm: url.includes('docs.google.com/forms'),
        isVideo: isYouTubeUrl(url) || url.includes('vimeo.com')
      };
    })
    .filter((link): link is ContentLink => link !== null);

  const allLinks = [...extractedLinks, ...embeddedLinks];
  return Array.from(new Map(allLinks.map(link => [link.url, link])).values());
}

function extractTextContent(content: string): string {
  if (!content) return '';

  const parser = new DOMParser();
  const doc = parser.parseFromString(content, 'text/html');

  // Remove media elements
  const mediaElements = doc.querySelectorAll('img, video, audio, iframe, a');
  mediaElements.forEach(element => element.remove());

  // Get the remaining text content
  const textContent = doc.body.innerHTML;

  return textContent;
}

function isYouTubeUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return (
      urlObj.hostname.includes('youtube.com') || 
      urlObj.hostname.includes('youtu.be') ||
      urlObj.hostname.includes('youtube-nocookie.com')
    );
  } catch {
    return false;
  }
}

function extractEmbeddedContent(content: string): ContentLink[] {
  if (!content) return [];

  const parser = new DOMParser();
  const doc = parser.parseFromString(content, 'text/html');
  
  const iframes = Array.from(doc.querySelectorAll('iframe'));
  return iframes
    .map(iframe => {
      const url = iframe.getAttribute('src') || '';
      const title = iframe.getAttribute('title')?.trim() || 'Embedded content';
      
      if (!url) return null;

      try {
        new URL(url);
      } catch {
        return null;
      }

      return {
        url,
        title,
        isGoogleForm: url.includes('docs.google.com/forms'),
        isVideo: isYouTubeUrl(url) || url.includes('vimeo.com')
      };
    })
    .filter((link): link is ContentLink => link !== null);
}

export function CourseViewer() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { getCourse } = useCourseStore();
  const { isDarkMode } = useThemeStore();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [links, setLinks] = useState<ContentLink[]>([]);
  const [embeddedContent, setEmbeddedContent] = useState<ContentLink[]>([]);
  const [activeTab, setActiveTab] = useState<'description' | 'materials' | 'links' | 'quiz' | 'media'>('description');
  const [textContent, setTextContent] = useState('');

  useEffect(() => {
    const loadCourse = async () => {
      if (!id) return;
      try {
        const courseData = await getCourse(id);
        if (!courseData) {
          throw new Error('Course not found');
        }
        if (!courseData.published && user?.role !== 'educator') {
          throw new Error('This course is not published');
        }
        setCourse(courseData);
        
        const extractedLinks = extractLinksFromContent(courseData.content || '');
        const extractedEmbeds = extractEmbeddedContent(courseData.content || '');
        const extractedText = extractTextContent(courseData.content || '');
        
        setLinks(extractedLinks);
        setEmbeddedContent(extractedEmbeds);
        setTextContent(extractedText);
        
        await fetchCourseFiles(courseData.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load course');
      } finally {
        setLoading(false);
      }
    };

    loadCourse();
  }, [id, getCourse, user?.role]);

  const fetchCourseFiles = async (courseId: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('course-media')
        .list(courseId);

      if (error) throw error;

      const files = await Promise.all(
        data.map(async (file) => {
          const { data: { publicUrl } } = supabase.storage
            .from('course-media')
            .getPublicUrl(`${courseId}/${file.name}`);

          const originalName = file.name.split('-').slice(2).join('-');

          return {
            url: publicUrl,
            name: file.name,
            originalName: originalName || file.name,
            type: file.metadata?.mimetype || 'application/octet-stream',
            size: file.metadata?.size || 0
          };
        })
      );

      setUploadedFiles(files);
    } catch (err) {
      console.error('Error fetching course files:', err);
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-5 w-5" />;
    if (type.startsWith('video/')) return <Video className="h-5 w-5" />;
    if (type.startsWith('audio/')) return <Music className="h-5 w-5" />;
    if (type.startsWith('application/pdf')) return <FileText className="h-5 w-5" />;
    return <File className="h-5 w-5" />;
  };

  const courseMaterials = uploadedFiles.filter(file => 
    ALLOWED_FILE_TYPES.courseMaterial.includes(file.type)
  );

  const audioFiles = uploadedFiles.filter(file => 
    file.type.startsWith('audio/')
  );

  const videoFiles = uploadedFiles.filter(file => 
    file.type.startsWith('video/')
  );

  const regularLinks = links.filter(link => !link.isGoogleForm);
  const quizLinks = [...links, ...embeddedContent].filter(link => link.isGoogleForm);
  
  const mediaContent = {
    audio: audioFiles,
    video: videoFiles
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className={`text-center py-12 ${isDarkMode ? 'bg-gray-900 text-gray-300' : 'bg-gray-50 text-gray-900'}`}>
        <p className="text-red-600">{error || 'Course not found'}</p>
        <button
          onClick={() => navigate('/courses')}
          className={`mt-4 ${isDarkMode ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-500'}`}
        >
          Return to courses
        </button>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className={`sticky top-0 z-10 ${isDarkMode ? 'bg-gray-900/80' : 'bg-white/80'} backdrop-blur-sm border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 flex items-center">
            <button
              onClick={() => navigate('/courses')}
              className={`inline-flex items-center text-sm transition-colors ${
                isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to courses
            </button>
            <h1 className={`ml-4 text-lg font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
              {course.title}
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('description')}
                className={`${
                  activeTab === 'description'
                    ? isDarkMode
                      ? 'border-indigo-500 text-indigo-400'
                      : 'border-indigo-500 text-indigo-600'
                    : isDarkMode
                    ? 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <BookOpen className="h-5 w-5 mr-2" />
                Description
              </button>

              <button
                onClick={() => setActiveTab('materials')}
                className={`${
                  activeTab === 'materials'
                    ? isDarkMode
                      ? 'border-indigo-500 text-indigo-400'
                      : 'border-indigo-500 text-indigo-600'
                    : isDarkMode
                    ? 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <Folder className="h-5 w-5 mr-2" />
                Course Materials
                {courseMaterials.length > 0 && (
                  <span className={`ml-2 py-0.5 px-2.5 rounded-full text-xs font-medium ${
                    activeTab === 'materials'
                      ? 'bg-indigo-100 text-indigo-600'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {courseMaterials.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('links')}
                className={`${
                  activeTab === 'links'
                    ? isDarkMode
                      ? 'border-indigo-500 text-indigo-400'
                      : 'border-indigo-500 text-indigo-600'
                    : isDarkMode
                    ? 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <LinkIcon className="h-5 w-5 mr-2" />
                Links
                {regularLinks.length > 0 && (
                  <span className={`ml-2 py-0.5 px-2.5 rounded-full text-xs font-medium ${
                    activeTab === 'links'
                      ? 'bg-indigo-100 text-indigo-600'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {regularLinks.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('quiz')}
                className={`${
                  activeTab === 'quiz'
                    ? isDarkMode
                      ? 'border-indigo-500 text-indigo-400'
                      : 'border-indigo-500 text-indigo-600'
                    : isDarkMode
                    ? 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <FileQuestion className="h-5 w-5 mr-2" />
                Quizzes
                {quizLinks.length > 0 && (
                  <span className={`ml-2 py-0.5 px-2.5 rounded-full text-xs font-medium ${
                    activeTab === 'quiz'
                      ? 'bg-indigo-100 text-indigo-600'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {quizLinks.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('media')}
                className={`${
                  activeTab === 'media'
                    ? isDarkMode
                      ? 'border-indigo-500 text-indigo-400'
                      : 'border-indigo-500 text-indigo-600'
                    : isDarkMode
                    ? 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <Film className="h-5 w-5 mr-2" />
                Audio & Video
                {(mediaContent.audio.length + mediaContent.video.length) > 0 && (
                  <span className={`ml-2 py-0.5 px-2.5 rounded-full text-xs font-medium ${
                    activeTab === 'media'
                      ? 'bg-indigo-100 text-indigo-600'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {mediaContent.audio.length + mediaContent.video.length}
                  </span>
                )}
              </button>
            </nav>
          </div>
        </div>

        <div className={`space-y-8 ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
          {activeTab === 'description' && (
            <div>
              <h2 className={`text-xl font-semibold mb-6 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                Course Description
              </h2>
              <div className={`prose max-w-none ${isDarkMode ? 'prose-invert' : ''} ${
                isDarkMode 
                  ? 'bg-gray-800 text-gray-100' 
                  : 'bg-white text-gray-900'
              } rounded-lg p-6 shadow-sm`}>
                <div dangerouslySetInnerHTML={{ __html: textContent }} />
              </div>
            </div>
          )}

          {activeTab === 'materials' && (
            <div>
              <h2 className={`text-xl font-semibold mb-6 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                Course Materials
              </h2>
              <div className="grid grid-cols-1 gap-4">
                {courseMaterials.length === 0 ? (
                  <p className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    No course materials available
                  </p>
                ) : (
                  courseMaterials.map((file) => (
                    <div
                      key={file.name}
                      className={`flex items-center rounded-lg p-4 ${
                        isDarkMode 
                          ? 'bg-gray-800 hover:bg-gray-700' 
                          : 'bg-white hover:bg-gray-50'
                      } transition-colors shadow-sm`}
                    >
                      <div className={`flex-shrink-0 mr-4 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        {getFileIcon(file.type)}
                      </div>
                      <div className="flex-grow min-w-0">
                        <p className={`text-sm font-medium truncate ${
                          isDarkMode ? 'text-gray-100' : 'text-gray-900'
                        }`}>
                          {file.originalName}
                        </p>
                        <p className={`text-sm ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                      <a
                        href={file.url}
                        download={file.originalName}
                        className={`flex-shrink-0 p-2 rounded-full transition-colors ${
                          isDarkMode 
                            ? 'text-indigo-400 hover:text-indigo-300 hover:bg-gray-600' 
                            : 'text-indigo-600 hover:text-indigo-700 hover:bg-gray-100'
                        }`}
                        title="Download"
                      >
                        <Download className="h-5 w-5" />
                      </a>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'links' && (
            <div>
              <h2 className={`text-xl font-semibold mb-6 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                Links
              </h2>
              <div className="grid grid-cols-1 gap-4">
                {regularLinks.length === 0 ? (
                  <p className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    No links available
                  </p>
                ) : (
                  regularLinks.map((link, index) => (
                    <a
                      key={index}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center rounded-lg p-4 ${
                        isDarkMode 
                          ? 'bg-gray-800 hover:bg-gray-700' 
                          : 'bg-white hover:bg-gray-50'
                      } transition-colors shadow-sm`}
                    >
                      <LinkIcon className={`h-5 w-5 mr-4 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-600'
                      }`} />
                      <span className={`text-sm font-medium ${
                        isDarkMode ? 'text-gray-100' : 'text-gray-900'
                      }`}>
                        {link.title}
                      </span>
                    </a>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'quiz' && (
            <div>
              <h2 className={`text-xl font-semibold mb-6 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                Quizzes
              </h2>
              <div className="grid grid-cols-1 gap-4">
                {quizLinks.length === 0 ? (
                  <p className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    No quizzes available
                  </p>
                ) : (
                  quizLinks.map((quiz, index) => (
                    <a
                      key={index}
                      href={quiz.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center rounded-lg p-4 ${
                        isDarkMode 
                          ? 'bg-gray-800 hover:bg-gray-700' 
                          : 'bg-white hover:bg-gray-50'
                      } transition-colors shadow-sm`}
                    >
                      <FileQuestion className={`h-5 w-5 mr-4 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-600'
                      }`} />
                      <span className={`text-sm font-medium ${
                        isDarkMode ? 'text-gray-100' : 'text-gray-900'
                      }`}>
                        {quiz.title}
                      </span>
                    </a>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'media' && (
            <div>
              <h2 className={`text-xl font-semibold mb-6 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                Audio & Video Files
              </h2>
              <div className="grid grid-cols-1 gap-8">
                {mediaContent.audio.length > 0 && (
                  <div>
                    <h3 className={`text-lg font-medium mb-4 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                      Audio
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                      {mediaContent.audio.map((file) => (
                        <div
                          key={file.name}
                          className={`flex items-center rounded-lg p-4 ${
                            isDarkMode 
                              ? 'bg-gray-800 hover:bg-gray-700' 
                              : 'bg-white hover:bg-gray-50'
                          } transition-colors shadow-sm`}
                        >
                          <Music className={`h-5 w-5 mr-4 ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-600'
                          }`} />
                          <div className="flex-grow min-w-0">
                            <p className={`text-sm font-medium truncate ${
                              isDarkMode ? 'text-gray-100' : 'text-gray-900'
                            }`}>
                              {file.originalName}
                            </p>
                            <audio
                              controls
                              className="mt-2 w-full"
                              src={file.url}
                            >
                              Your browser does not support the audio element.
                            </audio>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {mediaContent.video.length > 0 && (
                  <div>
                    <h3 className={`text-lg font-medium mb-4 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                      Video
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                      {mediaContent.video.map((file) => (
                        <div
                          key={file.name}
                          className={`rounded-lg overflow-hidden ${
                            isDarkMode 
                              ? 'bg-gray-800' 
                              : 'bg-white'
                          } shadow-sm`}
                        >
                          <div className="p-4">
                            <p className={`text-sm font-medium ${
                              isDarkMode ? 'text-gray-100' : 'text-gray-900'
                            }`}>
                              {file.originalName}
                            </p>
                          </div>
                          <video
                            controls
                            className="w-full"
                            src={file.url}
                          >
                            Your browser does not support the video element.
                          </video>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {mediaContent.audio.length === 0 && mediaContent.video.length === 0 && (
                  <p className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    No audio or video files available
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}







// import React, { useEffect, useState } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import { ArrowLeft, MessageSquare, Star } from 'lucide-react';
// import { useCourseStore } from '../store/courseStore';
// import { useAuthStore } from '../store/authStore';
// import { useThemeStore } from '../store/themeStore';
// import { CommentSidebar } from './CommentSidebar';
// import { FeedbackSection } from './FeedbackSection';

// export function CourseViewer() {
//   const { id } = useParams<{ id: string }>();
//   const navigate = useNavigate();
//   const { user } = useAuthStore();
//   const { getCourse } = useCourseStore();
//   const { isDarkMode } = useThemeStore();
//   const [course, setCourse] = useState<any>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [showComments, setShowComments] = useState(false);
//   const [showFeedback, setShowFeedback] = useState(false);

//   useEffect(() => {
//     const loadCourse = async () => {
//       if (!id) return;
//       try {
//         const courseData = await getCourse(id);
//         if (!courseData) {
//           throw new Error('Course not found');
//         }
//         if (!courseData.published && user?.role !== 'educator') {
//           throw new Error('This course is not published');
//         }
//         setCourse(courseData);
//       } catch (err) {
//         setError(err instanceof Error ? err.message : 'Failed to load course');
//       } finally {
//         setLoading(false);
//       }
//     };

//     loadCourse();
//   }, [id, getCourse, user?.role]);

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center min-h-screen">
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
//       </div>
//     );
//   }

//   if (error || !course) {
//     return (
//       <div className="text-center py-12">
//         <p className="text-red-600">{error || 'Course not found'}</p>
//         <button
//           onClick={() => navigate('/courses')}
//           className="mt-4 text-indigo-600 hover:text-indigo-500"
//         >
//           Return to courses
//         </button>
//       </div>
//     );
//   }

//   return (
//     <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
//       <div className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="py-4 flex items-center justify-between">
//             <div className="flex items-center">
//               <button
//                 onClick={() => navigate('/courses')}
//                 className={`inline-flex items-center text-sm ${
//                   isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
//                 }`}
//               >
//                 <ArrowLeft className="h-4 w-4 mr-1" />
//                 Back to courses
//               </button>
//               <h1 className={`ml-4 text-lg font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
//                 {course.title}
//               </h1>
//             </div>
//             <div className="flex items-center space-x-4">
//               <button
//                 onClick={() => setShowFeedback(!showFeedback)}
//                 className={`inline-flex items-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium ${
//                   isDarkMode
//                     ? 'border-gray-600 text-gray-300 hover:bg-gray-800'
//                     : 'border-gray-300 text-gray-700 hover:bg-gray-50'
//                 } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
//               >
//                 <Star className="h-4 w-4 mr-2" />
//                 {showFeedback ? 'Hide Feedback' : 'View Feedback'}
//               </button>
//               <button
//                 onClick={() => setShowComments(!showComments)}
//                 className={`inline-flex items-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium ${
//                   isDarkMode
//                     ? 'border-gray-600 text-gray-300 hover:bg-gray-800'
//                     : 'border-gray-300 text-gray-700 hover:bg-gray-50'
//                 } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
//               >
//                 <MessageSquare className="h-4 w-4 mr-2" />
//                 {showComments ? 'Hide Comments' : 'View Comments'}
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>

//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//         <div className={`prose max-w-none ${isDarkMode ? 'prose-invert' : ''}`}>
//           <div dangerouslySetInnerHTML={{ __html: course.content }} />
//         </div>
//       </div>

//       {showFeedback && (
//         <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity">
//           <div className="fixed inset-0 z-10 overflow-y-auto">
//             <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
//               <div className={`relative transform overflow-hidden rounded-lg px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-3xl sm:p-6 ${
//                 isDarkMode ? 'bg-gray-800' : 'bg-white'
//               }`}>
//                 <div className="absolute right-0 top-0 pr-4 pt-4">
//                   <button
//                     type="button"
//                     className={`rounded-md ${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-500'}`}
//                     onClick={() => setShowFeedback(false)}
//                   >
//                     <span className="sr-only">Close</span>
//                     <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
//                       <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
//                     </svg>
//                   </button>
//                 </div>
//                 <div className="sm:flex sm:items-start">
//                   <div className="w-full">
//                     <FeedbackSection course={course} readOnly />
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       <CommentSidebar
//         courseId={course.id}
//         isOpen={showComments}
//         onClose={() => setShowComments(false)}
//       />
//     </div>
//   );
// }