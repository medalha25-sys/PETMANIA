import React, { useState } from 'react';
import StatCards from '../components/dashboard/StatCards';
import AppointmentsTable from '../components/dashboard/AppointmentsTable';
import DashboardNotices from '../components/dashboard/DashboardNotices';
import DashboardNotes from '../components/dashboard/DashboardNotes';
import MarketingWidget from '../components/dashboard/MarketingWidget';

interface DashboardProps {
  isGuest?: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ isGuest = false }) => {
  // Shared state to trigger refreshes between components (e.g., table completion updates stats)
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleDataUpdate = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-[1400px] mx-auto w-full pb-24 lg:pb-8">
      {/* Page Header */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-slate-900 dark:text-white tracking-tight text-[28px] sm:text-[32px] font-bold leading-tight">Visão Geral</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-normal">Bem-vindo de volta, Admin. Aqui está o resumo de hoje.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-xl h-10 px-4 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-800 text-slate-700 dark:text-slate-200 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm">
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span className="hidden sm:inline">Relatórios</span>
          </button>
        </div>
      </header>

      {/* Stats Grid */}
      <StatCards isGuest={isGuest} refreshTrigger={refreshTrigger} />

      {/* Main Content Area */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Table Section */}
        <AppointmentsTable isGuest={isGuest} onUpdate={handleDataUpdate} />

        {/* Sidebar Cards */}
        {!isGuest && (
          <aside className="space-y-6">
            <DashboardNotices />
            <DashboardNotes />
            <MarketingWidget />
          </aside>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
