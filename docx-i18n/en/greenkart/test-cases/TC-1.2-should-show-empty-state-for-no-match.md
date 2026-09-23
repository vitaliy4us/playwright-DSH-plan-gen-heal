# TC-1.2 Empty state when there are no matches (should-show-empty-state-for-no-match)

**Preconditions:** the GreenKart main page is open (`https://rahulshettyacademy.com/seleniumPractise/#/`)

| Step # | Step description | Expected result | Actual result |
|---|---|---|---|
| 1 | Type "xyz123" into the "Search for Vegetables and Fruits" search box | The product list is replaced by the heading "Sorry, no products matched your search!" | |
| 2 | Check the hint in the empty state | The hint "Enter a different keyword and try." is shown | |
| 3 | Clear the search box | The empty-state heading disappears and the full product list is restored | |
