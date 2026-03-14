import React from 'react';

const Sidebar = () => (
  <aside className="w-64 bg-gray-800 text-white p-4">
    <h1 className="text-2xl font-bold font-wordmark text-brand-gold">IMIDUS</h1>
    <nav className="mt-8">
      <ul>
        <li className="mb-4">
          <a href="#" className="block hover:text-brand-gold">Dashboard</a>
        </li>
        <li className="mb-4">
          <a href="#" className="block hover:text-brand-gold">Orders</a>
        </li>
        <li className="mb-4">
          <a href="#" className="block hover:text-brand-gold">Customers</a>
        </li>
        <li className="mb-4">
          <a href="#" className="block hover:text-brand-gold">Menu</a>
        </li>
        <li className="mb-4">
          <a href="#" className="block hover:text-brand-gold">Settings</a>
        </li>
      </ul>
    </nav>
  </aside>
);

const Header = () => (
  <header className="bg-white shadow-l1 p-4">
    <h2 className="text-xl font-bold text-brand-blue tracking-heading">Dashboard</h2>
  </header>
);

const AdminLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="flex h-screen bg-surface-app-bg">
    <Sidebar />
    <div className="flex-1 flex flex-col">
      <Header />
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  </div>
);

export default AdminLayout;
