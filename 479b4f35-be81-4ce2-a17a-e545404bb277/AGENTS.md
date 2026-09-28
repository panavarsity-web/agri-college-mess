<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules

- All money and billing math lives in `src/lib/calc.ts` (engine) and `src/lib/money.ts` (decimal-safe rounding); screens must call them instead of re-implementing formulas, so dashboard, billing and reports can never disagree.
- Demo data comes from `src/lib/demo-data.ts` and all app state flows through the `AppProvider` context in `src/lib/store.tsx` with localStorage persistence, keeping the data layer swappable for SQLite/Tauri later.
- PDF and Excel output is generated client-side in `src/lib/exports.ts` with lazily imported jspdf/xlsx to keep the initial bundle small.
