// Dashboard.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Activity, Package, RefreshCw } from "lucide-react";
// import { page } from "../pages/page";
import PageContainer from "../components/PageContainer";
import "../styles/dashboard.css";
import Cards from '../components/Cards';
import SectionHeading from '../components/SectionHeading';

interface DashboardProps {
  sidebarCollapsed?: boolean;
  toggleSidebar?: () => void;
}
const Dashboard: React.FC<DashboardProps> = ({ sidebarCollapsed = false, toggleSidebar }) => {
  const navigate = useNavigate();
  
  // Mock stats for demonstration - replace with actual data
  const [stats, setStats] = useState({
    activeRequests: 0,
    sterilizationInProgress: 0,
    itemsReady: 0,
    lowStockItems: 0
  });
  const [loading, setLoading] = useState(true);

  const [currentTime, setCurrentTime] = useState(new Date());
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Fetch all data from database
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Get active requests count
        const requestsRes = await fetch('http://localhost:3001/api/cssd_requests');
        const requests = await requestsRes.json();
        const activeCount = requests.filter((r: any) => r.status === 'Requested' || r.status === 'In Progress').length;
        // Get latest new request
        const sortedRequests = [...requests].sort((a, b) => new Date(b.date + 'T' + (b.time || '00:00')).getTime() - new Date(a.date + 'T' + (a.time || '00:00')).getTime());
        const latestRequest = sortedRequests.find((r: any) => r.status === 'Requested');

        // Get sterilization in progress count
        const processesRes = await fetch('http://localhost:3001/api/sterilizationProcesses');
        const processes = await processesRes.json();
        const inProgressCount = processes.filter((p: any) => p.status === 'In Progress').length;
        // Get latest completed sterilization
        const completedProcesses = processes.filter((p: any) => p.status === 'Completed');
        const sortedCompleted = [...completedProcesses].sort((a, b) => new Date(b.endTime || b.date || '').getTime() - new Date(a.endTime || a.date || '').getTime());
        const latestCompleted = sortedCompleted[0];

        // Get items ready count (completed sterilization processes)
        const completedCount = processes.filter((p: any) => p.status === 'Completed').length;
        
        // Get low stock count
        const stockRes = await fetch('http://localhost:3001/api/stockItems');
        const stock = await stockRes.json();
        const lowStockCount = stock.filter((item: any) => item.status === 'Low Stock').length;

        setStats({
          activeRequests: activeCount,
          sterilizationInProgress: inProgressCount,
          itemsReady: completedCount,
          lowStockItems: lowStockCount
        });

        // Prepare recent activity
        const activity: any[] = [];
        if (latestCompleted) {
          activity.push({
            type: 'sterilization',
            id: latestCompleted.itemId || latestCompleted.id,
            desc: latestCompleted.process ? `${latestCompleted.process} finished for ${latestCompleted.itemId || 'item'}` : 'Sterilization process completed',
          });
        }
        if (latestRequest) {
          activity.push({
            type: 'request',
            id: latestRequest.id,
            desc: latestRequest.items ? `${latestRequest.items} requested from ${latestRequest.department}` : 'New request submitted',
          });
        }
        setRecentActivity(activity);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Keep default values if there's an error
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const refreshDashboard = () => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Get active requests count
        const requestsRes = await fetch('http://localhost:3001/api/cssd_requests');
        const requests = await requestsRes.json();
        const activeCount = requests.filter((r: any) => r.status === 'Requested' || r.status === 'In Progress').length;
        
        // Get sterilization in progress count
        const processesRes = await fetch('http://localhost:3001/api/sterilizationProcesses');
        const processes = await processesRes.json();
        const inProgressCount = processes.filter((p: any) => p.status === 'In Progress').length;
        
        // Get items ready count (completed sterilization processes)
        const completedCount = processes.filter((p: any) => p.status === 'Completed').length;
        
        // Get low stock count
        const stockRes = await fetch('http://localhost:3001/api/stockItems');
        const stock = await stockRes.json();
        const lowStockCount = stock.filter((item: any) => item.status === 'Low Stock').length;
        
        setStats({
          activeRequests: activeCount,
          sterilizationInProgress: inProgressCount,
          itemsReady: completedCount,
          lowStockItems: lowStockCount
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
    }
    };

    fetchDashboardData();
  };

  const handleNewRequest = () => navigate('/request-management');
  const handleStartSterilization = () => navigate('/sterilization-process');

  return (
    <>
      <Header sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} showDate showTime showCalculator />
      
       
      {/* <div className="page-container"> */}
      <PageContainer>
        <div className="flex justify-between items-center mb-6">
        <SectionHeading title="Dashboard" subtitle="Central Sterile Service Department" className="dashboard-heading" />
         
        </div>
        
        <div className="dashboard-summary-cards">
          {[
            { title: 'Active Requests', subtitle: stats.activeRequests?.toString() || '0' },
            { title: 'Sterilization In Progress', subtitle: stats.sterilizationInProgress?.toString() || '0' },
            { title: 'Items Ready', subtitle: stats.itemsReady?.toString() || '0' },
            { title: 'Low Stock Items', subtitle: stats.lowStockItems?.toString() || '0' }
          ].map((card, index) => (
            <Cards key={index} title={card.title} subtitle={card.subtitle} />
          ))}
        </div>

        <div className="dashboard-sections-row">
          <div className="dashboard-section-card recent-activity-card">
            <div className="">
              <h3>Recent Activity</h3>
              <p>Latest CSSD operations</p>
            </div>
            <div className="section-content">
              <div className="activity-list">
                {recentActivity.length === 0 && (
                  <div className="text-gray-500">No recent activity</div>
                )}
                {recentActivity.map((act, idx) => (
                  <div className="activity-item-card" key={idx}>
                    {act.type === 'sterilization' ? (
                      <Activity className="icon teal" />
                    ) : (
                      <Package className="icon teal" />
                    )}
                  <div>
                      <p className="activity-title">
                        {act.type === 'sterilization' ? 'Sterilization Completed' : 'New Request'} - {act.id}
                      </p>
                      <p className="activity-desc">{act.desc}</p>
                </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="dashboard-section-card quick-actions-card">
            <div className="">
              <h3>Quick Actions</h3>
              <p>Common CSSD tasks</p>
            </div>
            <div className="quick-actions-list">
              <button onClick={handleNewRequest} className="quick-action-btn">
                <Package className="icon teal" />
                <span>New Request</span>
              </button>
              <button onClick={handleStartSterilization} className="quick-action-btn">
                <Activity className="icon teal" />
                <span>Start Sterilization</span>
              </button>
            </div>
          </div>
        </div>
      {/* </div> */}
      </PageContainer>
      <Footer />
    </>
  );
};

export default Dashboard;
