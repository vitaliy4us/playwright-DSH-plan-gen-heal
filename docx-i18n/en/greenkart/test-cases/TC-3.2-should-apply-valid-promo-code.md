# TC-3.2 Applying a valid promo code (should-apply-valid-promo-code)

**Preconditions:** the GreenKart main page is open, 3 pcs of "Brocolli - 1 Kg" (₹120 each) have been added to the cart

| Step # | Step description | Expected result | Actual result |
|---|---|---|---|
| 1 | Open the cart and click "PROCEED TO CHECKOUT" | The URL becomes `#/cart`; "Total Amount :" equals 360 | |
| 2 | Type "rahulshettyacademy" into the "Enter promo code" field and click "Apply" | The message "Code applied ..!" appears | |
| 3 | Check the discount calculation | "Discount : 10%" | |
| 4 | Check the final amount | "Total After Discount : 324" (360 − 10%) | |
