// --- ANGEL'S BURGER DEFAULT TEMPLATE ---
export const angelsBurgerTemplate = {
  business: { name: "ANGEL'S POS", theme: 'red', hasEndingReconciliation: true },
  categories: [
    { id: 'cat_main',   name: 'Main Orders', color: 'red'    },
    { id: 'cat_extras', name: 'Extras',      color: 'yellow' },
    { id: 'cat_drinks', name: 'Drinks',      color: 'blue'   },
  ],
  inventoryDb: {
    'Buns': 5, 'HD Buns': 5, 'FL Buns': 12, 'Patty': 15,
    'FL Dog': 44, 'Hungarian': 65, 'Jalapeño': 53, 'Chiz': 5,
    'Bacon': 25, 'Hotdog': 13.5, 'Egg': 15,
    'Water': 16, 'Coke': 25, 'Sprite': 25, 'Royal': 25,
    'Predator': 25, 'Coke Zero': 25
  },
  menuItems: [
    { id: 'beef_burger',   categoryId: 'cat_main',   name: 'Beef Burger',    price: 40,  recipe: { 'Patty': 2, 'Buns': 2 } },
    { id: 'chiz_burger',   categoryId: 'cat_main',   name: 'Chiz Burger',    price: 50,  recipe: { 'Patty': 2, 'Buns': 2, 'Chiz': 2 } },
    { id: 'egg_sandwich',  categoryId: 'cat_main',   name: 'Egg Sandwich',   price: 20,  recipe: { 'Egg': 1, 'Buns': 1 } },
    { id: 'chiz_hotdog',   categoryId: 'cat_main',   name: 'Chiz Hotdog',    price: 37,  recipe: { 'Hotdog': 2, 'HD Buns': 2 } },
    { id: 'footlong',      categoryId: 'cat_main',   name: 'Footlong',       price: 56,  recipe: { 'FL Dog': 1, 'FL Buns': 1 } },
    { id: 'jalapeno',      categoryId: 'cat_main',   name: 'Jalapeño',       price: 65,  recipe: { 'Jalapeño': 1, 'FL Buns': 1 } },
    { id: 'hungarian',     categoryId: 'cat_main',   name: 'Hungarian',      price: 70,  recipe: { 'Hungarian': 1, 'HD Buns': 1 } },
    { id: 'footlong_combo',categoryId: 'cat_main',   name: 'Footlong Combo', price: 136, recipe: { 'FL Dog': 1, 'FL Buns': 1, 'Patty': 2, 'Egg': 2, 'Chiz': 4 } },
    { id: 'jalapeno_combo',categoryId: 'cat_main',   name: 'Jalapeño Combo', price: 145, recipe: { 'Jalapeño': 1, 'FL Buns': 1, 'Patty': 2, 'Egg': 2, 'Chiz': 4 } },
    { id: 'ex_chiz',       categoryId: 'cat_extras', name: 'Chiz',           price: 5,   recipe: { 'Chiz': 1 } },
    { id: 'ex_egg',        categoryId: 'cat_extras', name: 'Egg',            price: 15,  recipe: { 'Egg': 1 } },
    { id: 'ex_bacon',      categoryId: 'cat_extras', name: 'Bacon',          price: 25,  recipe: { 'Bacon': 1 } },
    { id: 'ex_patty',      categoryId: 'cat_extras', name: 'Patty',          price: 15,  recipe: { 'Patty': 1 } },
    { id: 'ex_b_buns',     categoryId: 'cat_extras', name: 'B. Buns',        price: 5,   recipe: { 'Buns': 1 } },
    { id: 'custom_amount', categoryId: 'cat_extras', name: 'Custom Value',   price: 0,   recipe: {} },
    { id: 'dr_coke',       categoryId: 'cat_drinks', name: 'Coke',           price: 25,  recipe: { 'Coke': 1 } },
    { id: 'dr_sprite',     categoryId: 'cat_drinks', name: 'Sprite',         price: 25,  recipe: { 'Sprite': 1 } },
    { id: 'dr_royal',      categoryId: 'cat_drinks', name: 'Royal',          price: 25,  recipe: { 'Royal': 1 } },
    { id: 'dr_predator',   categoryId: 'cat_drinks', name: 'Predator',       price: 25,  recipe: { 'Predator': 1 } },
    { id: 'dr_coke_zero',  categoryId: 'cat_drinks', name: 'Coke Zero',      price: 25,  recipe: { 'Coke Zero': 1 } },
    { id: 'dr_water',      categoryId: 'cat_drinks', name: 'Water',          price: 16,  recipe: { 'Water': 1 } },
  ]
};
