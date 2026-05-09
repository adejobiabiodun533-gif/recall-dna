import { motion } from 'motion/react';
import { ArrowRight, BookOpen, Brain, Sparkles, Zap, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const features = [
  {
    icon: <Sparkles className="h-6 w-6 text-blue-500" />,
    title: "AI Summaries",
    description: "Transform complex Biochemistry lectures into clear, concise summaries in seconds."
  },
  {
    icon: <Brain className="h-6 w-6 text-blue-500" />,
    title: "Memory Aids",
    description: "Custom mnemonics and memory tricks designed specifically for student life."
  },
  {
    icon: <Zap className="h-6 w-6 text-blue-500" />,
    title: "Practice Questions",
    description: "AI-generated exam-style questions to test your knowledge instantly."
  },
  {
    icon: <BookOpen className="h-6 w-6 text-blue-500" />,
    title: "Smart Vault",
    description: "Securely store and organize all your lecture materials in one beautiful dashboard."
  }
];

export default function LandingPage() {
  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 lg:pt-32 lg:pb-52">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold bg-blue-50 text-blue-600 mb-8">
              <ShieldCheck className="h-4 w-4 mr-2" />
              Trusted by 10,000+ Students
            </span>
            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-gray-900 leading-[1.1] mb-8">
              Smarter studying for <br />
              <span className="text-blue-600">Future Scientists.</span>
            </h1>
            <p className="text-lg text-gray-600 mb-10 leading-relaxed">
              Transform difficult Biochemistry lectures into simplified study notes, mnemonics, and practice questions with AI powered specifically for university students.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/auth"
                className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 hover:shadow-blue-300 flex items-center justify-center group"
              >
                Start Studying Now
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/auth"
                className="w-full sm:w-auto px-8 py-4 bg-white text-gray-900 font-bold rounded-2xl border border-gray-200 hover:bg-gray-50 transition-all"
              >
                Learn More
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-100 rounded-full blur-[120px] opacity-50"></div>
          <div className="absolute bottom-1/4 -right-20 w-[500px] h-[500px] bg-blue-50 rounded-full blur-[160px] opacity-40"></div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Engineered for Success</h2>
            <p className="text-gray-600">Everything you need to master your biochemistry exams.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-8 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-shadow group"
              >
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-4">
          <div className="bg-blue-600 rounded-[3rem] p-12 lg:p-20 text-center relative overflow-hidden shadow-2xl shadow-blue-200">
            <div className="relative z-10">
              <h2 className="text-3xl lg:text-5xl font-bold text-white mb-6">
                Ready to pass that exam?
              </h2>
              <p className="text-blue-100 mb-10 max-w-2xl mx-auto text-lg">
                Join thousands of students who are already using RecallDNA to simplify their lecture materials.
              </p>
              <Link
                to="/auth"
                className="inline-flex items-center px-10 py-4 bg-white text-blue-600 font-bold rounded-2xl hover:bg-blue-50 transition-all"
              >
                Get Started for Free
              </Link>
            </div>
            
            {/* Abstract Shapes */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-700/20 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2"></div>
          </div>
        </div>
      </section>
    </div>
  );
}
