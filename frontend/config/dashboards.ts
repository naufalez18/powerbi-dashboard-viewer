export interface Dashboard {
  id: string;
  name: string;
  url: string;
}

// Configure your Power BI dashboard URLs here
export const powerBiDashboards: Dashboard[] = [
  {
    id: 'dashboard-1',
    name: 'Sales Dashboard',
    url: 'https://app.powerbi.com/view?r=eyJrIjoiNTFkN2Q4ODEtMzVjZi00YTZlLWI5MDEtZjZkOTE5NjY3ODgwIiwidCI6IjRiZGJiZTdkLTYzZGYtNGU1Yy05NTNlLTkyODYzMTY4OTVlNiIsImMiOjEwfQ%3D%3D',
  },
  {
    id: 'dashboard-2',
    name: 'Marketing Dashboard',
    url: 'https://app.powerbi.com/view?r=eyJrIjoiN2U5YThjNGYtOGFjMi00M2FjLWI4OWUtNDYzNjNhOTMzZGQ5IiwidCI6IjRiZGJiZTdkLTYzZGYtNGU1Yy05NTNlLTkyODYzMTY4OTVlNiIsImMiOjEwfQ%3D%3D&pageName=5d09de0a920dc3d03aa6',
  },
  {
    id: 'dashboard-3',
    name: 'Financial Dashboard',
    url: 'https://app.powerbi.com/view?r=eyJrIjoiMzZhYmJmODMtMDRhNC00OTMwLWI0OWYtNTc5OWIzY2I1Yjc1IiwidCI6IjRiZGJiZTdkLTYzZGYtNGU1Yy05NTNlLTkyODYzMTY4OTVlNiIsImMiOjEwfQ%3D%3D',
  },
  {
    id: 'dashboard-4',
    name: 'Operations Dashboard',
    url: 'https://app.powerbi.com/view?r=eyJrIjoianBxcnN0dXYtd3h5ei0xMjM0LTU2NzgtOWFiY2RlZmdoaSIsInQiOiJjMDFhMmIzYy00ZDVlLTZmN2ctOGg5aS0wajFrMmwzbTRuNW8ifQ%3D%3D',
  },
];
