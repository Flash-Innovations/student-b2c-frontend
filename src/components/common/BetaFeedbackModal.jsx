import React, { useState } from 'react';
import { X, Send, Star, AlertCircle, CheckCircle2, MessageSquare } from 'lucide-react';
import { b2cApi } from '../../services/b2cApi';

const CATEGORIES = [
  { id: 'BUG', label: 'Bug Report' },
  { id: 'FEATURE_REQUEST', label: 'Feature Request' },
  { id: 'UX_FEEDBACK', label: 'User Experience' },
  { id: 'CONTENT_ISSUE', label: 'Question / Content' },
  { id: 'GENERAL', label: 'General Feedback' }
];

export default function BetaFeedbackModal({ isOpen, onClose }) {
  const [category, setCategory] = useState('FEATURE_REQUEST');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      setError('Please provide feedback comments.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await b2cApi.submitBetaFeedback({
        category,
        rating,
        comment: comment.trim()
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setComment('');
        onClose();
      }, 1600);
    } catch (err) {
      setError(err.message || 'Failed to submit feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-indigo-900/30 via-slate-850 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Closed Beta Feedback</h3>
              <p className="text-xs text-slate-400">Help shape Flash for 2028 batch students</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        {success ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-white">Thank You for Your Feedback!</h4>
            <p className="text-xs text-slate-400">Your report has been sent directly to the engineering team.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Category selection */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Feedback Category</label>
              <div className="grid grid-cols-2 gap-1.5">
                {CATEGORIES.map((cat) => (
                  <button
                    type="button"
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border text-left transition-colors ${
                      category === cat.id
                        ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300'
                        : 'bg-slate-850 border-slate-750 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Rating */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Experience Rating</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setRating(star)}
                    className="p-1 text-slate-500 hover:text-amber-400 transition-colors"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        star <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs text-slate-400 ml-2">
                  {rating === 5 ? 'Excellent' : rating === 4 ? 'Good' : rating === 3 ? 'Average' : 'Needs Work'}
                </span>
              </div>
            </div>

            {/* Comment */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Your Thoughts & Notes</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share bug details, UI suggestions, question corrections, or features you want to see..."
                rows={4}
                maxLength={600}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <div className="text-right text-[10px] text-slate-500 mt-1">
                {comment.length}/600 characters
              </div>
            </div>

            {/* Submit */}
            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium rounded-xl flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
              >
                <Send className="w-3.5 h-3.5" />
                {submitting ? 'Submitting...' : 'Send Feedback'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

