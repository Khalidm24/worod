# Security Specification for Baqa & Ward (باقة وورد - القنيطرة)

## 1. Data Invariants & Access Control Model
- **Admin Identity**: The primary store administrator is `messkha31@gmail.com`. Admins have full access to create, update, and delete products, update store settings, and manage/process customer delivery orders.
- **Product Catalog (`/products/{productId}`)**:
  - Anyone can read/list products (public storefront catalog).
  - Only authenticated admin (`messkha31@gmail.com`) can create, update, or delete products (prices, photos, descriptions, stock).
- **Orders (`/orders/{orderId}`)**:
  - Anyone can create a customer order during checkout (with valid fields: recipient name, phone, city, total > 0, status == 'pending').
  - Only admin (`messkha31@gmail.com`) can list all orders, view order details, update status ('processing', 'out_for_delivery', 'delivered', 'cancelled'), or delete orders.
- **Store Settings (`/settings/{settingId}`)**:
  - Anyone can read store settings (free delivery threshold, announcement banner, contact phone).
  - Only admin (`messkha31@gmail.com`) can write or update store settings.

## 2. The "Dirty Dozen" Payloads (Designed to Fail)
1. **Unauthenticated Product Price Alteration**: An unauthenticated user attempts to update a product price to 0 MAD. (Should be PERMISSION_DENIED)
2. **Non-Admin Product Creation**: A random signed-in customer attempts to create a new product in `/products/`. (Should be PERMISSION_DENIED)
3. **Product ID Poisoning Attack**: An attacker supplies an invalid document ID (> 128 chars or illegal characters) to `/products/`. (Should be PERMISSION_DENIED)
4. **Order Without Required Fields**: An order created without `recipientPhone` or `recipientName`. (Should be PERMISSION_DENIED)
5. **Negative Order Total**: An order submitted with `total: -50`. (Should be PERMISSION_DENIED)
6. **Public Order Listing Scraping**: An unauthenticated user attempts to list all customer orders in `/orders/` to steal addresses and phone numbers. (Should be PERMISSION_DENIED)
7. **Customer Tampering With Order Status**: A customer attempts to mark an order as 'delivered' or change status. (Should be PERMISSION_DENIED)
8. **Malicious Giant String Payload**: Submitting a product with an 8MB base64 string in `name`. (Should be PERMISSION_DENIED)
9. **Fake Admin Spoofing via Unverified Email**: Sending an auth token with `email: 'messkha31@gmail.com'` but `email_verified: false`. (Should be PERMISSION_DENIED)
10. **Store Settings Overwrite by Anonymous Client**: An unauthenticated client writing to `/settings/main`. (Should be PERMISSION_DENIED)
11. **Order Deletion by Customer**: A customer attempting to delete an order from `/orders/{orderId}`. (Should be PERMISSION_DENIED)
12. **Catch-All Default Deny**: Accessing arbitrary non-existent collections like `/system_keys/` or `/admins/`. (Should be PERMISSION_DENIED)
