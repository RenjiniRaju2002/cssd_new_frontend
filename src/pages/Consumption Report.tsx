import { useState, useEffect } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Download, BarChart3, Plus, BarChart2, TrendingUp, ClipboardList } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar, CartesianGrid, ResponsiveContainer } from "recharts";
import ButtonWithGradient from "../components/ButtonWithGradient";
import "../styles/consumptionreport.css";
import Cards from "../components/Cards";
import Table from "../components/Table";
import SectionHeading from "../components/SectionHeading";
import PageContainer from "../components/PageContainer";
import DropInput from "../components/DropInput";
import Input from "../components/Input";

interface ConsumptionReportsProps {
  sidebarCollapsed?: boolean;
  toggleSidebar?: () => void;
}

const ConsumptionReports: React.FC<ConsumptionReportsProps> = ({ sidebarCollapsed = false, toggleSidebar }) => {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [reportGenerated, setReportGenerated] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [allData, setAllData] = useState<any[]>([]);

  const [tableData, setTableData] = useState<any[]>([]);

  const [requests, setRequests] = useState<any[]>([]);
  const [kits, setKits] = useState<any[]>([]);

  // Fetch requests and kits for dropdowns
  useEffect(() => {
    fetch('http://localhost:3001/api/cssd_requests')
      .then(res => res.json())
      .then(data => setRequests(data))
      .catch(() => setRequests([]));
    fetch('http://localhost:3001/api/createdKits')
      .then(res => res.json())
      .then(data => setKits(data))
      .catch(() => setKits([]));
  }, []);

  const [form, setForm] = useState({
    id: "",
    type: "",
    dept: "",
    date: "",
    before: "",
    after: "",
    used: "",
    items: "",
    requestId: "",
    kitId: "",
  });

  // Fetch consumption records from database
  useEffect(() => {
    fetch('http://localhost:3001/api/consumptionRecords')
      .then(res => res.json())
      .then(data => {
        setAllData(data);
        setTableData(data);
        setFilteredData(data);
      })
      .catch(() => {
        setAllData([]);
        setTableData([]);
        setFilteredData([]);
      });
  }, []);

  // Filter data based on date range and department
  const filterData = () => {
    let filtered = allData;

    // Filter by date range
    if (dateFrom && dateTo) {
      filtered = filtered.filter(record => {
        const recordDate = new Date(record.date);
        const fromDate = new Date(dateFrom);
        const toDate = new Date(dateTo);
        return recordDate >= fromDate && recordDate <= toDate;
      });
    } else if (dateFrom) {
      filtered = filtered.filter(record => {
        const recordDate = new Date(record.date);
        const fromDate = new Date(dateFrom);
        return recordDate >= fromDate;
      });
    } else if (dateTo) {
      filtered = filtered.filter(record => {
        const recordDate = new Date(record.date);
        const toDate = new Date(dateTo);
        return recordDate <= toDate;
      });
    }

    // Filter by department
    if (selectedDepartment !== "all") {
      filtered = filtered.filter(record => record.dept === selectedDepartment);
    }

    setFilteredData(filtered);
    setTableData(filtered);
    setReportGenerated(true);
  };

  // Generate report function
  const generateReport = () => {
    if (!dateFrom && !dateTo && selectedDepartment === "all") {
      alert("Please select at least one filter criteria (date range or department)");
      return;
    }
    filterData();
  };

  // Export to PDF
  const exportToPDF = () => {
    if (!reportGenerated) {
      alert("Please generate a report first");
      return;
    }

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const reportContent = `
        <html>
          <head>
            <title>Consumption Report</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .filters { margin-bottom: 20px; padding: 10px; background: #f5f5f5; }
              .summary { margin-bottom: 20px; }
              .summary-item { display: inline-block; margin-right: 30px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              .consumed { color: red; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>CSSD Consumption Report</h1>
              <p>Generated on: ${new Date().toLocaleDateString()}</p>
            </div>
            
            <div class="filters">
              <strong>Filters:</strong><br>
              Date Range: ${dateFrom || 'All'} to ${dateTo || 'All'}<br>
              Department: ${selectedDepartment === 'all' ? 'All Departments' : selectedDepartment}
            </div>

            <div class="summary">
              <div class="summary-item"><strong>Total Consumption:</strong> ${calculateSummaryStats().find(s => s.title === "Total Consumption")?.value}</div>
              <div class="summary-item"><strong>Total Surgeries:</strong> ${calculateSummaryStats().find(s => s.title === "Total Surgeries")?.value}</div>
              <div class="summary-item"><strong>Average per Surgery:</strong> ${calculateSummaryStats().find(s => s.title === "Average per Surgery")?.value}</div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Surgery ID</th>
                  <th>Surgery Type</th>
                  <th>Department</th>
                  <th>Date</th>
                  <th>Before Count</th>
                  <th>After Count</th>
                  <th>Consumed</th>
                  <th>Items Used</th>
                </tr>
              </thead>
              <tbody>
                ${filteredData.map(record => `
                  <tr>
                    <td>${record.id || ''}</td>
                    <td>${record.type || ''}</td>
                    <td>${record.dept || ''}</td>
                    <td>${record.date || ''}</td>
                    <td>${record.before || ''}</td>
                    <td>${record.after || ''}</td>
                    <td class="consumed">${record.used || ''}</td>
                    <td>${record.items || ''}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </body>
        </html>
      `;
      
      printWindow.document.write(reportContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Export to Excel
  const exportToExcel = () => {
    if (!reportGenerated) {
      alert("Please generate a report first");
      return;
    }

    // Helper function to format date for Excel
    const formatDateForExcel = (dateString: string) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      // Format as DD/MM/YYYY for Excel compatibility
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    };

    // Create CSV content with proper date formatting (date NOT quoted)
    const headers = ['Surgery ID', 'Surgery Type', 'Department', 'Date', 'Before Count', 'After Count', 'Consumed', 'Items Used'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(record => [
        `"${record.id || ''}"`,
        `"${record.type || ''}"`,
        `"${record.dept || ''}"`,
        formatDateForExcel(record.date), // <-- No quotes here
        record.before || '',
        record.after || '',
        record.used || '',
        `"${record.items || ''}"`
      ].join(','))
    ].join('\n');

    // Add BOM for Excel UTF-8 compatibility
    const BOM = '\uFEFF';
    const csvContentWithBOM = BOM + csvContent;

    // Create and download file
    const blob = new Blob([csvContentWithBOM], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `consumption_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate summary stats from filtered data
  const calculateSummaryStats = () => {
    const totalConsumption = filteredData.reduce((sum, record) => sum + (record.used || 0), 0);
    const totalSurgeries = filteredData.length;
    const averagePerSurgery = totalSurgeries > 0 ? (totalConsumption / totalSurgeries).toFixed(1) : 0;

    return [
      { 
        title: "Total Consumption", 
        value: totalConsumption, 
        description: "Items consumed", 
        icon: <BarChart2 size={20} color="#0ea5e9" />, 
        color: "#0ea5e9" 
      },
      { 
        title: "Average per Surgery", 
        value: averagePerSurgery, 
        description: "Items per procedure", 
        icon: <TrendingUp size={20} color="#22c55e" />, 
        color: "#22c55e" 
      },
      { 
        title: "Total Surgeries", 
        value: totalSurgeries, 
        description: "Procedures tracked", 
        icon: <ClipboardList size={20} color="#a78bfa" />, 
        color: "#a78bfa" 
      },
    ];
  };

  // Calculate weekly consumption trend from filtered data
  const calculateWeeklyTrend = () => {
    const weeklyData: { [key: string]: number } = {};
    
    filteredData.forEach(record => {
      if (record.date) {
        const date = new Date(record.date);
        const weekNumber = getWeekNumber(date);
        const weekKey = `Week ${weekNumber}`;
        weeklyData[weekKey] = (weeklyData[weekKey] || 0) + (record.used || 0);
      }
    });

    return Object.entries(weeklyData)
      .map(([week, count]) => ({ week, count }))
      .sort((a, b) => {
        const weekA = parseInt(a.week.split(' ')[1] || '0');
        const weekB = parseInt(b.week.split(' ')[1] || '0');
        return weekA - weekB;
      });
  };

  // Calculate department-wise consumption from filtered data
  const calculateDepartmentConsumption = () => {
    const deptData: { [key: string]: number } = {};
    
    filteredData.forEach(record => {
      if (record.dept) {
        deptData[record.dept] = (deptData[record.dept] || 0) + (record.used || 0);
      }
    });

    return Object.entries(deptData)
      .map(([department, count]) => ({ department, count }))
      .sort((a, b) => b.count - a.count);
  };

  // Helper function to get week number
  const getWeekNumber = (date: Date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  // Get calculated data
  const summaryStats = calculateSummaryStats();
  const lineChartData = calculateWeeklyTrend();
  const barChartData = calculateDepartmentConsumption();

  const tableColumns = [
    { key: "id", header: "Surgery ID" },
    { key: "type", header: "Surgery Type" },
    { key: "dept", header: "Department" },
    { key: "date", header: "Date" },
    { key: "before", header: "Before Count" },
    { key: "after", header: "After Count" },
    { key: "used", header: "Consumed", render: (row: any) => <span className="text-red">{row.used}</span> },
    { key: "items", header: "Items Used" },
  ];

  return (
    <>
      <Header sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} showDate showTime showCalculator />
      <PageContainer>
      <SectionHeading 
          title="Consumption Reports" 
          subtitle="Generate and analyze item consumption reports" 
          className="" 
        />

        {/* Report Filters */}
        <div className="report-card">
          <div className="report-card-header">
            <BarChart3 className="icon" /> Report Filters
        </div>
          <div className="report-card-body">
            <div className="filter-section">
              <div className="filter-group">
                <label className="form-label">From Date</label>
                <input type="date" className="form-input" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
              </div>
              <div className="filter-group">
                <label className="form-label">To Date</label>
                <input type="date" className="form-input" value={dateTo} onChange={e => setDateTo(e.target.value)} />
              </div>
              <div className="filter-group">
                <label className="form-label">Department</label>
                <select className="form-input" value={selectedDepartment} onChange={e => setSelectedDepartment(e.target.value)}>
                  <option value="all">All Departments</option>
                  <option value="OR-1">OR-1</option>
                  <option value="OR-2">OR-2</option>
                </select>
              </div>
              <div className="filter-button-wrapper">
                <ButtonWithGradient onClick={generateReport}>Generate Report</ButtonWithGradient>
              </div>
            </div>
            <div className="export-buttons">
              <button className="export-btn-flat" disabled={!reportGenerated} onClick={exportToPDF}><span>PDF</span></button>
              <button className="export-btn-flat" disabled={!reportGenerated} onClick={exportToExcel}><span>Excel</span></button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="card-grid dashboard-summary-cards">
          {summaryStats.map(stat => (
            <Cards key={stat.title} title={stat.title} subtitle={stat.value} />
          ))}
        </div>

        {/* Charts Section */}
        <div className="chart-grid">
          <div className="chart-box">
            <h4>Weekly Consumption Trend</h4>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={lineChartData}>
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#0ea5e9" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-box">
            <h4>Outlet-wise Consumption</h4>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={barChartData}>
                <XAxis dataKey="department" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#a78bfa" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Consumption Table */}
        <div className="table-box">
          <div className="table-header">
            <h3>Surgery Item Consumption Details</h3>
            <ButtonWithGradient onClick={() => setShowAddModal(true)}>Add Consumption Record</ButtonWithGradient>
          </div>
          <Table columns={tableColumns} data={tableData} />
        </div>
       </PageContainer>
      {showAddModal && (
        <>
          <div className="modal-overlay" onClick={() => setShowAddModal(false)} />
          <div className="shortcuts-modal">
            <div className="modal-header">
              <h2>Add Consumption Record</h2>
              <button className="close-btn" onClick={() => setShowAddModal(false)}>&times;</button>
            </div>
            <form onSubmit={async e => {
              e.preventDefault();
              // Generate unique Surgery ID automatically
              const generatedId = `SURG-${Date.now()}`;
              if (!form.type) { alert('Please enter the Surgery Type'); return; }
              if (!form.dept) { alert('Please enter the Department'); return; }
              if (!form.date) { alert('Please enter the Date'); return; }
              if (!form.before) { alert('Please enter the Before Count'); return; }
              if (!form.after) { alert('Please enter the After Count'); return; }
              if (!form.used) { alert('Please enter the Consumed count'); return; }
              if (!form.items) { alert('Please enter the Items Used'); return; }
              const newRecord = { ...form, id: generatedId, before: Number(form.before), after: Number(form.after), used: Number(form.used) };
              await fetch('http://localhost:3001/api/consumptionRecords', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newRecord)
              });
              const res = await fetch('http://localhost:3001/api/consumptionRecords');
              const updated = await res.json();
              setAllData(updated); setTableData(updated); setFilteredData(updated);
              setForm({ id: '', type: '', dept: '', date: '', before: '', after: '', used: '', items: '', requestId: '', kitId: '' });
              setShowAddModal(false);
            }}>
              <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', maxWidth: 600 }}>
                {/* Request ID dropdown replaced with DropInput */}
                <div>
                  <DropInput
                    label="Request ID"
                    value={form.requestId}
                    onChange={e => setForm({ ...form, requestId: e.target.value })}
                    options={[
                      { label: "Select request", value: "" },
                      ...requests
                        .filter(r => r.department === form.dept)
                        .map(r => ({
                          label: `${r.id} - ${r.items}`,
                          value: r.id
                        }))
                    ]}
                    width="100%"
                  />
                </div>
                {/* Kit ID dropdown replaced with DropInput */}
                <div>
                  <DropInput
                    label="Kit ID"
                    value={form.kitId}
                    onChange={e => setForm({ ...form, kitId: e.target.value })}
                    options={[
                      { label: "Select kit", value: "" },
                      ...kits.filter(k => k.department === form.dept).map(k => ({
                        label: `${k.id} - ${k.name}`,
                        value: k.id
                      }))
                    ]}
                    width="100%"
                  />
                </div>
                {/* Surgery Type input replaced with Input */}
                <div>
                  <Input
                    label="Surgery Type"
                    value={form.type}
                    onChange={e => setForm({ ...form, type: e.target.value })}
                    required
                  />
                </div>
                {/* Department dropdown replaced with DropInput */}
                <div>
                  <DropInput
                    label="Department"
                    value={form.dept}
                    onChange={e => setForm({ ...form, dept: e.target.value })}
                    options={[
                      { label: "Select outlet", value: "" },
                      { label: "Cardiology", value: "Cardiology" },
                      { label: "Neurology", value: "Neurology" },
                      { label: "Orthopedics", value: "Orthopedics" }
                    ]}
                    width="100%"
                  />
                </div>
                {/* Date input replaced with Input */}
                <div>
                  <Input
                    label="Date"
                    type="date"
                    value={form.date}
                    onChange={e => setForm({ ...form, date: e.target.value })}
                    required
                  />
                </div>
                {/* Before Count input replaced with Input */}
                <div>
                  <Input
                    label="Before Count"
                    type="number"
                    value={form.before}
                    onChange={e => setForm({ ...form, before: e.target.value })}
                    required
                  />
                </div>
                {/* After Count input replaced with Input */}
                <div>
                  <Input
                    label="After Count"
                    type="number"
                    value={form.after}
                    onChange={e => setForm({ ...form, after: e.target.value })}
                    required
                  />
                </div>
                {/* Consumed input replaced with Input */}
                <div>
                  <Input
                    label="Consumed"
                    type="number"
                    value={form.used}
                    onChange={e => setForm({ ...form, used: e.target.value })}
                    required
                  />
                </div>
                {/* Items Used input replaced with Input */}
                <div style={{ gridColumn: '1 / span 2' }}>
                  <Input
                    label="Items Used"
                    value={form.items}
                    onChange={e => setForm({ ...form, items: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
                <ButtonWithGradient type="submit">Add Record</ButtonWithGradient>
              </div>
            </form>
          </div>
        </>
      )}
      <Footer />
    </>
  );
};

export default ConsumptionReports;
