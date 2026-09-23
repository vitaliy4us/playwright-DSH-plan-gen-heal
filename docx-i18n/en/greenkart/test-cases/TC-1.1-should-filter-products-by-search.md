# TC-1.1 Filtering products by search (should-filter-products-by-search)

**Preconditions:** the GreenKart main page is open (`https://rahulshettyacademy.com/seleniumPractise/#/`), the full catalogue of 30 products

| Step # | Step description | Expected result | Actual result |
|---|---|---|---|
| 1 | Type "ca" into the "Search for Vegetables and Fruits" search box | Only products whose name contains "ca" are shown: Cauliflower - 1 Kg, Carrot - 1 Kg, Capsicum, Cashews - 1 Kg | |
| 2 | Check that the no-results message is absent | The heading "Sorry, no products matched your search!" is not shown | |
| 3 | Clear the search box | All 30 products are shown, including Brocolli - 1 Kg and Walnuts - 1/4 Kg | |
