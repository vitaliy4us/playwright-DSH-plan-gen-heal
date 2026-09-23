# TC-2.2 Adjusting the quantity before adding (should-adjust-quantity-before-adding)

**Preconditions:** the GreenKart main page is open (`https://rahulshettyacademy.com/seleniumPractise/#/`), the cart is empty

| Step # | Step description | Expected result | Actual result |
|---|---|---|---|
| 1 | On the "Brocolli - 1 Kg" card, click "+" twice | The quantity field shows "3" | |
| 2 | Click "–" once | The quantity field shows "2" | |
| 3 | Click "–" twice more | The quantity never drops below "1"; the quantity field shows "1" | |
| 4 | Click "ADD TO CART" | The "Items" counter shows "1", the "Price" counter shows "120" (1 × ₹120) | |
| 5 | Open the drop-down cart | The cart shows "Brocolli - 1 Kg", "1 No." and "₹ 120" | |
