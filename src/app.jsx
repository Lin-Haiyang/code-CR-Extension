import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/users');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const userData = await response.json();
      setUsers(userData);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching users:', err);
    } finally {
      // 第25行 - 变量命名不规范的问题在这里
      const data = users.filter(user => user.active);
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchUsers();
  };

  const handleUserClick = (userId) => {
    console.log('User clicked:', userId);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <p>加载中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p>错误: {error}</p>
        <button onClick={handleRefresh}>重试</button>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>用户列表</h1>
        <button onClick={handleRefresh} className="refresh-btn">
          刷新
        </button>
      </header>
      
      <main className="App-main">
        {users.length === 0 ? (
          <p>暂无用户数据</p>
        ) : (
          <div className="user-grid">
            {users.map(user => (
              <div 
                key={user.id} 
                className="user-card"
                onClick={() => handleUserClick(user.id)}
              >
                <h3>{user.name}</h3>
                <p>{user.email}</p>
                <span className={`status ${user.active ? 'active' : 'inactive'}`}>
                  {user.active ? '活跃' : '不活跃'}
                </span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
