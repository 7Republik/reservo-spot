# Design Document

## Overview

El sistema de check-in/check-out permite a los usuarios indicar cuándo están usando una plaza reservada y cuándo la liberan, permitiendo la reutilización de plazas el mismo día. El sistema incluye detección automática de infracciones, generación de amonestaciones y bloqueos temporales configurables.

### Objetivos Principales

1. Permitir check-in/check-out simple y rápido desde la sección "Hoy"
2. Liberar plazas automáticamente tras check-out para reutilización
3. Detectar infracciones automáticamente sin intervención manual
4. Generar amonestaciones y bloqueos según configuración
5. Proporcionar reporting completo para administradores
6. Mantener histórico para análisis y estadísticas

### Principios de Diseño

- **Simplicidad para el usuario**: Interfaz de un solo clic para check-in/check-out
- **Automatización**: Detección de infracciones y amonestaciones sin intervención manual
- **Flexibilidad**: Configuración global y por grupo de parking
- **Transparencia**: Histórico completo y reporting detallado
- **Escalabilidad**: Diseño preparado para miles de reservas diarias

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                         │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Today Section│  │ Admin Config │  │ Admin Reports│      │
│  │  (User UI)   │  │     Panel    │  │    Panel     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Supabase Backend                            │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Database Tables                         │   │
│  │  • reservation_checkins                              │   │
│  │  • checkin_infractions                               │   │
│  │  • checkin_settings (global)                         │   │
│  │  • parking_group_checkin_config                      │   │
│  │  • user_warnings (extended)                          │   │
│  │  • user_blocks (new)                                 │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           Database Functions                         │   │
│  │  • perform_checkin()                                 │   │
│  │  • perform_checkout()                                │   │
│  │  • detect_checkin_infractions()                      │   │
│  │  • detect_checkout_infractions()                     │   │
│  │  • generate_automatic_warning()                      │   │
│  │  • apply_temporary_block()                           │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Scheduled Jobs (pg_cron)                │   │
│  │  • daily_reset_job (00:00)                           │   │
│  │  • infraction_detection_job (every 15 min)           │   │
│  │  • notification_job (configurable)                   │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```


## Components and Interfaces

### Frontend Components

#### 1. TodayCheckinCard Component
**Location**: `src/components/dashboard/TodayCheckinCard.tsx`

**Purpose**: Componente principal en la sección "Hoy" para check-in/check-out

**Props**:
```typescript
interface TodayCheckinCardProps {
  reservation: ReservationWithCheckin;
  onCheckin: () => Promise<void>;
  onCheckout: () => Promise<void>;
}
```

**Features**:
- Muestra información de la reserva activa
- Botón prominente "Llegué" cuando no hay check-in
- Botón prominente "Me voy" después de check-in
- Muestra hora de check-in realizado
- Animaciones de confirmación
- Manejo de estados de carga

#### 2. AdminCheckinConfigTab Component
**Location**: `src/components/admin/configuration/AdminCheckinConfigTab.tsx`

**Purpose**: Panel de configuración global del sistema de check-in

**Features**:
- Toggle para activar/desactivar sistema globalmente
- Configuración de periodo de gracia (0-120 minutos)
- Configuración de umbrales de amonestación (check-in y check-out)
- Configuración de duración de bloqueo temporal (1-90 días)
- Toggle para activar/desactivar notificaciones de recordatorio
- Validación de valores en tiempo real

#### 3. GroupCheckinConfigSection Component
**Location**: `src/components/admin/groups/GroupCheckinConfigSection.tsx`

**Purpose**: Configuración de check-in específica por grupo

**Props**:
```typescript
interface GroupCheckinConfigSectionProps {
  groupId: string;
  groupName: string;
}
```

**Features**:
- Toggle para activar/desactivar check-in en el grupo
- Configuración de ventana de check-in (1-24 horas)
- Opción de usar configuración global o personalizada
- Indicador visual de configuración activa

#### 4. CheckinReportPanel Component
**Location**: `src/components/admin/reports/CheckinReportPanel.tsx`

**Purpose**: Panel de reporting de infracciones y cumplimiento

**Features**:
- Tabla de reservas sin check-in del día
- Tabla de reservas sin check-out del día
- Filtros por grupo, fecha, usuario
- Exportación a CSV
- Estadísticas de cumplimiento
- Gráficos de tendencias

#### 5. CheckinHistoryPanel Component
**Location**: `src/components/admin/reports/CheckinHistoryPanel.tsx`

**Purpose**: Histórico completo de check-ins y check-outs

**Features**:
- Tabla paginada con histórico completo
- Filtros avanzados (usuario, grupo, plaza, fechas)
- Estadísticas por usuario y grupo
- Exportación a CSV
- Visualización de patrones de uso

### Backend Components

#### Database Tables

##### 1. reservation_checkins
```sql
CREATE TABLE public.reservation_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  spot_id UUID NOT NULL REFERENCES public.parking_spots(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES public.parking_groups(id) ON DELETE CASCADE,
  
  checkin_at TIMESTAMPTZ,
  checkout_at TIMESTAMPTZ,
  
  -- Para reservas continuas
  is_continuous_reservation BOOLEAN DEFAULT FALSE,
  continuous_start_date DATE,
  continuous_end_date DATE,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(reservation_id)
);
```

**Indexes**:
- `idx_checkins_user_date` on (user_id, created_at)
- `idx_checkins_group_date` on (group_id, created_at)
- `idx_checkins_pending` on (checkin_at) WHERE checkin_at IS NULL

##### 2. checkin_infractions
```sql
CREATE TABLE public.checkin_infractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reservation_id UUID NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  spot_id UUID NOT NULL REFERENCES public.parking_spots(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES public.parking_groups(id) ON DELETE CASCADE,
  
  infraction_type TEXT NOT NULL CHECK (infraction_type IN ('checkin', 'checkout')),
  infraction_date DATE NOT NULL,
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Contexto
  expected_checkin_window_end TIMESTAMPTZ,
  grace_period_end TIMESTAMPTZ,
  
  -- Estado
  warning_generated BOOLEAN DEFAULT FALSE,
  warning_id UUID REFERENCES public.user_warnings(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes**:
- `idx_infractions_user` on (user_id, infraction_date)
- `idx_infractions_pending_warning` on (user_id, warning_generated) WHERE warning_generated = FALSE

##### 3. checkin_settings
```sql
CREATE TABLE public.checkin_settings (
  id UUID PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
  
  -- Activación global
  system_enabled BOOLEAN DEFAULT FALSE,
  
  -- Configuración de tiempos
  default_checkin_window_hours INTEGER DEFAULT 24 CHECK (default_checkin_window_hours >= 1 AND default_checkin_window_hours <= 24),
  grace_period_minutes INTEGER DEFAULT 60 CHECK (grace_period_minutes >= 0 AND grace_period_minutes <= 120),
  
  -- Umbrales de amonestación
  checkin_infraction_threshold INTEGER DEFAULT 3 CHECK (checkin_infraction_threshold >= 1 AND checkin_infraction_threshold <= 20),
  checkout_infraction_threshold INTEGER DEFAULT 3 CHECK (checkout_infraction_threshold >= 1 AND checkout_infraction_threshold <= 20),
  
  -- Bloqueo temporal
  temporary_block_days INTEGER DEFAULT 7 CHECK (temporary_block_days >= 1 AND temporary_block_days <= 90),
  
  -- Notificaciones
  send_checkin_reminders BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT only_one_checkin_settings CHECK (id = '00000000-0000-0000-0000-000000000001'::uuid)
);
```

##### 4. parking_group_checkin_config
```sql
CREATE TABLE public.parking_group_checkin_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.parking_groups(id) ON DELETE CASCADE,
  
  -- Activación por grupo
  enabled BOOLEAN DEFAULT TRUE,
  
  -- Configuración personalizada
  use_custom_config BOOLEAN DEFAULT FALSE,
  custom_checkin_window_hours INTEGER CHECK (custom_checkin_window_hours >= 1 AND custom_checkin_window_hours <= 24),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(group_id)
);
```

##### 5. user_blocks (nueva tabla)
```sql
CREATE TABLE public.user_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  block_type TEXT NOT NULL CHECK (block_type IN ('manual', 'automatic_checkin', 'automatic_checkout')),
  reason TEXT NOT NULL,
  
  blocked_at TIMESTAMPTZ DEFAULT NOW(),
  blocked_until TIMESTAMPTZ NOT NULL,
  
  -- Referencia a la amonestación que causó el bloqueo
  warning_id UUID REFERENCES public.user_warnings(id),
  
  -- Estado
  is_active BOOLEAN DEFAULT TRUE,
  unblocked_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes**:
- `idx_user_blocks_active` on (user_id, is_active) WHERE is_active = TRUE

##### 6. Extensión de user_warnings
```sql
-- Añadir columnas a user_warnings existente
ALTER TABLE public.user_warnings ADD COLUMN IF NOT EXISTS warning_type TEXT CHECK (warning_type IN ('manual', 'automatic_checkin', 'automatic_checkout'));
ALTER TABLE public.user_warnings ADD COLUMN IF NOT EXISTS infraction_count INTEGER;
ALTER TABLE public.user_warnings ADD COLUMN IF NOT EXISTS auto_generated BOOLEAN DEFAULT FALSE;
```


#### Database Functions

##### 1. perform_checkin()
```sql
CREATE OR REPLACE FUNCTION public.perform_checkin(
  p_reservation_id UUID,
  p_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
  v_reservation RECORD;
  v_checkin_record RECORD;
  v_group_config RECORD;
  v_settings RECORD;
  v_window_end TIMESTAMPTZ;
  v_grace_end TIMESTAMPTZ;
  v_is_late BOOLEAN;
BEGIN
  -- Verificar que la reserva existe y pertenece al usuario
  SELECT r.*, ps.group_id INTO v_reservation
  FROM public.reservations r
  JOIN public.parking_spots ps ON r.spot_id = ps.id
  WHERE r.id = p_reservation_id 
    AND r.user_id = p_user_id
    AND r.status = 'active'
    AND r.reservation_date = CURRENT_DATE;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Reserva no encontrada o no válida');
  END IF;
  
  -- Obtener configuración
  SELECT * INTO v_settings FROM public.checkin_settings WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;
  
  IF NOT v_settings.system_enabled THEN
    RETURN json_build_object('success', false, 'error', 'Sistema de check-in desactivado');
  END IF;
  
  -- Verificar configuración del grupo
  SELECT * INTO v_group_config 
  FROM public.parking_group_checkin_config 
  WHERE group_id = v_reservation.group_id;
  
  IF v_group_config IS NOT NULL AND NOT v_group_config.enabled THEN
    RETURN json_build_object('success', false, 'error', 'Check-in desactivado para este grupo');
  END IF;
  
  -- Verificar si ya existe check-in
  SELECT * INTO v_checkin_record 
  FROM public.reservation_checkins 
  WHERE reservation_id = p_reservation_id;
  
  IF v_checkin_record IS NOT NULL AND v_checkin_record.checkin_at IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 'Check-in ya realizado');
  END IF;
  
  -- Calcular ventana de check-in
  v_window_end := CURRENT_DATE::TIMESTAMPTZ + 
    INTERVAL '1 hour' * COALESCE(
      CASE WHEN v_group_config.use_custom_config THEN v_group_config.custom_checkin_window_hours ELSE NULL END,
      v_settings.default_checkin_window_hours
    );
  
  v_grace_end := v_window_end + INTERVAL '1 minute' * v_settings.grace_period_minutes;
  
  -- Determinar si es tarde
  v_is_late := NOW() > v_grace_end;
  
  -- Crear o actualizar registro de check-in
  INSERT INTO public.reservation_checkins (
    reservation_id, user_id, spot_id, group_id, checkin_at
  ) VALUES (
    p_reservation_id, p_user_id, v_reservation.spot_id, v_reservation.group_id, NOW()
  )
  ON CONFLICT (reservation_id) DO UPDATE
  SET checkin_at = NOW(), updated_at = NOW();
  
  -- Si es tarde, registrar infracción
  IF v_is_late THEN
    INSERT INTO public.checkin_infractions (
      user_id, reservation_id, spot_id, group_id,
      infraction_type, infraction_date,
      expected_checkin_window_end, grace_period_end
    ) VALUES (
      p_user_id, p_reservation_id, v_reservation.spot_id, v_reservation.group_id,
      'checkin', CURRENT_DATE,
      v_window_end, v_grace_end
    );
  END IF;
  
  RETURN json_build_object(
    'success', true, 
    'checkin_at', NOW(),
    'was_late', v_is_late
  );
END;
$$;
```

##### 2. perform_checkout()
```sql
CREATE OR REPLACE FUNCTION public.perform_checkout(
  p_reservation_id UUID,
  p_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
  v_checkin_record RECORD;
BEGIN
  -- Verificar que existe check-in
  SELECT * INTO v_checkin_record
  FROM public.reservation_checkins
  WHERE reservation_id = p_reservation_id
    AND user_id = p_user_id
    AND checkin_at IS NOT NULL
    AND checkout_at IS NULL;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'No hay check-in activo');
  END IF;
  
  -- Registrar checkout
  UPDATE public.reservation_checkins
  SET checkout_at = NOW(), updated_at = NOW()
  WHERE id = v_checkin_record.id;
  
  -- Marcar la plaza como disponible para hoy
  -- (esto se maneja en la lógica de disponibilidad de plazas)
  
  RETURN json_build_object(
    'success', true,
    'checkout_at', NOW()
  );
END;
$$;
```

##### 3. detect_checkin_infractions()
```sql
CREATE OR REPLACE FUNCTION public.detect_checkin_infractions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_settings RECORD;
  v_infractions_created INTEGER := 0;
  v_reservation RECORD;
  v_group_config RECORD;
  v_window_end TIMESTAMPTZ;
  v_grace_end TIMESTAMPTZ;
BEGIN
  -- Obtener configuración
  SELECT * INTO v_settings FROM public.checkin_settings WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;
  
  IF NOT v_settings.system_enabled THEN
    RETURN 0;
  END IF;
  
  -- Buscar reservas de hoy sin check-in que ya pasaron la ventana + gracia
  FOR v_reservation IN
    SELECT r.*, ps.group_id, rc.id as checkin_id
    FROM public.reservations r
    JOIN public.parking_spots ps ON r.spot_id = ps.id
    LEFT JOIN public.reservation_checkins rc ON r.id = rc.reservation_id
    WHERE r.reservation_date = CURRENT_DATE
      AND r.status = 'active'
      AND (rc.checkin_at IS NULL OR rc.id IS NULL)
      AND NOT EXISTS (
        SELECT 1 FROM public.checkin_infractions ci
        WHERE ci.reservation_id = r.id AND ci.infraction_type = 'checkin'
      )
  LOOP
    -- Obtener configuración del grupo
    SELECT * INTO v_group_config
    FROM public.parking_group_checkin_config
    WHERE group_id = v_reservation.group_id;
    
    -- Si el grupo tiene check-in desactivado, saltar
    IF v_group_config IS NOT NULL AND NOT v_group_config.enabled THEN
      CONTINUE;
    END IF;
    
    -- Calcular ventana
    v_window_end := CURRENT_DATE::TIMESTAMPTZ + 
      INTERVAL '1 hour' * COALESCE(
        CASE WHEN v_group_config.use_custom_config THEN v_group_config.custom_checkin_window_hours ELSE NULL END,
        v_settings.default_checkin_window_hours
      );
    
    v_grace_end := v_window_end + INTERVAL '1 minute' * v_settings.grace_period_minutes;
    
    -- Si ya pasó el periodo de gracia, registrar infracción
    IF NOW() > v_grace_end THEN
      INSERT INTO public.checkin_infractions (
        user_id, reservation_id, spot_id, group_id,
        infraction_type, infraction_date,
        expected_checkin_window_end, grace_period_end
      ) VALUES (
        v_reservation.user_id, v_reservation.id, v_reservation.spot_id, v_reservation.group_id,
        'checkin', CURRENT_DATE,
        v_window_end, v_grace_end
      );
      
      v_infractions_created := v_infractions_created + 1;
    END IF;
  END LOOP;
  
  RETURN v_infractions_created;
END;
$$;
```

##### 4. detect_checkout_infractions()
```sql
CREATE OR REPLACE FUNCTION public.detect_checkout_infractions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_settings RECORD;
  v_infractions_created INTEGER := 0;
  v_checkin RECORD;
BEGIN
  -- Obtener configuración
  SELECT * INTO v_settings FROM public.checkin_settings WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;
  
  IF NOT v_settings.system_enabled THEN
    RETURN 0;
  END IF;
  
  -- Buscar check-ins de ayer sin checkout
  FOR v_checkin IN
    SELECT rc.*, r.reservation_date
    FROM public.reservation_checkins rc
    JOIN public.reservations r ON rc.reservation_id = r.id
    WHERE rc.checkin_at IS NOT NULL
      AND rc.checkout_at IS NULL
      AND r.reservation_date < CURRENT_DATE
      AND NOT EXISTS (
        SELECT 1 FROM public.checkin_infractions ci
        WHERE ci.reservation_id = rc.reservation_id AND ci.infraction_type = 'checkout'
      )
      -- Excluir reservas continuas que aún están activas
      AND NOT (
        rc.is_continuous_reservation = TRUE 
        AND rc.continuous_end_date >= CURRENT_DATE
      )
  LOOP
    INSERT INTO public.checkin_infractions (
      user_id, reservation_id, spot_id, group_id,
      infraction_type, infraction_date
    ) VALUES (
      v_checkin.user_id, v_checkin.reservation_id, v_checkin.spot_id, v_checkin.group_id,
      'checkout', v_checkin.reservation_date
    );
    
    v_infractions_created := v_infractions_created + 1;
  END LOOP;
  
  RETURN v_infractions_created;
END;
$$;
```

##### 5. generate_automatic_warnings()
```sql
CREATE OR REPLACE FUNCTION public.generate_automatic_warnings()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_settings RECORD;
  v_warnings_created INTEGER := 0;
  v_user_infractions RECORD;
  v_warning_id UUID;
  v_block_until TIMESTAMPTZ;
BEGIN
  SELECT * INTO v_settings FROM public.checkin_settings WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;
  
  IF NOT v_settings.system_enabled THEN
    RETURN 0;
  END IF;
  
  -- Procesar infracciones de check-in
  FOR v_user_infractions IN
    SELECT user_id, COUNT(*) as infraction_count
    FROM public.checkin_infractions
    WHERE infraction_type = 'checkin'
      AND warning_generated = FALSE
    GROUP BY user_id
    HAVING COUNT(*) >= v_settings.checkin_infraction_threshold
  LOOP
    -- Crear amonestación
    INSERT INTO public.user_warnings (
      user_id, 
      issued_by, 
      reason, 
      warning_type,
      infraction_count,
      auto_generated,
      incident_id
    ) VALUES (
      v_user_infractions.user_id,
      '00000000-0000-0000-0000-000000000000'::uuid, -- Sistema
      format('Amonestación automática por %s infracciones de check-in', v_user_infractions.infraction_count),
      'automatic_checkin',
      v_user_infractions.infraction_count,
      TRUE,
      '00000000-0000-0000-0000-000000000000'::uuid -- Placeholder, necesitamos ajustar el schema
    )
    RETURNING id INTO v_warning_id;
    
    -- Marcar infracciones como procesadas
    UPDATE public.checkin_infractions
    SET warning_generated = TRUE, warning_id = v_warning_id
    WHERE user_id = v_user_infractions.user_id
      AND infraction_type = 'checkin'
      AND warning_generated = FALSE;
    
    -- Crear bloqueo temporal
    v_block_until := NOW() + INTERVAL '1 day' * v_settings.temporary_block_days;
    
    INSERT INTO public.user_blocks (
      user_id, block_type, reason, blocked_until, warning_id
    ) VALUES (
      v_user_infractions.user_id,
      'automatic_checkin',
      format('Bloqueo automático por %s infracciones de check-in', v_user_infractions.infraction_count),
      v_block_until,
      v_warning_id
    );
    
    -- Cancelar reservas futuras durante el periodo de bloqueo
    UPDATE public.reservations
    SET status = 'cancelled', cancelled_at = NOW()
    WHERE user_id = v_user_infractions.user_id
      AND reservation_date BETWEEN CURRENT_DATE AND v_block_until::DATE
      AND status = 'active';
    
    v_warnings_created := v_warnings_created + 1;
  END LOOP;
  
  -- Procesar infracciones de check-out (mismo proceso)
  FOR v_user_infractions IN
    SELECT user_id, COUNT(*) as infraction_count
    FROM public.checkin_infractions
    WHERE infraction_type = 'checkout'
      AND warning_generated = FALSE
    GROUP BY user_id
    HAVING COUNT(*) >= v_settings.checkout_infraction_threshold
  LOOP
    INSERT INTO public.user_warnings (
      user_id, 
      issued_by, 
      reason, 
      warning_type,
      infraction_count,
      auto_generated,
      incident_id
    ) VALUES (
      v_user_infractions.user_id,
      '00000000-0000-0000-0000-000000000000'::uuid,
      format('Amonestación automática por %s infracciones de check-out', v_user_infractions.infraction_count),
      'automatic_checkout',
      v_user_infractions.infraction_count,
      TRUE,
      '00000000-0000-0000-0000-000000000000'::uuid
    )
    RETURNING id INTO v_warning_id;
    
    UPDATE public.checkin_infractions
    SET warning_generated = TRUE, warning_id = v_warning_id
    WHERE user_id = v_user_infractions.user_id
      AND infraction_type = 'checkout'
      AND warning_generated = FALSE;
    
    v_block_until := NOW() + INTERVAL '1 day' * v_settings.temporary_block_days;
    
    INSERT INTO public.user_blocks (
      user_id, block_type, reason, blocked_until, warning_id
    ) VALUES (
      v_user_infractions.user_id,
      'automatic_checkout',
      format('Bloqueo automático por %s infracciones de check-out', v_user_infractions.infraction_count),
      v_block_until,
      v_warning_id
    );
    
    UPDATE public.reservations
    SET status = 'cancelled', cancelled_at = NOW()
    WHERE user_id = v_user_infractions.user_id
      AND reservation_date BETWEEN CURRENT_DATE AND v_block_until::DATE
      AND status = 'active';
    
    v_warnings_created := v_warnings_created + 1;
  END LOOP;
  
  RETURN v_warnings_created;
END;
$$;
```

##### 6. is_user_blocked_by_checkin()
```sql
CREATE OR REPLACE FUNCTION public.is_user_blocked_by_checkin(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_blocks
    WHERE user_id = p_user_id
      AND is_active = TRUE
      AND blocked_until > NOW()
      AND block_type IN ('automatic_checkin', 'automatic_checkout')
  );
$$;
```

##### 7. get_available_spots_with_checkout()
```sql
-- Modificar función existente para incluir plazas liberadas por checkout
CREATE OR REPLACE FUNCTION public.get_available_spots_by_group(
  p_group_id UUID,
  p_date DATE
)
RETURNS TABLE (
  spot_id UUID,
  spot_number TEXT,
  is_early_checkout BOOLEAN
)
LANGUAGE SQL
STABLE
AS $$
  SELECT 
    ps.id as spot_id,
    ps.spot_number,
    CASE 
      WHEN rc.checkout_at IS NOT NULL AND p_date = CURRENT_DATE THEN TRUE
      ELSE FALSE
    END as is_early_checkout
  FROM public.parking_spots ps
  LEFT JOIN public.reservations r ON ps.id = r.spot_id 
    AND r.reservation_date = p_date 
    AND r.status = 'active'
  LEFT JOIN public.reservation_checkins rc ON r.id = rc.reservation_id
  WHERE ps.group_id = p_group_id
    AND ps.is_active = TRUE
    AND (
      r.id IS NULL  -- No hay reserva
      OR (rc.checkout_at IS NOT NULL AND p_date = CURRENT_DATE)  -- Checkout realizado hoy
    );
$$;
```


#### Scheduled Jobs (pg_cron)

##### 1. Daily Reset Job
```sql
-- Ejecutar a las 00:00 todos los días
SELECT cron.schedule(
  'daily-checkin-reset',
  '0 0 * * *',
  $$
    -- Marcar check-ins del día anterior como finalizados
    UPDATE public.reservation_checkins
    SET updated_at = NOW()
    WHERE checkin_at::DATE < CURRENT_DATE
      AND checkout_at IS NULL
      AND NOT (is_continuous_reservation = TRUE AND continuous_end_date >= CURRENT_DATE);
    
    -- Detectar infracciones de checkout del día anterior
    SELECT public.detect_checkout_infractions();
  $$
);
```

##### 2. Infraction Detection Job
```sql
-- Ejecutar cada 15 minutos
SELECT cron.schedule(
  'checkin-infraction-detection',
  '*/15 * * * *',
  $$
    SELECT public.detect_checkin_infractions();
  $$
);
```

##### 3. Warning Generation Job
```sql
-- Ejecutar cada hora
SELECT cron.schedule(
  'automatic-warning-generation',
  '0 * * * *',
  $$
    SELECT public.generate_automatic_warnings();
  $$
);
```

##### 4. Block Expiration Job
```sql
-- Ejecutar cada hora para desactivar bloqueos expirados
SELECT cron.schedule(
  'block-expiration',
  '0 * * * *',
  $$
    UPDATE public.user_blocks
    SET is_active = FALSE, unblocked_at = NOW()
    WHERE is_active = TRUE
      AND blocked_until <= NOW();
  $$
);
```

##### 5. Checkin Reminder Job
```sql
-- Ejecutar cada 30 minutos durante el día
SELECT cron.schedule(
  'checkin-reminder-notifications',
  '*/30 6-22 * * *',
  $$
    -- Esta función enviará notificaciones a usuarios con reservas activas sin check-in
    -- La implementación dependerá del sistema de notificaciones
    SELECT public.send_checkin_reminders();
  $$
);
```

### Custom Hooks

#### 1. useCheckin Hook
**Location**: `src/hooks/useCheckin.ts`

```typescript
interface UseCheckinReturn {
  checkin: (reservationId: string) => Promise<void>;
  checkout: (reservationId: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export const useCheckin = (): UseCheckinReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const checkin = async (reservationId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.rpc('perform_checkin', {
        p_reservation_id: reservationId,
        p_user_id: (await supabase.auth.getUser()).data.user?.id
      });
      
      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      
      if (data.was_late) {
        toast.warning('Check-in realizado fuera de tiempo. Se ha registrado una infracción.');
      } else {
        toast.success('Check-in realizado correctamente');
      }
      
      queryClient.invalidateQueries(['reservations']);
      queryClient.invalidateQueries(['checkins']);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al realizar check-in';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const checkout = async (reservationId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.rpc('perform_checkout', {
        p_reservation_id: reservationId,
        p_user_id: (await supabase.auth.getUser()).data.user?.id
      });
      
      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      
      toast.success('Check-out realizado. La plaza está disponible para otros usuarios.');
      
      queryClient.invalidateQueries(['reservations']);
      queryClient.invalidateQueries(['checkins']);
      queryClient.invalidateQueries(['available-spots']);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al realizar check-out';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return { checkin, checkout, isLoading, error };
};
```

#### 2. useCheckinSettings Hook
**Location**: `src/hooks/admin/useCheckinSettings.ts`

```typescript
interface CheckinSettings {
  system_enabled: boolean;
  default_checkin_window_hours: number;
  grace_period_minutes: number;
  checkin_infraction_threshold: number;
  checkout_infraction_threshold: number;
  temporary_block_days: number;
  send_checkin_reminders: boolean;
}

export const useCheckinSettings = () => {
  const [settings, setSettings] = useState<CheckinSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const isCached = useRef(false);

  const loadSettings = async (forceReload = false) => {
    if (isCached.current && !forceReload) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('checkin_settings')
        .select('*')
        .single();
      
      if (error) throw error;
      setSettings(data);
      isCached.current = true;
    } catch (err) {
      console.error('Error loading checkin settings:', err);
      toast.error('Error al cargar configuración');
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<CheckinSettings>) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('checkin_settings')
        .update(updates)
        .eq('id', '00000000-0000-0000-0000-000000000001');
      
      if (error) throw error;
      
      toast.success('Configuración actualizada');
      await loadSettings(true);
    } catch (err) {
      console.error('Error updating settings:', err);
      toast.error('Error al actualizar configuración');
    } finally {
      setLoading(false);
    }
  };

  return { settings, loading, loadSettings, updateSettings };
};
```

#### 3. useCheckinReports Hook
**Location**: `src/hooks/admin/useCheckinReports.ts`

```typescript
interface CheckinReport {
  user_id: string;
  user_name: string;
  spot_number: string;
  group_name: string;
  reservation_date: string;
  infraction_type: 'checkin' | 'checkout';
  detected_at: string;
}

export const useCheckinReports = () => {
  const [reports, setReports] = useState<CheckinReport[]>([]);
  const [loading, setLoading] = useState(false);

  const loadTodayInfractions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('checkin_infractions')
        .select(`
          *,
          profiles:user_id(full_name),
          parking_spots:spot_id(spot_number),
          parking_groups:group_id(name)
        `)
        .eq('infraction_date', new Date().toISOString().split('T')[0])
        .order('detected_at', { ascending: false });
      
      if (error) throw error;
      setReports(data || []);
    } catch (err) {
      console.error('Error loading infractions:', err);
      toast.error('Error al cargar infracciones');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = (data: CheckinReport[]) => {
    const csv = [
      ['Usuario', 'Plaza', 'Grupo', 'Fecha', 'Tipo', 'Detectado'],
      ...data.map(r => [
        r.user_name,
        r.spot_number,
        r.group_name,
        r.reservation_date,
        r.infraction_type,
        r.detected_at
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `infracciones-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return { reports, loading, loadTodayInfractions, exportToCSV };
};
```


## Data Models

### TypeScript Interfaces

```typescript
// src/types/checkin.types.ts

export interface CheckinSettings {
  id: string;
  system_enabled: boolean;
  default_checkin_window_hours: number;
  grace_period_minutes: number;
  checkin_infraction_threshold: number;
  checkout_infraction_threshold: number;
  temporary_block_days: number;
  send_checkin_reminders: boolean;
  created_at: string;
  updated_at: string;
}

export interface ParkingGroupCheckinConfig {
  id: string;
  group_id: string;
  enabled: boolean;
  use_custom_config: boolean;
  custom_checkin_window_hours: number | null;
  created_at: string;
  updated_at: string;
}

export interface ReservationCheckin {
  id: string;
  reservation_id: string;
  user_id: string;
  spot_id: string;
  group_id: string;
  checkin_at: string | null;
  checkout_at: string | null;
  is_continuous_reservation: boolean;
  continuous_start_date: string | null;
  continuous_end_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface CheckinInfraction {
  id: string;
  user_id: string;
  reservation_id: string;
  spot_id: string;
  group_id: string;
  infraction_type: 'checkin' | 'checkout';
  infraction_date: string;
  detected_at: string;
  expected_checkin_window_end: string | null;
  grace_period_end: string | null;
  warning_generated: boolean;
  warning_id: string | null;
  created_at: string;
}

export interface UserBlock {
  id: string;
  user_id: string;
  block_type: 'manual' | 'automatic_checkin' | 'automatic_checkout';
  reason: string;
  blocked_at: string;
  blocked_until: string;
  warning_id: string | null;
  is_active: boolean;
  unblocked_at: string | null;
  created_at: string;
}

export interface ReservationWithCheckin {
  id: string;
  user_id: string;
  spot_id: string;
  reservation_date: string;
  status: string;
  created_at: string;
  checkin?: ReservationCheckin;
  spot: {
    spot_number: string;
    group: {
      name: string;
    };
  };
}

export interface CheckinReportItem {
  user_id: string;
  user_name: string;
  spot_number: string;
  group_name: string;
  reservation_date: string;
  infraction_type: 'checkin' | 'checkout';
  detected_at: string;
  expected_window_end?: string;
  grace_period_end?: string;
}

export interface CheckinHistoryItem {
  id: string;
  user_name: string;
  spot_number: string;
  group_name: string;
  checkin_at: string | null;
  checkout_at: string | null;
  duration_minutes: number | null;
  is_continuous: boolean;
}

export interface CheckinStats {
  total_checkins: number;
  total_checkouts: number;
  total_infractions: number;
  checkin_infractions: number;
  checkout_infractions: number;
  compliance_rate: number;
  avg_checkin_time: string;
  avg_checkout_time: string;
}
```

## Error Handling

### Error Types

```typescript
export enum CheckinErrorCode {
  SYSTEM_DISABLED = 'SYSTEM_DISABLED',
  GROUP_DISABLED = 'GROUP_DISABLED',
  NO_ACTIVE_RESERVATION = 'NO_ACTIVE_RESERVATION',
  ALREADY_CHECKED_IN = 'ALREADY_CHECKED_IN',
  NO_CHECKIN_FOUND = 'NO_CHECKIN_FOUND',
  USER_BLOCKED = 'USER_BLOCKED',
  LATE_CHECKIN = 'LATE_CHECKIN',
  INVALID_DATE = 'INVALID_DATE',
  DATABASE_ERROR = 'DATABASE_ERROR'
}

export class CheckinError extends Error {
  constructor(
    public code: CheckinErrorCode,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'CheckinError';
  }
}
```

### Error Messages (i18n ready)

```typescript
export const CHECKIN_ERROR_MESSAGES: Record<CheckinErrorCode, string> = {
  [CheckinErrorCode.SYSTEM_DISABLED]: 'El sistema de check-in está desactivado',
  [CheckinErrorCode.GROUP_DISABLED]: 'El check-in está desactivado para este grupo',
  [CheckinErrorCode.NO_ACTIVE_RESERVATION]: 'No tienes una reserva activa para hoy',
  [CheckinErrorCode.ALREADY_CHECKED_IN]: 'Ya has realizado el check-in',
  [CheckinErrorCode.NO_CHECKIN_FOUND]: 'No se encontró un check-in activo',
  [CheckinErrorCode.USER_BLOCKED]: 'Tu cuenta está bloqueada temporalmente',
  [CheckinErrorCode.LATE_CHECKIN]: 'Check-in realizado fuera de tiempo',
  [CheckinErrorCode.INVALID_DATE]: 'Fecha de reserva inválida',
  [CheckinErrorCode.DATABASE_ERROR]: 'Error al procesar la solicitud'
};
```

### Frontend Error Handling

```typescript
const handleCheckinError = (error: any) => {
  if (error instanceof CheckinError) {
    const message = CHECKIN_ERROR_MESSAGES[error.code];
    
    switch (error.code) {
      case CheckinErrorCode.LATE_CHECKIN:
        toast.warning(message);
        break;
      case CheckinErrorCode.USER_BLOCKED:
        toast.error(message, { duration: 5000 });
        break;
      default:
        toast.error(message);
    }
  } else {
    console.error('Unexpected error:', error);
    toast.error('Error inesperado. Por favor, inténtalo de nuevo.');
  }
};
```

## Testing Strategy

### Unit Tests

#### 1. Database Functions
```sql
-- Test perform_checkin()
BEGIN;
  -- Setup
  INSERT INTO test_users ...;
  INSERT INTO test_reservations ...;
  
  -- Test normal checkin
  SELECT perform_checkin(test_reservation_id, test_user_id);
  ASSERT checkin_at IS NOT NULL;
  
  -- Test late checkin
  -- Test duplicate checkin
  -- Test disabled system
  
ROLLBACK;
```

#### 2. Frontend Components
```typescript
describe('TodayCheckinCard', () => {
  it('should show checkin button when no checkin exists', () => {
    render(<TodayCheckinCard reservation={mockReservation} />);
    expect(screen.getByText('Llegué')).toBeInTheDocument();
  });
  
  it('should show checkout button after checkin', () => {
    const reservationWithCheckin = { ...mockReservation, checkin: { checkin_at: '2025-01-15T10:00:00Z' } };
    render(<TodayCheckinCard reservation={reservationWithCheckin} />);
    expect(screen.getByText('Me voy')).toBeInTheDocument();
  });
  
  it('should call onCheckin when button clicked', async () => {
    const onCheckin = jest.fn();
    render(<TodayCheckinCard reservation={mockReservation} onCheckin={onCheckin} />);
    fireEvent.click(screen.getByText('Llegué'));
    expect(onCheckin).toHaveBeenCalled();
  });
});
```

#### 3. Custom Hooks
```typescript
describe('useCheckin', () => {
  it('should perform checkin successfully', async () => {
    const { result } = renderHook(() => useCheckin());
    await act(async () => {
      await result.current.checkin('reservation-id');
    });
    expect(result.current.error).toBeNull();
  });
  
  it('should handle checkin errors', async () => {
    mockSupabase.rpc.mockRejectedValue(new Error('Database error'));
    const { result } = renderHook(() => useCheckin());
    await act(async () => {
      await result.current.checkin('reservation-id');
    });
    expect(result.current.error).toBeTruthy();
  });
});
```

### Integration Tests

#### 1. Complete Checkin Flow
```typescript
describe('Checkin Flow Integration', () => {
  it('should complete full checkin-checkout cycle', async () => {
    // 1. User navigates to Today section
    // 2. Sees active reservation
    // 3. Clicks checkin button
    // 4. Sees confirmation
    // 5. Clicks checkout button
    // 6. Spot becomes available
  });
  
  it('should detect and record late checkin', async () => {
    // 1. Set time past grace period
    // 2. Perform checkin
    // 3. Verify infraction recorded
    // 4. Verify warning shown
  });
});
```

#### 2. Admin Configuration Flow
```typescript
describe('Admin Configuration Integration', () => {
  it('should update global settings and apply to groups', async () => {
    // 1. Admin updates grace period
    // 2. Verify settings saved
    // 3. Verify applied to new checkins
  });
  
  it('should override group settings', async () => {
    // 1. Set custom group config
    // 2. Verify group uses custom settings
    // 3. Verify other groups use global
  });
});
```

### End-to-End Tests

```typescript
describe('Checkin System E2E', () => {
  it('should handle complete user journey', async () => {
    // 1. User makes reservation
    // 2. Receives reminder notification
    // 3. Performs checkin on time
    // 4. Uses parking spot
    // 5. Performs checkout
    // 6. Spot becomes available
    // 7. Another user reserves it
  });
  
  it('should handle infraction and warning flow', async () => {
    // 1. User misses checkin 3 times
    // 2. System detects infractions
    // 3. Automatic warning generated
    // 4. User blocked temporarily
    // 5. Future reservations cancelled
    // 6. Block expires automatically
  });
});
```

### Performance Tests

```typescript
describe('Checkin Performance', () => {
  it('should handle 1000 concurrent checkins', async () => {
    const promises = Array(1000).fill(null).map(() => performCheckin());
    const results = await Promise.all(promises);
    expect(results.every(r => r.success)).toBe(true);
  });
  
  it('should detect infractions for 10000 reservations in < 5s', async () => {
    const start = Date.now();
    await detectCheckinInfractions();
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(5000);
  });
});
```

## Security Considerations

### Row Level Security (RLS)

```sql
-- reservation_checkins
CREATE POLICY "Users view own checkins"
  ON public.reservation_checkins FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users create own checkins"
  ON public.reservation_checkins FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own checkins"
  ON public.reservation_checkins FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins view all checkins"
  ON public.reservation_checkins FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- checkin_infractions
CREATE POLICY "Users view own infractions"
  ON public.checkin_infractions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins view all infractions"
  ON public.checkin_infractions FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "System creates infractions"
  ON public.checkin_infractions FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

-- checkin_settings
CREATE POLICY "Anyone can view settings"
  ON public.checkin_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins update settings"
  ON public.checkin_settings FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- user_blocks
CREATE POLICY "Users view own blocks"
  ON public.user_blocks FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins view all blocks"
  ON public.user_blocks FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Only system creates blocks"
  ON public.user_blocks FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));
```

### Function Security

- All RPC functions use `SECURITY DEFINER` to run with elevated privileges
- Input validation in all functions
- User ID verification from `auth.uid()`
- Prevent SQL injection with parameterized queries
- Rate limiting on checkin/checkout operations

### Frontend Security

- Validate user has active reservation before showing checkin button
- Check user is not blocked before allowing checkin
- Verify reservation belongs to current user
- Use HTTPS for all API calls
- Sanitize all user inputs

## Performance Optimization

### Database Indexes

```sql
-- Optimize checkin lookups
CREATE INDEX idx_checkins_user_date ON public.reservation_checkins(user_id, created_at);
CREATE INDEX idx_checkins_group_date ON public.reservation_checkins(group_id, created_at);
CREATE INDEX idx_checkins_pending ON public.reservation_checkins(checkin_at) WHERE checkin_at IS NULL;

-- Optimize infraction detection
CREATE INDEX idx_infractions_user ON public.checkin_infractions(user_id, infraction_date);
CREATE INDEX idx_infractions_pending_warning ON public.checkin_infractions(user_id, warning_generated) WHERE warning_generated = FALSE;
CREATE INDEX idx_infractions_type_date ON public.checkin_infractions(infraction_type, infraction_date);

-- Optimize block checks
CREATE INDEX idx_user_blocks_active ON public.user_blocks(user_id, is_active) WHERE is_active = TRUE;
CREATE INDEX idx_user_blocks_expiry ON public.user_blocks(blocked_until) WHERE is_active = TRUE;
```

### Caching Strategy

```typescript
// Frontend caching with React Query
const CACHE_TIMES = {
  checkinSettings: 5 * 60 * 1000, // 5 minutes
  todayReservation: 30 * 1000, // 30 seconds
  checkinHistory: 2 * 60 * 1000, // 2 minutes
  infractions: 1 * 60 * 1000 // 1 minute
};

// Stale-while-revalidate pattern
useQuery(['checkin-settings'], fetchSettings, {
  staleTime: CACHE_TIMES.checkinSettings,
  cacheTime: CACHE_TIMES.checkinSettings * 2
});
```

### Batch Operations

```sql
-- Batch infraction detection instead of per-reservation
CREATE OR REPLACE FUNCTION detect_checkin_infractions_batch()
RETURNS INTEGER
AS $$
  -- Process all pending infractions in single query
  INSERT INTO checkin_infractions (...)
  SELECT ... FROM reservations
  WHERE ... -- Batch conditions
  ON CONFLICT DO NOTHING;
$$;
```

## Deployment Strategy

### Migration Plan

1. **Phase 1: Database Schema** (Day 1)
   - Create new tables
   - Add indexes
   - Deploy RLS policies

2. **Phase 2: Backend Functions** (Day 2)
   - Deploy database functions
   - Setup pg_cron jobs
   - Test in staging

3. **Phase 3: Frontend Components** (Day 3-4)
   - Deploy user-facing components
   - Deploy admin configuration
   - Deploy reporting panels

4. **Phase 4: Testing & Rollout** (Day 5)
   - Enable for pilot group
   - Monitor performance
   - Full rollout

### Rollback Plan

- Keep feature flag in `checkin_settings.system_enabled`
- Can disable system without code changes
- Preserve all data for re-enabling
- No destructive migrations

### Monitoring

```typescript
// Key metrics to monitor
const METRICS = {
  checkin_rate: 'Percentage of reservations with checkin',
  checkout_rate: 'Percentage of checkins with checkout',
  late_checkin_rate: 'Percentage of late checkins',
  infraction_rate: 'Infractions per 100 reservations',
  warning_rate: 'Warnings generated per day',
  block_rate: 'Users blocked per week',
  avg_checkin_time: 'Average time of day for checkin',
  avg_checkout_time: 'Average time of day for checkout'
};
```

## Future Enhancements

1. **Mobile App Integration**: Push notifications for checkin reminders
2. **QR Code Checkin**: Scan QR at parking spot for automatic checkin
3. **Geofencing**: Auto-checkin when user enters parking area
4. **Analytics Dashboard**: Advanced reporting and trends
5. **Predictive Availability**: ML model to predict spot availability
6. **Gamification**: Rewards for consistent checkin compliance
7. **Integration with Access Control**: Open barriers on checkin
8. **Multi-language Support**: i18n for all user-facing text
