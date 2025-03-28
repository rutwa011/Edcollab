import React, { useEffect, useState } from 'react';
import { Star, MessageSquare, Loader2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useFeedbackStore } from '../store/feedbackStore';
import type { Course } from '../types';

interface FeedbackSectionProps {
  course: Course;
  readOnly?: boolean;
}

export function FeedbackSection({ course, readOnly = false }: FeedbackSectionProps) {
  const { user } = useAuthStore();
  const { feedback, loading, error, fetchFeedback, addFeedback, respondToFeedback } = useFeedbackStore();
  const [newFeedback, setNewFeedback] = useState('');
  const [rating, setRating] = useState(5);
  const [response, setResponse] = useState('');
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchFeedback(course.id);
  }, [course.id, fetchFeedback]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFeedback.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await addFeedback(course.id, newFeedback, rating);
      setNewFeedback('');
      setRating(5);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRespond = async (id: string) => {
    if (!response.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await respondToFeedback(id, response);
      setResponse('');
      setRespondingTo(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const averageRating = feedback.length
    ? (feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length).toFixed(1)
    : 'N/A';

  return (
    <div className={`${readOnly ? '' : 'max-w-3xl mx-auto'} py-8`}>
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Course Feedback</h3>
          
          <div className="mt-4 flex items-center space-x-2">
            <Star className="h-5 w-5 text-yellow-400 fill-current" />
            <span className="text-lg font-medium">{averageRating}</span>
            <span className="text-sm text-gray-500">
              ({feedback.length} {feedback.length === 1 ? 'review' : 'reviews'})
            </span>
          </div>

          {!readOnly && user?.role === 'student' && (
            <form onSubmit={handleSubmit} className="mt-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Rating</label>
                <div className="mt-1 flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRating(value)}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`h-6 w-6 ${
                          value <= rating
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label htmlFor="feedback" className="block text-sm font-medium text-gray-700">
                  Your Feedback
                </label>
                <textarea
                  id="feedback"
                  rows={4}
                  value={newFeedback}
                  onChange={(e) => setNewFeedback(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Share your experience with this course..."
                />
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Feedback'
                  )}
                </button>
              </div>
            </form>
          )}

          {loading ? (
            <div className="mt-6 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
          ) : error ? (
            <div className="mt-6 text-center text-red-600">{error}</div>
          ) : feedback.length === 0 ? (
            <div className="mt-6 text-center text-gray-500">
              <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2">No feedback yet</p>
            </div>
          ) : (
            <div className="mt-6 space-y-6">
              {feedback.map((item) => (
                <div key={item.id} className="border-t border-gray-200 pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                          <span className="text-indigo-800 font-medium">
                            {item.student?.full_name.charAt(0)}
                          </span>
                        </div>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">
                          {item.student?.full_name}
                        </p>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < item.rating
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500">
                      {new Date(item.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="mt-2 text-sm text-gray-700">
                    <p>{item.content}</p>
                  </div>

                  {item.educator_response && (
                    <div className="mt-4 ml-6 p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-900">Educator Response:</p>
                      <p className="mt-1 text-sm text-gray-700">{item.educator_response}</p>
                    </div>
                  )}

                  {!readOnly && user?.id === course.creator_id && !item.educator_response && (
                    <div className="mt-4">
                      {respondingTo === item.id ? (
                        <div className="space-y-4">
                          <textarea
                            value={response}
                            onChange={(e) => setResponse(e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            rows={3}
                            placeholder="Write your response..."
                          />
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => {
                                setRespondingTo(null);
                                setResponse('');
                              }}
                              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleRespond(item.id)}
                              disabled={isSubmitting}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                            >
                              {isSubmitting ? 'Responding...' : 'Respond'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setRespondingTo(item.id)}
                          className="text-sm text-indigo-600 hover:text-indigo-500"
                        >
                          Respond to feedback
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}