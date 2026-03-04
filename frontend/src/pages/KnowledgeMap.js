import React, { useState, useEffect } from 'react';
import apiClient from '@/utils/api';
import Navigation from '@/components/Navigation';
import { Map, TrendingUp, Award, BookOpen } from 'lucide-react';

const KnowledgeMap = () => {
  const [knowledgeMap, setKnowledgeMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchKnowledgeMap();
  }, []);

  const fetchKnowledgeMap = async () => {
    try {
      const response = await apiClient.get('/knowledge-map');
      setKnowledgeMap(response.data.knowledge_map);
    } catch (error) {
      console.error('Error fetching knowledge map:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMasteryColor = (level) => {
    if (level === 0) return 'text-zinc-600';
    if (level === 1) return 'text-yellow-500';
    if (level === 2) return 'text-blue-500';
    if (level === 3) return 'text-primary';
    return 'text-zinc-600';
  };

  const getMasteryIcon = (level) => {
    if (level === 3) return '★★★';
    if (level === 2) return '★★';
    if (level === 1) return '★';
    return '☆';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-400 font-mono-display">LOADING...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="flex items-center gap-4 mb-12">
          <Map className="h-10 w-10 text-primary" strokeWidth={1.5} />
          <h1 className="font-heading font-black text-5xl uppercase tracking-tighter" data-testid="knowledge-map-title">
            KNOWLEDGE MAP
          </h1>
        </div>

        {Object.keys(knowledgeMap).length === 0 ? (
          <div className="stat-card p-12 rounded-sm text-center">
            <BookOpen className="h-16 w-16 text-zinc-700 mx-auto mb-4" />
            <div className="text-zinc-400 text-lg mb-2">No study progress yet</div>
            <div className="text-zinc-600 text-sm">Complete sessions with AI verification to build your knowledge map</div>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(knowledgeMap).map(([subject, topics]) => (
              <div key={subject} className="stat-card p-8 rounded-sm" data-testid={`subject-${subject}`}>
                <h2 className="font-heading text-3xl uppercase tracking-wider font-semibold mb-6 text-white">
                  {subject}
                </h2>
                
                <div className="space-y-4">
                  {topics.map((topic, idx) => (
                    <div
                      key={idx}
                      className="bg-zinc-900/40 border border-zinc-800 rounded-sm p-6 hover:bg-zinc-800/60 transition-colors duration-100"
                      data-testid={`topic-${idx}`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-white text-xl font-semibold">{topic.topic}</h3>
                            <span className={`text-2xl ${getMasteryColor(topic.mastery_level)}`}>
                              {getMasteryIcon(topic.mastery_level)}
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className={`text-sm font-semibold ${getMasteryColor(topic.mastery_level)}`}>
                              {topic.mastery_name.toUpperCase()}
                            </span>
                            <span className="text-zinc-600 text-xs">
                              Last studied: {new Date(topic.last_studied).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <div className="text-zinc-500 text-xs uppercase tracking-wider mb-1">ATTEMPTS</div>
                          <div className="font-mono-display text-xl text-white">{topic.quiz_attempts}</div>
                        </div>
                        <div>
                          <div className="text-zinc-500 text-xs uppercase tracking-wider mb-1">PASSED</div>
                          <div className="font-mono-display text-xl text-primary">{topic.quizzes_passed}</div>
                        </div>
                        <div>
                          <div className="text-zinc-500 text-xs uppercase tracking-wider mb-1">STUDY XP</div>
                          <div className="font-mono-display text-xl text-white">{topic.study_xp}</div>
                        </div>
                        <div>
                          <div className="text-zinc-500 text-xs uppercase tracking-wider mb-1">KNOWLEDGE XP</div>
                          <div className="font-mono-display text-xl text-primary">{topic.knowledge_xp}</div>
                        </div>
                      </div>

                      {/* Mastery Progress Bar */}
                      <div className="mt-4">
                        <div className="h-2 bg-zinc-800 rounded-none overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all duration-500"
                            style={{ width: `${(topic.mastery_level / 3) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info */}
        <div className="mt-8 stat-card p-6 rounded-sm">
          <div className="flex items-center gap-3 mb-3">
            <Award className="h-5 w-5 text-primary" />
            <h3 className="font-heading text-lg uppercase tracking-wider font-semibold">MASTERY LEVELS</h3>
          </div>
          <div className="space-y-2 text-sm">
            <p className="text-zinc-400">☆ <strong className="text-zinc-500">Not Started</strong> - Topic not studied yet</p>
            <p className="text-zinc-400">★ <strong className="text-yellow-500">Basic</strong> - 1-2 quizzes passed</p>
            <p className="text-zinc-400">★★ <strong className="text-blue-500">Concept Clarity</strong> - 3-5 quizzes passed</p>
            <p className="text-zinc-400">★★★ <strong className="text-primary">Mastery</strong> - 6+ quizzes passed</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeMap;
