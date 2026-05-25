

## Plan: Fix Build Errors and Wire Up Tenure/Department Data

### Problem Summary

There are two categories of issues:

1. **The `user_profiles` table does not exist in the database.** Both the Tenure and Department pages rely on `useDemographicBreakdown`, which queries `user_profiles`. Every request returns a 404. This means no data appears for any school.

2. **Build errors in edge functions and frontend files** referencing the missing table or containing typos.

### Steps

#### 1. Create the `user_profiles` table (database migration)

Create the missing table with columns matching what the code expects:
- `user_id` (uuid, PK, references auth.users)
- `school_id` (uuid, nullable)
- `display_name` (text, nullable)
- `tenure_band` (text, nullable) — values: `0-2`, `3-5`, `6-10`, `10+`
- `grade_level` (text, nullable) — values: `elementary`, `middle`, `high`
- `department` (text, nullable)
- `onboarded` (boolean, default false)
- `updated_at` (timestamptz, default now())

Add RLS policies:
- Users can read/upsert their own profile
- School members can read profiles in their school (for admin dashboards)

#### 2. Make Tenure/Department pages show mock data for Test School

Update `useDemographicBreakdown` to detect `TEST_SCHOOL_ID` and return hardcoded mock cohort data instead of querying the database. This mirrors the pattern already used in `useSchoolData.ts`.

#### 3. Fix edge function build errors

- **`send-transactional-email/index.ts` line 82**: Remove the duplicate `const role = parseJwtRole(jwtToken)` line.
- **`process-email-queue/index.ts`**: Add `as any` type casts on the `supabase` client calls and add explicit types for `msg` parameter to fix TS errors. The `email_send_log` insert and `move_to_dlq` RPC calls fail type-checking because the Supabase types file doesn't know about these tables in the edge function context.

#### 4. Fix frontend TS errors in `DemographicsOnboarding.tsx`

After the `user_profiles` table is created and types regenerate, these errors will resolve automatically. If not, add `as any` casts on the `.from("user_profiles")` calls as a stopgap.

### Technical Details

- `TEST_SCHOOL_ID = "d184f91b-3049-4fa0-a03e-1378561527e4"` — mock data school
- `ROCKLIN_ID = "3f7e8a8a-05a7-4114-aaec-8abcc42f24c0"` — real data school
- Mock cohort data for Test School will include 4 tenure bands and ~6 departments with realistic scores
- The `PremiumTenureDashboard` already uses hardcoded data, so it's unaffected

