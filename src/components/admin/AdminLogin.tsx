import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminLogin } from "@/lib/admin.server";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

interface AdminLoginProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function AdminLogin({ onSuccess, onCancel }: AdminLoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setError(null);
    setIsLoading(true);

    try {
      const response = await adminLogin({ data: { email, password } });
      
      if (response.error) {
        throw new Error(response.error);
      }

      if (response.data?.session) {
        // Set session on the client supabase client
        await supabase.auth.setSession(response.data.session);
        onSuccess();
      } else {
        throw new Error("Could not retrieve session info.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to authenticate.");
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="stride-section-dark min-h-screen flex items-center justify-center px-4">
      <div
        className={`w-full max-w-md bg-[color:var(--ink)] border border-[color:var(--hairline-dark)] p-8 md:p-10 ${
          shake ? "animate-admin-shake" : ""
        }`}
        style={{ borderRadius: 4 }}
      >
        <div className="text-center mb-8">
          <div className="font-display text-4xl tracking-tight text-white mb-2">
            STRIDE
          </div>
          <div className="eyebrow text-[color:var(--muted-on-dark)] uppercase tracking-wider text-xs font-mono">
            Admin Portal
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-white text-xs uppercase tracking-wider font-mono">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@stridephysio.ie"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              className="bg-black/40 border-[color:var(--hairline-dark)] text-white focus-visible:ring-[color:var(--ember)]"
              style={{ borderRadius: 3 }}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="password" className="text-white text-xs uppercase tracking-wider font-mono">
                Password
              </Label>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              className="bg-black/40 border-[color:var(--hairline-dark)] text-white focus-visible:ring-[color:var(--ember)]"
              style={{ borderRadius: 3 }}
            />
          </div>

          {error && (
            <div className="text-[color:var(--ember)] text-xs font-mono bg-[color:var(--ember)]/10 border border-[color:var(--ember)]/20 px-3 py-2">
              Error: {error}
            </div>
          )}

          <div className="flex flex-col gap-3 pt-2">
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[color:var(--ember)] hover:bg-[color:var(--ember-hover)] text-[color:var(--ember-foreground)] font-medium uppercase tracking-wider py-5"
              style={{ borderRadius: 3 }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Sign In"
              )}
            </Button>

            <Button
              type="button"
              variant="ghost"
              disabled={isLoading}
              onClick={onCancel}
              className="w-full text-[color:var(--muted-on-dark)] hover:text-white hover:bg-white/5 font-mono text-xs uppercase"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
