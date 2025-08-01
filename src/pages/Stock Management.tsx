import { useState, useEffect } from "react";
import { Search, Plus, Package, Edit, Trash2 } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ButtonWithGradient from "../components/ButtonWithGradient";
import Cards from "../components/Cards";
import "../styles/StockManagement.css";
import PageContainer from "../components/PageContainer";
import SectionHeading from "../components/SectionHeading";
import Table from "../components/Table";
import EditButton from "../components/EditButton";
import DeleteButton from "../components/DeleteButton";
import Searchbar from "../components/Searchbar";
import { toast } from 'react-toastify';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface StockManagementProps {
  sidebarCollapsed?: boolean;
  toggleSidebar?: () => void;
}

const StockManagement: React.FC<StockManagementProps> = ({ sidebarCollapsed = false, toggleSidebar }) => {
  const initialData = {
    stockItems: [
      { id: "STK001", name: "Surgery Kit", category: "Reusable", quantity: 25, location: "Storage B", minLevel: 10, status: "In Stock" },
      { id: "STK002", name: "Forceps", category: "Reusable", quantity: 15, location: "Storage B", minLevel: 20, status: "Low Stock" },
      { id: "STK003", name: "Gauze", category: "Non-Reusable", quantity: 3, location: "Storage C", minLevel: 1, status: "In Stock" }
    ]
  };

  const [stockItems, setStockItems] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingItem, setEditingItem] = useState<any>(null);
  const [showAddItem, setShowAddItem] = useState(false);
  const [showEditItem, setShowEditItem] = useState(false);

  useEffect(() => {
    fetch('http://localhost:3001/api/stockItems')
      .then(res => res.json())
      .then(data => setStockItems(data))
      .catch(() => setStockItems([]));
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "In Stock": return "status-instock";
      case "Low Stock": return "status-lowstock";
      default: return "status-default";
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const quantity = parseInt(formData.get("quantity") as string);
    const minLevel = parseInt(formData.get("minLevel") as string);

    const newItem = {
      id: `STK${String(stockItems.length + 1).padStart(3, '0')}`,
      name: formData.get("itemName") as string,
      category: formData.get("category") as string,
      quantity,
      location: formData.get("location") as string,
      minLevel,
      status: quantity > minLevel ? "In Stock" : "Low Stock"
    };

    // Save to backend
    await fetch('http://localhost:3001/api/stockItems', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newItem)
    });

    // Fetch updated stock items
    const res = await fetch('http://localhost:3001/api/stockItems');
    const updated = await res.json();
    setStockItems(updated);

    setShowAddItem(false);
    toast.success('Item added successfully!');
  };

  const handleEditItem = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const quantity = parseInt(formData.get("quantity") as string);
    const minLevel = parseInt(formData.get("minLevel") as string);

    const updatedItem = {
      ...editingItem,
      name: formData.get("itemName") as string,
      category: formData.get("category") as string,
      quantity,
      location: formData.get("location") as string,
      minLevel,
      status: quantity > minLevel ? "In Stock" : "Low Stock"
    };

    const updatedItems = stockItems.map((item: any) => item.id === updatedItem.id ? updatedItem : item);
    setStockItems(updatedItems);
    setShowEditItem(false);
    setEditingItem(null);
    toast.success('Item updated successfully!');
  };

  const handleDeleteItem = (id: string) => {
    const updatedItems = stockItems.filter((item: any) => item.id !== id);
    setStockItems(updatedItems);
    toast.success('Item deleted successfully!');
  };

  const openEditDialog = (item: any) => {
    setEditingItem(item);
    setShowEditItem(true);
  };

  const filteredItems = stockItems.filter((item: any) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockCount = stockItems.filter((item: any) => item.status === "Low Stock").length;
  const totalItems = stockItems.length;

  return (
    <>
      <Header sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} showDate showTime showCalculator/>
      <PageContainer>
      <SectionHeading 
          title="Stock Management" 
          subtitle="Manage inventory items and stock levels" 
          className="Stock Management-heading w-100" 
        />

        <div className="card-box">
          <Cards title="Total Items" subtitle={totalItems} />
          <Cards title="Low Stock Items" subtitle={lowStockCount} />
          <Cards title="Categories" subtitle={2} />
        </div>

        <div className="inventory-box">
          <div className="inventory-header-top">
            
           
        </div>
       

            <div className="flex justify-between items-center mb-4">
              <div> <ButtonWithGradient onClick={() => setShowAddItem(true)}> + Add Item</ButtonWithGradient></div>
              <div className="relative flex-1 max-w-md ml-auto">
                <Searchbar value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
            </div>

          <Table
            columns={[
              { key: "id", header: "Item ID" },
              { key: "name", header: "Name" },
              { key: "category", header: "Category" },
              { key: "quantity", header: "Quantity" },
              { key: "location", header: "Location" },
              {
                key: "status",
                header: "Status",
                render: (row: any) => (
                  <span className={`status-pill ${getStatusColor(row.status)}`}>{row.status}</span>
                ),
              },
              {
                key: "actions",
                header: "Actions",
                render: (row: any) => (
                  <div className="action-buttons">
                    <EditButton onClick={() => openEditDialog(row)} id={row.id}/>
                    <DeleteButton
                      onClick={e => {
                        e.preventDefault();
                        if (window.confirm('Are you sure you want to delete this item?')) {
                          handleDeleteItem(row.id);
                        }
                      }}
                      id={row.id}
                    />
                  </div>
                ),
              },
            ]}
            data={filteredItems}
          />
                      </div>

        {(showAddItem || showEditItem) && (
          <div className="dialog-overlay">
            <div className="dialog-content">
              <div className="dialog-header">
                <h2>{showAddItem ? "Add New Item" : "Edit Item"}</h2>
                <button onClick={() => { setShowAddItem(false); setShowEditItem(false); setEditingItem(null); }} className="dialog-close">×</button>
              </div>
              <form onSubmit={showAddItem ? handleAddItem : handleEditItem} className="form-grid">
                <label>Item Name</label>
                <input name="itemName" defaultValue={editingItem?.name || ""} required />

                <label>Category</label>
                <select name="category" defaultValue={editingItem?.category || ""} required>
                  <option value="">Select category</option>
                  <option value="Reusable">Reusable</option>
                  <option value="Non-Reusable">Non-Reusable</option>
                </select>

                <label>Quantity</label>
                <input name="quantity" type="number" min="0" defaultValue={editingItem?.quantity || ""} required />

                <label>Min Level</label>
                <input name="minLevel" type="number" min="0" defaultValue={editingItem?.minLevel || ""} required />

                <label>Location</label>
                <input name="location" defaultValue={editingItem?.location || ""} required />

                <ButtonWithGradient type="submit" className="button-gradient w-full">
                  {showAddItem ? "Add Item" : "Update Item"}
                </ButtonWithGradient>
              </form>
            </div>
          </div>
            )}
      </PageContainer>
      <Footer />
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
};

export default StockManagement;
