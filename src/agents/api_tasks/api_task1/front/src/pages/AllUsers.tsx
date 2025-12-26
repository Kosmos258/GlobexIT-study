import React, { useState, useEffect } from 'react';
import { getUsers } from '../api/api';
import { IUser } from '../shared/types/IUser';
import './AllUsers.scss';

const AllUsers: React.FC = () => {
  const [users, setUsers] = useState<IUser[]>([]);

  const loadUsers = () => {
    getUsers().then((data) => {
      if (Array.isArray(data)) {
        setUsers(data);
      } else {
        setUsers([]);
      }
    });
  };

  useEffect(() => {
    loadUsers();
  }, []);

  return (
    <div className="users-container">
      <h1>Список пользователей</h1>

      <button onClick={loadUsers}>
        Обновить
      </button>

      {users.length === 0 && <p>Пользователей нет</p>}

      <div className="users-list">
        {users.map((user) => (
          <div key={user.id} className="user-card">
            <h3>{user.name}</h3>
            <p>@{user.username}</p>
            <p>Email: {user.email}</p>
            <p>Телефон: {user.phone}</p>
            <p>Сайт: {user.website}</p>
            <p>
              Адрес: {user.address.city}, {user.address.street}
            </p>
            <p>Компания: {user.company.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AllUsers;
