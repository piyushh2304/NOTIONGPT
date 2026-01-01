
import { useState } from "react";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { Button, Input, DotMap } from "@/components/ui/auth-elements";
import { useAuth } from "@/context/auth-context";

export default function SignupPage() {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Signup failed");

      login(data);
      toast.success("Account created successfully!");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#060818] to-[#0d1023] p-4">
      <div className="flex w-full h-full items-center justify-center">
        <motion.div
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ duration: 0.5 }}
           className="w-full max-w-4xl overflow-hidden rounded-2xl flex bg-[#090b13] text-white shadow-2xl"
        >
           {/* Left Side: Map */}
           <div className="hidden md:block w-1/2 h-[600px] relative overflow-hidden border-r border-[#1f2130]">
             <div className="absolute inset-0 bg-gradient-to-br from-[#0f1120] to-[#151929]">
               <DotMap />
               <div className="absolute inset-0 flex flex-col items-center justify-center p-8 z-10">
                  <h2 className="text-3xl font-bold mb-2 text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">Join NotionGPT</h2>
                  <p className="text-sm text-center text-gray-400 max-w-xs">Start building your knowledge base today</p>
               </div>
             </div>
          </div>
          
          <div className="w-full md:w-1/2 p-8 md:p-10 flex flex-col justify-center">
            <h1 className="text-2xl md:text-3xl font-bold mb-1">Create Account</h1>
            <p className="text-gray-400 mb-8">Start your journey today</p>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
                <Input 
                  type="text" 
                  value={fullName} 
                  onChange={(e) => setFullName(e.target.value)} 
                  required 
                  className="bg-[#13151f] border-[#2a2d3a] text-gray-200" 
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                <Input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                  className="bg-[#13151f] border-[#2a2d3a] text-gray-200" 
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
                <div className="relative">
                  <Input 
                    type={isPasswordVisible ? "text" : "password"} 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required 
                    className="bg-[#13151f] border-[#2a2d3a] text-gray-200 pr-10" 
                    placeholder="Create a password"
                  />
                   <button type="button" onClick={() => setIsPasswordVisible(!isPasswordVisible)} className="absolute inset-y-0 right-0 pr-3 text-gray-400 hover:text-gray-200">
                    {isPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

               <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:hue-rotate-15 text-white shadow-lg shadow-blue-500/25">
                  {loading ? "Creating Account..." : "Sign Up"} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </motion.div>
            </form>
             <div className="mt-6 text-center">
               <p className="text-sm text-gray-400">Already have an account? <Link to="/login" className="text-blue-500 hover:text-blue-400 font-medium">Log in</Link></p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
