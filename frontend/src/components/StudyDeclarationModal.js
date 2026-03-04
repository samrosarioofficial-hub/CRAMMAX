import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { BookOpen, X } from 'lucide-react';

const StudyDeclarationModal = ({ show, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    subject: '',
    exam_board: '',
    grade: '',
    topic: '',
    study_material: ''
  });

  const handleSubmit = () => {
    if (!formData.subject || !formData.topic) {
      alert('Please fill in at least Subject and Topic');
      return;
    }
    onSubmit(formData);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-8" data-testid="study-declaration-modal">
      <div className="bg-zinc-900 border border-zinc-800 rounded-sm p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-primary" strokeWidth={1.5} />
            <h2 className="font-heading font-black text-3xl uppercase tracking-tighter">DECLARE STUDY TOPIC</h2>
          </div>
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 rounded-none"
            data-testid="close-declaration-modal"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>

        <p className="text-zinc-400 text-sm mb-8">
          Declare what you will study. This enables AI verification to ensure genuine learning.
        </p>

        {/* Form */}
        <div className="space-y-6">
          <div>
            <Label className="text-zinc-300 text-xs uppercase tracking-wider mb-2 block">Subject *</Label>
            <Input
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="e.g., Economics, Physics, Mathematics"
              className="bg-zinc-950 border-zinc-800 focus:ring-1 focus:ring-primary rounded-none"
              data-testid="subject-input"
            />
          </div>

          <div>
            <Label className="text-zinc-300 text-xs uppercase tracking-wider mb-2 block">Exam Board</Label>
            <Input
              value={formData.exam_board}
              onChange={(e) => setFormData({ ...formData, exam_board: e.target.value })}
              placeholder="e.g., CBSE, ICSE, IB, AP"
              className="bg-zinc-950 border-zinc-800 focus:ring-1 focus:ring-primary rounded-none"
              data-testid="exam-board-input"
            />
          </div>

          <div>
            <Label className="text-zinc-300 text-xs uppercase tracking-wider mb-2 block">Grade/Class</Label>
            <Input
              value={formData.grade}
              onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
              placeholder="e.g., 12, Grade 10, Year 11"
              className="bg-zinc-950 border-zinc-800 focus:ring-1 focus:ring-primary rounded-none"
              data-testid="grade-input"
            />
          </div>

          <div>
            <Label className="text-zinc-300 text-xs uppercase tracking-wider mb-2 block">Topic/Chapter *</Label>
            <Input
              value={formData.topic}
              onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
              placeholder="e.g., National Income, Newton's Laws, Calculus"
              className="bg-zinc-950 border-zinc-800 focus:ring-1 focus:ring-primary rounded-none"
              data-testid="topic-input"
            />
          </div>

          <div>
            <Label className="text-zinc-300 text-xs uppercase tracking-wider mb-2 block">Study Material (Optional)</Label>
            <Textarea
              value={formData.study_material}
              onChange={(e) => setFormData({ ...formData, study_material: e.target.value })}
              placeholder="Reference: NCERT Chapter 2, textbook pages, or brief context"
              className="bg-zinc-950 border-zinc-800 focus:ring-1 focus:ring-primary rounded-sm min-h-24"
              data-testid="material-input"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="mt-8 flex gap-4">
          <Button
            onClick={onClose}
            className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white rounded-none uppercase tracking-widest font-semibold py-5 border-0 transition-colors duration-100"
            data-testid="cancel-declaration-btn"
          >
            CANCEL
          </Button>
          <Button
            onClick={handleSubmit}
            className="flex-1 bg-primary hover:bg-primary/90 text-white rounded-none uppercase tracking-widest font-semibold py-5 shadow-[0_0_15px_-3px_rgba(37,99,235,0.3)] border-0 transition-colors duration-100"
            data-testid="submit-declaration-btn"
          >
            START SESSION
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StudyDeclarationModal;
