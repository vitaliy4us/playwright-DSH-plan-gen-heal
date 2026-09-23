# TC-3.1 Rejecting an invalid promo code (should-reject-invalid-promo-code)

**Preconditions:** the GreenKart main page is open, 3 pcs of "Brocolli - 1 Kg" (₹120 each) have been added to the cart

| Step # | Step description | Expected result | Actual result |
|---|---|---|---|
| 1 | Open the cart and click "PROCEED TO CHECKOUT" | The URL becomes `#/cart`; the total is 360 | |
| 2 | Type "INVALID123" into the "Enter promo code" field and click "Apply" | The message "Invalid code ..!" appears | |
| 3 | Check the calculation without a discount | "Discount : 0%" and "Total After Discount : 360" remain unchanged | |
