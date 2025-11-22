import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserProfile, ProfileUpdateData } from "@/types/profile";
import { DisabledControlTooltip } from "@/components/DisabledControlTooltip";

/**
 * Validation schema for profile form
 * 
 * Rules:
 * - full_name: Required, 2-100 characters
 * - phone: Optional, international format validation
 */
const profileSchema = z.object({
  full_name: z
    .string()
    .min(2, "Mínimo 2 caracteres")
    .max(100, "Máximo 100 caracteres"),
  phone: z
    .string()
    .regex(/^[+]?[\d\s()-]{9,20}$/, "Formato de teléfono inválido")
    .optional()
    .or(z.literal("")),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileEditorProps {
  profile: UserProfile;
  onUpdate: (data: ProfileUpdateData) => Promise<void>;
  isLoading: boolean;
  isOffline?: boolean;
}

/**
 * ProfileEditor Component
 * 
 * Form for editing user profile data (name and phone).
 * 
 * Features:
 * - React Hook Form with Zod validation
 * - Inline validation errors
 * - Loading state during save
 * - Dirty state detection for unsaved changes
 * - Email displayed as readonly
 * - Accessible form with proper ARIA labels
 * - Offline mode support with disabled form and tooltips
 * 
 * @param profile - Current user profile data
 * @param onUpdate - Function to update profile
 * @param isLoading - Loading state from parent
 * @param isOffline - Whether the app is offline (disables editing)
 */
export const ProfileEditor = ({ profile, onUpdate, isLoading, isOffline = false }: ProfileEditorProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile.full_name || "",
      phone: profile.phone || "",
    },
  });

  // Reset form when profile changes
  useEffect(() => {
    reset({
      full_name: profile.full_name || "",
      phone: profile.phone || "",
    });
  }, [profile, reset]);

  /**
   * Handle form submission
   */
  const onSubmit = async (data: ProfileFormData) => {
    try {
      await onUpdate({
        full_name: data.full_name,
        phone: data.phone || "",
      });
      // Reset dirty state after successful update
      reset(data);
    } catch (error) {
      // Error handling is done in the hook
      console.error("Error in ProfileEditor:", error);
    }
  };

  /**
   * Warn user about unsaved changes
   */
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl sm:text-2xl">Datos Personales</CardTitle>
        <CardDescription className="text-sm sm:text-base">
          Actualiza tu información personal. El email no puede ser modificado.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} aria-label="Editar perfil personal" className="space-y-4 sm:space-y-6">
          {/* Email (readonly) */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm sm:text-base">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={profile.email}
              disabled
              className="bg-muted cursor-not-allowed text-sm sm:text-base min-h-[44px]"
              aria-readonly="true"
              aria-label="Email (solo lectura)"
            />
            <p className="text-xs sm:text-sm text-muted-foreground">
              El email no puede ser modificado
            </p>
          </div>

          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="full_name" className="text-sm sm:text-base">
              Nombre completo <span className="text-destructive" aria-label="requerido">*</span>
            </Label>
            <DisabledControlTooltip isDisabled={isOffline}>
              <Input
                id="full_name"
                type="text"
                {...register("full_name")}
                aria-required="true"
                aria-invalid={!!errors.full_name}
                aria-describedby={errors.full_name ? "full_name_error" : undefined}
                disabled={isSubmitting || isOffline}
                className="text-sm sm:text-base min-h-[44px]"
                placeholder="Ej: Juan Pérez"
              />
            </DisabledControlTooltip>
            {errors.full_name && (
              <p
                id="full_name_error"
                role="alert"
                className="text-xs sm:text-sm text-destructive flex items-center gap-2"
              >
                <span className="sr-only">Error:</span>
                {errors.full_name.message}
              </p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm sm:text-base">
              Teléfono
            </Label>
            <DisabledControlTooltip isDisabled={isOffline}>
              <Input
                id="phone"
                type="tel"
                placeholder="+34 600 123 456"
                {...register("phone")}
                aria-invalid={!!errors.phone}
                aria-describedby={errors.phone ? "phone_error phone_help" : "phone_help"}
                disabled={isSubmitting || isOffline}
                className="text-sm sm:text-base min-h-[44px]"
              />
            </DisabledControlTooltip>
            {errors.phone && (
              <p
                id="phone_error"
                role="alert"
                className="text-xs sm:text-sm text-destructive flex items-center gap-2"
              >
                <span className="sr-only">Error:</span>
                {errors.phone.message}
              </p>
            )}
            <p id="phone_help" className="text-xs sm:text-sm text-muted-foreground">
              Formato internacional: +34 600 123 456
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 pt-2">
            <DisabledControlTooltip isDisabled={isOffline}>
              <Button
                type="submit"
                disabled={!isDirty || isSubmitting || isLoading || isOffline}
                className="min-h-[44px] w-full sm:w-auto text-sm sm:text-base"
                aria-label={isSubmitting || isLoading ? "Guardando cambios" : "Guardar cambios"}
              >
                {isSubmitting || isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    Guardando...
                  </>
                ) : (
                  "Guardar cambios"
                )}
              </Button>
            </DisabledControlTooltip>
            
            {isDirty && !isSubmitting && !isOffline && (
              <p className="text-xs sm:text-sm text-muted-foreground" role="status" aria-live="polite">
                Tienes cambios sin guardar
              </p>
            )}
            
            {isOffline && (
              <p className="text-xs sm:text-sm text-muted-foreground" role="status" aria-live="polite">
                Edición deshabilitada sin conexión
              </p>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
