import { useState, useMemo, useEffect, FC } from "react";
import { useAppData } from "../../hooks/useAppData";
import {
  Employee,
  ChangeHistory,
  StateHistory,
  Department,
} from "../../types/employees/types";
import EmployeeModal from "./EmployeeModal";
import "./AllEmployeesTab.scss";

type Props = {
  team: Employee[];
  onAddToTeam: (emp: Employee) => void;
};

const AllEmployeesTab: FC<Props> = ({ team, onAddToTeam }) => {
  const {
    departments,
    allEmployees,
    getEmployeesByDepartment,
    getHistoryByCollaborators,
    getStateByCollaborators,
    employeesChange,
    employeesState,
    error,
  } = useAppData();

  const [search, setSearch] = useState("");
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [deptEmployeesMap, setDeptEmployeesMap] = useState<
    Record<string, Employee[]>
  >({});
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);

  useEffect(() => {
    const fetchForSelected = async () => {
      const newMap: Record<string, Employee[]> = {};
      for (const depName of selectedDepartments) {
        try {
          const result: Employee[] = await getEmployeesByDepartment(depName);
          newMap[depName] = result;
        } catch {
          newMap[depName] = [];
        }
      }
      setDeptEmployeesMap(newMap);
    };

    if (selectedDepartments.length > 0) {
      fetchForSelected();
    } else {
      setDeptEmployeesMap({});
    }
  }, [selectedDepartments, getEmployeesByDepartment]);

  const deptFilteredEmployees = useMemo(() => {
    if (selectedDepartments.length === 0) return [];
    const combined: Employee[] = [];
    selectedDepartments.forEach((depName) => {
      const list = deptEmployeesMap[depName] || [];
      list.forEach((emp) => {
        if (!combined.find((e) => e.id === emp.id)) {
          combined.push(emp);
        }
      });
    });
    return combined;
  }, [selectedDepartments, deptEmployeesMap]);

  const filtered = useMemo(() => {
    const baseList =
      selectedDepartments.length > 0 ? deptFilteredEmployees : allEmployees;
    return baseList
      .filter((emp) => !team.some((member) => member.id === emp.id))
      .filter((emp) => emp.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allEmployees, deptFilteredEmployees, team, search, selectedDepartments]);

  const openModal = (emp: Employee) => {
    setSelectedEmployee(emp);
    getHistoryByCollaborators(emp.id);
    getStateByCollaborators(emp.id);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedEmployee(null);
  };

  const handleAddToTeam = (emp: Employee) => {
    onAddToTeam(emp);
    setShowSuccessNotification(true);
    setTimeout(() => setShowSuccessNotification(false), 3000);
  };

  const toggleDepartment = (depName: string) => {
    setSelectedDepartments((prev) =>
      prev.includes(depName)
        ? prev.filter((d) => d !== depName)
        : [...prev, depName]
    );
  };

  return (
    <div className="all-employees-tab">
      {error && (
        <div className="error-banner">
          <span className="error-banner__text">{error}</span>
        </div>
      )}

      {showSuccessNotification && (
        <div className="success-notification">
          <span>Сотрудник успешно добавлен в команду!</span>
        </div>
      )}

      <div className="header1">
        <h1>Все сотрудники</h1>
        <input
          className="searchbar"
          placeholder="Поиск по имени сотрудника..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Фильтры по подразделениям */}
      <div className="filters">
        <strong>Фильтр по подразделениям:</strong>
        <div className="filters__list">
          {departments.map((dep: Department) => (
            <label key={dep.name} className="filters__item">
              <input
                type="checkbox"
                checked={selectedDepartments.includes(dep.name)}
                onChange={() => toggleDepartment(dep.name)}
              />
              {dep.name}
            </label>
          ))}
        </div>
      </div>

      <ul className="employees-tab__list">
        {filtered.map((emp) => (
          <li key={emp.id} className="employees-tab__item">
            <span className="employees-tab__name">{emp.name}</span>
            <button
              className="employees-tab__add"
              onClick={() => handleAddToTeam(emp)}
            >
              Добавить в команду
            </button>
            <button
              className="employees-tab__add"
              onClick={() => openModal(emp)}
            >
              История изменений и состояний
            </button>
          </li>
        ))}
        {filtered.length === 0 && (
          <li className="employees-tab__empty">Нет доступных сотрудников</li>
        )}
      </ul>

      {isModalOpen && selectedEmployee && (
        <EmployeeModal
          isOpen={isModalOpen}
          employee={selectedEmployee}
          changeHistory={employeesChange as ChangeHistory[]}
          stateHistory={employeesState as StateHistory[]}
          onClose={closeModal}
        />
      )}
    </div>
  );
};

export default AllEmployeesTab;
