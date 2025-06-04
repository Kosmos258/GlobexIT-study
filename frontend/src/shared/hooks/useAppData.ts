import { useEffect, useState } from "react";
import axios from "axios";
import { BACKEND_URL } from "../../app/config/templateVars";
import {
  Department,
  Employee,
  ChangeHistory,
  StateHistory,
} from "../types/employees/types";

type BackendDepartment = {
  dep_id: string;
  dep_name: string;
  parent_object_id: string;
};

export function useAppData() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [deptEmployees, setDeptEmployees] = useState<Employee[]>([]);
  const [employeesChange, setEmployeesChange] = useState<ChangeHistory[]>([]);
  const [employeesState, setEmployeesState] = useState<StateHistory[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    axios
      .post(BACKEND_URL, { method: "getDepartments" })
      .then((res) => {
        const data = res.data;
        if (data.success && Array.isArray(data.data)) {
          const raw: BackendDepartment[] = data.data;
          const mapped: Department[] = raw.map((item) => {
            const pid =
              item.parent_object_id.trim() === ""
                ? null
                : Number(item.parent_object_id);
            return {
              id: Number(item.dep_id),
              name: item.dep_name,
              parentId: pid,
            };
          });
          setDepartments(mapped);
        } else {
          setError("Неверный формат данных подразделений");
        }
      })
      .catch((err) => {
        setError("Ошибка при получении подразделений: " + err.message);
      });
  }, []);

  const fetchAllEmployees = () => {
    axios
      .post(BACKEND_URL, { method: "getAllEmployees" })
      .then((res) => {
        const data = res.data;
        if (data.success && Array.isArray(data.data)) {
          setAllEmployees(data.data as Employee[]);
        } else {
          setError("Неверный формат данных сотрудников");
        }
      })
      .catch((err) => {
        setError("Ошибка при получении всех сотрудников: " + err.message);
      });
  };

  useEffect(() => {
    fetchAllEmployees();
  }, []);

  const fetchEmployeesByDepartment = (depName: string) => {
    axios
      .post(BACKEND_URL, {
        method: "getEmployeesByDepartmentName",
        depName,
      })
      .then((res) => {
        const data = res.data;
        if (data.success && Array.isArray(data.data)) {
          setDeptEmployees(data.data as Employee[]);
        } else {
          setDeptEmployees([]);
        }
      })
      .catch((err) => {
        setError(
          "Ошибка при получении сотрудников подразделения: " + err.message
        );
      });
  };

  const getHistoryByCollaborators = (collaboratorId: number) => {
    axios
      .post(BACKEND_URL, {
        method: "getHistoryChange",
        collaboratorId,
      })
      .then((res) => {
        const data = res.data;
        if (data.success && Array.isArray(data.data)) {
          setEmployeesChange(data.data as ChangeHistory[]);
        } else {
          setEmployeesChange([]);
        }
      })
      .catch((err) => {
        setError("Ошибка при получении истории изменений: " + err.message);
      });
  };

  const getStateByCollaborators = (collaboratorId: number) => {
    axios
      .post(BACKEND_URL, {
        method: "getStateChange",
        collaboratorId,
      })
      .then((res) => {
        const data = res.data;
        if (data.success && Array.isArray(data.data)) {
          setEmployeesState(data.data as StateHistory[]);
        } else {
          setEmployeesState([]);
        }
      })
      .catch((err) => {
        setError("Ошибка при получении состояний: " + err.message);
      });
  };

  const getEmployeesByDepartment = async (
    depName: string
  ): Promise<Employee[]> => {
    try {
      const res = await axios.post(BACKEND_URL, {
        method: "getEmployeesByDepartmentName",
        depName,
      });
      const data = res.data;
      if (data.success && Array.isArray(data.data)) {
        return data.data as Employee[];
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error("Ошибка при выполнении запроса:", err.message);
      } else {
        console.error("Неизвестная ошибка", err);
      }
    }
    return [];
  };

  return {
    departments,
    allEmployees,
    deptEmployees,
    fetchEmployeesByDepartment,
    getHistoryByCollaborators,
    getStateByCollaborators,
    employeesChange,
    employeesState,
    error,
    getEmployeesByDepartment,
  };
}
