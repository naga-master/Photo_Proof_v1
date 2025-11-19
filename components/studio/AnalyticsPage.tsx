import React, { useMemo } from 'react';
import type { Album, Client, Invoice, ServicePackage, AnalyticsData, RevenueMetrics, ClientMetrics, ProjectMetrics, InvoiceMetrics, PackagePerformance, MonthlyData, TopClient } from '../../types';

interface AnalyticsPageProps {
    albums?: Album[];
    clients?: Client[];
    invoices?: Invoice[];
    packages?: ServicePackage[];
}

const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ albums = [], clients = [], invoices = [], packages = [] }) => {
    
    // Calculate analytics data
    const analyticsData = useMemo<AnalyticsData>(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        // Revenue Metrics
        const paidInvoices = invoices.filter(inv => inv.status === 'Paid');
        const totalRevenue = paidInvoices.reduce((sum, inv) => sum + inv.total, 0);
        
        const monthlyInvoices = paidInvoices.filter(inv => {
            const invDate = new Date(inv.invoiceDate);
            return invDate.getMonth() === currentMonth && invDate.getFullYear() === currentYear;
        });
        const monthlyRevenue = monthlyInvoices.reduce((sum, inv) => sum + inv.total, 0);
        
        const lastMonthInvoices = paidInvoices.filter(inv => {
            const invDate = new Date(inv.invoiceDate);
            const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
            const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
            return invDate.getMonth() === lastMonth && invDate.getFullYear() === lastMonthYear;
        });
        const lastMonthRevenue = lastMonthInvoices.reduce((sum, inv) => sum + inv.total, 0);
        
        const revenueGrowth = lastMonthRevenue > 0 
            ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
            : 0;
        
        const averageOrderValue = paidInvoices.length > 0 
            ? totalRevenue / paidInvoices.length 
            : 0;
        
        const projectedRevenue = monthlyRevenue * 12;
        
        const revenue: RevenueMetrics = {
            totalRevenue,
            monthlyRevenue,
            averageOrderValue,
            revenueGrowth,
            projectedRevenue,
        };
        
        // Client Metrics
        const activeClients = clients.filter(c => c.projects.length > 0);
        const newClientsThisMonth = clients.filter(c => {
            // Assuming client has a createdAt field - using lastActivity as proxy
            return c.lastActivity.includes('now') || c.lastActivity.includes('today');
        }).length;
        
        const clientsWithRevenue = clients.map(client => {
            const clientInvoices = paidInvoices.filter(inv => inv.clientId === client.id);
            return {
                ...client,
                totalSpent: clientInvoices.reduce((sum, inv) => sum + inv.total, 0),
            };
        });
        
        const averageClientValue = clients.length > 0 
            ? totalRevenue / clients.length 
            : 0;
        
        const clientRetentionRate = clients.length > 0 
            ? (activeClients.length / clients.length) * 100 
            : 0;
        
        const clientMetrics: ClientMetrics = {
            totalClients: clients.length,
            activeClients: activeClients.length,
            newClientsThisMonth,
            clientRetentionRate,
            averageClientValue,
        };
        
        // Project Metrics
        const completedProjects = albums.filter(a => a.paymentStatus === 'Paid');
        const ongoingProjects = albums.filter(a => a.paymentStatus !== 'Paid');
        const projectsThisMonth = albums.filter(a => {
            if (!a.shootDate) return false;
            const shootDate = new Date(a.shootDate);
            return shootDate.getMonth() === currentMonth && shootDate.getFullYear() === currentYear;
        }).length;
        
        const totalProjectValue = albums.reduce((sum, a) => sum + (a.price || 0), 0);
        const averageProjectValue = albums.length > 0 ? totalProjectValue / albums.length : 0;
        const completionRate = albums.length > 0 ? (completedProjects.length / albums.length) * 100 : 0;
        
        const projectMetrics: ProjectMetrics = {
            totalProjects: albums.length,
            completedProjects: completedProjects.length,
            ongoingProjects: ongoingProjects.length,
            averageProjectValue,
            projectsThisMonth,
            completionRate,
        };
        
        // Invoice Metrics
        const pendingInvoices = invoices.filter(inv => inv.status === 'Pending' || inv.status === 'Draft');
        const overdueInvoices = invoices.filter(inv => {
            if (inv.status === 'Paid') return false;
            const dueDate = new Date(inv.dueDate);
            return dueDate < now;
        });
        
        const totalPaid = paidInvoices.reduce((sum, inv) => sum + inv.total, 0);
        const totalPending = pendingInvoices.reduce((sum, inv) => sum + inv.total, 0);
        const totalOverdue = overdueInvoices.reduce((sum, inv) => sum + inv.total, 0);
        
        // Calculate average payment time
        const paymentTimes = paidInvoices.map(inv => {
            const issueDate = new Date(inv.invoiceDate);
            const paidDate = new Date(); // In real scenario, track actual payment date
            const diffTime = Math.abs(paidDate.getTime() - issueDate.getTime());
            return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        });
        const averagePaymentTime = paymentTimes.length > 0 
            ? paymentTimes.reduce((a, b) => a + b, 0) / paymentTimes.length 
            : 0;
        
        const invoiceMetrics: InvoiceMetrics = {
            totalInvoices: invoices.length,
            paidInvoices: paidInvoices.length,
            pendingInvoices: pendingInvoices.length,
            overdueInvoices: overdueInvoices.length,
            totalPaid,
            totalPending,
            totalOverdue,
            averagePaymentTime,
        };
        
        // Package Performance
        const packagePerformance: PackagePerformance[] = packages.map(pkg => {
            const pkgProjects = albums.filter(a => a.packageId === pkg.id);
            const pkgRevenue = pkgProjects.reduce((sum, a) => sum + (a.price || 0), 0);
            const popularity = albums.length > 0 ? (pkgProjects.length / albums.length) * 100 : 0;
            
            return {
                packageId: pkg.id,
                packageName: pkg.name,
                bookings: pkgProjects.length,
                revenue: pkgRevenue,
                popularity,
            };
        }).sort((a, b) => b.revenue - a.revenue);
        
        // Monthly Trends (last 6 months)
        const monthlyTrends: MonthlyData[] = [];
        for (let i = 5; i >= 0; i--) {
            const monthDate = new Date(currentYear, currentMonth - i, 1);
            const month = monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            
            const monthRevenue = paidInvoices.filter(inv => {
                const invDate = new Date(inv.invoiceDate);
                return invDate.getMonth() === monthDate.getMonth() && 
                       invDate.getFullYear() === monthDate.getFullYear();
            }).reduce((sum, inv) => sum + inv.total, 0);
            
            const monthProjects = albums.filter(a => {
                if (!a.shootDate) return false;
                const shootDate = new Date(a.shootDate);
                return shootDate.getMonth() === monthDate.getMonth() && 
                       shootDate.getFullYear() === monthDate.getFullYear();
            }).length;
            
            const monthClients = newClientsThisMonth; // Simplified
            
            monthlyTrends.push({ month, revenue: monthRevenue, projects: monthProjects, clients: monthClients });
        }
        
        // Top Clients
        const topClients: TopClient[] = clientsWithRevenue
            .sort((a, b) => b.totalSpent - a.totalSpent)
            .slice(0, 5)
            .map(c => ({
                id: c.id,
                name: c.name,
                email: c.email,
                totalSpent: c.totalSpent,
                projectCount: c.projects.length,
                avatarUrl: c.profilePicture || c.avatarUrl,
            }));
        
        return {
            revenue,
            clients: clientMetrics,
            projects: projectMetrics,
            invoices: invoiceMetrics,
            packagePerformance,
            monthlyTrends,
            topClients,
        };
    }, [albums, clients, invoices, packages]);
    
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };
    
    const formatPercentage = (value: number) => {
        return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
            <header className="mb-6 sm:mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Analytics & Insights</h1>
                <p className="mt-1 text-sm sm:text-base text-gray-600">Track your studio's performance and growth metrics.</p>
            </header>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
                {/* Revenue Card */}
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-4 sm:p-6 text-white">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs sm:text-sm font-semibold uppercase opacity-90">Total Revenue</h3>
                        <svg className="w-6 h-6 sm:w-8 sm:h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold mb-1">{formatCurrency(analyticsData.revenue.totalRevenue)}</p>
                    <p className="text-xs sm:text-sm opacity-90">
                        {formatCurrency(analyticsData.revenue.monthlyRevenue)} this month
                        <span className={`ml-2 ${analyticsData.revenue.revenueGrowth >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                            {formatPercentage(analyticsData.revenue.revenueGrowth)}
                        </span>
                    </p>
                </div>

                {/* Projects Card */}
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-4 sm:p-6 text-white">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs sm:text-sm font-semibold uppercase opacity-90">Projects</h3>
                        <svg className="w-6 h-6 sm:w-8 sm:h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold mb-1">{analyticsData.projects.totalProjects}</p>
                    <p className="text-xs sm:text-sm opacity-90">
                        {analyticsData.projects.completedProjects} completed • {analyticsData.projects.ongoingProjects} ongoing
                    </p>
                </div>

                {/* Clients Card */}
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-4 sm:p-6 text-white">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs sm:text-sm font-semibold uppercase opacity-90">Clients</h3>
                        <svg className="w-6 h-6 sm:w-8 sm:h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold mb-1">{analyticsData.clients.totalClients}</p>
                    <p className="text-xs sm:text-sm opacity-90">
                        {analyticsData.clients.activeClients} active • {analyticsData.clients.clientRetentionRate.toFixed(0)}% retention
                    </p>
                </div>

                {/* Invoices Card */}
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-lg p-4 sm:p-6 text-white">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs sm:text-sm font-semibold uppercase opacity-90">Invoices</h3>
                        <svg className="w-6 h-6 sm:w-8 sm:h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold mb-1">{analyticsData.invoices.totalInvoices}</p>
                    <p className="text-xs sm:text-sm opacity-90">
                        {analyticsData.invoices.paidInvoices} paid • {analyticsData.invoices.overdueInvoices} overdue
                    </p>
                </div>
            </div>

            {/* Charts and Details Row */}
            <div className="space-y-6 lg:grid lg:grid-cols-3 lg:gap-6 lg:space-y-0 mb-6 sm:mb-8">
                {/* Revenue Breakdown */}
                <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg shadow p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Revenue Overview</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                            <div>
                                <p className="text-sm text-gray-500">Average Order Value</p>
                                <p className="text-2xl font-bold text-gray-900">{formatCurrency(analyticsData.revenue.averageOrderValue)}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-gray-500">Projected Annual</p>
                                <p className="text-2xl font-bold text-green-600">{formatCurrency(analyticsData.revenue.projectedRevenue)}</p>
                            </div>
                        </div>
                        
                        <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-3">6-Month Revenue Trend</h4>
                            <div className="flex items-end justify-between h-48 gap-2">
                                {analyticsData.monthlyTrends.map((data, index) => {
                                    const maxRevenue = Math.max(...analyticsData.monthlyTrends.map(d => d.revenue));
                                    const height = maxRevenue > 0 ? (data.revenue / maxRevenue) * 100 : 0;
                                    return (
                                        <div key={index} className="flex-1 flex flex-col items-center gap-2">
                                            <div 
                                                className="w-full bg-gradient-to-t from-green-500 to-green-400 rounded-t hover:from-green-600 hover:to-green-500 transition-all cursor-pointer relative group"
                                                style={{ height: `${height}%`, minHeight: '10px' }}
                                                title={`${data.month}: ${formatCurrency(data.revenue)}`}
                                            >
                                                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                                    {formatCurrency(data.revenue)}
                                                </div>
                                            </div>
                                            <span className="text-xs text-gray-600 transform -rotate-45 mt-2">{data.month}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Payment Status */}
                <div className="bg-white border border-gray-200 rounded-lg shadow p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Payment Status</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div>
                                <p className="text-sm font-medium text-green-900">Paid</p>
                                <p className="text-xs text-green-700">{analyticsData.invoices.paidInvoices} invoices</p>
                            </div>
                            <p className="text-xl font-bold text-green-600">{formatCurrency(analyticsData.invoices.totalPaid)}</p>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div>
                                <p className="text-sm font-medium text-yellow-900">Pending</p>
                                <p className="text-xs text-yellow-700">{analyticsData.invoices.pendingInvoices} invoices</p>
                            </div>
                            <p className="text-xl font-bold text-yellow-600">{formatCurrency(analyticsData.invoices.totalPending)}</p>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                            <div>
                                <p className="text-sm font-medium text-red-900">Overdue</p>
                                <p className="text-xs text-red-700">{analyticsData.invoices.overdueInvoices} invoices</p>
                            </div>
                            <p className="text-xl font-bold text-red-600">{formatCurrency(analyticsData.invoices.totalOverdue)}</p>
                        </div>
                        
                        <div className="pt-3 border-t">
                            <p className="text-sm text-gray-600">Avg. Payment Time</p>
                            <p className="text-2xl font-bold text-gray-900">{analyticsData.invoices.averagePaymentTime.toFixed(0)} days</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Row */}
            <div className="space-y-6 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0">
                {/* Top Clients */}
                <div className="bg-white border border-gray-200 rounded-lg shadow p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Top Clients by Revenue</h3>
                    <div className="space-y-3">
                        {analyticsData.topClients.map((client, index) => (
                            <div key={client.id} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                                <div className="flex-shrink-0 w-8 text-center">
                                    <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                                </div>
                                <img 
                                    src={client.avatarUrl || `https://i.pravatar.cc/150?u=${client.email}`} 
                                    alt={client.name}
                                    className="w-12 h-12 rounded-full object-cover"
                                />
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900">{client.name}</p>
                                    <p className="text-sm text-gray-500">{client.projectCount} projects</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-green-600">{formatCurrency(client.totalSpent)}</p>
                                </div>
                            </div>
                        ))}
                        {analyticsData.topClients.length === 0 && (
                            <p className="text-center text-gray-500 py-8">No client data available</p>
                        )}
                    </div>
                </div>

                {/* Package Performance */}
                <div className="bg-white border border-gray-200 rounded-lg shadow p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Package Performance</h3>
                    <div className="space-y-3">
                        {analyticsData.packagePerformance.map((pkg, index) => (
                            <div key={pkg.packageId} className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900">{pkg.packageName}</p>
                                        <p className="text-sm text-gray-500">{pkg.bookings} bookings</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-blue-600">{formatCurrency(pkg.revenue)}</p>
                                        <p className="text-xs text-gray-500">{pkg.popularity.toFixed(1)}% share</p>
                                    </div>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all"
                                        style={{ width: `${pkg.popularity}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                        {analyticsData.packagePerformance.length === 0 && (
                            <p className="text-center text-gray-500 py-8">No package data available</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Additional Insights */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-blue-900 mb-2">💡 Revenue Insight</h4>
                    <p className="text-sm text-blue-700">
                        Your average order value is {formatCurrency(analyticsData.revenue.averageOrderValue)}. 
                        {analyticsData.revenue.averageOrderValue < 50000 && " Consider upselling premium packages to increase AOV."}
                        {analyticsData.revenue.averageOrderValue >= 50000 && " Great work! Your AOV is above industry average."}
                    </p>
                </div>
                
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-purple-900 mb-2">📈 Growth Opportunity</h4>
                    <p className="text-sm text-purple-700">
                        You have {analyticsData.projects.ongoingProjects} ongoing projects. 
                        {analyticsData.projects.ongoingProjects > 5 && " Focus on delivering quality to maintain high client satisfaction."}
                        {analyticsData.projects.ongoingProjects <= 5 && " You have capacity for more bookings!"}
                    </p>
                </div>
                
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-orange-900 mb-2">⚡ Action Required</h4>
                    <p className="text-sm text-orange-700">
                        {analyticsData.invoices.overdueInvoices > 0 
                            ? `${analyticsData.invoices.overdueInvoices} overdue invoices need follow-up. Send reminders to improve cash flow.`
                            : "All invoices are up to date! Great job managing payments."}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsPage;
