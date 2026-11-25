// Ember & Thyme — the menu.
// Every dish the bistro serves, every ingredient on the counter, and the
// prep each ingredient needs before it can go on a plate. A dish is served
// only when the plate holds exactly its ingredient set, in any order.

export const INGREDIENTS = [
  { id: 'bun',     name: 'Bun',     key: '1', prep: 'none',  station: 'plate', color: '#e8a94f', dark: '#b97f2e' },
  { id: 'patty',   name: 'Patty',   key: '2', prep: 'grill', station: 'grill', color: '#8a5a33', dark: '#5f3a1e' },
  { id: 'cheese',  name: 'Cheese',  key: '3', prep: 'none',  station: 'plate', color: '#f5c542', dark: '#d9a41f' },
  { id: 'lettuce', name: 'Lettuce', key: '4', prep: 'chop',  station: 'board', color: '#7bc96f', dark: '#4c9a44' },
  { id: 'tomato',  name: 'Tomato',  key: '5', prep: 'chop',  station: 'board', color: '#e0523e', dark: '#b23424' },
  { id: 'onion',   name: 'Onion',   key: '6', prep: 'chop',  station: 'board', color: '#f2e6f5', dark: '#c9a8d4' },
  { id: 'steak',   name: 'Steak',   key: '7', prep: 'grill', station: 'grill', color: '#a04a3a', dark: '#6e2f24' },
  { id: 'fries',   name: 'Fries',   key: '8', prep: 'fry',   station: 'fryer', color: '#f2c14e', dark: '#d99a1f' },
];

// Where an ingredient goes, in words the counter can print under its bin.
export const STATION_LABELS = {
  plate: 'straight to plate',
  board: 'chop first',
  grill: 'grill it',
  fryer: 'fry it',
};

export const INGREDIENT_BY_ID = Object.fromEntries(
  INGREDIENTS.map((ing) => [ing.id, ing]),
);

// A dish's `needs` list the finished ingredients: grilled items are listed
// by their id once cooked, chopped items by their id once chopped.
export const DISHES = [
  {
    id: 'burger',
    name: 'Classic Burger',
    needs: ['bun', 'patty', 'cheese', 'lettuce'],
    price: 18,
    blurb: 'The house favourite. Grill the patty, stack it high.',
  },
  {
    id: 'salad',
    name: 'Garden Salad',
    needs: ['lettuce', 'tomato', 'onion'],
    price: 12,
    blurb: 'Three chops, one bowl, no grill at all.',
  },
  {
    id: 'steakfrites',
    name: 'Steak Frites',
    needs: ['steak', 'fries'],
    price: 22,
    blurb: 'Seared steak, golden fries. Watch the grill twice.',
  },
];

export const DISH_BY_ID = Object.fromEntries(
  DISHES.map((dish) => [dish.id, dish]),
);

// The plate matches a dish when it holds exactly that dish's set.
export function matchDish(plateIds) {
  const sorted = [...plateIds].sort().join(',');
  return DISHES.find((dish) => [...dish.needs].sort().join(',') === sorted) ?? null;
}

// True when the plate is a prefix of some dish: still worth building on.
export function plateIsOnTrack(plateIds) {
  return DISHES.some((dish) => plateIds.every((id) => dish.needs.includes(id)));
}
