# TC-4.1 Mandatory acceptance of the terms (should-require-terms-acceptance)

**Preconditions:** the GreenKart main page is open, the cart holds at least one product

| Step # | Step description | Expected result | Actual result |
|---|---|---|---|
| 1 | Add any product to the cart, open the cart and click "PROCEED TO CHECKOUT" | The URL becomes `#/cart` | |
| 2 | Click "Place Order" | The URL becomes `#/country` | |
| 3 | Select "India" in the "Choose Country" list, leave the Terms & Conditions checkbox unchecked and click "Proceed" | The message "Please accept Terms & Conditions - Required" appears; the URL remains `#/country` | |
