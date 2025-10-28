// Shared mock data used by multiple analytics and demo modules
export const MOCK_TRIPS = [
  { id: 't1', employee: 'Alice', dept: 'Sales', region: 'EMEA', destination: 'London', spend: 3200, date: '2025-09-10', status: 'Approved' },
  { id: 't2', employee: 'Bob', dept: 'Engineering', region: 'APAC', destination: 'Tokyo', spend: 4200, date: '2025-09-14', status: 'Pending' },
  { id: 't3', employee: 'Alice', dept: 'Sales', region: 'EMEA', destination: 'Paris', spend: 1200, date: '2025-08-04', status: 'Completed' },
  { id: 't4', employee: 'Carlos', dept: 'Finance', region: 'AMER', destination: 'New York', spend: 5400, date: '2025-07-22', status: 'Approved' },
  { id: 't5', employee: 'Dee', dept: 'Engineering', region: 'APAC', destination: 'Seoul', spend: 900, date: '2025-09-02', status: 'Approved' },
];

export const MOCK_EXPENSES = [
  { id:'e1', tripId:'t1', category: 'Airline', vendor: 'Airways', amount: 1200 },
  { id:'e2', tripId:'t1', category: 'Hotel', vendor: 'Grand Inn', amount: 1500 },
  { id:'e3', tripId:'t2', category: 'Airline', vendor: 'NipponAir', amount: 2200 },
  { id:'e4', tripId:'t4', category: 'Hotel', vendor: 'NY Suites', amount: 3000 },
  { id:'e5', tripId:'t5', category: 'Car', vendor: 'RentMe', amount: 200 },
];

export const MOCK_INCIDENTS = [
  { id:'i1', date:'2025-09-11', tripId:'t1', severity: 'Low', note: 'Missed connection, rebooked' },
  { id:'i2', date:'2025-09-14', tripId:'t2', severity: 'High', note: 'Medical evacuation' },
];

export default { MOCK_TRIPS, MOCK_EXPENSES, MOCK_INCIDENTS };
