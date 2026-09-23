# TC-2.3 Removing a product from the cart (should-remove-product-from-cart)

**Preconditions:** the GreenKart main page is open (`https://rahulshettyacademy.com/seleniumPractise/#/`), the cart is empty

| Step # | Step description | Expected result | Actual result |
|---|---|---|---|
| 1 | Add "Brocolli - 1 Kg" to the cart | The "Items" counter shows "1" | |
| 2 | Add "Cauliflower - 1 Kg" to the cart | The "Items" counter shows "2" | |
| 3 | Open the cart and click "×" next to "Brocolli - 1 Kg" | "Brocolli - 1 Kg" is no longer shown in the cart; the "Items" counter shows "1"; the "Price" counter shows "60" (only Cauliflower remains) | |
