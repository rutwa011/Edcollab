import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { 
  ArrowLeft, Save, MessageSquare, Star, Globe, EyeOff, Loader2,
  File, Image, Video, FileText, X, Download, Clock
} from 'lucide-react';
import { useCourseStore } from '../store/courseStore';
import { useCommentStore } from '../store/commentStore';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { CommentSidebar } from './CommentSidebar';
import { FeedbackSection } from './FeedbackSection';

interface UploadedFile {
  url: string;
  name: string;
  originalName: string;
  type: string;
  size: number;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_FILE_TYPES = {
  'image': ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  'document': [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain'
  ],
  'video': ['video/mp4', 'video/webm'],
  'archive': ['application/zip', 'application/x-zip-compressed']
};

function generateFileName(originalName: string): string {
  const timestamp = new Date().getTime();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop();
  return `${timestamp}-${random}-${originalName}`;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 KB';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatLastUpdated(dateString: string): string {
  if (!dateString) return 'Never';
  
  const date = new Date(dateString);
  
  const dateOptions: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  
  const timeOptions: Intl.DateTimeFormatOptions = { 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: true 
  };
  
  const formattedDate = date.toLocaleDateString(undefined, dateOptions);
  const formattedTime = date.toLocaleTimeString(undefined, timeOptions);
  
  return `${formattedDate} at ${formattedTime}`;
}

export function CourseEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { courses, loading, error, fetchCourses, updateCourse } = useCourseStore();
  const { fetchComments } = useCommentStore();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const course = courses.find(c => c.id === id);

  useEffect(() => {
    if (!courses.length) {
      fetchCourses();
    }
    if (id) {
      fetchComments(id);
      fetchExistingFiles();
    }
  }, [courses.length, fetchCourses, fetchComments, id]);

  const fetchExistingFiles = async () => {
    if (!course?.id) return;
    
    try {
      const { data, error } = await supabase.storage
        .from('course-media')
        .list(course.id);

      if (error) throw error;

      const files = await Promise.all(
        data.map(async (file) => {
          const { data: { publicUrl } } = supabase.storage
            .from('course-media')
            .getPublicUrl(`${course.id}/${file.name}`);

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
      console.error('Error fetching files:', err);
    }
  };

  const validateFile = (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`);
    }

    const isValidType = Object.values(ALLOWED_FILE_TYPES)
      .flat()
      .includes(file.type);

    if (!isValidType) {
      throw new Error('File type not supported');
    }
  };

  const handleMediaUpload = useCallback(async (file: File) => {
    if (!course?.id) return null;
    setUploadingMedia(true);

    try {
      validateFile(file);

      const fileName = generateFileName(file.name);
      const filePath = `${course.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('course-media')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('course-media')
        .getPublicUrl(filePath);

      const newFile = {
        url: publicUrl,
        name: fileName,
        originalName: file.name,
        type: file.type,
        size: file.size
      };

      setUploadedFiles(prev => [...prev, newFile]);
      return publicUrl;
    } catch (err) {
      console.error('Error uploading file:', err);
      throw err;
    } finally {
      setUploadingMedia(false);
    }
  }, [course?.id]);

  const handleFileDelete = async (fileName: string) => {
    if (!course?.id) return;

    try {
      const { error } = await supabase.storage
        .from('course-media')
        .remove([`${course.id}/${fileName}`]);

      if (error) throw error;

      setUploadedFiles(prev => prev.filter(file => file.name !== fileName));
    } catch (err) {
      console.error('Error deleting file:', err);
      alert('Failed to delete file. Please try again.');
    }
  };

  const getFileIcon = (type: string) => {
    if (ALLOWED_FILE_TYPES.image.includes(type)) return <Image className="h-5 w-5" />;
    if (ALLOWED_FILE_TYPES.video.includes(type)) return <Video className="h-5 w-5" />;
    if (ALLOWED_FILE_TYPES.document.includes(type)) return <FileText className="h-5 w-5" />;
    return <File className="h-5 w-5" />;
  };

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'align': [] }],
        ['link', 'image', 'video'],
        ['clean']
      ],
      handlers: {
        image: () => {
          const input = document.createElement('input');
          input.setAttribute('type', 'file');
          input.setAttribute('accept', Object.values(ALLOWED_FILE_TYPES).flat().join(','));
          input.click();

          input.onchange = async () => {
            const file = input.files?.[0];
            if (!file) return;

            try {
              const url = await handleMediaUpload(file);
              if (!url) return;

              const quill = (document.querySelector('.ql-editor') as any)?.getEditor();
              if (!quill) return;

              const range = quill.getSelection(true);

              if (file.type.startsWith('image/')) {
                quill.insertEmbed(range.index, 'image', url);
              } else if (file.type.startsWith('video/')) {
                quill.insertEmbed(range.index, 'video', url);
              } else {
                quill.insertText(range.index, file.name, 'link', url);
              }
              quill.setSelection(range.index + 1);
            } catch (err) {
              alert(err instanceof Error ? err.message : 'Failed to upload file');
            }
          };
        }
      }
    }
  }), [handleMediaUpload]);

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'list', 'bullet',
    'align',
    'link', 'image', 'video'
  ];

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');

    try {
      const content = document.querySelector('.ql-editor')?.innerHTML || '';
      await updateCourse(course!.id, {
        content,
        updated_at: new Date().toISOString(),
      });
      navigate('/courses');
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handlePublishToggle = async () => {
    if (!course) return;
    setPublishing(true);
    setSaveError('');

    try {
      await updateCourse(course.id, {
        published: !course.published,
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to update publish status');
    } finally {
      setPublishing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = Array.from(e.dataTransfer.files);
    for (const file of files) {
      try {
        await handleMediaUpload(file);
      } catch (err) {
        console.error(`Error uploading ${file.name}:`, err);
        alert(`Failed to upload ${file.name}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="p-8 rounded-xl bg-white shadow-xl">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600 text-sm">Loading course editor...</p>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-xl p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
            <X className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {error || 'Course not found'}
          </h3>
          <p className="text-gray-500 mb-6">
            We couldn't load the course editor. Please try again.
          </p>
          <button
            onClick={() => navigate('/courses')}
            className="inline-flex items-center px-4 py-2 rounded-lg text-white bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 transition-all duration-200 shadow-md"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Return to courses
          </button>
        </div>
      </div>
    );
  }

  if (user?.role !== 'educator') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-xl p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
            <X className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Access Denied
          </h3>
          <p className="text-gray-500 mb-6">
            You don't have permission to edit courses. Only educators can access the course editor.
          </p>
          <button
            onClick={() => navigate('/courses')}
            className="inline-flex items-center px-4 py-2 rounded-lg text-white bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 transition-all duration-200 shadow-md"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Return to courses
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/courses')}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="font-medium">Back</span>
              </button>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-semibold text-gray-900">
                  {course.title}
                </h1>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  course.published
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {course.published ? 'Published' : 'Draft'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {saveError && (
                <p className="text-sm text-red-600 bg-red-50 px-3 py-1 rounded-lg">
                  {saveError}
                </p>
              )}
              
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePublishToggle}
                  disabled={publishing}
                  className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    course.published
                      ? 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                      : 'text-white bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-md'
                  } disabled:opacity-50`}
                >
                  {publishing ? (
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  ) : course.published ? (
                    <EyeOff className="h-5 w-5 mr-2" />
                  ) : (
                    <Globe className="h-5 w-5 mr-2" />
                  )}
                  {publishing
                    ? 'Updating...'
                    : course.published
                    ? 'Unpublish'
                    : 'Publish'}
                </button>
                
                <button
                  onClick={() => setShowFeedback(!showFeedback)}
                  className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  <Star className="h-5 w-5 mr-2 text-yellow-500" />
                  Feedback
                </button>
                
                <button
                  onClick={() => setShowComments(!showComments)}
                  className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  <MessageSquare className="h-5 w-5 mr-2 text-blue-500" />
                  Comments
                </button>
                
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center px-6 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 transition-all duration-200 shadow-md disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-5 w-5 mr-2" />
                  )}
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Last Updated */}
        <div className="mb-6 flex items-center text-sm text-gray-500 bg-white/50 backdrop-blur-sm px-4 py-2 rounded-lg shadow-sm border border-gray-200/50">
          <Clock className="h-4 w-4 mr-2 text-gray-400" />
          <span>Last updated: {formatLastUpdated(course.updated_at)}</span>
        </div>

        {/* Upload Status */}
        {uploadingMedia && (
          <div className="mb-6 flex items-center justify-center p-4 bg-blue-50 text-blue-700 rounded-xl border border-blue-100 shadow-sm">
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            <span className="font-medium">Uploading media...</span>
          </div>
        )}
        
        {/* Editor */}
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="bg-white rounded-xl shadow-xl border border-gray-200/50 overflow-hidden transition-all duration-200 hover:shadow-2xl"
        >
          <ReactQuill
            theme="snow"
            value={course.content}
            modules={modules}
            formats={formats}
            className="min-h-[500px]"
          />
        </div>

        {/* Uploaded Files */}
        <div className="mt-8 bg-white rounded-xl shadow-xl border border-gray-200/50 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Uploaded Files</h2>
            <div className="text-sm text-gray-500">
              {uploadedFiles.length} {uploadedFiles.length === 1 ? 'file' : 'files'}
            </div>
          </div>
          
          <div className="grid gap-4">
            {uploadedFiles.map((file) => (
              <div
                key={file.name}
                className="flex items-center gap-4 p-4 rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors group"
              >
                <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-white shadow-sm border border-gray-200">
                  {getFileIcon(file.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.originalName}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <a
                    href={file.url}
                    download={file.originalName}
                    className="p-2 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-white transition-colors"
                    title="Download"
                  >
                    <Download className="h-5 w-5" />
                  </a>
                  <button
                    onClick={() => handleFileDelete(file.name)}
                    className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-white transition-colors"
                    title="Delete"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
            
            {uploadedFiles.length === 0 && (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                  <File className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-500">
                  No files uploaded yet. Drag and drop files here or use the editor to upload.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Feedback Modal */}
      {showFeedback && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center px-4">
            <div 
              className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
              onClick={() => setShowFeedback(false)}
            />
            
            <div className="relative w-full max-w-3xl transform rounded-xl bg-white shadow-2xl transition-all">
              <div className="p-6">
                <div className="absolute right-4 top-4">
                  <button
                    onClick={() => setShowFeedback(false)}
                    className="rounded-lg p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors"
                  >
                    <span className="sr-only">Close</span>
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <div className="mt-4">
                  <FeedbackSection course={course} readOnly />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comments Sidebar */}
      <CommentSidebar
        courseId={course.id}
        isOpen={showComments}
        onClose={() => setShowComments(false)}
      />
    </div>
  );
}







// import React, { useEffect, useState, useCallback, useMemo } from 'react';
// import { useNavigate, useParams } from 'react-router-dom';
// import ReactQuill from 'react-quill';
// import 'react-quill/dist/quill.snow.css';
// import { 
//   ArrowLeft, Save, MessageSquare, Star, Globe, EyeOff, Loader2,
//   File, Image, Video, FileText, X, Download
// } from 'lucide-react';
// import { useCourseStore } from '../store/courseStore';
// import { useCommentStore } from '../store/commentStore';
// import { useAuthStore } from '../store/authStore';
// import { supabase } from '../lib/supabase';
// import { CommentSidebar } from './CommentSidebar';
// import { FeedbackSection } from './FeedbackSection';

// interface UploadedFile {
//   url: string;
//   name: string;
//   originalName: string;
//   type: string;
//   size: number;
// }

// const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
// const ALLOWED_FILE_TYPES = {
//   'image': ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
//   'document': [
//     'application/pdf',
//     'application/msword',
//     'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
//     'application/vnd.ms-powerpoint',
//     'application/vnd.openxmlformats-officedocument.presentationml.presentation',
//     'text/plain'
//   ],
//   'video': ['video/mp4', 'video/webm'],
//   'archive': ['application/zip', 'application/x-zip-compressed']
// };

// function generateFileName(originalName: string): string {
//   const timestamp = new Date().getTime();
//   const random = Math.random().toString(36).substring(2, 8);
//   const extension = originalName.split('.').pop();
//   return `${timestamp}-${random}.${extension}`;
// }

// function formatFileSize(bytes: number): string {
//   if (bytes === 0) return '0 KB';
//   const k = 1024;
//   const sizes = ['B', 'KB', 'MB', 'GB'];
//   const i = Math.floor(Math.log(bytes) / Math.log(k));
//   return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
// }

// export function CourseEditor() {
//   const { id } = useParams<{ id: string }>();
//   const navigate = useNavigate();
//   const { user } = useAuthStore();
//   const { courses, loading, error, fetchCourses, updateCourse } = useCourseStore();
//   const { fetchComments } = useCommentStore();
//   const [saving, setSaving] = useState(false);
//   const [saveError, setSaveError] = useState('');
//   const [uploadingMedia, setUploadingMedia] = useState(false);
//   const [showComments, setShowComments] = useState(false);
//   const [showFeedback, setShowFeedback] = useState(false);
//   const [publishing, setPublishing] = useState(false);
//   const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

//   const course = courses.find(c => c.id === id);

//   useEffect(() => {
//     if (!courses.length) {
//       fetchCourses();
//     }
//     if (id) {
//       fetchComments(id);
//       fetchExistingFiles();
//     }
//   }, [courses.length, fetchCourses, fetchComments, id]);

//   const fetchExistingFiles = async () => {
//     if (!course?.id) return;
    
//     try {
//       const { data, error } = await supabase.storage
//         .from('course-media')
//         .list(course.id);

//       if (error) throw error;

//       const files = await Promise.all(
//         data.map(async (file) => {
//           const { data: { publicUrl } } = supabase.storage
//             .from('course-media')
//             .getPublicUrl(`${course.id}/${file.name}`);

//           return {
//             url: publicUrl,
//             name: file.name,
//             originalName: file.name,
//             type: file.metadata?.mimetype || 'application/octet-stream',
//             size: file.metadata?.size || 0
//           };
//         })
//       );

//       setUploadedFiles(files);
//     } catch (err) {
//       console.error('Error fetching files:', err);
//     }
//   };

//   const validateFile = (file: File) => {
//     if (file.size > MAX_FILE_SIZE) {
//       throw new Error(`File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`);
//     }

//     const isValidType = Object.values(ALLOWED_FILE_TYPES)
//       .flat()
//       .includes(file.type);

//     if (!isValidType) {
//       throw new Error('File type not supported');
//     }
//   };

//   const handleMediaUpload = useCallback(async (file: File) => {
//     if (!course?.id) return null;
//     setUploadingMedia(true);

//     try {
//       validateFile(file);

//       const fileName = generateFileName(file.name);
//       const filePath = `${course.id}/${fileName}`;

//       const { error: uploadError } = await supabase.storage
//         .from('course-media')
//         .upload(filePath, file, {
//           cacheControl: '3600',
//           upsert: false
//         });

//       if (uploadError) throw uploadError;

//       const { data: { publicUrl } } = supabase.storage
//         .from('course-media')
//         .getPublicUrl(filePath);

//       const newFile = {
//         url: publicUrl,
//         name: fileName,
//         originalName: file.name,
//         type: file.type,
//         size: file.size
//       };

//       setUploadedFiles(prev => [...prev, newFile]);
//       return publicUrl;
//     } catch (err) {
//       console.error('Error uploading file:', err);
//       throw err;
//     } finally {
//       setUploadingMedia(false);
//     }
//   }, [course?.id]);

//   const handleFileDelete = async (fileName: string) => {
//     if (!course?.id) return;

//     try {
//       const { error } = await supabase.storage
//         .from('course-media')
//         .remove([`${course.id}/${fileName}`]);

//       if (error) throw error;

//       setUploadedFiles(prev => prev.filter(file => file.name !== fileName));
//     } catch (err) {
//       console.error('Error deleting file:', err);
//       alert('Failed to delete file. Please try again.');
//     }
//   };

//   const getFileIcon = (type: string) => {
//     if (ALLOWED_FILE_TYPES.image.includes(type)) return <Image className="h-5 w-5" />;
//     if (ALLOWED_FILE_TYPES.video.includes(type)) return <Video className="h-5 w-5" />;
//     if (ALLOWED_FILE_TYPES.document.includes(type)) return <FileText className="h-5 w-5" />;
//     return <File className="h-5 w-5" />;
//   };

//   const modules = useMemo(() => ({
//     toolbar: {
//       container: [
//         [{ 'header': [1, 2, false] }],
//         ['bold', 'italic', 'underline', 'strike'],
//         [{ 'color': [] }, { 'background': [] }],
//         [{ 'list': 'ordered'}, { 'list': 'bullet' }],
//         [{ 'align': [] }],
//         ['link', 'image', 'video'],
//         ['clean']
//       ],
//       handlers: {
//         image: () => {
//           const input = document.createElement('input');
//           input.setAttribute('type', 'file');
//           input.setAttribute('accept', Object.values(ALLOWED_FILE_TYPES).flat().join(','));
//           input.click();

//           input.onchange = async () => {
//             const file = input.files?.[0];
//             if (!file) return;

//             try {
//               const url = await handleMediaUpload(file);
//               if (!url) return;

//               const quill = (document.querySelector('.ql-editor') as any)?.getEditor();
//               if (!quill) return;

//               const range = quill.getSelection(true);

//               if (file.type.startsWith('image/')) {
//                 quill.insertEmbed(range.index, 'image', url);
//               } else if (file.type.startsWith('video/')) {
//                 quill.insertEmbed(range.index, 'video', url);
//               } else {
//                 quill.insertText(range.index, file.name, 'link', url);
//               }
//               quill.setSelection(range.index + 1);
//             } catch (err) {
//               alert(err instanceof Error ? err.message : 'Failed to upload file');
//             }
//           };
//         }
//       }
//     }
//   }), [handleMediaUpload]);

//   const formats = [
//     'header',
//     'bold', 'italic', 'underline', 'strike',
//     'color', 'background',
//     'list', 'bullet',
//     'align',
//     'link', 'image', 'video'
//   ];

//   const handleSave = async () => {
//     setSaving(true);
//     setSaveError('');

//     try {
//       const content = document.querySelector('.ql-editor')?.innerHTML || '';
//       await updateCourse(course!.id, {
//         content,
//         updated_at: new Date().toISOString(),
//       });
//       navigate('/courses');
//     } catch (err) {
//       setSaveError(err instanceof Error ? err.message : 'Failed to save changes');
//     } finally {
//       setSaving(false);
//     }
//   };

//   const handlePublishToggle = async () => {
//     if (!course) return;
//     setPublishing(true);
//     setSaveError('');

//     try {
//       await updateCourse(course.id, {
//         published: !course.published,
//         updated_at: new Date().toISOString(),
//       });
//     } catch (err) {
//       setSaveError(err instanceof Error ? err.message : 'Failed to update publish status');
//     } finally {
//       setPublishing(false);
//     }
//   };

//   const handleDragOver = (e: React.DragEvent) => {
//     e.preventDefault();
//     e.stopPropagation();
//   };

//   const handleDrop = async (e: React.DragEvent) => {
//     e.preventDefault();
//     e.stopPropagation();

//     const files = Array.from(e.dataTransfer.files);
//     for (const file of files) {
//       try {
//         await handleMediaUpload(file);
//       } catch (err) {
//         console.error(`Error uploading ${file.name}:`, err);
//         alert(`Failed to upload ${file.name}: ${err instanceof Error ? err.message : 'Unknown error'}`);
//       }
//     }
//   };

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

//   if (user?.role !== 'educator') {
//     return (
//       <div className="text-center py-12">
//         <p className="text-red-600">You don't have permission to edit courses</p>
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
//     <div className="min-h-screen bg-white">
//       <div className="border-b border-gray-200">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="py-4 flex items-center justify-between">
//             <div className="flex items-center">
//               <button
//                 onClick={() => navigate('/courses')}
//                 className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
//               >
//                 <ArrowLeft className="h-4 w-4 mr-1" />
//                 Back to courses
//               </button>
//               <h1 className="ml-4 text-lg font-medium text-gray-900">
//                 Editing: {course.title}
//               </h1>
//               <span className={`ml-2 px-2.5 py-0.5 rounded-full text-xs font-medium ${
//                 course.published
//                   ? 'bg-green-100 text-green-800'
//                   : 'bg-yellow-100 text-yellow-800'
//               }`}>
//                 {course.published ? 'Published' : 'Draft'}
//               </span>
//             </div>
//             <div className="flex items-center space-x-4">
//               {saveError && (
//                 <p className="text-sm text-red-600">{saveError}</p>
//               )}
//               <button
//                 onClick={handlePublishToggle}
//                 disabled={publishing}
//                 className={`inline-flex items-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
//                   course.published
//                     ? 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-gray-500'
//                     : 'border-transparent text-white bg-green-600 hover:bg-green-700 focus:ring-green-500'
//                 } disabled:opacity-50`}
//               >
//                 {publishing ? (
//                   <Loader2 className="h-4 w-4 mr-2 animate-spin" />
//                 ) : course.published ? (
//                   <EyeOff className="h-4 w-4 mr-2" />
//                 ) : (
//                   <Globe className="h-4 w-4 mr-2" />
//                 )}
//                 {publishing
//                   ? 'Updating...'
//                   : course.published
//                   ? 'Unpublish'
//                   : 'Publish'}
//               </button>
//               <button
//                 onClick={() => setShowFeedback(!showFeedback)}
//                 className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
//               >
//                 <Star className="h-4 w-4 mr-2" />
//                 View Feedback
//               </button>
//               <button
//                 onClick={() => setShowComments(!showComments)}
//                 className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
//               >
//                 <MessageSquare className="h-4 w-4 mr-2" />
//                 Comments
//               </button>
//               <button
//                 onClick={handleSave}
//                 disabled={saving}
//                 className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
//               >
//                 {saving ? (
//                   <Loader2 className="h-4 w-4 mr-2 animate-spin" />
//                 ) : (
//                   <Save className="h-4 w-4 mr-2" />
//                 )}
//                 {saving ? 'Saving...' : 'Save'}
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>

//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//         {uploadingMedia && (
//           <div className="mb-4 flex items-center justify-center p-4 bg-blue-50 text-blue-700 rounded-md">
//             <Loader2 className="h-5 w-5 mr-2 animate-spin" />
//             Uploading media...
//           </div>
//         )}
        
//         <div
//           onDragOver={handleDragOver}
//           onDrop={handleDrop}
//           className="min-h-[500px] bg-white"
//         >
//           <ReactQuill
//             theme="snow"
//             value={course.content}
//             modules={modules}
//             formats={formats}
//           />
//         </div>

//         <div className="mt-8">
//           <h2 className="text-xl font-semibold text-gray-900 mb-6">Uploaded Files</h2>
//           <div className="grid grid-cols-1 gap-4">
//             {uploadedFiles.map((file) => (
//               <div
//                 key={file.name}
//                 className="flex items-center bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
//               >
//                 <div className="flex-shrink-0 mr-4">
//                   {getFileIcon(file.type)}
//                 </div>
//                 <div className="flex-grow min-w-0">
//                   <p className="text-sm font-medium text-gray-900 truncate">
//                     {file.originalName}
//                   </p>
//                   <p className="text-sm text-gray-500">
//                     {formatFileSize(file.size)}
//                   </p>
//                 </div>
//                 <div className="flex-shrink-0 flex items-center space-x-3">
//                   <a
//                     href={file.url}
//                     download={file.originalName}
//                     className="text-blue-600 hover:text-blue-800 transition-colors"
//                     title="Download"
//                   >
//                     <Download className="h-5 w-5" />
//                   </a>
//                   <button
//                     onClick={() => handleFileDelete(file.name)}
//                     className="text-red-600 hover:text-red-800 transition-colors"
//                     title="Delete"
//                   >
//                     <X className="h-5 w-5" />
//                   </button>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>

//       {showFeedback && (
//         <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity">
//           <div className="fixed inset-0 z-10 overflow-y-auto">
//             <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
//               <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-3xl sm:p-6">
//                 <div className="absolute right-0 top-0 pr-4 pt-4">
//                   <button
//                     type="button"
//                     className="rounded-md bg-white text-gray-400 hover:text-gray-500"
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




// import React, { useEffect, useState, useCallback, useMemo } from 'react';
// import { useNavigate, useParams } from 'react-router-dom';
// import ReactQuill from 'react-quill';
// import 'react-quill/dist/quill.snow.css';
// import { 
//   ArrowLeft, Save, MessageSquare, Star, Globe, EyeOff, Loader2,
//   File, Image, Video, FileText, X, Download
// } from 'lucide-react';
// import { useCourseStore } from '../store/courseStore';
// import { useCommentStore } from '../store/commentStore';
// import { useAuthStore } from '../store/authStore';
// import { supabase } from '../lib/supabase';
// import { CommentSidebar } from './CommentSidebar';
// import { FeedbackSection } from './FeedbackSection';

// interface UploadedFile {
//   url: string;
//   name: string;
//   type: string;
//   size: number;
// }

// const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
// const ALLOWED_FILE_TYPES = {
//   'image': ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
//   'document': [
//     'application/pdf',
//     'application/msword',
//     'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
//     'application/vnd.ms-powerpoint',
//     'application/vnd.openxmlformats-officedocument.presentationml.presentation',
//     'text/plain'
//   ],
//   'video': ['video/mp4', 'video/webm'],
//   'archive': ['application/zip', 'application/x-zip-compressed']
// };

// export function CourseEditor() {
//   const { id } = useParams<{ id: string }>();
//   const navigate = useNavigate();
//   const { user } = useAuthStore();
//   const { courses, loading, error, fetchCourses, updateCourse } = useCourseStore();
//   const { fetchComments } = useCommentStore();
//   const [saving, setSaving] = useState(false);
//   const [saveError, setSaveError] = useState('');
//   const [uploadingMedia, setUploadingMedia] = useState(false);
//   const [showComments, setShowComments] = useState(false);
//   const [showFeedback, setShowFeedback] = useState(false);
//   const [publishing, setPublishing] = useState(false);
//   const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

//   const course = courses.find(c => c.id === id);

//   useEffect(() => {
//     if (!courses.length) {
//       fetchCourses();
//     }
//     if (id) {
//       fetchComments(id);
//       fetchExistingFiles();
//     }
//   }, [courses.length, fetchCourses, fetchComments, id]);

//   const fetchExistingFiles = async () => {
//     if (!course?.id) return;
    
//     try {
//       const { data, error } = await supabase.storage
//         .from('course-media')
//         .list(course.id);

//       if (error) throw error;

//       const files = await Promise.all(
//         data.map(async (file) => {
//           const { data: { publicUrl } } = supabase.storage
//             .from('course-media')
//             .getPublicUrl(`${course.id}/${file.name}`);

//           return {
//             url: publicUrl,
//             name: file.name,
//             type: file.metadata?.mimetype || 'application/octet-stream',
//             size: file.metadata?.size || 0
//           };
//         })
//       );

//       setUploadedFiles(files);
//     } catch (err) {
//       console.error('Error fetching files:', err);
//     }
//   };

//   const validateFile = (file: File) => {
//     if (file.size > MAX_FILE_SIZE) {
//       throw new Error(`File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`);
//     }

//     const isValidType = Object.values(ALLOWED_FILE_TYPES)
//       .flat()
//       .includes(file.type);

//     if (!isValidType) {
//       throw new Error('File type not supported');
//     }
//   };

//   const handleMediaUpload = useCallback(async (file: File) => {
//     if (!course?.id) return null;
//     setUploadingMedia(true);

//     try {
//       validateFile(file);

//       const fileExt = file.name.split('.').pop();
//       const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
//       const filePath = `${course.id}/${fileName}`;

//       const { error: uploadError } = await supabase.storage
//         .from('course-media')
//         .upload(filePath, file, {
//           cacheControl: '3600',
//           upsert: false
//         });

//       if (uploadError) throw uploadError;

//       const { data: { publicUrl } } = supabase.storage
//         .from('course-media')
//         .getPublicUrl(filePath);

//       const newFile = {
//         url: publicUrl,
//         name: fileName,
//         type: file.type,
//         size: file.size
//       };

//       setUploadedFiles(prev => [...prev, newFile]);
//       return publicUrl;
//     } catch (err) {
//       console.error('Error uploading file:', err);
//       throw err;
//     } finally {
//       setUploadingMedia(false);
//     }
//   }, [course?.id]);

//   const handleFileDelete = async (fileName: string) => {
//     if (!course?.id) return;

//     try {
//       const { error } = await supabase.storage
//         .from('course-media')
//         .remove([`${course.id}/${fileName}`]);

//       if (error) throw error;

//       setUploadedFiles(prev => prev.filter(file => file.name !== fileName));
//     } catch (err) {
//       console.error('Error deleting file:', err);
//       alert('Failed to delete file. Please try again.');
//     }
//   };

//   const getFileIcon = (type: string) => {
//     if (ALLOWED_FILE_TYPES.image.includes(type)) return <Image className="h-5 w-5" />;
//     if (ALLOWED_FILE_TYPES.video.includes(type)) return <Video className="h-5 w-5" />;
//     if (ALLOWED_FILE_TYPES.document.includes(type)) return <FileText className="h-5 w-5" />;
//     return <File className="h-5 w-5" />;
//   };

//   const modules = useMemo(() => ({
//     toolbar: {
//       container: [
//         [{ 'header': [1, 2, false] }],
//         ['bold', 'italic', 'underline', 'strike'],
//         [{ 'color': [] }, { 'background': [] }],
//         [{ 'list': 'ordered'}, { 'list': 'bullet' }],
//         [{ 'align': [] }],
//         ['link', 'image', 'video'],
//         ['clean']
//       ],
//       handlers: {
//         image: () => {
//           const input = document.createElement('input');
//           input.setAttribute('type', 'file');
//           input.setAttribute('accept', Object.values(ALLOWED_FILE_TYPES).flat().join(','));
//           input.click();

//           input.onchange = async () => {
//             const file = input.files?.[0];
//             if (!file) return;

//             try {
//               const url = await handleMediaUpload(file);
//               if (!url) return;

//               const quill = (document.querySelector('.ql-editor') as any)?.getEditor();
//               if (!quill) return;

//               const range = quill.getSelection(true);

//               if (file.type.startsWith('image/')) {
//                 quill.insertEmbed(range.index, 'image', url);
//               } else if (file.type.startsWith('video/')) {
//                 quill.insertEmbed(range.index, 'video', url);
//               } else {
//                 quill.insertText(range.index, file.name, 'link', url);
//               }
//               quill.setSelection(range.index + 1);
//             } catch (err) {
//               alert(err instanceof Error ? err.message : 'Failed to upload file');
//             }
//           };
//         }
//       }
//     }
//   }), [handleMediaUpload]);

//   const formats = [
//     'header',
//     'bold', 'italic', 'underline', 'strike',
//     'color', 'background',
//     'list', 'bullet',
//     'align',
//     'link', 'image', 'video'
//   ];

//   const handleSave = async () => {
//     setSaving(true);
//     setSaveError('');

//     try {
//       const content = document.querySelector('.ql-editor')?.innerHTML || '';
//       await updateCourse(course!.id, {
//         content,
//         updated_at: new Date().toISOString(),
//       });
//       navigate('/courses');
//     } catch (err) {
//       setSaveError(err instanceof Error ? err.message : 'Failed to save changes');
//     } finally {
//       setSaving(false);
//     }
//   };

//   const handlePublishToggle = async () => {
//     if (!course) return;
//     setPublishing(true);
//     setSaveError('');

//     try {
//       await updateCourse(course.id, {
//         published: !course.published,
//         updated_at: new Date().toISOString(),
//       });
//     } catch (err) {
//       setSaveError(err instanceof Error ? err.message : 'Failed to update publish status');
//     } finally {
//       setPublishing(false);
//     }
//   };

//   const handleDragOver = (e: React.DragEvent) => {
//     e.preventDefault();
//     e.stopPropagation();
//   };

//   const handleDrop = async (e: React.DragEvent) => {
//     e.preventDefault();
//     e.stopPropagation();

//     const files = Array.from(e.dataTransfer.files);
//     for (const file of files) {
//       try {
//         await handleMediaUpload(file);
//       } catch (err) {
//         console.error(`Error uploading ${file.name}:`, err);
//         alert(`Failed to upload ${file.name}: ${err instanceof Error ? err.message : 'Unknown error'}`);
//       }
//     }
//   };

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

//   if (user?.role !== 'educator') {
//     return (
//       <div className="text-center py-12">
//         <p className="text-red-600">You don't have permission to edit courses</p>
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
//     <div className="min-h-screen bg-white">
//       <div className="border-b border-gray-200">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="py-4 flex items-center justify-between">
//             <div className="flex items-center">
//               <button
//                 onClick={() => navigate('/courses')}
//                 className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
//               >
//                 <ArrowLeft className="h-4 w-4 mr-1" />
//                 Back to courses
//               </button>
//               <h1 className="ml-4 text-lg font-medium text-gray-900">
//                 Editing: {course.title}
//               </h1>
//               <span className={`ml-2 px-2.5 py-0.5 rounded-full text-xs font-medium ${
//                 course.published
//                   ? 'bg-green-100 text-green-800'
//                   : 'bg-yellow-100 text-yellow-800'
//               }`}>
//                 {course.published ? 'Published' : 'Draft'}
//               </span>
//             </div>
//             <div className="flex items-center space-x-4">
//               {saveError && (
//                 <p className="text-sm text-red-600">{saveError}</p>
//               )}
//               <button
//                 onClick={handlePublishToggle}
//                 disabled={publishing}
//                 className={`inline-flex items-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
//                   course.published
//                     ? 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-gray-500'
//                     : 'border-transparent text-white bg-green-600 hover:bg-green-700 focus:ring-green-500'
//                 } disabled:opacity-50`}
//               >
//                 {publishing ? (
//                   <Loader2 className="h-4 w-4 mr-2 animate-spin" />
//                 ) : course.published ? (
//                   <EyeOff className="h-4 w-4 mr-2" />
//                 ) : (
//                   <Globe className="h-4 w-4 mr-2" />
//                 )}
//                 {publishing
//                   ? 'Updating...'
//                   : course.published
//                   ? 'Unpublish'
//                   : 'Publish'}
//               </button>
//               <button
//                 onClick={() => setShowFeedback(!showFeedback)}
//                 className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
//               >
//                 <Star className="h-4 w-4 mr-2" />
//                 View Feedback
//               </button>
//               <button
//                 onClick={() => setShowComments(!showComments)}
//                 className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
//               >
//                 <MessageSquare className="h-4 w-4 mr-2" />
//                 Comments
//               </button>
//               <button
//                 onClick={handleSave}
//                 disabled={saving}
//                 className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
//               >
//                 {saving ? (
//                   <Loader2 className="h-4 w-4 mr-2 animate-spin" />
//                 ) : (
//                   <Save className="h-4 w-4 mr-2" />
//                 )}
//                 {saving ? 'Saving...' : 'Save'}
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>

//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//         {uploadingMedia && (
//           <div className="mb-4 flex items-center justify-center p-4 bg-blue-50 text-blue-700 rounded-md">
//             <Loader2 className="h-5 w-5 mr-2 animate-spin" />
//             Uploading media...
//           </div>
//         )}
        
//         <div
//           onDragOver={handleDragOver}
//           onDrop={handleDrop}
//           className="min-h-[500px] bg-white"
//         >
//           <ReactQuill
//             theme="snow"
//             value={course.content}
//             modules={modules}
//             formats={formats}
//           />
//         </div>

//         <div className="mt-8">
//           <h2 className="text-lg font-medium text-gray-900 mb-4">Uploaded Files</h2>
//           <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
//             {uploadedFiles.map((file) => (
//               <div
//                 key={file.name}
//                 className="relative flex items-center p-4 bg-gray-50 rounded-lg border border-gray-200"
//               >
//                 <div className="flex-shrink-0 mr-4">
//                   {getFileIcon(file.type)}
//                 </div>
//                 <div className="min-w-0 flex-1">
//                   <p className="text-sm font-medium text-gray-900 truncate">
//                     {file.name}
//                   </p>
//                   <p className="text-sm text-gray-500">
//                     {(file.size / 1024).toFixed(1)} KB
//                   </p>
//                 </div>
//                 <div className="flex-shrink-0 ml-4">
//                   <a
//                     href={file.url}
//                     download
//                     className="text-indigo-600 hover:text-indigo-900 mr-2"
//                   >
//                     <Download className="h-5 w-5" />
//                   </a>
//                   <button
//                     onClick={() => handleFileDelete(file.name)}
//                     className="text-red-600 hover:text-red-900"
//                   >
//                     <X className="h-5 w-5" />
//                   </button>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>

//       {showFeedback && (
//         <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity">
//           <div className="fixed inset-0 z-10 overflow-y-auto">
//             <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
//               <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-3xl sm:p-6">
//                 <div className="absolute right-0 top-0 pr-4 pt-4">
//                   <button
//                     type="button"
//                     className="rounded-md bg-white text-gray-400 hover:text-gray-500"
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