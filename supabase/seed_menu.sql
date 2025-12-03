-- Clear existing items (optional, but good for clean slate if desired)
-- TRUNCATE menu_items CASCADE; 

-- Insert Chicken Items
INSERT INTO menu_items (name, price, category, variants) VALUES
('Garlic Chicken', 220.00, 'Chicken Dishes', null),
('Buttered Chicken', 199.00, 'Chicken Dishes', null),
('Chicken bang-bang', 220.00, 'Chicken Dishes', null),
('Chicken creamy mushroom', 230.00, 'Chicken Dishes', null),
('Spicy chicken', 220.00, 'Chicken Dishes', null),
('Pininyahang Manok', 230.00, 'Chicken Dishes', null),
('Chicken tinola (native)', 299.00, 'Chicken Dishes', null),
('Lemon Buttered Chicken', 199.00, 'Chicken Dishes', null),
('Binakol (native)', 330.00, 'Chicken Dishes', null),
('Native chicken inasal', 149.00, 'Chicken Dishes', null),
('Chicken cordon blue', 0, 'Chicken Dishes', null); -- Price not specified in image

-- Insert Pork Items
INSERT INTO menu_items (name, price, category, variants) VALUES
('Pork Adobo', 220.00, 'Pork Dishes', null),
('Pork Kinilaw', 299.00, 'Pork Dishes', null),
('Bicol Express', 310.00, 'Pork Dishes', null),
('Sinigang', 320.00, 'Pork Dishes', null),
('Pork Hamonado', 299.00, 'Pork Dishes', null),
('Pork Estopado', 299.00, 'Pork Dishes', null);

-- Insert Beef Items
INSERT INTO menu_items (name, price, category, variants) VALUES
('Beef steak', 339.00, 'Beef Dishes', null),
('Bulalo (Family)', 499.00, 'Beef Dishes', null),
('Bulalo (Medium)', 299.00, 'Beef Dishes', null),
('Bulalo (Small)', 199.00, 'Beef Dishes', null),
('Beef curry', 349.00, 'Beef Dishes', null),
('Beef broccoli', 310.00, 'Beef Dishes', null);

-- Insert Vegetables & Salad
INSERT INTO menu_items (name, price, category, variants) VALUES
('Chopsuey', 220.00, 'Vegetables', null),
('Buttered Vegetables', 270.00, 'Vegetables', null),
('Pako salad', 120.00, 'Vegetables', null),
('Cauliflower, broccoli w/ shrimp', 310.00, 'Vegetables', null),
('Lettuce Salad', 180.00, 'Vegetables', null);

-- Insert Fish Items
INSERT INTO menu_items (name, price, category, variants) VALUES
('Fried Hito', 299.00, 'Seafood', null),
('Fish Fillet', 199.00, 'Seafood', null),
('Ginataang hito', 320.00, 'Seafood', null),
('Chicharon tilapia', 320.00, 'Seafood', null),
('Sweet and Sour Fish Fillet', 220.00, 'Seafood', null),
('Fish tausi', 230.00, 'Seafood', null),
('Shrimp tempura', 310.00, 'Seafood', null),
('Buttered Shrimp', 310.00, 'Seafood', null),
('Calamares', 200.00, 'Seafood', null),
('Tinolang isda', 299.00, 'Seafood', null),
('Tilapia (sinugba)', 250.00, 'Seafood', null);

-- Insert Soup
INSERT INTO menu_items (name, price, category, variants) VALUES
('Egg Drop Soup', 220.00, 'Soup', null);

-- Insert Lechon
INSERT INTO menu_items (name, price, category, variants, is_weighted) VALUES
('Lechon', 700.00, 'Lechon & Grills', null, true),
('Lechon paksiw', 299.00, 'Lechon & Grills', null),
('Lechon sisig', 299.00, 'Lechon & Grills', null),
('Lechon Batchoy (special)', 99.00, 'Lechon & Grills', null),
('Lechon 99 w/ unli rice', 99.00, 'Lechon & Grills', null);

-- Insert Dessert
INSERT INTO menu_items (name, price, category, variants) VALUES
('Mango graham', 120.00, 'Desserts', null),
('Mango tapioca', 150.00, 'Desserts', null),
('Banana cream', 120.00, 'Desserts', null);

-- Insert Short Order
INSERT INTO menu_items (name, price, category, variants) VALUES
('Pancit Canton', 175.00, 'Short Orders', null),
('Sotanghon', 180.00, 'Short Orders', null),
('Bihon', 160.00, 'Short Orders', null),
('Bam-i', 270.00, 'Short Orders', null);


-- PARTY TRAYS (Chicken Series)
INSERT INTO menu_items (name, price, category, variants) VALUES
('Garlic Chicken (Tray)', 750.00, 'Party Trays', '[{"name": "Small", "price": 750}, {"name": "Medium", "price": 850}, {"name": "Large", "price": 1200}]'),
('Spicy Chicken (Tray)', 750.00, 'Party Trays', '[{"name": "Small", "price": 750}, {"name": "Medium", "price": 850}, {"name": "Large", "price": 1200}]'),
('Buttered Chicken (Tray)', 650.00, 'Party Trays', '[{"name": "Small", "price": 650}, {"name": "Medium", "price": 750}, {"name": "Large", "price": 1100}]'),
('Chicken bang-bang (Tray)', 750.00, 'Party Trays', '[{"name": "Small", "price": 750}, {"name": "Medium", "price": 850}, {"name": "Large", "price": 1200}]'),
('Lemon Buttered Chicken (Tray)', 750.00, 'Party Trays', '[{"name": "Small", "price": 750}, {"name": "Medium", "price": 850}, {"name": "Large", "price": 1200}]');

-- PARTY TRAYS (Pork Favorites)
INSERT INTO menu_items (name, price, category, variants) VALUES
('Pork Adobo (Tray)', 850.00, 'Party Trays', '[{"name": "Small", "price": 850}, {"name": "Medium", "price": 1500}, {"name": "Large", "price": 2300}]'),
('Pork Kinilaw (Tray)', 850.00, 'Party Trays', '[{"name": "Small", "price": 850}, {"name": "Medium", "price": 1500}, {"name": "Large", "price": 1800}]');

-- PARTY TRAYS (Seafood)
INSERT INTO menu_items (name, price, category, variants) VALUES
('Fish Fillet (Tray)', 450.00, 'Party Trays', '[{"name": "Small", "price": 450}, {"name": "Medium", "price": 550}, {"name": "Large", "price": 650}]'),
('Calamari (Tray)', 650.00, 'Party Trays', '[{"name": "Small", "price": 650}, {"name": "Medium", "price": 750}, {"name": "Large", "price": 950}]');

-- PARTY TRAYS (Noodles)
INSERT INTO menu_items (name, price, category, variants) VALUES
('Bam-i (Tray)', 220.00, 'Party Trays', '[{"name": "Small", "price": 220}, {"name": "Medium", "price": 330}, {"name": "Large", "price": 440}]'),
('Bihon (Tray)', 450.00, 'Party Trays', '[{"name": "Small", "price": 450}, {"name": "Medium", "price": 550}, {"name": "Large", "price": 650}]'),
('Canton (Tray)', 550.00, 'Party Trays', '[{"name": "Small", "price": 550}, {"name": "Medium", "price": 650}, {"name": "Large", "price": 750}]'),
('Sotanghon (Tray)', 650.00, 'Party Trays', '[{"name": "Small", "price": 650}, {"name": "Medium", "price": 750}, {"name": "Large", "price": 850}]');

-- PARTY TRAYS (Vegetables)
INSERT INTO menu_items (name, price, category, variants) VALUES
('Chopsuey (Tray)', 450.00, 'Party Trays', '[{"name": "Small", "price": 450}, {"name": "Medium", "price": 550}, {"name": "Large", "price": 650}]');
