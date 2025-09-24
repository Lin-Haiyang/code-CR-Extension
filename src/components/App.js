import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  // 这里有一个变量命名不规范的问题（第25行）
  const data = users.filter(user => user.active);

  return (
    <div className="App">
      <header className="App-header">
        <h1>用户列表</h1>
        {loading ? (
          <p>加载中...</p>
        ) : (
          <ul>
            {data.map(user => (
              <li key={user.id}>{user.name}</li>
            ))}
          </ul>
        )}
      </header>
    </div>
  );
}

export default App;
