import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Car, Eye, EyeOff, ArrowLeft, Mail, Lock, User, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import "@/styles/auth.css";

const authSchema = z.object({
  email: z.string().email("Email inválido").max(255, "Email demasiado largo"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres").max(100, "Contraseña demasiado larga"),
  fullName: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres").max(100, "Nombre demasiado largo").optional(),
});

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState<"login" | "signup" | "forgot">("login");
  const [formStep, setFormStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard");
      }
    };
    checkUser();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validated = authSchema.pick({ email: true, password: true }).parse({ email, password });
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: validated.email,
        password: validated.password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast.error("Credenciales incorrectas");
        } else {
          toast.error("Error al iniciar sesión: " + error.message);
        }
        return;
      }

      if (data.session) {
        toast.success("¡Bienvenido de nuevo!");
        navigate("/dashboard");
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error("Error al validar los datos");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validated = authSchema.parse({ email, password, fullName });
      
      const redirectUrl = `${window.location.origin}/dashboard`;
      
      const { data, error } = await supabase.auth.signUp({
        email: validated.email,
        password: validated.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: validated.fullName,
          },
        },
      });

      if (error) {
        if (error.message.includes("already registered")) {
          toast.error("Este email ya está registrado");
        } else {
          toast.error("Error al registrarse: " + error.message);
        }
        return;
      }

      if (data.user) {
        toast.success("¡Cuenta creada con éxito!");
        navigate("/dashboard");
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error("Error al validar los datos");
      }
    } finally {
      setLoading(false);
    }
  };

  const validateField = (field: string, value: string) => {
    try {
      if (field === 'email') {
        authSchema.shape.email.parse(value);
        setErrors(prev => ({ ...prev, email: '' }));
      } else if (field === 'password') {
        authSchema.shape.password.parse(value);
        setErrors(prev => ({ ...prev, password: '' }));
      } else if (field === 'fullName' && value) {
        authSchema.shape.fullName.parse(value);
        setErrors(prev => ({ ...prev, fullName: '' }));
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors(prev => ({ ...prev, [field]: error.errors[0].message }));
      }
    }
  };

  const handleFieldChange = (field: string, value: string) => {
    if (field === 'email') setEmail(value);
    else if (field === 'password') setPassword(value);
    else if (field === 'fullName') setFullName(value);

    if (touched[field]) {
      validateField(field, value);
    }
  };

  const handleFieldBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const value = field === 'email' ? email : field === 'password' ? password : fullName;
    validateField(field, value);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?reset=success`,
      });

      if (error) {
        toast.error("Error al enviar el correo: " + error.message);
        return;
      }

      toast.success("¡Correo de recuperación enviado!");
      setCurrentStep("login");
    } catch (error) {
      toast.error("Error al procesar la solicitud");
    } finally {
      setLoading(false);
    }
  };

  const renderLoginForm = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="login-email" className="text-sm font-medium flex items-center gap-2">
          <Mail className="h-4 w-4" />
          Email Corporativo
        </Label>
        <Input
          id="login-email"
          type="email"
          placeholder="tu.email@empresa.com"
          value={email}
          onChange={(e) => handleFieldChange('email', e.target.value)}
          onBlur={() => handleFieldBlur('email')}
          className={cn(
            "auth-input auth-transition",
            errors.email && touched.email && "border-destructive focus:ring-destructive"
          )}
          required
          disabled={loading}
        />
        {errors.email && touched.email && (
          <p className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {errors.email}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="login-password" className="text-sm font-medium flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Contraseña
          </span>
          <button
            type="button"
            onClick={() => setCurrentStep("forgot")}
            className="text-xs text-primary hover:underline focus:outline-none"
          >
            ¿Olvidaste tu contraseña?
          </button>
        </Label>
        <div className="relative">
          <Input
            id="login-password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => handleFieldChange('password', e.target.value)}
            onBlur={() => handleFieldBlur('password')}
            className={cn(
              "auth-input auth-transition pr-10",
              errors.password && touched.password && "border-destructive focus:ring-destructive"
            )}
            required
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && touched.password && (
          <p className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {errors.password}
          </p>
        )}
      </div>

      <Button 
        type="submit" 
        className="w-full auth-button auth-transition hover:scale-[1.02]" 
        disabled={loading || !email || !password || !!errors.email || !!errors.password}
        size="lg"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Iniciando sesión...
          </>
        ) : (
          "Iniciar Sesión"
        )}
      </Button>

      <div className="text-center text-sm text-muted-foreground">
        ¿No tienes una cuenta?{" "}
        <button
          type="button"
          onClick={() => setCurrentStep("signup")}
          className="text-primary hover:underline focus:outline-none"
        >
          Regístrate aquí
        </button>
      </div>
    </div>
  );

  const renderSignupForm = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="signup-name" className="text-sm font-medium flex items-center gap-2">
          <User className="h-4 w-4" />
          Nombre Completo
        </Label>
        <Input
          id="signup-name"
          type="text"
          placeholder="Juan Pérez García"
          value={fullName}
          onChange={(e) => handleFieldChange('fullName', e.target.value)}
          onBlur={() => handleFieldBlur('fullName')}
          className={cn(
            "auth-input auth-transition",
            errors.fullName && touched.fullName && "border-destructive focus:ring-destructive"
          )}
          required
          disabled={loading}
        />
        {errors.fullName && touched.fullName && (
          <p className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {errors.fullName}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-email" className="text-sm font-medium flex items-center gap-2">
          <Mail className="h-4 w-4" />
          Email Corporativo
        </Label>
        <Input
          id="signup-email"
          type="email"
          placeholder="tu.email@empresa.com"
          value={email}
          onChange={(e) => handleFieldChange('email', e.target.value)}
          onBlur={() => handleFieldBlur('email')}
          className={cn(
            "auth-input auth-transition",
            errors.email && touched.email && "border-destructive focus:ring-destructive"
          )}
          required
          disabled={loading}
        />
        {errors.email && touched.email && (
          <p className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {errors.email}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-password" className="text-sm font-medium flex items-center gap-2">
          <Lock className="h-4 w-4" />
          Contraseña
        </Label>
        <div className="relative">
          <Input
            id="signup-password"
            type={showPassword ? "text" : "password"}
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChange={(e) => handleFieldChange('password', e.target.value)}
            onBlur={() => handleFieldBlur('password')}
            className={cn(
              "auth-input auth-transition pr-10",
              errors.password && touched.password && "border-destructive focus:ring-destructive"
            )}
            required
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && touched.password && (
          <p className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {errors.password}
          </p>
        )}
      </div>

      <Button 
        type="submit" 
        className="w-full auth-button auth-transition hover:scale-[1.02]" 
        disabled={loading || !email || !password || !fullName || !!errors.email || !!errors.password || !!errors.fullName}
        size="lg"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creando cuenta...
          </>
        ) : (
          "Crear Cuenta"
        )}
      </Button>

      <div className="text-center text-sm text-muted-foreground">
        ¿Ya tienes una cuenta?{" "}
        <button
          type="button"
          onClick={() => setCurrentStep("login")}
          className="text-primary hover:underline focus:outline-none"
        >
          Inicia sesión aquí
        </button>
      </div>
    </div>
  );

  const renderForgotPasswordForm = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Recuperar Contraseña</h3>
        <p className="text-sm text-muted-foreground">
          Ingresa tu email corporativo y te enviaremos instrucciones para restablecer tu contraseña.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="forgot-email" className="text-sm font-medium flex items-center gap-2">
          <Mail className="h-4 w-4" />
          Email Corporativo
        </Label>
        <Input
          id="forgot-email"
          type="email"
          placeholder="tu.email@empresa.com"
          value={email}
          onChange={(e) => handleFieldChange('email', e.target.value)}
          onBlur={() => handleFieldBlur('email')}
          className={cn(
            "auth-input auth-transition",
            errors.email && touched.email && "border-destructive focus:ring-destructive"
          )}
          required
          disabled={loading}
        />
        {errors.email && touched.email && (
          <p className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {errors.email}
          </p>
        )}
      </div>

      <div className="flex gap-3">
        <Button 
          type="button"
          variant="outline" 
          onClick={() => setCurrentStep("login")}
          className="flex-1 auth-button auth-transition"
          disabled={loading}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
        <Button 
          type="submit" 
          className="flex-1 auth-button auth-transition hover:scale-[1.02]" 
          disabled={loading || !email || !!errors.email}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : (
            "Enviar Instrucciones"
          )}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4 auth-container">
      <div className="w-full max-w-md">
        {/* Logo animado */}
        <div className="flex justify-center mb-8 animate-fade-in">
          <div className="bg-gradient-to-br from-primary to-primary/80 p-4 rounded-2xl shadow-lg auth-logo animate-pulse-glow">
            <Car className="h-12 w-12 text-primary-foreground" />
          </div>
        </div>
        
        {/* Card principal con animación */}
        <Card className="border-0 shadow-2xl backdrop-blur-sm bg-white/90 dark:bg-slate-900/90 animate-slide-up auth-card">
          <CardHeader className="space-y-3 text-center pb-6">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent auth-title">
              ParkingManager
            </CardTitle>
            <CardDescription className="text-base text-muted-foreground auth-description">
              Sistema de gestión inteligente de aparcamiento corporativo
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form 
              onSubmit={currentStep === "login" ? handleLogin : currentStep === "signup" ? handleSignup : handleForgotPassword}
              className="space-y-6"
            >
              {currentStep === "login" && renderLoginForm()}
              {currentStep === "signup" && renderSignupForm()}
              {currentStep === "forgot" && renderForgotPasswordForm()}
            </form>
          </CardContent>
        </Card>

        {/* Footer con información de seguridad */}
        <div className="mt-6 text-center text-xs text-muted-foreground">
          <div className="flex items-center justify-center gap-1 mb-2">
            <CheckCircle className="h-3 w-3 text-green-500" />
            <span>Conexión segura con encriptación SSL</span>
          </div>
          <p>© 2024 ParkingManager. Todos los derechos reservados.</p>
        </div>
      </div>
    </div>
  );
}

export default Auth;
