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
    url: 'https://app.powerbi.com/view?r=eyJrIjoiYWJjZGVmZ2gtaWprbC1tbm9wLXFyc3QtdXZ3eHl6MTIzNCIsInQiOiJjMDFhMmIzYy00ZDVlLTZmN2ctOGg5aS0wajFrMmwzbTRuNW8ifQ%3D%3D',
  },
  {
    id: 'dashboard-2',
    name: 'Marketing Dashboard',
    url: 'https://app.powerbi.com/view?r=eyJrIjoiZGVmZ2hpams0LWxtbm8tcHFycy10dXZ3LXh5ejEyMzQ1IiwidCI6ImMwMWEyYjNjLTRkNWUtNmY3Yy04aDlpLTBqMWsybDNtNG41byJ9',
  },
  {
    id: 'dashboard-3',
    name: 'Financial Dashboard',
    url: 'https://app.powerbi.com/view?r=eyJrIjoiZ2hpamtsbW4tb3Bxci1zdHV2LXd4eXotMTIzNDU2IiwidCI6ImMwMWEyYjNjLTRkNWUtNmY3Yy04aDlpLTBqMWsybDNtNG41byJ9',
  },
  {
    id: 'dashboard-4',
    name: 'Operations Dashboard',
    url: 'https://app.powerbi.com/view?r=eyJrIjoianBxcnN0dXYtd3h5ei0xMjM0LTU2NzgtOWFiY2RlZmdoaSIsInQiOiJjMDFhMmIzYy00ZDVlLTZmN2ctOGg5aS0wajFrMmwzbTRuNW8ifQ%3D%3D',
  },
];
