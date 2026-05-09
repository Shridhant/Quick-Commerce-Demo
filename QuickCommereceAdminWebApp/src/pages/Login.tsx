import type React from "react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "motion/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { toast } from "sonner"

interface LoginFormData {
  email: string
  password: string
}

const Login: React.FC = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  })
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [error, setError] = useState<string>("")

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    if (error) {
      setError("")
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      await login(formData.email, formData.password)
      toast.success("Login successful!")
      navigate("/dashboard")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed"
      setError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f6f8ef] px-4 py-8">
      <div className="absolute -left-24 top-12 h-72 w-72 rounded-full bg-[#d8f4b8]/70 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[#b9ead0]/55 blur-3xl" />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(246,248,239,0.86)_48%,rgba(239,247,229,0.92))]" />

      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative z-10 w-full max-w-[410px]"
      >
        <div className="overflow-hidden rounded-[24px] border border-white/80 bg-white/92 shadow-[0_22px_60px_rgba(47,74,42,0.14)] backdrop-blur-sm">
          <div className="px-8 pb-8 pt-8 sm:px-10">
            <div className="mb-7 flex justify-center">
              <div className="rounded-2xl border border-[#edf4e4] bg-[#fbfff7] px-4 py-3 shadow-[0_10px_24px_rgba(57,99,44,0.08)]">
                <img
                  src="/Fresh and fast delivery logo.png"
                  alt="Paiilo"
                  className="h-14 w-auto object-contain"
                />
              </div>
            </div>

            <div className="mb-8 text-center">
              <h1 className="text-[20px] font-semibold tracking-[-0.01em] text-[#172313]">
                Sign in to Paiilo
              </h1>
              <p className="mt-2 text-[14px] leading-5 text-[#687363]">
                Welcome back. Enter your admin details to continue.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[13px] font-semibold text-[#25331f]">
                  Email address
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  disabled={isLoading}
                  className="h-12 rounded-xl border-[#dfe8d8] bg-[#fbfdf8] px-4 text-[14px] text-[#172313] shadow-none placeholder:text-[#9ba697] focus-visible:border-[#7eb957] focus-visible:ring-[3px] focus-visible:ring-[#dcefd0]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-[13px] font-semibold text-[#25331f]">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    disabled={isLoading}
                    className="h-12 rounded-xl border-[#dfe8d8] bg-[#fbfdf8] px-4 pr-12 text-[14px] text-[#172313] shadow-none placeholder:text-[#9ba697] focus-visible:border-[#7eb957] focus-visible:ring-[3px] focus-visible:ring-[#dcefd0]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b9887] transition-colors hover:text-[#4f6547] disabled:opacity-50"
                  >
                    {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                  </button>
                </div>
              </div>

              {error ? (
                <div className="rounded-xl border border-[#f1cccc] bg-[#fff7f7] px-3 py-2 text-[13px] text-[#b42318]">
                  {error}
                </div>
              ) : null}

              <Button
                type="submit"
                disabled={isLoading}
                className="h-12 w-full rounded-xl bg-gradient-to-b from-[#7fbe49] to-[#5fa733] text-[14px] font-semibold text-white shadow-[0_12px_24px_rgba(99,167,51,0.26),inset_0_1px_0_rgba(255,255,255,0.22)] transition-all duration-200 hover:-translate-y-0.5 hover:from-[#75b73e] hover:to-[#579b2d] focus-visible:ring-[#cfe9bd]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Continue"
                )}
              </Button>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default Login
