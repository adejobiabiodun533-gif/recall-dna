import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, BookOpen, Brain, Sparkles, Zap, ChevronRight, 
  CheckCircle2, XCircle, RefreshCcw, FileText, Send, Loader2
} from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { StudyMaterial, PracticeQuestion } from '../types';
import ReactMarkdown from 'react-markdown';
import { compareStudyAnswer, processStudyContent, ProcessingType } from '../lib/gemini';

export default function StudyRoomPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [material, setMaterial] = useState<StudyMaterial | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'prep' | 'practice'>('prep');
  
  // Generation State
  const [isGenerating, setIsGenerating] = useState<ProcessingType | null>(null);

  // Practice State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [userTheoryAnswer, setUserTheoryAnswer] = useState('');
  const [theoryFeedback, setTheoryFeedback] = useState<{ score: number; feedback: string; isCorrect: boolean } | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  useEffect(() => {
    const fetchMaterial = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'materials', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setMaterial({ id: docSnap.id, ...docSnap.data() } as StudyMaterial);
        } else {
          navigate('/dashboard');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMaterial();
  }, [id, navigate]);

  const handleManualGeneration = async (type: ProcessingType) => {
    if (!material || !id) return;
    setIsGenerating(type);
    try {
      const result = await processStudyContent(material.originalContent, [type]);
      const docRef = doc(db, 'materials', id);
      
      let updateData: any = {};
      if (type === 'summary') updateData.summary = result.summary;
      if (type === 'mnemonics') updateData.mnemonics = result.mnemonics;
      if (type === 'keyPoints') {
        updateData.keyPoints = result.keyPoints;
        // Also update summary if it has key points in it (fallback for legacy)
      }

      await updateDoc(docRef, updateData);
      setMaterial({ ...material, ...updateData });
    } catch (err) {
      console.error(err);
      alert("Failed to generate. Please try a shorter section.");
    } finally {
      setIsGenerating(null);
    }
  };

  const handleAnswerSelect = (option: string) => {
    if (showFeedback) return;
    setSelectedAnswer(option);
    setShowFeedback(true);
    if (option === material?.practiceQuestions[currentQuestionIndex].answer) {
      setScore(score + 1);
    }
  };

  const handleTheorySubmit = async () => {
    if (!material || !userTheoryAnswer.trim() || isComparing) return;
    setIsComparing(true);
    try {
      const question = material.practiceQuestions[currentQuestionIndex];
      const result = await compareStudyAnswer(question.question, question.answer, userTheoryAnswer);
      setTheoryFeedback(result);
      setShowFeedback(true);
      if (result.isCorrect) setScore(score + 1);
    } catch (err) {
      console.error(err);
    } finally {
      setIsComparing(false);
    }
  };

  const nextQuestion = () => {
    if (!material) return;
    if (currentQuestionIndex < material.practiceQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setUserTheoryAnswer('');
      setTheoryFeedback(null);
      setShowFeedback(false);
    } else {
      setQuizFinished(true);
    }
  };

  const resetQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setUserTheoryAnswer('');
    setTheoryFeedback(null);
    setShowFeedback(false);
    setScore(0);
    setQuizFinished(false);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  if (!material) return null;

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      <div className="bg-white border-b border-gray-100 py-6">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/dashboard')}
              className="p-2 hover:bg-gray-50 rounded-xl transition-colors text-gray-400 hover:text-gray-900"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900 pr-4">{material.fileName}</h1>
              <p className="text-blue-600 text-xs font-bold uppercase tracking-wider">{material.course || 'Biochemistry'}</p>
            </div>
          </div>

          <div className="flex bg-gray-100 p-1 rounded-2xl">
            <button
              onClick={() => setActiveTab('prep')}
              className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'prep' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Sparkles className="h-4 w-4" />
              Prep Study
            </button>
            <button
              onClick={() => setActiveTab('practice')}
              className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'practice' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Zap className="h-4 w-4" />
              Practice
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-10">
        <AnimatePresence mode="wait">
          {activeTab === 'prep' ? (
            <motion.div
              key="prep"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-10"
            >
              <div className="lg:col-span-8 space-y-10">
                {/* Summary */}
                <section className="bg-white p-8 lg:p-12 rounded-[3rem] shadow-sm border border-gray-100 min-h-[300px] flex flex-col">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                        <FileText className="h-5 w-5" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900">AI Summary</h2>
                    </div>
                    {!material.summary && (
                      <button 
                        onClick={() => handleManualGeneration('summary')}
                        disabled={!!isGenerating}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {isGenerating === 'summary' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                        Generate
                      </button>
                    )}
                  </div>
                  {material.summary ? (
                    <div className="prose prose-blue max-w-none text-gray-700 leading-relaxed markdown-content">
                      <ReactMarkdown>{material.summary}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className="flex-grow flex flex-col items-center justify-center text-center py-10 opacity-40">
                      <FileText className="h-12 w-12 mb-4" />
                      <p className="font-medium">No summary generated yet.</p>
                    </div>
                  )}
                </section>

                {/* Key Points */}
                <section className="bg-white p-8 lg:p-12 rounded-[3rem] shadow-sm border border-gray-100 min-h-[300px]">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                        <Sparkles className="h-5 w-5" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900">Key Exam Points</h2>
                    </div>
                    {(!material.keyPoints || material.keyPoints.length === 0) && (
                      <button 
                        onClick={() => handleManualGeneration('keyPoints')}
                        disabled={!!isGenerating}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {isGenerating === 'keyPoints' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                        Generate
                      </button>
                    )}
                  </div>
                  {material.keyPoints && material.keyPoints.length > 0 ? (
                    <ul className="space-y-4">
                      {material.keyPoints.map((point, i) => (
                        <li key={i} className="flex gap-4 p-4 bg-gray-50 rounded-2xl group transition-all">
                          <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                            {i + 1}
                          </div>
                          <p className="text-gray-700 font-medium">{point}</p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center py-10 opacity-40">
                      <Sparkles className="h-12 w-12 mb-4" />
                      <p className="font-medium">Unlock key points by clicking generate.</p>
                    </div>
                  )}
                </section>
              </div>

              <div className="lg:col-span-4 space-y-8">
                <section className="bg-blue-600 p-8 rounded-[3rem] text-white shadow-xl shadow-blue-100 relative overflow-hidden min-h-[300px]">
                  <Brain className="absolute top-4 right-4 h-24 w-24 opacity-10 -rotate-12" />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                          <Brain className="h-5 w-5" />
                        </div>
                        <h2 className="text-xl font-bold">Mnemonics</h2>
                      </div>
                      {(!material.mnemonics || material.mnemonics.length === 0) && (
                        <button 
                          onClick={() => handleManualGeneration('mnemonics')}
                          disabled={!!isGenerating}
                          className="p-2 bg-white/20 hover:bg-white/30 rounded-lg backdrop-blur-md transition-all"
                          title="Generate Mnemonics"
                        >
                          {isGenerating === 'mnemonics' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                        </button>
                      )}
                    </div>
                    {material.mnemonics && material.mnemonics.length > 0 ? (
                      <div className="space-y-6">
                        {material.mnemonics.map((mnemonic, i) => (
                          <div key={i} className="p-5 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10">
                            <p className="text-sm italic leading-relaxed">"{mnemonic}"</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-10 opacity-60">
                        <p className="text-sm">No mnemonics yet.</p>
                      </div>
                    )}
                  </div>
                </section>

                <div className="bg-white p-8 rounded-[3rem] border border-gray-100 border-dashed text-center">
                  <Sparkles className="h-10 w-10 text-blue-200 mx-auto mb-4" />
                  <h3 className="font-bold text-gray-900 mb-2">Study Tips</h3>
                  <p className="text-sm text-gray-500">Focus on the points in <span className="text-blue-600 font-bold">Blue</span> as they usually represent core biochemistry pathways.</p>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="practice"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-3xl mx-auto"
            >
              {!quizFinished ? (
                <div className="space-y-8">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex-grow h-2 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${((currentQuestionIndex + 1) / material.practiceQuestions.length) * 100}%` }}
                        className="h-full bg-blue-600 rounded-full"
                      />
                    </div>
                    <span className="text-sm font-bold text-gray-400">
                      {currentQuestionIndex + 1} / {material.practiceQuestions.length}
                    </span>
                  </div>

                  <div className="bg-white p-10 lg:p-14 rounded-[3rem] shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-6">
                      <span className="px-3 py-1 bg-blue-100 text-blue-600 text-[10px] font-black uppercase tracking-widest rounded-full">
                        {material.practiceQuestions[currentQuestionIndex].type?.replace(/-/g, ' ')}
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-10 leading-snug">
                      {material.practiceQuestions[currentQuestionIndex].question}
                    </h3>

                    <div className="space-y-4">
                      {material.practiceQuestions[currentQuestionIndex].options ? (
                        material.practiceQuestions[currentQuestionIndex].options.map((option, i) => {
                          const isCorrect = option === material.practiceQuestions[currentQuestionIndex].answer;
                          const isSelected = selectedAnswer === option;
                          
                          let variantClasses = "bg-gray-50 border-transparent text-gray-700 hover:bg-gray-100";
                          if (showFeedback) {
                            if (isCorrect) variantClasses = "bg-green-50 border-green-200 text-green-700";
                            else if (isSelected) variantClasses = "bg-red-50 border-red-200 text-red-700";
                            else variantClasses = "opacity-40 bg-gray-50 border-transparent text-gray-700";
                          }
                          
                          return (
                            <button
                              key={i}
                              disabled={showFeedback}
                              onClick={() => handleAnswerSelect(option)}
                              className={`w-full text-left p-6 rounded-2xl border-2 transition-all font-medium flex items-center justify-between group ${variantClasses}`}
                            >
                              <span>{option}</span>
                              {showFeedback && isCorrect && <CheckCircle2 className="h-5 w-5" />}
                              {showFeedback && isSelected && !isCorrect && <XCircle className="h-5 w-5" />}
                            </button>
                          );
                        })
                      ) : (
                        <div className="space-y-6">
                           <textarea 
                             value={userTheoryAnswer}
                             onChange={(e) => setUserTheoryAnswer(e.target.value)}
                             disabled={showFeedback}
                             placeholder="Type your answer here..."
                             className="w-full h-32 p-6 rounded-2xl border-2 border-gray-100 bg-gray-50 focus:bg-white focus:border-blue-600 outline-none transition-all resize-none font-medium"
                           />
                           {!showFeedback && (
                             <button
                               onClick={handleTheorySubmit}
                               disabled={!userTheoryAnswer.trim() || isComparing}
                               className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-blue-700 transition-all disabled:opacity-50"
                             >
                               {isComparing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                               Submit Answer
                             </button>
                           )}
                        </div>
                      )}
                    </div>

                    <AnimatePresence>
                      {showFeedback && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-10 p-8 bg-gray-50 rounded-[2rem] border border-gray-100"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <p className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                              {theoryFeedback ? (
                                <span className={theoryFeedback.isCorrect ? "text-green-600" : "text-amber-600"}>
                                  Score: {theoryFeedback.score}%
                                </span>
                              ) : (
                                <>
                                  <Sparkles className="h-4 w-4 text-blue-500" />
                                  Explanation
                                </>
                              )}
                            </p>
                            {theoryFeedback && (
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${theoryFeedback.isCorrect ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                {theoryFeedback.isCorrect ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                              </div>
                            )}
                          </div>
                          
                          <div className="text-gray-700 leading-relaxed space-y-4">
                            {theoryFeedback ? (
                               <p className="font-medium text-lg">{theoryFeedback.feedback}</p>
                            ) : (
                               <p>{material.practiceQuestions[currentQuestionIndex].explanation || "Assess your understanding against the correct answer below."}</p>
                            )}
                            
                            <div className="p-6 bg-white rounded-2xl border border-gray-100">
                              <p className="text-[10px] font-black text-blue-600 uppercase mb-2 tracking-widest">Target Solution</p>
                              <p className="font-bold text-gray-900">{material.practiceQuestions[currentQuestionIndex].answer}</p>
                            </div>
                          </div>
                          
                          <button
                            onClick={nextQuestion}
                            className="mt-8 w-full py-4 bg-gray-900 text-white font-bold rounded-2xl hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
                          >
                            {currentQuestionIndex < material.practiceQuestions.length - 1 ? 'Next Question' : 'Finish Quiz'}
                            <ChevronRight className="h-5 w-5" />
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              ) : (
                <div className="text-center py-20 bg-white rounded-[3rem] border border-gray-100 shadow-sm">
                  <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8">
                    <CheckCircle2 className="h-12 w-12 text-green-600" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">Success! Session Complete</h2>
                  <p className="text-gray-500 mb-10 max-w-sm mx-auto">
                    You've finished the practice session for {material.fileName}. 
                    Keep going to master the material!
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button
                      onClick={resetQuiz}
                      className="px-8 py-4 bg-blue-600 text-white font-bold rounded-2xl flex items-center gap-2 shadow-lg shadow-blue-100"
                    >
                      <RefreshCcw className="h-5 w-5" />
                      Try Again
                    </button>
                    <button
                      onClick={() => navigate('/dashboard')}
                      className="px-8 py-4 bg-white text-gray-900 font-bold border border-gray-200 rounded-2xl"
                    >
                      Back to Dashboard
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
