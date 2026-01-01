import { Navbar } from "@/components/layout/navbar";
import { ArrowRight, Book, MessageSquare, Shield, BarChart2, Globe, Zap } from "lucide-react";
import { Link } from "react-router-dom";
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#121212] text-white font-sans selection:bg-[#2D2DFF] selection:text-white">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
         {/* Background Glows */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-purple-900/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-40 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-blue-900/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="container mx-auto px-6 relative z-10 text-center">
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-6 drop-shadow-2xl">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6366f1] to-[#a855f7]">Documentation, Support, & AI.</span>
                <br />
                All in One Place.
            </h1>
            
            <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                Build beautiful docs, automate support with AI agents, and manage customer tickets seamlessly. The enterprise-grade platform you've been waiting for.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link 
                    to="/signup" 
                    className="h-12 px-8 rounded-lg bg-[#1e293b] hover:bg-[#283548] border border-white/10 flex items-center gap-2 font-medium transition-all group"
                >
                    Start Building
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link 
                    to="/demo" 
                    className="h-12 px-8 rounded-lg border border-white/10 hover:bg-white/5 flex items-center font-medium transition-all"
                >
                    Book a Demo
                </Link>
            </div>
        </div>
      </section>
      {/* Features Grid */}
      <section className="py-24 bg-[#121212] relative">
         <div className="container mx-auto px-6">
            <div className="text-center mb-16">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-3">Key Features</h2>
                <h3 className="text-3xl md:text-5xl font-bold mb-4">Everything you need to scale support</h3>
                <p className="text-gray-400 max-w-2xl mx-auto">
                    Stop juggling multiple tools. AIODocs brings documentation, help desk, and AI automation into a single unified workflow.
                </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <FeatureCard 
                    icon={Book}
                    title="Beautiful Documentation"
                    description="Create Notion-style documentation with a rich block editor. Publish instantly with SEO optimization."
                />
                <FeatureCard 
                    icon={MessageSquare}
                    title="AI Chat & RAG"
                    description="Instantly train AI on your docs. Answer 60% of customer queries automatically with context-aware responses."
                />
                <FeatureCard 
                    icon={Shield}
                    title="Support Dashboard"
                    description="Manage tickets that AI can't handle. Collaborate with your team in a unified inbox."
                />
                <FeatureCard 
                    icon={BarChart2}
                    title="Advanced Analytics"
                    description="Measure AI code deflection, search trends, and documentation gaps to improve your content."
                />
                <FeatureCard 
                    icon={Globe}
                    title="Multi-Tenant"
                    description="Built for enterprise. Host multiple organizations and knowledge bases from one account."
                />
                <FeatureCard 
                    icon={Zap}
                    title="Lightning Fast"
                    description="Powered by Next.js 15 and Edge functions for global low-latency performance."
                />
            </div>
         </div>
      </section>
      {/* Footer Simple */}
      <footer className="py-12 border-t border-white/10 bg-[#0F0F0F] text-center">
            <div className="container mx-auto px-6 flex flex-col items-center">
                 <div className="p-2 rounded-lg bg-white/5 mb-4">
                     <Zap className="h-6 w-6 text-white text-opacity-50" />
                 </div>
                 <p className="text-gray-500 text-sm">© 2024 AIODocs Inc. All rights reserved.</p>
            </div>
      </footer>
    </div>
  );
}
function FeatureCard({ icon: Icon, title, description }: { icon: any, title: string, description: string }) {
    return (
        <div className="p-8 rounded-2xl bg-[#1A1A1A] border border-white/5 hover:border-white/10 transition-colors group">
            <div className="h-10 w-10 rounded-lg bg-transparent flex items-center justify-start mb-6 text-white">
                <Icon className="h-8 w-8 stroke-[1.5px]" />
            </div>
            <h4 className="text-xl font-bold mb-3">{title}</h4>
            <p className="text-gray-400 leading-relaxed text-sm">
                {description}
            </p>
        </div>
    )
}