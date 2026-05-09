import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Search, FileText, MoreVertical, Trash2, Edit2, 
  Upload, Filter, Clock, BookOpen, AlertCircle, Sparkles, Brain, Zap
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc, orderBy, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../lib/AuthContext';
import { StudyMaterial } from '../types';
import { Link } from 'react-router-dom';
import { processStudyContent, ProcessingType } from '../lib/gemini';
import * as pdfjsLib from 'pdfjs-dist';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export default function DashboardPage() {
  const { user } = useAuth();
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadStatus, setUploadStatus] = useState('');
  const [showConfig, setShowConfig] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<ProcessingType[]>(['summary', 'keyPoints', 'mcqs']);

  const fetchMaterials = async () => {
    if (!user) return;
    try {
      const q = query(
        collection(db, 'materials'), 
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudyMaterial));
      setMaterials(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, [user]);

  const extractTextFromPDF = async (data: ArrayBuffer): Promise<string> => {
    const loadingTask = pdfjsLib.getDocument({ data });
    const pdf = await loadingTask.promise;
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str || '')
        .join(' ');
      fullText += pageText + '\n';
    }
    
    return fullText;
  };

  const onFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    setSelectedFile(file);
    setIsUploading(true);
    setUploadStatus('Reading file content...');
    
    try {
      let text = '';
      if (file.type === 'application/pdf') {
        const arrayBuffer = await file.arrayBuffer();
        text = await extractTextFromPDF(arrayBuffer);
      } else {
        text = await file.text();
      }

      if (!text || text.trim().length < 50) {
        throw new Error('Could not extract enough text from the document.');
      }
      
      setExtractedText(text);
      setShowConfig(true);
    } catch (err: any) {
      setUploadError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleProcess = async () => {
    if (!selectedFile || !user || !extractedText) return;

    setIsUploading(true);
    setUploadError('');
    setShowConfig(false);
    setUploadStatus('AI is processing your selection...');

    try {
      const aiResult = await processStudyContent(extractedText, selectedTypes);
      
      setUploadStatus('Saving to your vault...');
      
      const materialData = {
        userId: user.uid,
        fileName: selectedFile.name,
        originalContent: extractedText.substring(0, 50000),
        summary: aiResult.summary || '',
        mnemonics: aiResult.mnemonics || [],
        keyPoints: aiResult.keyPoints || [],
        practiceQuestions: [
          ...(aiResult.mcqs?.map((q: any) => ({ ...q, type: 'mcq', id: Math.random().toString(36).substr(2, 9) })) || []),
          ...(aiResult.theoryQuestions?.map((q: any) => ({ ...q, type: 'theory', id: Math.random().toString(36).substr(2, 9) })) || []),
          ...(aiResult.fillInGaps?.map((q: any) => ({ ...q, type: 'fill-in-the-gap', id: Math.random().toString(36).substr(2, 9) })) || [])
        ],
        course: selectedFile.name.split('.')[0].substring(0, 20) || 'General',
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'materials'), materialData);
      await fetchMaterials();
      
      // Cleanup
      setSelectedFile(null);
      setExtractedText('');
      setIsUploading(false);
    } catch (err: any) {
      setUploadError(err.message);
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this material?')) return;
    
    try {
      await deleteDoc(doc(db, 'materials', id));
      setMaterials(materials.filter(m => m.id !== id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'materials');
    }
  };

  const filteredMaterials = materials.filter(m => 
    m.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.course?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Your Study Vault</h1>
          <p className="text-gray-500 mt-1 font-medium">Welcome back, {user?.displayName}</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search materials..."
              className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:border-blue-500 transition-all outline-none text-sm w-full md:w-64 shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all cursor-pointer shadow-lg shadow-blue-100">
            <Plus className="h-5 w-5" />
            <span className="hidden sm:inline">Upload Lecture</span>
            <input type="file" className="hidden" onChange={onFileSelect} accept=".txt,.pdf" />
          </label>
        </div>
      </div>

      {/* Configuration Modal */}
      <AnimatePresence>
        {showConfig && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-[3rem] p-8 lg:p-12 max-w-2xl w-full shadow-2xl"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Custom Study Plan</h2>
                  <p className="text-gray-500">Pick what you want our AI to generate for this lecture.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                {[
                  { id: 'summary', label: 'AI Summary', icon: FileText, desc: 'Simplified breakdown of concepts' },
                  { id: 'keyPoints', label: 'Exam Points', icon: Sparkles, desc: 'High-yield topics for tests' },
                  { id: 'mnemonics', label: 'Mnemonics', icon: Brain, desc: 'Memory aids for lists/steps' },
                  { id: 'mcqs', label: 'Practice Quiz', icon: Zap, desc: 'Multiple choice questions' },
                  { id: 'theory', label: 'Theory Practice', icon: BookOpen, desc: 'QA with AI grading' },
                  { id: 'gaps', label: 'Fill-in-gaps', icon: Edit2, desc: 'Test specific term retention' },
                ].map((type) => {
                  const Icon = type.icon;
                  const isSelected = selectedTypes.includes(type.id as ProcessingType);
                  return (
                    <button
                      key={type.id}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedTypes(selectedTypes.filter(t => t !== type.id));
                        } else {
                          setSelectedTypes([...selectedTypes, type.id as ProcessingType]);
                        }
                      }}
                      className={`flex flex-col text-left p-5 rounded-2xl border-2 transition-all group ${
                        isSelected 
                          ? 'border-blue-600 bg-blue-50' 
                          : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Icon className={`h-5 w-5 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} />
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white'}`}>
                          {isSelected && <Plus className="h-3 w-3 text-white" />}
                        </div>
                      </div>
                      <span className={`font-bold block ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>{type.label}</span>
                      <span className="text-[10px] text-gray-500 mt-1">{type.desc}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowConfig(false)}
                  className="flex-1 py-4 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleProcess}
                  disabled={selectedTypes.length === 0}
                  className="flex-[2] py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
                >
                  <Plus className="h-5 w-5" />
                  Generate Study Library
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Uploading Overlay */}
      <AnimatePresence>
        {isUploading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-white/80 backdrop-blur-sm flex items-center justify-center p-6 text-center"
          >
            <div className="max-w-sm">
              <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Upload className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">{uploadStatus || 'Analyzing Lecture Notes'}</h2>
              <p className="text-gray-500 text-sm mb-4">Our AI is breaking down complex topics, generating mnemonics, and creating practice questions for you.</p>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: '5%' }} 
                  animate={{ width: uploadStatus.includes('Organizing') ? '90%' : '60%' }}
                  transition={{ duration: 15, ease: "easeOut" }}
                  className="bg-blue-600 h-full"
                ></motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {uploadError && (
        <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          {uploadError}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-48 bg-gray-100 rounded-3xl animate-pulse"></div>
          ))}
        </div>
      ) : filteredMaterials.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-[3rem] border border-dashed border-gray-200">
          <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
            <FileText className="h-10 w-10 text-gray-300" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">No study materials yet</h2>
          <p className="text-gray-500 max-w-sm mx-auto mb-8">Upload your first lecture note to see how RecallDNA transforms it into a powerful study guide.</p>
          <label className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 font-bold rounded-2xl border-2 border-blue-600 hover:bg-blue-50 transition-all cursor-pointer">
            <Plus className="h-5 w-5" />
            Upload Your First Note
            <input type="file" className="hidden" onChange={onFileSelect} accept=".txt,.pdf" />
          </label>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredMaterials.map((material) => (
            <Link
              key={material.id}
              to={`/study/${material.id}`}
              className="group bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all relative"
            >
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              
              <h3 className="font-bold text-gray-900 mb-1 truncate pr-8" title={material.fileName}>
                {material.fileName}
              </h3>
              <p className="text-xs font-semibold text-blue-500 uppercase tracking-wider mb-4">
                {material.course || 'Unknown Course'}
              </p>
              
              <div className="flex items-center gap-4 text-xs text-gray-400 font-medium pt-4 border-t border-gray-50">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(material.createdAt?.toDate?.() || material.createdAt).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  {material.practiceQuestions?.length || 0} Questions
                </span>
              </div>

              <button 
                onClick={(e) => handleDelete(material.id, e)}
                className="absolute top-6 right-6 p-2 text-gray-300 hover:text-red-500 transition-colors"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
