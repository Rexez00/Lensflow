UPDATE products SET image_url='https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80', badge='', featured=TRUE WHERE slug='fisheye-180';
UPDATE products SET image_url='https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=800&q=80', badge='New', featured=TRUE WHERE slug='macro-pro';
UPDATE products SET image_url='https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80', badge='', featured=FALSE WHERE slug='wide-067';
UPDATE products SET image_url='https://images.unsplash.com/photo-1500634245200-e5245c7574ef?auto=format&fit=crop&w=800&q=80', badge='Bestseller', featured=TRUE WHERE slug='duo-kit';
UPDATE products SET image_url='https://images.unsplash.com/photo-1495707902641-75cac588d2e9?auto=format&fit=crop&w=800&q=80', badge='', featured=FALSE WHERE slug='clip-pack';
UPDATE products SET image_url='https://images.unsplash.com/photo-1519638831568-d9897f54ed69?auto=format&fit=crop&w=800&q=80', badge='', featured=FALSE WHERE slug='pocket-case';
SELECT slug, badge, featured, left(image_url, 40) FROM products ORDER BY id;
