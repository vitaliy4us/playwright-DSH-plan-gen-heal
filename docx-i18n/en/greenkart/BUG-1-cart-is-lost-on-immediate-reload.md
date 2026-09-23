# BUG-1 The cart is lost on a page reload immediately after adding a product

**Severity:** medium — loss of user data, a time window of about 1 second
**Component:** cart / state persistence (localStorage)
**Environment:** GreenKart `https://rahulshettyacademy.com/seleniumPractise/#/`, Chromium (project `chromium`), Windows
**Found:** in the plan → generate → heal cycle; test `tests/cart-edge-cases/should-persist-cart-after-app-reload.spec.ts`

## Summary

The application saves the cart to `localStorage`, but it does so **roughly a second after the change**. If the page is reloaded inside that interval, the cart is lost: during initialisation the application writes its own current (empty) state to storage and overwrites the product that has not been saved yet.

## Preconditions

The GreenKart main page is open, the cart is empty (`Items : 0`).

## Steps to reproduce

| Step # | Step description | Expected result | Actual result |
|---|---|---|---|
| 1 | Click "ADD TO CART" on the "Brocolli - 1 Kg" card | The product is added: the header shows `Items : 1`, `Price : 120`, and the cart icon shows the badge "1" | Matches the expected result |
| 2 | **Immediately** (within ~1 s) press F5 / Ctrl+R | The cart is preserved: `Items : 1`, `Price : 120` | `Items : 0`, `Price : 0`, the badge on the icon has disappeared — the cart is empty |
| 3 | Wait 1–2 s and reload the page once more | — | The cart is still empty: the reload has already overwritten the saved state |
| 4 | Repeat steps 1–2, but wait ~2 s before reloading | The cart is preserved | Matches the expected result — the cart is restored |

Step 4 shows the boundary of the defect: it reproduces only on a fast reload, that is, it depends on a race between the write and the reload.

## Evidence

1. **Measurement of the write delay.** A programmatic measurement on the live page: immediately after the "ADD TO CART" click the value in `localStorage` does not change, and the write appears after **~1009 ms**.
2. **Storage state after a failed reload.** The keys `app_data_info`, `app_data_qty`, `app_data_tamt` are present in `localStorage`, but their values are the string `"null"`:

   ```
   localStorage.getItem('app_data_info')  →  "null"
   localStorage.getItem('app_data_qty')   →  "null"
   localStorage.getItem('app_data_tamt')  →  "null"
   ```

   That is, application start-up wrote an empty state over something that had not been saved yet.
3. **The interface updates before storage does.** Before the reload the counters already showed `Items : 1` — so it is the write to `localStorage` that lags behind, not the in-memory state.

## Impact

The user loses the cart they have assembled if they refresh the page (F5) immediately after adding a product. It is not the quantity that is lost but the whole line item. Reproducibility: consistently high on a fast reload; on a slow device the window may be wider, on a fast one narrower. At first glance the defect is "invisible", because in the ordinary scenario (added → browsed the catalogue → reloaded) the cart is restored correctly.

## Hypothesis about the cause

The save to `localStorage` is deferred (a debounce or an interval of ~1 s) instead of a synchronous write when the cart state changes. During initialisation the application writes the current (empty) state without checking whether there are unsaved changes.

## Workaround

Wait 1–2 seconds after a change to the cart before reloading the page.

## Related artefacts

- Test: `tests/cart-edge-cases/should-persist-cart-after-app-reload.spec.ts` — marked `test.fixme()` with a description of the defect (the suite stays green, the defect is documented).
- Plan: `specs/cart-edge-cases.plan.md`, the scenario about preserving the cart after a reload.
