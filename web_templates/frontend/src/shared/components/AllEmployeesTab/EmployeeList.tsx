import { FC } from "react";
import { Employee } from "../../types/employees/types";

interface EmployeeListProps {
  employees: Employee[];
  search: string;
  onSearchChange: (value: string) => void;
  onAddClick: (emp: Employee) => void;
  team: Employee[];
}

const EmployeeList: FC<EmployeeListProps> = ({
  employees,
  search,
  onSearchChange,
  onAddClick,
  team,
}) => {
  const filtered = employees
    .filter((emp) => !team.some((member) => member.id === emp.id))
    .filter((emp) => emp.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="employees-list">
      <div className="header1">
        <h1>Сотрудники</h1>
        <input
          className="searchbar"
          placeholder="Поиск по имени..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <ul className="list">
        {filtered.map((emp) => (
          <li key={emp.id} className="list__item">
            {emp.name}
            <button
              className="list__add-button"
              onClick={() => onAddClick(emp)}
            >
              ➕
            </button>
          </li>
        ))}
        {filtered.length === 0 && (
          <li className="list__empty">Нет доступных сотрудников</li>
        )}
      </ul>
    </div>
  );
};

export default EmployeeList;
