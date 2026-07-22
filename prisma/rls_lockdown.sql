-- Verrouille l'accès public à toutes les tables via l'API REST auto-générée
-- de Supabase (PostgREST), qui utilise la clé "anon" publique embarquée dans
-- le site et l'app mobile (NEXT_PUBLIC_SUPABASE_ANON_KEY).
--
-- Contexte : cette application n'utilise PAS Supabase Auth. L'authentification
-- est gérée entièrement par NextAuth côté serveur Next.js, avec ses propres
-- vérifications (getAuthUser, getAdminSession) et clauses `WHERE userId = ...`
-- dans les requêtes Prisma. Il n'existe donc pas de session Supabase
-- (auth.uid()) sur laquelle baser des policies RLS "par utilisateur".
--
-- Toutes les données transitent exclusivement par le backend Next.js via
-- Prisma (DATABASE_URL), connecté avec le rôle propriétaire des tables — ce
-- rôle contourne RLS par défaut (ENABLE, sans FORCE), donc l'application
-- continue de fonctionner à l'identique après ce script.
--
-- Résultat : plus aucune ligne de ces tables n'est accessible via l'API
-- publique Supabase (anon / authenticated), quel que soit l'appelant. Tout
-- accès légitime passe par les routes API Next.js, qui appliquent déjà les
-- règles "un client ne voit que ses données / un admin voit tout".

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TwoFactorToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PushToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PasswordResetToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LoginAttempt" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Document" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Message" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "deny_all_public_access" ON "User";
DROP POLICY IF EXISTS "deny_all_public_access" ON "TwoFactorToken";
DROP POLICY IF EXISTS "deny_all_public_access" ON "PushToken";
DROP POLICY IF EXISTS "deny_all_public_access" ON "PasswordResetToken";
DROP POLICY IF EXISTS "deny_all_public_access" ON "LoginAttempt";
DROP POLICY IF EXISTS "deny_all_public_access" ON "Document";
DROP POLICY IF EXISTS "deny_all_public_access" ON "Message";

-- Policy explicite de refus total pour anon + authenticated (les seuls rôles
-- utilisés par l'API publique PostgREST). Le rôle propriétaire (Prisma,
-- backend Next.js) n'est pas concerné par les policies RLS.
CREATE POLICY "deny_all_public_access" ON "User"
  AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false);

CREATE POLICY "deny_all_public_access" ON "TwoFactorToken"
  AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false);

CREATE POLICY "deny_all_public_access" ON "PushToken"
  AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false);

CREATE POLICY "deny_all_public_access" ON "PasswordResetToken"
  AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false);

CREATE POLICY "deny_all_public_access" ON "LoginAttempt"
  AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false);

CREATE POLICY "deny_all_public_access" ON "Document"
  AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false);

CREATE POLICY "deny_all_public_access" ON "Message"
  AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false);
