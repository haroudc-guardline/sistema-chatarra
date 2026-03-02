-- Migration: separate_contact_fields
-- Created: 2026-03-01
-- Description: Separate contacto_responsable into telefono_responsable and email_responsable

-- Step 1: Add new columns
ALTER TABLE public.locations 
ADD COLUMN IF NOT EXISTS telefono_responsable TEXT,
ADD COLUMN IF NOT EXISTS email_responsable TEXT;

-- Step 2: Migrate existing data
-- Move current contact data to telefono as default
UPDATE public.locations 
SET telefono_responsable = contacto_responsable
WHERE telefono_responsable IS NULL 
  AND contacto_responsable IS NOT NULL;

-- Extract emails (entries containing @) to email field
UPDATE public.locations 
SET email_responsable = contacto_responsable
WHERE contacto_responsable LIKE '%@%'
  AND email_responsable IS NULL;

-- Clean up telefono if it was set to an email
UPDATE public.locations 
SET telefono_responsable = NULL
WHERE telefono_responsable LIKE '%@%';

-- Step 3: Add comments for documentation
COMMENT ON COLUMN public.locations.telefono_responsable IS 'Número de teléfono del responsable';
COMMENT ON COLUMN public.locations.email_responsable IS 'Correo electrónico del responsable';

-- Step 4: Optional - Remove old column after verification
-- Uncomment the following line only after confirming data migration is correct
-- ALTER TABLE public.locations DROP COLUMN contacto_responsable;
