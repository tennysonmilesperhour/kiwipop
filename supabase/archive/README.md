# Archived migrations

These files used to live in `supabase/migrations/` but have no row in production history (`supabase_migrations.schema_migrations` on project `yibliuftqrnfguctrqca`). The Supabase GitHub integration matches history by the version prefix and would try to run anything left in `supabase/migrations/` that production does not already know. They stay here so that history is recoverable and nothing is applied again.

| File | Why it is here |
|---|---|
| `013_preorder_twenty_percent_off.sql` | Never took effect. Production price for that SKU is not the 20% off price this file sets. |
| `018_campaign_updates.sql` | Never took effect. `public.campaign_updates` does not exist in production. |
| `016_spreadsheet_seed_and_embeds.sql` | Overtaken. Later applied migrations (033 through 046) own the current raw-material and recipe state. |
| `020_rename_mango_mary_flavors.sql` | Overtaken by production `20260726153120_canonical_product_names`. Re-running would revert names. |
| `021_rename_merry_to_mary.sql` | Overtaken by production `20260726153120_canonical_product_names`. Re-running would revert names. |
| `038_flavor_sources_taurine_reorder_cleanup.sql` | Overtaken. Production `039` already deletes `RM-GINKGO`; do not re-run this blindly. |
| `030_coconut_oil_ingredient.sql` | Effects are live (`RM-COCONUT-OIL` exists). Moved here with the SQL unchanged aside from the archive note, so the integration cannot run it against production. |
| `031_coconut_oil_bom.sql` | Effects are live (four bill-of-materials rows reference `RM-COCONUT-OIL`). Same treatment as 030. |

Do not move these back into `supabase/migrations/` unless each version is marked applied in production without executing the file.
