# TC-4.2 Placing an order successfully (should-place-order-successfully)

**Preconditions:** the GreenKart main page is open, the cart is empty

| Step # | Step description | Expected result | Actual result |
|---|---|---|---|
| 1 | Add 2 pcs of "Tomato - 1 Kg" (₹16 each) to the cart and click "PROCEED TO CHECKOUT" | The cart page shows "No. of Items : 1" and the total 32 | |
| 2 | Click "Place Order" | The URL becomes `#/country` | |
| 3 | Select "India" in the country list, check the Terms & Conditions checkbox and click "Proceed" | The message "Thank you, your order has been placed successfully" appears; after the auto-redirect the URL returns to the main page `#/`; the "Items" counter shows "0" (the cart is cleared) | |
