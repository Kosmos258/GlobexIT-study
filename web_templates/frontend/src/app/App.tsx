import { useState } from "react";
import { Tabs } from "antd";
import type { TabsProps } from "antd";
import DepartmentTab from "../shared/components/DepartmentTab/DepartmentTab";
import AllEmployeesTab from "../shared/components/AllEmployeesTab/AllEmployeesTab";
import TeamCollaboratorTab from "../shared/components/TeamCollaboratorTab/TeamCollaboratorTab";
import { Employee } from "../shared/types/employees/types";
import "./styles/App.scss";

function App() {
  const [team, setTeam] = useState<Employee[]>([]);

  const handleAddToTeam = (employee: Employee) => {
    setTeam((prev) => {
      if (prev.find((e) => e.id === employee.id)) return prev;
      return [...prev, employee];
    });
  };

  const handleRemoveFromTeam = (id: number) => {
    setTeam((prev) => prev.filter((e) => e.id !== id));
  };

  const items: TabsProps["items"] = [
    {
      key: "1",
      label: "Подразделения",
      children: <DepartmentTab />,
    },
    {
      key: "2",
      label: "Все сотрудники",
      children: <AllEmployeesTab onAddToTeam={handleAddToTeam} team={team} />,
    },
    {
      key: "3",
      label: "Команда",
      children: (
        <TeamCollaboratorTab
          team={team}
          onRemoveFromTeam={handleRemoveFromTeam}
        />
      ),
    },
  ];

  return <Tabs defaultActiveKey="1" items={items} />;
}

export default App;
