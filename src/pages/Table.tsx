// TableWithSearch.tsx
import React, { useState } from 'react';
import Searchbar from '../components/Searchbar';
import 'bootstrap/dist/css/bootstrap.min.css';

interface Data {
  id: number;
  name: string;
  email: string;
}

const sampleData: Data[] = [
  { id: 1, name: 'Alice Johnson', email: 'alice@example.com' },
  { id: 2, name: 'Bob Smith', email: 'bob@example.com' },
  { id: 2, name: 'cob Smith', email: 'bob@example.com' },
  { id: 2, name: 'dob Smith', email: 'bob@example.com' },
  { id: 2, name: 'eob Smith', email: 'bob@example.com' },
  { id: 3, name: 'Charlie Brown', email: 'charlie@example.com' },
];

const Table: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const filteredData = sampleData.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className='container w-50 p-3'>
      <Searchbar value={searchTerm} onChange={handleSearchChange} />

      <table className='table table-resonsive table-striped'>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map((row) => (
            <tr key={row.id}>
              <td>{row.name}</td>
              <td>{row.email}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
