
SET default_transaction_read_only = off;

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

ALTER ROLE "anon" SET "statement_timeout" TO '3s';

ALTER ROLE "authenticated" SET "statement_timeout" TO '8s';

ALTER ROLE "authenticator" SET "statement_timeout" TO '8s';

RESET ALL;



SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."order_status" AS ENUM (
    'recibido',
    'cotizado',
    'datos_recibidos',
    'diseno',
    'revision',
    'aprobado',
    'entregado'
);


ALTER TYPE "public"."order_status" OWNER TO "postgres";


CREATE TYPE "public"."package_type" AS ENUM (
    'basico',
    'estandar',
    'premium'
);


ALTER TYPE "public"."package_type" OWNER TO "postgres";


CREATE TYPE "public"."user_role" AS ENUM (
    'cliente',
    'asesor',
    'disenador',
    'admin'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  insert into public.profiles (id, full_name, email, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'phone',
    'cliente'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_staff"() RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin','asesor','disenador')
  );
$$;


ALTER FUNCTION "public"."is_staff"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."metrics_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "event_name" "text" NOT NULL,
    "payload" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."metrics_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."order_versions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "designer_id" "uuid",
    "version_number" integer DEFAULT 1 NOT NULL,
    "preview_url" "text" NOT NULL,
    "notes" "text",
    "status" "text" DEFAULT 'enviada'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."order_versions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tracking_code" "text" NOT NULL,
    "user_id" "uuid",
    "client_name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "phone" "text",
    "event_type" "text" NOT NULL,
    "package_type" "public"."package_type" DEFAULT 'basico'::"public"."package_type" NOT NULL,
    "template_id" "uuid",
    "event_title" "text",
    "honorees" "text",
    "event_date" "date",
    "event_time" time without time zone,
    "location" "text",
    "map_url" "text",
    "music_url" "text",
    "colors" "text",
    "notes" "text",
    "guests" integer DEFAULT 0,
    "urgent" boolean DEFAULT false,
    "status" "public"."order_status" DEFAULT 'recibido'::"public"."order_status" NOT NULL,
    "total_amount" numeric(10,2) DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "method" "text" DEFAULT 'QR/Transferencia'::"text",
    "proof_url" "text",
    "status" "text" DEFAULT 'pendiente'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."payments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "full_name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "phone" "text",
    "role" "public"."user_role" DEFAULT 'cliente'::"public"."user_role" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rsvps" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "guest_name" "text" NOT NULL,
    "guest_phone" "text",
    "attendance" "text" DEFAULT 'pendiente'::"text" NOT NULL,
    "companions" integer DEFAULT 0,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."rsvps" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "category" "text" NOT NULL,
    "style" "text" NOT NULL,
    "package_type" "public"."package_type" DEFAULT 'basico'::"public"."package_type" NOT NULL,
    "base_price" numeric(10,2) DEFAULT 0 NOT NULL,
    "description" "text",
    "features" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "accent" "text" DEFAULT '#7C3AED'::"text",
    "preview_url" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."templates" OWNER TO "postgres";


ALTER TABLE ONLY "public"."metrics_events"
    ADD CONSTRAINT "metrics_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."order_versions"
    ADD CONSTRAINT "order_versions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_tracking_code_key" UNIQUE ("tracking_code");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rsvps"
    ADD CONSTRAINT "rsvps_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."templates"
    ADD CONSTRAINT "templates_pkey" PRIMARY KEY ("id");



CREATE OR REPLACE TRIGGER "set_orders_updated_at" BEFORE UPDATE ON "public"."orders" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



ALTER TABLE ONLY "public"."metrics_events"
    ADD CONSTRAINT "metrics_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."order_versions"
    ADD CONSTRAINT "order_versions_designer_id_fkey" FOREIGN KEY ("designer_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."order_versions"
    ADD CONSTRAINT "order_versions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."templates"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rsvps"
    ADD CONSTRAINT "rsvps_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE "public"."metrics_events" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "metrics_insert_any_authenticated" ON "public"."metrics_events" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "metrics_select_staff" ON "public"."metrics_events" FOR SELECT USING ("public"."is_staff"());



ALTER TABLE "public"."order_versions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "orders_delete_staff" ON "public"."orders" FOR DELETE USING ("public"."is_staff"());



CREATE POLICY "orders_insert_own" ON "public"."orders" FOR INSERT WITH CHECK ((("user_id" = "auth"."uid"()) OR "public"."is_staff"()));



CREATE POLICY "orders_select_own_or_staff" ON "public"."orders" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR "public"."is_staff"()));



CREATE POLICY "orders_update_staff_or_owner_approve" ON "public"."orders" FOR UPDATE USING (("public"."is_staff"() OR ("user_id" = "auth"."uid"()))) WITH CHECK (("public"."is_staff"() OR ("user_id" = "auth"."uid"())));



ALTER TABLE "public"."payments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "payments_delete_staff" ON "public"."payments" FOR DELETE USING ("public"."is_staff"());



CREATE POLICY "payments_insert_related" ON "public"."payments" FOR INSERT WITH CHECK (("public"."is_staff"() OR (EXISTS ( SELECT 1
   FROM "public"."orders" "o"
  WHERE (("o"."id" = "payments"."order_id") AND ("o"."user_id" = "auth"."uid"()))))));



CREATE POLICY "payments_select_related" ON "public"."payments" FOR SELECT USING (("public"."is_staff"() OR (EXISTS ( SELECT 1
   FROM "public"."orders" "o"
  WHERE (("o"."id" = "payments"."order_id") AND ("o"."user_id" = "auth"."uid"()))))));



CREATE POLICY "payments_update_related" ON "public"."payments" FOR UPDATE USING (("public"."is_staff"() OR (EXISTS ( SELECT 1
   FROM "public"."orders" "o"
  WHERE (("o"."id" = "payments"."order_id") AND ("o"."user_id" = "auth"."uid"())))))) WITH CHECK (("public"."is_staff"() OR (EXISTS ( SELECT 1
   FROM "public"."orders" "o"
  WHERE (("o"."id" = "payments"."order_id") AND ("o"."user_id" = "auth"."uid"()))))));



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_insert_own" ON "public"."profiles" FOR INSERT WITH CHECK (("id" = "auth"."uid"()));



CREATE POLICY "profiles_select_own_or_admin" ON "public"."profiles" FOR SELECT USING ((("id" = "auth"."uid"()) OR "public"."is_admin"()));



CREATE POLICY "profiles_update_own_or_admin" ON "public"."profiles" FOR UPDATE USING ((("id" = "auth"."uid"()) OR "public"."is_admin"())) WITH CHECK ((("id" = "auth"."uid"()) OR "public"."is_admin"()));



ALTER TABLE "public"."rsvps" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "rsvps_delete_related" ON "public"."rsvps" FOR DELETE USING (("public"."is_staff"() OR (EXISTS ( SELECT 1
   FROM "public"."orders" "o"
  WHERE (("o"."id" = "rsvps"."order_id") AND ("o"."user_id" = "auth"."uid"()))))));



CREATE POLICY "rsvps_related" ON "public"."rsvps" USING (("public"."is_staff"() OR (EXISTS ( SELECT 1
   FROM "public"."orders" "o"
  WHERE (("o"."id" = "rsvps"."order_id") AND ("o"."user_id" = "auth"."uid"())))))) WITH CHECK (("public"."is_staff"() OR (EXISTS ( SELECT 1
   FROM "public"."orders" "o"
  WHERE (("o"."id" = "rsvps"."order_id") AND ("o"."user_id" = "auth"."uid"()))))));



CREATE POLICY "rsvps_update_related" ON "public"."rsvps" FOR UPDATE USING (("public"."is_staff"() OR (EXISTS ( SELECT 1
   FROM "public"."orders" "o"
  WHERE (("o"."id" = "rsvps"."order_id") AND ("o"."user_id" = "auth"."uid"())))))) WITH CHECK (("public"."is_staff"() OR (EXISTS ( SELECT 1
   FROM "public"."orders" "o"
  WHERE (("o"."id" = "rsvps"."order_id") AND ("o"."user_id" = "auth"."uid"()))))));



ALTER TABLE "public"."templates" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "templates_admin_all" ON "public"."templates" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "templates_public_read" ON "public"."templates" FOR SELECT USING ((("is_active" = true) OR "public"."is_staff"()));



CREATE POLICY "versions_delete_staff" ON "public"."order_versions" FOR DELETE USING ("public"."is_staff"());



CREATE POLICY "versions_insert_staff" ON "public"."order_versions" FOR INSERT WITH CHECK ("public"."is_staff"());



CREATE POLICY "versions_select_related" ON "public"."order_versions" FOR SELECT USING (("public"."is_staff"() OR (EXISTS ( SELECT 1
   FROM "public"."orders" "o"
  WHERE (("o"."id" = "order_versions"."order_id") AND ("o"."user_id" = "auth"."uid"()))))));



CREATE POLICY "versions_update_staff" ON "public"."order_versions" FOR UPDATE USING ("public"."is_staff"()) WITH CHECK ("public"."is_staff"());





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_staff"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_staff"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_staff"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";


















GRANT ALL ON TABLE "public"."metrics_events" TO "anon";
GRANT ALL ON TABLE "public"."metrics_events" TO "authenticated";
GRANT ALL ON TABLE "public"."metrics_events" TO "service_role";



GRANT ALL ON TABLE "public"."order_versions" TO "anon";
GRANT ALL ON TABLE "public"."order_versions" TO "authenticated";
GRANT ALL ON TABLE "public"."order_versions" TO "service_role";



GRANT ALL ON TABLE "public"."orders" TO "anon";
GRANT ALL ON TABLE "public"."orders" TO "authenticated";
GRANT ALL ON TABLE "public"."orders" TO "service_role";



GRANT ALL ON TABLE "public"."payments" TO "anon";
GRANT ALL ON TABLE "public"."payments" TO "authenticated";
GRANT ALL ON TABLE "public"."payments" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."rsvps" TO "anon";
GRANT ALL ON TABLE "public"."rsvps" TO "authenticated";
GRANT ALL ON TABLE "public"."rsvps" TO "service_role";



GRANT ALL ON TABLE "public"."templates" TO "anon";
GRANT ALL ON TABLE "public"."templates" TO "authenticated";
GRANT ALL ON TABLE "public"."templates" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- \restrict bo1I34NWKuCRNWgF5C11w7wnyHN1YvDuCcbqzeiW9l60MN5bJ1yLMRVqxYvwf3P

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."audit_log_entries" ("instance_id", "id", "payload", "created_at", "ip_address") FROM stdin;
\.


--
-- Data for Name: custom_oauth_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."custom_oauth_providers" ("id", "provider_type", "identifier", "name", "client_id", "client_secret", "acceptable_client_ids", "scopes", "pkce_enabled", "attribute_mapping", "authorization_params", "enabled", "email_optional", "issuer", "discovery_url", "skip_nonce_check", "cached_discovery", "discovery_cached_at", "authorization_url", "token_url", "userinfo_url", "jwks_uri", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."flow_state" ("id", "user_id", "auth_code", "code_challenge_method", "code_challenge", "provider_type", "provider_access_token", "provider_refresh_token", "created_at", "updated_at", "authentication_method", "auth_code_issued_at", "invite_token", "referrer", "oauth_client_state_id", "linking_target_id", "email_optional") FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") FROM stdin;
\.


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") FROM stdin;
\.


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."instances" ("id", "uuid", "raw_base_config", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."oauth_clients" ("id", "client_secret_hash", "registration_type", "redirect_uris", "grant_types", "client_name", "client_uri", "logo_uri", "created_at", "updated_at", "deleted_at", "client_type", "token_endpoint_auth_method") FROM stdin;
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."sessions" ("id", "user_id", "created_at", "updated_at", "factor_id", "aal", "not_after", "refreshed_at", "user_agent", "ip", "tag", "oauth_client_id", "refresh_token_hmac_key", "refresh_token_counter", "scopes") FROM stdin;
\.


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."mfa_amr_claims" ("session_id", "created_at", "updated_at", "authentication_method", "id") FROM stdin;
\.


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."mfa_factors" ("id", "user_id", "friendly_name", "factor_type", "status", "created_at", "updated_at", "secret", "phone", "last_challenged_at", "web_authn_credential", "web_authn_aaguid", "last_webauthn_challenge_data") FROM stdin;
\.


--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."mfa_challenges" ("id", "factor_id", "created_at", "verified_at", "ip_address", "otp_code", "web_authn_session_data") FROM stdin;
\.


--
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."oauth_authorizations" ("id", "authorization_id", "client_id", "user_id", "redirect_uri", "scope", "state", "resource", "code_challenge", "code_challenge_method", "response_type", "status", "authorization_code", "created_at", "expires_at", "approved_at", "nonce") FROM stdin;
\.


--
-- Data for Name: oauth_client_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."oauth_client_states" ("id", "provider_type", "code_verifier", "created_at") FROM stdin;
\.


--
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."oauth_consents" ("id", "user_id", "client_id", "scopes", "granted_at", "revoked_at") FROM stdin;
\.


--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."one_time_tokens" ("id", "user_id", "token_type", "token_hash", "relates_to", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."refresh_tokens" ("instance_id", "id", "token", "user_id", "revoked", "created_at", "updated_at", "parent", "session_id") FROM stdin;
\.


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."sso_providers" ("id", "resource_id", "created_at", "updated_at", "disabled") FROM stdin;
\.


--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."saml_providers" ("id", "sso_provider_id", "entity_id", "metadata_xml", "metadata_url", "attribute_mapping", "created_at", "updated_at", "name_id_format") FROM stdin;
\.


--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."saml_relay_states" ("id", "sso_provider_id", "request_id", "for_email", "redirect_to", "created_at", "updated_at", "flow_state_id") FROM stdin;
\.


--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."sso_domains" ("id", "sso_provider_id", "domain", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: webauthn_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."webauthn_challenges" ("id", "user_id", "challenge_type", "session_data", "created_at", "expires_at") FROM stdin;
\.


--
-- Data for Name: webauthn_credentials; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."webauthn_credentials" ("id", "user_id", "credential_id", "public_key", "attestation_type", "aaguid", "sign_count", "transports", "backup_eligible", "backed_up", "friendly_name", "created_at", "updated_at", "last_used_at") FROM stdin;
\.


--
-- Data for Name: metrics_events; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."metrics_events" ("id", "user_id", "event_name", "payload", "created_at") FROM stdin;
66666666-6666-4666-8666-666666666601	\N	page_view	{"route": "#inicio"}	2026-06-16 08:00:00+00
66666666-6666-4666-8666-666666666602	\N	template_view	{"templateId": "tpl-15-lila"}	2026-06-16 08:02:00+00
66666666-6666-4666-8666-666666666603	\N	template_view	{"templateId": "tpl-boda-oro"}	2026-06-16 08:05:00+00
66666666-6666-4666-8666-666666666604	\N	quote_start	{"package": "premium"}	2026-06-16 08:10:00+00
66666666-6666-4666-8666-666666666605	\N	quote_submit	{"package": "premium"}	2026-06-16 08:15:00+00
66666666-6666-4666-8666-666666666606	\N	whatsapp_click	{"source": "cotizador"}	2026-06-16 08:16:00+00
66666666-6666-4666-8666-666666666607	\N	order_created	{"orderId": "ord-demo-001"}	2026-06-16 12:00:00+00
66666666-6666-4666-8666-666666666608	\N	payment_registered	{"orderId": "ord-demo-003"}	2026-06-16 13:00:00+00
66666666-6666-4666-8666-666666666609	\N	version_uploaded	{"orderId": "ord-demo-004"}	2026-06-16 14:30:00+00
66666666-6666-4666-8666-666666666610	\N	rsvp_confirmed	{"orderId": "ord-demo-004"}	2026-06-16 15:00:00+00
\.


--
-- Data for Name: templates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."templates" ("id", "title", "category", "style", "package_type", "base_price", "description", "features", "accent", "preview_url", "is_active", "created_at", "updated_at") FROM stdin;
c0d20d2f-3d5e-44bd-ac04-817516ef873f	Quinceañera Lila	15 años	Elegante	premium	160.00	Diseño interactivo con cuenta regresiva, música, galería y QR.	{"Cuenta regresiva",Música,Galería,QR,RSVP}	#7C3AED	\N	t	2026-06-16 21:40:08.718312+00	2026-06-16 21:40:08.718312+00
12258ccb-747e-4716-a2ee-fb5ad6e284c4	Boda Oro Suave	Boda	Romántico	premium	180.00	Invitación web elegante para boda con mapa, itinerario y confirmación.	{Mapa,Itinerario,RSVP,Galería}	#C084FC	\N	t	2026-06-16 21:40:08.718312+00	2026-06-16 21:40:08.718312+00
0793a3dd-eff3-47a8-acc4-2d2777585492	Cumple Neon	Cumpleaños	Moderno	estandar	95.00	Invitación animada para compartir por WhatsApp.	{Animación,Link,QR}	#14B8A6	\N	t	2026-06-16 21:40:08.718312+00	2026-06-16 21:40:08.718312+00
5527d740-927b-4d8f-bad0-d12bce69f3cb	Baby Shower Pastel	Baby shower	Dulce	estandar	90.00	Diseño tierno con datos claros y confirmación simple.	{Link,RSVP,Mapa}	#F9A8D4	\N	t	2026-06-16 21:40:08.718312+00	2026-06-16 21:40:08.718312+00
963ae7d8-fcae-46bf-bed3-55d6cf2f082f	Graduación Azul	Graduación	Formal	premium	150.00	Invitación institucional con programa, mapa y QR.	{Programa,QR,Mapa,RSVP}	#2563EB	\N	t	2026-06-16 21:40:08.718312+00	2026-06-16 21:40:08.718312+00
11111111-1111-4111-8111-111111111112	XV Neon Party	15 años	Moderno	premium	175.00	Diseño juvenil con animaciones, colores neón y confirmación de asistencia.	{Animación,RSVP,QR,Música,Galería}	#EC4899	https://demo.netlify.app/xv-neon	t	2026-06-17 02:39:50.325268+00	2026-06-17 02:39:50.325268+00
11111111-1111-4111-8111-111111111114	Boda Minimal Blanca	Boda	Minimalista	premium	165.00	Diseño sobrio y limpio para bodas civiles o religiosas.	{Mapa,RSVP,Itinerario,QR}	#A78BFA	https://demo.netlify.app/boda-minimal	t	2026-06-17 02:39:50.325268+00	2026-06-17 02:39:50.325268+00
11111111-1111-4111-8111-111111111116	Cumple Kids Aventura	Cumpleaños	Infantil	estandar	85.00	Invitación digital para cumpleaños infantiles con colores vivos.	{Animación,Mapa,WhatsApp}	#F97316	https://demo.netlify.app/kids-aventura	t	2026-06-17 02:39:50.325268+00	2026-06-17 02:39:50.325268+00
11111111-1111-4111-8111-111111111118	Gender Reveal Glow	Baby shower	Celebración	premium	155.00	Invitación interactiva para revelación de género con cuenta regresiva.	{"Cuenta regresiva",Música,RSVP,Galería}	#60A5FA	https://demo.netlify.app/gender-reveal	t	2026-06-17 02:39:50.325268+00	2026-06-17 02:39:50.325268+00
11111111-1111-4111-8111-111111111120	Gala Académica	Graduación	Institucional	premium	170.00	Diseño académico para promociones, actos de colación y galas.	{Programa,RSVP,QR,Mapa,"Lista de invitados"}	#1D4ED8	https://demo.netlify.app/gala-academica	t	2026-06-17 02:39:50.325268+00	2026-06-17 02:39:50.325268+00
11111111-1111-4111-8111-111111111121	Bautizo Cielo	Bautizo	Minimalista	basico	55.00	Invitación digital simple en imagen/PDF optimizada.	{Imagen/PDF,WhatsApp}	#38BDF8	https://demo.netlify.app/bautizo-cielo	t	2026-06-17 02:39:50.325268+00	2026-06-17 02:39:50.325268+00
11111111-1111-4111-8111-111111111123	Evento Corporativo	Empresarial	Profesional	premium	190.00	Invitación para conferencias, inauguraciones y eventos empresariales.	{Agenda,Registro,QR,Reportes}	#059669	https://demo.netlify.app/corporativo-verde	t	2026-06-17 02:39:50.325268+00	2026-06-17 02:39:50.325268+00
11111111-1111-4111-8111-111111111128	Promoción Escolar	Graduación	Juvenil	estandar	105.00	Diseño para promociones escolares con lista de programa.	{Programa,QR,Mapa}	#10B981	https://demo.netlify.app/promocion-escolar	t	2026-06-17 02:39:50.325268+00	2026-06-17 02:39:50.325268+00
11111111-1111-4111-8111-111111111111	Quinceañera Lila	15 años	Elegante	premium	160.00	Diseño interactivo con cuenta regresiva, música, galería, mapa y QR.	{"Cuenta regresiva",Música,Galería,QR,RSVP,Mapa}	#7C3AED	https://6a358fa967d5ad0a202eeed6--superlative-dasik-4f324a.netlify.app/	t	2026-06-17 02:39:50.325268+00	2026-06-19 20:57:36.29854+00
11111111-1111-4111-8111-111111111119	Graduación Azul	Graduación	Formal	premium	150.00	Invitación institucional con programa, mapa y QR.	{Programa,QR,Mapa,RSVP}	#2563EB	https://jazzy-paletas-40528a.netlify.app/	t	2026-06-17 02:39:50.325268+00	2026-06-19 20:57:36.29854+00
11111111-1111-4111-8111-111111111113	Boda Oro Suave	Boda	Romántico	premium	180.00	Invitación web elegante para boda con mapa, itinerario y confirmación.	{Mapa,Itinerario,RSVP,Galería,"Cuenta regresiva"}	#C084FC	https://dulcet-toffee-8ce1a3.netlify.app/	t	2026-06-17 02:39:50.325268+00	2026-06-19 20:57:36.29854+00
11111111-1111-4111-8111-111111111124	Workshop Tech	Empresarial	Tecnológico	premium	210.00	Invitación para talleres, ferias tecnológicas y lanzamientos.	{Registro,Agenda,QR,Reportes,Recordatorio}	#0F172A	https://verdant-puppy-8fdb9f.netlify.app/	t	2026-06-17 02:39:50.325268+00	2026-06-19 20:57:36.29854+00
11111111-1111-4111-8111-111111111117	Baby Shower Pastel	Baby shower	Dulce	estandar	90.00	Diseño tierno con datos claros y confirmación simple.	{Link,RSVP,Mapa}	#F9A8D4	https://eclectic-creponne-f9e5ed.netlify.app/	t	2026-06-17 02:39:50.325268+00	2026-06-19 20:57:36.29854+00
11111111-1111-4111-8111-111111111115	Cumple Neon	Cumpleaños	Moderno	estandar	95.00	Invitación animada para compartir por WhatsApp.	{Animación,Link,QR}	#14B8A6	https://animated-pegasus-d3ebba.netlify.app/	t	2026-06-17 02:39:50.325268+00	2026-06-19 20:57:36.29854+00
11111111-1111-4111-8111-111111111122	Bautizo Dorado	Bautizo	Elegante	estandar	98.00	Diseño delicado con ubicación y confirmación básica.	{Mapa,RSVP,QR}	#D97706	https://regal-seahorse-6b0c81.netlify.app/	t	2026-06-17 02:39:50.325268+00	2026-06-19 20:57:36.29854+00
11111111-1111-4111-8111-111111111125	Aniversario Clásico	Aniversario	Clásico	estandar	100.00	Formato elegante con link de ubicación y música.	{Música,Mapa,Link}	#92400E	https://tangerine-melba-9d6207.netlify.app/	t	2026-06-17 02:39:50.325268+00	2026-06-19 20:57:36.29854+00
11111111-1111-4111-8111-111111111127	Primera Comunión Luz	Comunión	Delicado	basico	60.00	Invitación digital sobria para ceremonia familiar.	{Imagen/PDF,WhatsApp,Mapa}	#FBBF24	https://quiet-sunflower-b4ec57.netlify.app/	t	2026-06-17 02:39:50.325268+00	2026-06-19 20:57:36.29854+00
11111111-1111-4111-8111-111111111129	Inauguración Boutique	Empresarial	Premium	premium	195.00	Invitación comercial para apertura de tiendas y negocios.	{Registro,Mapa,QR,Reportes,Galería}	#9333EA	https://nimble-concha-486067.netlify.app/	t	2026-06-17 02:39:50.325268+00	2026-06-19 20:57:36.29854+00
11111111-1111-4111-8111-111111111126	Despedida Glam	Despedida	Glamour	estandar	110.00	Invitación para despedidas, reuniones privadas y cenas especiales.	{Link,Mapa,QR,Música}	#BE185D	https://inquisitive-malasada-5e626b.netlify.app/	t	2026-06-17 02:39:50.325268+00	2026-06-19 20:57:36.29854+00
11111111-1111-4111-8111-111111111130	Reunión Simple	Otro	Simple	basico	50.00	Invitación rápida para reuniones pequeñas con datos esenciales.	{Imagen/PDF,WhatsApp}	#64748B	https://cozy-arithmetic-838edb.netlify.app/	t	2026-06-17 02:39:50.325268+00	2026-06-19 20:57:36.29854+00
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."orders" ("id", "tracking_code", "user_id", "client_name", "email", "phone", "event_type", "package_type", "template_id", "event_title", "honorees", "event_date", "event_time", "location", "map_url", "music_url", "colors", "notes", "guests", "urgent", "status", "total_amount", "created_at", "updated_at") FROM stdin;
22222222-2222-4222-8222-222222222201	IF-2026-001	\N	Cliente Demo	cliente@invitaflow.com	74562899	15 años	premium	11111111-1111-4111-8111-111111111111	Mis 15 años	Valentina	2026-08-20	19:30:00	Salón Imperial, La Paz	\N	\N	\N	Paleta lila, dorado suave y música romántica.	120	f	entregado	180.00	2026-06-16 12:00:00+00	2026-06-19 20:57:36.29854+00
22222222-2222-4222-8222-222222222202	IF-2026-002	\N	Cliente Demo	cliente@invitaflow.com	74562899	Graduación	estandar	11111111-1111-4111-8111-111111111119	Acto de graduación	Promoción 2026	2026-09-10	10:00:00	Auditorio UPDS	\N	\N	\N	Incluir programa y QR.	80	f	entregado	120.00	2026-06-15 15:00:00+00	2026-06-19 20:57:36.29854+00
22222222-2222-4222-8222-222222222203	IF-2026-003	\N	María Fernanda López	maria.cliente@invitaflow.com	71555444	Boda	premium	11111111-1111-4111-8111-111111111113	Nuestra boda	María & Andrés	2026-11-22	17:00:00	Jardín Los Pinos, La Paz	\N	\N	\N	Estilo romántico, colores crema y dorado.	180	f	entregado	210.00	2026-06-12 09:30:00+00	2026-06-19 20:57:36.29854+00
22222222-2222-4222-8222-222222222204	IF-2026-004	\N	Rodrigo Salinas	rodrigo.cliente@invitaflow.com	72555111	Empresarial	premium	11111111-1111-4111-8111-111111111124	Workshop de Innovación	TechLab Bolivia	2026-07-05	09:00:00	Cowork Sopocachi	\N	\N	\N	Incluir agenda, formulario de registro y QR.	60	f	entregado	230.00	2026-06-10 14:00:00+00	2026-06-19 20:57:36.29854+00
22222222-2222-4222-8222-222222222205	IF-2026-005	\N	María Fernanda López	maria.cliente@invitaflow.com	71555444	Baby shower	estandar	11111111-1111-4111-8111-111111111117	Baby Shower de Sofía	Sofía	2026-07-28	16:30:00	Casa familiar, Miraflores	\N	\N	\N	Colores pastel, ositos y música suave.	45	t	entregado	105.00	2026-06-18 08:10:00+00	2026-06-19 20:57:36.29854+00
22222222-2222-4222-8222-222222222206	IF-2026-006	\N	Rodrigo Salinas	rodrigo.cliente@invitaflow.com	72555111	Cumpleaños	estandar	11111111-1111-4111-8111-111111111115	Cumple 30	Rodrigo	2026-08-02	21:00:00	Restaurante Central	\N	\N	\N	Tema neón, incluir ubicación y frase breve.	55	f	entregado	95.00	2026-06-18 11:45:00+00	2026-06-19 20:57:36.29854+00
22222222-2222-4222-8222-222222222207	IF-2026-007	\N	Cliente Demo	cliente@invitaflow.com	74562899	Bautizo	estandar	11111111-1111-4111-8111-111111111122	Bautizo de Mateo	Mateo	2026-09-01	11:00:00	Iglesia San Miguel	\N	\N	\N	Diseño sobrio, celeste, blanco y dorado.	70	f	entregado	98.00	2026-06-19 09:15:00+00	2026-06-19 20:57:36.29854+00
22222222-2222-4222-8222-222222222208	IF-2026-008	\N	María Fernanda López	maria.cliente@invitaflow.com	71555444	Aniversario	estandar	11111111-1111-4111-8111-111111111125	Aniversario 25 años	Familia López	2026-10-12	18:00:00	Hotel Europa	\N	\N	\N	Estilo clásico y música instrumental.	100	f	entregado	100.00	2026-06-14 12:20:00+00	2026-06-19 20:57:36.29854+00
22222222-2222-4222-8222-222222222209	IF-2026-009	\N	Rodrigo Salinas	rodrigo.cliente@invitaflow.com	72555111	Comunión	basico	11111111-1111-4111-8111-111111111127	Primera Comunión	Luciana	2026-08-18	10:30:00	Parroquia Cristo Rey	\N	\N	\N	Formato simple para WhatsApp.	35	f	entregado	55.00	2026-06-08 10:00:00+00	2026-06-19 20:57:36.29854+00
22222222-2222-4222-8222-222222222210	IF-2026-010	\N	Cliente Demo	cliente@invitaflow.com	74562899	Empresarial	premium	11111111-1111-4111-8111-111111111129	Inauguración Boutique	Luna Store	2026-07-15	19:00:00	Zona Sur, La Paz	\N	\N	\N	Invitación premium con galería de productos y registro.	150	f	entregado	215.00	2026-06-19 13:30:00+00	2026-06-19 20:57:36.29854+00
22222222-2222-4222-8222-222222222211	IF-2026-011	\N	María Fernanda López	maria.cliente@invitaflow.com	71555444	Despedida	estandar	11111111-1111-4111-8111-111111111126	Cena de despedida	Daniela	2026-07-30	20:00:00	Café del Centro	\N	\N	\N	Diseño elegante, tonos rosados y negro.	25	f	entregado	110.00	2026-06-13 15:10:00+00	2026-06-19 20:57:36.29854+00
22222222-2222-4222-8222-222222222212	IF-2026-012	\N	Rodrigo Salinas	rodrigo.cliente@invitaflow.com	72555111	Otro	basico	11111111-1111-4111-8111-111111111130	Reunión familiar	Familia Salinas	2026-07-20	13:00:00	Achumani	\N	\N	\N	Invitación rápida y clara.	20	f	entregado	50.00	2026-06-19 16:10:00+00	2026-06-19 20:57:36.29854+00
\.


--
-- Data for Name: order_versions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."order_versions" ("id", "order_id", "designer_id", "version_number", "preview_url", "notes", "status", "created_at") FROM stdin;
33333333-3333-4333-8333-333333333301	22222222-2222-4222-8222-222222222201	\N	1	https://demo.netlify.app/valentina-v1	Primera propuesta interactiva.	enviada	2026-06-17 10:00:00+00
33333333-3333-4333-8333-333333333302	22222222-2222-4222-8222-222222222201	\N	2	https://demo.netlify.app/valentina-v2	Corrección de foto principal y horarios.	corregida	2026-06-18 16:00:00+00
33333333-3333-4333-8333-333333333303	22222222-2222-4222-8222-222222222203	\N	1	https://demo.netlify.app/boda-ma-v1	Primera propuesta.	enviada	2026-06-13 12:30:00+00
33333333-3333-4333-8333-333333333304	22222222-2222-4222-8222-222222222203	\N	2	https://demo.netlify.app/boda-ma-final	Versión final aprobada.	aprobada	2026-06-15 18:40:00+00
33333333-3333-4333-8333-333333333305	22222222-2222-4222-8222-222222222204	\N	1	https://demo.netlify.app/workshop-techlab	Versión entregada con agenda.	aprobada	2026-06-11 08:20:00+00
33333333-3333-4333-8333-333333333306	22222222-2222-4222-8222-222222222208	\N	1	https://demo.netlify.app/aniversario-lopez-v1	Primera propuesta enviada.	enviada	2026-06-15 09:00:00+00
33333333-3333-4333-8333-333333333307	22222222-2222-4222-8222-222222222209	\N	1	https://demo.netlify.app/comunion-luciana	Imagen final optimizada.	aprobada	2026-06-09 17:00:00+00
33333333-3333-4333-8333-333333333308	22222222-2222-4222-8222-222222222211	\N	1	https://demo.netlify.app/despedida-daniela	Aprobada sin cambios.	aprobada	2026-06-14 11:00:00+00
33333333-3333-4333-8333-333333333401	22222222-2222-4222-8222-222222222201	\N	99	https://6a358fa967d5ad0a202eeed6--superlative-dasik-4f324a.netlify.app/	Versión final publicada en Netlify.	aprobada	2026-06-19 20:57:36.29854+00
33333333-3333-4333-8333-333333333402	22222222-2222-4222-8222-222222222202	\N	99	https://jazzy-paletas-40528a.netlify.app/	Versión final publicada en Netlify.	aprobada	2026-06-19 20:57:36.29854+00
33333333-3333-4333-8333-333333333403	22222222-2222-4222-8222-222222222203	\N	99	https://dulcet-toffee-8ce1a3.netlify.app/	Versión final publicada en Netlify.	aprobada	2026-06-19 20:57:36.29854+00
33333333-3333-4333-8333-333333333404	22222222-2222-4222-8222-222222222204	\N	99	https://verdant-puppy-8fdb9f.netlify.app/	Versión final publicada en Netlify.	aprobada	2026-06-19 20:57:36.29854+00
33333333-3333-4333-8333-333333333405	22222222-2222-4222-8222-222222222205	\N	99	https://eclectic-creponne-f9e5ed.netlify.app/	Versión final publicada en Netlify.	aprobada	2026-06-19 20:57:36.29854+00
33333333-3333-4333-8333-333333333406	22222222-2222-4222-8222-222222222206	\N	99	https://animated-pegasus-d3ebba.netlify.app/	Versión final publicada en Netlify.	aprobada	2026-06-19 20:57:36.29854+00
33333333-3333-4333-8333-333333333407	22222222-2222-4222-8222-222222222207	\N	99	https://regal-seahorse-6b0c81.netlify.app/	Versión final publicada en Netlify.	aprobada	2026-06-19 20:57:36.29854+00
33333333-3333-4333-8333-333333333408	22222222-2222-4222-8222-222222222208	\N	99	https://tangerine-melba-9d6207.netlify.app/	Versión final publicada en Netlify.	aprobada	2026-06-19 20:57:36.29854+00
33333333-3333-4333-8333-333333333409	22222222-2222-4222-8222-222222222209	\N	99	https://quiet-sunflower-b4ec57.netlify.app/	Versión final publicada en Netlify.	aprobada	2026-06-19 20:57:36.29854+00
33333333-3333-4333-8333-333333333410	22222222-2222-4222-8222-222222222210	\N	99	https://nimble-concha-486067.netlify.app/	Versión final publicada en Netlify.	aprobada	2026-06-19 20:57:36.29854+00
33333333-3333-4333-8333-333333333411	22222222-2222-4222-8222-222222222211	\N	99	https://inquisitive-malasada-5e626b.netlify.app/	Versión final publicada en Netlify.	aprobada	2026-06-19 20:57:36.29854+00
33333333-3333-4333-8333-333333333412	22222222-2222-4222-8222-222222222212	\N	99	https://cozy-arithmetic-838edb.netlify.app/	Versión final publicada en Netlify.	aprobada	2026-06-19 20:57:36.29854+00
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."payments" ("id", "order_id", "amount", "method", "proof_url", "status", "created_at") FROM stdin;
44444444-4444-4444-8444-444444444401	22222222-2222-4222-8222-222222222201	90.00	QR	https://demo.netlify.app/comprobante-001	confirmado	2026-06-16 13:30:00+00
44444444-4444-4444-8444-444444444402	22222222-2222-4222-8222-222222222202	60.00	Transferencia	\N	pendiente	2026-06-15 16:00:00+00
44444444-4444-4444-8444-444444444403	22222222-2222-4222-8222-222222222203	210.00	QR	https://demo.netlify.app/pago-003	confirmado	2026-06-12 10:00:00+00
44444444-4444-4444-8444-444444444404	22222222-2222-4222-8222-222222222204	230.00	Transferencia	https://demo.netlify.app/pago-004	confirmado	2026-06-10 15:00:00+00
44444444-4444-4444-8444-444444444405	22222222-2222-4222-8222-222222222208	50.00	QR	\N	confirmado	2026-06-14 12:50:00+00
44444444-4444-4444-8444-444444444406	22222222-2222-4222-8222-222222222209	55.00	QR	\N	confirmado	2026-06-08 11:00:00+00
44444444-4444-4444-8444-444444444407	22222222-2222-4222-8222-222222222210	100.00	Transferencia	\N	confirmado	2026-06-19 14:00:00+00
44444444-4444-4444-8444-444444444408	22222222-2222-4222-8222-222222222211	110.00	QR	\N	confirmado	2026-06-13 15:30:00+00
\.


--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."profiles" ("id", "full_name", "email", "phone", "role", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: rsvps; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."rsvps" ("id", "order_id", "guest_name", "guest_phone", "attendance", "companions", "notes", "created_at") FROM stdin;
55555555-5555-4555-8555-555555555501	22222222-2222-4222-8222-222222222201	Tía Elena	76555101	confirmado	1	Mesa familiar	2026-06-18 20:00:00+00
55555555-5555-4555-8555-555555555502	22222222-2222-4222-8222-222222222201	Carlos Rojas	76555102	pendiente	0	\N	2026-06-18 20:10:00+00
55555555-5555-4555-8555-555555555503	22222222-2222-4222-8222-222222222203	Familia López	76555333	confirmado	3	\N	2026-06-16 09:10:00+00
55555555-5555-4555-8555-555555555504	22222222-2222-4222-8222-222222222203	Familia Pérez	76555334	confirmado	2	Sin menú picante	2026-06-16 10:20:00+00
55555555-5555-4555-8555-555555555505	22222222-2222-4222-8222-222222222204	Ana Mercado	76555401	confirmado	0	\N	2026-06-11 18:00:00+00
55555555-5555-4555-8555-555555555506	22222222-2222-4222-8222-222222222204	Jorge Limachi	76555402	confirmado	0	\N	2026-06-11 18:15:00+00
55555555-5555-4555-8555-555555555507	22222222-2222-4222-8222-222222222204	Paola Rivero	76555403	rechazado	0	Viaje programado	2026-06-11 19:00:00+00
\.


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."buckets" ("id", "name", "owner", "created_at", "updated_at", "public", "avif_autodetection", "file_size_limit", "allowed_mime_types", "owner_id", "type") FROM stdin;
\.


--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."buckets_analytics" ("name", "type", "format", "created_at", "updated_at", "id", "deleted_at") FROM stdin;
\.


--
-- Data for Name: buckets_vectors; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."buckets_vectors" ("id", "type", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."objects" ("id", "bucket_id", "name", "owner", "created_at", "updated_at", "last_accessed_at", "metadata", "version", "owner_id", "user_metadata") FROM stdin;
\.


--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."s3_multipart_uploads" ("id", "in_progress_size", "upload_signature", "bucket_id", "key", "version", "owner_id", "created_at", "user_metadata", "metadata") FROM stdin;
\.


--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."s3_multipart_uploads_parts" ("id", "upload_id", "size", "part_number", "bucket_id", "key", "etag", "owner_id", "version", "created_at") FROM stdin;
\.


--
-- Data for Name: vector_indexes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."vector_indexes" ("id", "name", "bucket_id", "data_type", "dimension", "distance_metric", "metadata_configuration", "created_at", "updated_at") FROM stdin;
\.


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 1, false);


--
-- PostgreSQL database dump complete
--

-- \unrestrict bo1I34NWKuCRNWgF5C11w7wnyHN1YvDuCcbqzeiW9l60MN5bJ1yLMRVqxYvwf3P

RESET ALL;
