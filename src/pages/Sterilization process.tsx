import { useState, useEffect } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import PageContainer from "../components/PageContainer";
import SectionHeading from "../components/SectionHeading";
import Table from "../components/Table";
import Searchbar from "../components/Searchbar";
import ButtonWithGradient from "../components/ButtonWithGradient";
import { Play, Pause, Square, Activity, Plus, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import "../styles/SterilizationProcess.css";
import Cards from "../components/Cards";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye } from '@fortawesome/free-solid-svg-icons';
import Stepper from '../components/Stepper';
import DropInput from "../components/DropInput";
import DateInput from "../components/DateInput";
import Breadcrumb from "../components/Breadcrumb";

interface SterilizationProcessProps {
  sidebarCollapsed?: boolean;
  toggleSidebar?: () => void;
}

interface SterilizationProcess {
  id: string;
  machine: string;
  process: string;
  itemId: string;
  startTime: string;
  endTime: string;
  status: string;
  duration: number;
}

interface Machine {
  id: string;
  name: string;
  status: string;
}

interface SterilizationMethod {
  id: string;
  name: string;
  duration: number;
}

const SterilizationProcess: React.FC<SterilizationProcessProps> = ({ sidebarCollapsed = false, toggleSidebar }) => {
  const initialData = {
    machines: [
      { id: "M1", name: "Autoclave-1", status: "Available" },
      { id: "M2", name: "Autoclave-2", status: "In Use" },
      { id: "M3", name: "Autoclave-3", status: "Maintenance" },
      { id: "M4", name: "Chemical Sterilizer-1", status: "Available" },
    ],
    sterilizationMethods: [
      { id: "S1", name: "Steam Sterilization", duration: 45 },
      { id: "S2", name: "Chemical Sterilization", duration: 75 },
      { id: "S3", name: "Plasma Sterilization", duration: 60 },
    ],
  };

  const [processes, setProcesses] = useState<SterilizationProcess[]>([]);

  const [selectedMachine, setSelectedMachine] = useState("");
  const [selectedProcess, setSelectedProcess] = useState("");
  const [selectedRequestId, setSelectedRequestId] = useState("");
  const [machines, setMachines] = useState<Machine[]>(initialData.machines);
  const sterilizationMethods: SterilizationMethod[] = initialData.sterilizationMethods;
  const [availableRequests, setAvailableRequests] = useState<any[]>([]);
  const [consumptionRecords, setConsumptionRecords] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [showMachineStatusModal, setShowMachineStatusModal] = useState(false);
  const [eyeHover, setEyeHover] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [lastStartedProcessId, setLastStartedProcessId] = useState<string | null>(null);


  // Fetch sterilization processes from database
  useEffect(() => {
    fetch('http://localhost:3001/api/sterilizationProcesses')
      .then(res => res.json())
      .then(data => {
        // Sort processes in descending order by ID (assuming higher IDs are more recent)
        const sortedData = [...data].sort((a, b) => 
          parseInt(b.id.replace(/\D/g, '')) - parseInt(a.id.replace(/\D/g, ''))
        );
        setProcesses(sortedData);
      })
      .catch(() => setProcesses([]));
  }, []);

  useEffect(() => {
    // Fetch receive_items and only include those with status 'Approved'
    fetch('http://localhost:3001/api/receive_items')
      .then(res => res.json())
      .then(data => {
        const approvedRequests = data.filter((r: any) => r.status === 'Approved');
        setAvailableRequests(approvedRequests);
      })
      .catch(() => setAvailableRequests([]));
    // Fetch consumption records for Surgery IDs
    fetch('http://localhost:3001/api/consumptionRecords')
      .then(res => res.json())
      .then(data => setConsumptionRecords(data))
      .catch(() => setConsumptionRecords([]));
  }, []);

  // Auto-complete processes when duration is over
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      processes.forEach((process) => {
        if (process.status === "In Progress" && process.startTime && process.duration) {
          // Parse startTime (format: HH:mm)
          const [startHour, startMinute] = process.startTime.split(":").map(Number);
          const startDate = new Date();
          startDate.setHours(startHour, startMinute, 0, 0);
          // Calculate elapsed minutes
          const elapsedMinutes = (now.getTime() - startDate.getTime()) / 60000;
          if (elapsedMinutes >= process.duration) {
            handleStatusChange(process.id, "Completed");
          }
        }
      });
    }, 30000); // check every 30 seconds
    return () => clearInterval(interval);
  }, [processes]);

  // Machine status update handler
  const handleMachineStatusChange = (id: string, newStatus: string) => {
    setMachines(prev => prev.map(m => m.id === id ? { ...m, status: newStatus } : m));
  };

  // Process actions
  const handleStatusChange = async (id: string, newStatus: string) => {
    const processToUpdate = processes.find(p => p.id === id);
    if (!processToUpdate) return;

    const updateData: any = { 
      status: newStatus,
      updatedAt: new Date().toISOString() // Add current timestamp
    };
    
    // If completing the process, set the end time
    if (newStatus === "Completed" && !processToUpdate.endTime) {
      updateData.endTime = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
      updateData.completedAt = new Date().toISOString(); // Add completion timestamp
    } else if (newStatus === "In Progress" && !processToUpdate.startTime) {
      updateData.startTime = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
      updateData.startedAt = new Date().toISOString(); // Add start timestamp
    } else if (newStatus === "Paused") {
      updateData.pausedAt = new Date().toISOString(); // Add pause timestamp
    }

    const updatedProcesses = processes.map(p => p.id === id ? { ...p, ...updateData } : p);
    setProcesses(updatedProcesses);

    // Update in database
    await fetch(`http://localhost:3001/api/sterilizationProcesses/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });

    // Show alert for pause/resume
    if (newStatus === "Paused") {
      alert("Process paused!");
    } else if (newStatus === "In Progress") {
      alert("Process resumed!");
    }

    // If completing the process, add to available items
    if (newStatus === "Completed") {
      try {
        // Fetch the original request details
        const requestResponse = await fetch(`http://localhost:3001/api/cssd_requests/${processToUpdate.itemId}`);
        if (requestResponse.ok) {
          const requestData = await requestResponse.json();
          
          // Create available item
          const availableItem = {
            id: processToUpdate.itemId,
            department: requestData.department || processToUpdate.machine || "",
            items: requestData.items || processToUpdate.process || "Sterilized Item",
            quantity: requestData.quantity || 1,
            status: "Sterilized",
            readyTime: updateData.endTime || new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
            sterilizationId: processToUpdate.id,
            machine: processToUpdate.machine,
            process: processToUpdate.process,
          };

          // Check if item already exists in available items
          const existingItemsResponse = await fetch('http://localhost:3001/api/availableItems');
          const existingItems = await existingItemsResponse.json();
          const existingItem = existingItems.find((item: any) => item.id === processToUpdate.itemId);

          if (!existingItem) {
            // Add to available items database
            const addResponse = await fetch('http://localhost:3001/api/availableItems', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(availableItem),
            });
            
            if (addResponse.ok) {
              console.log('Item added to available items:', availableItem);
            } else {
              console.error('Failed to add item to available items');
            }
          } else {
            console.log('Item already exists in available items:', processToUpdate.itemId);
            // Update the existing item with new sterilization info
            const updateResponse = await fetch(`http://localhost:3001/api/availableItems/${processToUpdate.itemId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                readyTime: updateData.endTime,
                sterilizationId: processToUpdate.id,
                machine: processToUpdate.machine,
                process: processToUpdate.process,
              }),
            });
            
            if (updateResponse.ok) {
              console.log('Updated existing item with new sterilization info:', processToUpdate.itemId);
            }
          }
        }
      } catch (error) {
        console.error('Error adding item to available items:', error);
      }
    }
  };
  
  const handleResume = (id: string) => handleStatusChange(id, "In Progress");
  const handlePause = (id: string) => handleStatusChange(id, "Paused");
  const handleComplete = (id: string) => handleStatusChange(id, "Completed");

  // Start new process
  const startSterilization = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedMachine) {
      alert('Please select the Machine');
      return;
    }
    if (!selectedProcess) {
      alert('Please select the Sterilization Method');
      return;
    }
    if (!selectedRequestId) {
      alert('Please select the Item/Request ID');
      return;
    }
    
    const newProcess: SterilizationProcess = {
      id: `STE${String(processes.length + 1).padStart(3, '0')}`,
      machine: selectedMachine,
      process: selectedProcess,
      itemId: selectedRequestId,
      startTime: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      endTime: "",
      status: "In Progress",
      duration: sterilizationMethods.find(method => method.name === selectedProcess)?.duration || 45
    };

    // Save to database
    await fetch('http://localhost:3001/api/sterilizationProcesses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProcess)
    });

    // Fetch updated processes
    const res = await fetch('http://localhost:3001/api/sterilizationProcesses');
    const updated = await res.json();
    setProcesses(updated);

    setSelectedMachine("");
    setSelectedProcess("");
    setSelectedRequestId("");
    setCurrentStep(1); // Go to Active Processes step
  };

  // Filter processes based on search term, status, and date range
  const filteredProcesses = processes.filter(process => {
    const matchesSearch = 
      process.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      process.machine.toLowerCase().includes(searchTerm.toLowerCase()) ||
      process.process.toLowerCase().includes(searchTerm.toLowerCase()) ||
      process.itemId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || 
      process.status.toLowerCase() === statusFilter.toLowerCase() ||
      (statusFilter === "in progress" && process.status === "In Progress") ||
      (statusFilter === "completed" && process.status === "Completed") ||
      (statusFilter === "failed" && process.status === "Failed");

    // Filter by date range if dates are selected
    let matchesDate = true;
    if (fromDate || toDate) {
      const processDate = new Date(process.startTime);
      const from = fromDate ? new Date(fromDate) : null;
      const to = toDate ? new Date(toDate) : null;
      
      if (from) {
        from.setHours(0, 0, 0, 0);
        matchesDate = matchesDate && processDate >= from;
      }
      if (to) {
        to.setHours(23, 59, 59, 999);
        matchesDate = matchesDate && processDate <= to;
      }
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  // Filter available requests by date range
  const getFilteredRequests = () => {
    if (!fromDate && !toDate) return { requests: availableRequests, surgeries: consumptionRecords };
    
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;
    
    const filterByDate = (item) => {
      const itemDate = new Date(item.date || item.receivedDate);
      
      if (from && to) {
        return itemDate >= from && itemDate <= to;
      } else if (from) {
        return itemDate >= from;
      } else if (to) {
        return itemDate <= to;
      }
      
      return true;
    };
    
    return {
      requests: availableRequests.filter(filterByDate),
      surgeries: consumptionRecords.filter(filterByDate)
    };
  };

  const { requests: filteredRequests, surgeries: filteredSurgeries } = getFilteredRequests();

  // Summary cards
  const inProgressCount = filteredProcesses.filter(p => p.status === "In Progress").length;
  const completedTodayCount = filteredProcesses.filter(p => p.status === "Completed").length;
  const alertCount = machines.filter(m => m.status === "Maintenance").length;

  // Table columns
  const columns = [
    { key: 'id', header: 'Process ID' },
    { key: 'machine', header: 'Machine' },
    { key: 'process', header: 'Method' },
    { key: 'itemId', header: 'Item ID' },
    { key: 'startTime', header: 'Start Time' },
    { key: 'duration', header: 'Duration' },
    {
      key: 'status',
      header: 'Status',
      render: (row: SterilizationProcess) => (
        <select
          className="form-input text-sm"
          value={row.status}
          onChange={e => handleStatusChange(row.id, e.target.value)}
        >
          <option value="In Progress">In Progress</option>
          <option value="Paused">Paused</option>
          <option value="Completed">Completed</option>
        </select>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row: SterilizationProcess) => (
        <div className="flex gap-1">
          {row.status === "Paused" && (
            <ButtonWithGradient className="btn-with-gradient btn-sm" onClick={() => handleResume(row.id)} aria-label="Resume">
              <Play size={16} />
            </ButtonWithGradient>
          )}
          {row.status === "In Progress" && (
            <>
              <ButtonWithGradient className="btn-with-gradient btn-sm" onClick={() => handlePause(row.id)} aria-label="Pause">
                <Pause size={16} />
              </ButtonWithGradient>
              <ButtonWithGradient className="btn-with-gradient btn-sm" onClick={() => handleComplete(row.id)} aria-label="Complete">
                <Square size={16} />
              </ButtonWithGradient>
            </>
          )}
        </div>
      )
    }
  ];

  return (
    <>
      <Header sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} showDate showTime showCalculator />
      <PageContainer>
        <div className="flex justify-between items-center mb-4">
          <SectionHeading 
            title="Sterilization Process" 
            subtitle="Manage sterilization cycles and monitor progress" 
            className="sterilization-heading" 
          />
          
        </div>
        <Breadcrumb 
          steps={[{ label: 'Start Sterilization' }, { label: 'Active Processes' },{ label: 'Available Items' }]}
          activeStep={currentStep} 
          onStepClick={setCurrentStep}
        />
        <div className="grid2 grid-cols-3 md:grid-cols-3 gap-6 mb-6 mt-3">
          <Cards title="In Progress" subtitle={inProgressCount} />
          <Cards title="Completed" subtitle={completedTodayCount} />
          <Cards title="In Maintenance" subtitle={alertCount} />
        </div>
        {/* Step 1: Start Sterilization */}
        {currentStep === 0 && (
          <div className="card mb-4">
            <div className="card-header flex items-center justify-between" style={{ position: 'relative' }}>
              <h2 className="card-title">Start New Sterilization</h2>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <FontAwesomeIcon
                  icon={faEye}
                  style={{ color: '#2196f3', fontSize: 16, cursor: 'pointer' }}
                  onClick={() => setShowMachineStatusModal(true)}
                  onMouseEnter={() => setEyeHover(true)}
                  onMouseLeave={() => setEyeHover(false)}
                />
                {eyeHover && (
                  <div style={{
                    position: 'absolute',
                    bottom: '120%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#222',
                    color: '#fff',
                    padding: '4px 10px',
                    borderRadius: '4px',
                    fontSize: '0.85rem',
                    whiteSpace: 'nowrap',
                    zIndex: 10,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                  }}>
                    Machine Status
                  </div>
                )}
              </div>
            </div>
            <div className="card-content">
              <form onSubmit={startSterilization}>
                <div style={{ display: 'flex', gap: '10px' }}>
              
                  <div style={{ display: 'flex', gap: '10px', flex: 1 }}>
                    <div style={{ flex: 1 }}>
                      <DateInput
                        label="From Date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <DateInput
                        label="To Date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        min={fromDate}
                      />
                    </div>
                  </div>
                  

                  <div style={{ flex: 1 }}>
                    <DropInput
                      label="Item/Request ID"
                      value={selectedRequestId}
                      onChange={e => setSelectedRequestId(e.target.value)}
                      options={[
                        { label: "Select approved request or surgery", value: "" },
                        // Requests (pre-surgery)
                        ...filteredRequests.map(req => ({
                          label: `REQ: ${req.requestId || req.id} - ${req.department} (${req.items})`,
                          value: req.requestId || req.id
                        })),
                        // Surgery IDs (post-surgery)
                        ...filteredSurgeries.map(rec => ({
                          label: `SURG: ${rec.id} - ${rec.dept} (${rec.items})`,
                          value: rec.id
                        }))
                      ]}
                      width="100%"
                    />
                  </div>

                  <div style={{ flex: 1 }}>
                    <DropInput
                      label="Select Machine"
                      value={selectedMachine}
                      onChange={e => setSelectedMachine(e.target.value)}
                      options={[
                        { label: "Choose sterilization machine", value: "" },
                        ...machines.map(m => ({
                          label: m.name,
                          value: m.name
                        }))
                      ]}
                      width="100%"
                    />
                  </div>

                  
                  <div style={{ flex: 1 }}>
                    <DropInput
                      label="Sterilization Method"
                      value={selectedProcess}
                      onChange={e => setSelectedProcess(e.target.value)}
                      options={[
                        { label: "Choose sterilization method", value: "" },
                        ...sterilizationMethods.map(method => ({
                          label: method.name,
                          value: method.name
                        }))
                      ]}
                      width="100%"
                    />
                  </div>
               
                </div>
                <div className="flex justify-content-end gap-2 mt-2">
                <ButtonWithGradient type="submit" className="button-gradient w-full " disabled={!selectedMachine || !selectedProcess || !selectedRequestId}>
                  Start Sterilization Process
                </ButtonWithGradient>
                </div>
              </form>
              </div>
            <div className="flex justify-between mt-4">
              <ButtonWithGradient 
                type="button" 
                className={`button-gradient ${currentStep === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => currentStep > 0 && setCurrentStep(currentStep - 1)}
                disabled={currentStep === 0}
              >
                Back
              </ButtonWithGradient>
              <ButtonWithGradient 
                type="button" 
                className={`button-gradient ${currentStep === 2 ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => currentStep < 2 && setCurrentStep(currentStep + 1)}
                disabled={currentStep === 2}
              >
                Next
              </ButtonWithGradient>
            </div>
          </div>
        )}
          {/* Step 2: Active Processes */}
          {currentStep === 1 && (
            <>
              <div className="card mb-4">
                <div className="card-header">
                  <h2 className="card-title">Active Processes</h2>
                </div>
                <div className="card-content">
                  <div className="flex flex-wrap gap-4 mb-4">
                    <div className="flex-1 min-w-[200px]">
                      <DateInput
                        label="From Date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                      />
                    </div>
                    <div className="flex-1 min-w-[200px]">
                      <DateInput
                        label="To Date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        min={fromDate}
                      />
                    </div>
                    <div className="flex-1 min-w-[200px]">
                      <DropInput
                        label="Status"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        options={[
                          { label: "All Status", value: "all" },
                          { label: "In Progress", value: "In Progress" },
                          { label: "Paused", value: "Paused" },
                          { label: "Completed", value: "Completed" },
                        ]}
                        width="100%"
                      />
                    </div>
                 
                  </div>
                  <Table 
                    columns={columns} 
                    data={filteredProcesses.sort((a, b) => 
                      parseInt(b.id.replace(/\D/g, '')) - parseInt(a.id.replace(/\D/g, ''))
                    )} 
                  />
                </div>
                <div className="flex justify-between mt-4">
                  <ButtonWithGradient 
                    type="button" 
                    className={`button-gradient ${currentStep === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => currentStep > 0 && setCurrentStep(currentStep - 1)}
                    disabled={currentStep === 0}
                  >
                    Back
                  </ButtonWithGradient>
                  <ButtonWithGradient 
                    type="button" 
                    className={`button-gradient ${currentStep === 2 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => currentStep < 2 && setCurrentStep(currentStep + 1)}
                    disabled={currentStep === 2}
                  >
                    Next
                  </ButtonWithGradient>
                </div>
              </div>
            </>
          )}
          {/* Step 3: Available Items */}
          {currentStep === 2 && (
            <>
              <div className="card mb-4">
                <div className="card-header">
                  <h2 className="card-title">Available Items</h2>
                </div>
                <div className="card-content">
                  {/* Show all completed sterilization processes as available items */}
                  <Table
                    columns={[
                      { key: 'id', header: 'Process ID' },
                      { key: 'machine', header: 'Machine' },
                      { key: 'process', header: 'Method' },
                      { key: 'itemId', header: 'Item ID' },
                      { key: 'endTime', header: 'End Time' },
                      {
                        key: 'status',
                        header: 'Status',
                        render: () => <span className="status-badge status-sterilized text-center justify-content-center">Sterilized</span>
                      },
                    ]}
                    data={filteredProcesses
                      .filter(p => p.status === 'Completed')
                      .sort((a, b) => 
                        parseInt(b.id.replace(/\D/g, '')) - parseInt(a.id.replace(/\D/g, ''))
                      )}
                  />
                </div>
                <div className="flex justify-between mt-4">
                    <ButtonWithGradient 
                      type="button" 
                      className={`button-gradient ${currentStep === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={() => currentStep > 0 && setCurrentStep(currentStep - 1)}
                      disabled={currentStep === 0}
                    >
                      Back
                    </ButtonWithGradient>
                    <ButtonWithGradient 
                      type="button" 
                      className={`button-gradient ${currentStep === 2 ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={() => currentStep < 2 && setCurrentStep(currentStep + 1)}
                      disabled={currentStep === 2}
                    >
                      Next
                    </ButtonWithGradient>
                </div>
              </div>
            </>
          )}
        {/* Machine Status Modal */}
        {showMachineStatusModal && (
          <div className="dialog-overlay">
            <div className="dialog-content" style={{ maxWidth: '500px', width: '90%', boxShadow: 'none' }}>
              <div className="card" style={{ boxShadow: 'none' }}>
                <div className="card-header flex items-center justify-between">
                  <span className="text-red-600 flex items-center"><AlertCircle className="mr-2" /> Machine Status</span>
                  <button className="text-gray-500 hover:text-gray-700 bg-white rounded-full w-8 h-8 flex items-center justify-center" onClick={() => setShowMachineStatusModal(false)} style={{ border: '1px solid #e5e7eb', boxShadow: 'none' }}>×</button>
                </div>
                <div className="card-content">
                  {machines.map(m => (
                    <div key={m.id} className="flex justify-between items-center mb-3">
                      <span>{m.name}</span>
                      <select className="form-input w-32" value={m.status} onChange={e => handleMachineStatusChange(m.id, e.target.value)}>
                        <option value="Available">Available</option>
                        <option value="In Use">In Use</option>
                        <option value="Maintenance">Maintenance</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </PageContainer>
      <Footer />
    </>
  );
};

export default SterilizationProcess;
