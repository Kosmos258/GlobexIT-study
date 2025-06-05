import { useState, useMemo, useCallback, FC } from "react";
import { useAppData } from "../../hooks/useAppData";
import { Department, Employee } from "../../types/employees/types";
import "./DepartmentTab.scss";

type DeptNode = Department & {
  children: DeptNode[];
};

function filterTree(nodes: DeptNode[], query: string): DeptNode[] {
  if (!query.trim()) {
    return nodes;
  }
  const lower = query.toLowerCase();
  return nodes
    .map((node) => {
      const filteredChildren = filterTree(node.children, query);
      if (
        node.name.toLowerCase().includes(lower) ||
        filteredChildren.length > 0
      ) {
        return { ...node, children: filteredChildren };
      }
      return null;
    })
    .filter((n): n is DeptNode => n !== null);
}

const DepartmentTab: FC = () => {
  const { departments, deptEmployees, fetchEmployeesByDepartment, error } =
    useAppData();

  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [selectedDeptId, setSelectedDeptId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");

  const fullTree = useMemo<DeptNode[]>(() => {
    const map: Record<number, DeptNode> = {};

    departments.forEach((dep) => {
      if (!map[dep.id]) {
        map[dep.id] = { ...dep, children: [] };
      }
    });

    const roots: DeptNode[] = [];

    Object.values(map).forEach((node) => {
      const parentId = node.parentId;
      if (parentId === null || parentId === node.id) {
        roots.push(node);
      } else {
        const parentNode = map[parentId];
        if (parentNode) {
          parentNode.children.push(node);
        } else {
          roots.push(node);
        }
      }
    });

    const sortRecursively = (nodes: DeptNode[]) => {
      nodes.sort((a, b) => a.name.localeCompare(b.name));
      nodes.forEach((n) => {
        if (n.children.length > 0) {
          sortRecursively(n.children);
        }
      });
    };
    sortRecursively(roots);

    return roots;
  }, [departments]);

  const treeData = useMemo<DeptNode[]>(() => {
    return filterTree(fullTree, searchTerm);
  }, [fullTree, searchTerm]);

  const onToggleClick = useCallback((id: number) => {
    setExpandedIds((prev) => {
      const copy = new Set(prev);
      if (copy.has(id)) copy.delete(id);
      else copy.add(id);
      return copy;
    });
  }, []);

  const onNameClick = useCallback(
    (node: DeptNode) => {
      setSelectedDeptId(node.id);
      fetchEmployeesByDepartment(node.name);
    },
    [fetchEmployeesByDepartment]
  );

  const renderNode = (node: DeptNode, level: number = 0) => {
    const isExpanded = expandedIds.has(node.id);
    const isSelected = selectedDeptId === node.id;
    const indentStyle = { marginLeft: `${level * 5}rem` };

    return (
      <li key={node.id} className="department-tab__node">
        <div
          className={`department-tab__node-header ${
            isSelected ? "department-tab__node-header--selected" : ""
          }`}
          style={indentStyle}
        >
          {node.children.length > 0 ? (
            <button
              className={`department-tab__toggle-button ${
                isExpanded ? "department-tab__toggle-button--expanded" : ""
              }`}
              onClick={(e) => {
                e.stopPropagation();
                onToggleClick(node.id);
              }}
            >
              ▶
            </button>
          ) : (
            <span className="department-tab__toggle-placeholder" />
          )}
          <span
            className="department-tab__node-name"
            onClick={() => onNameClick(node)}
          >
            {node.name}
          </span>
        </div>

        {isExpanded && node.children.length > 0 && (
          <ul className="department-tab__node-children">
            {node.children.map((child) => renderNode(child, level + 1))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <div className="department-tab department-tab--container">
      {error && (
        <div className="error-banner">
          <span className="error-banner__text">{error}</span>
        </div>
      )}

      <div className="department-tab__left">
        {/* Поиск по подразделениям */}
        <div className="department-tab__search">
          <input
            type="text"
            className="department-tab__search-input"
            placeholder="Поиск подразделений..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {treeData.length === 0 ? (
          <p className="department-tab__message">Подразделения не найдены</p>
        ) : (
          <ul className="department-tab__tree">
            {treeData.map((root) => renderNode(root))}
          </ul>
        )}
      </div>

      <div className="department-tab__right">
        {selectedDeptId !== null ? (
          <>
            <h2 className="department-tab__employees-title">
              Сотрудники подразделения:
            </h2>
            {deptEmployees.length === 0 ? (
              <p className="department-tab__no-employees">Сотрудников нет</p>
            ) : (
              <ul className="department-tab__emp-list">
                {deptEmployees.map((emp: Employee) => (
                  <li key={emp.id} className="department-tab__emp-item">
                    {emp.name}
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <p className="department-tab__hover-message">
            Нажмите на подразделение, чтобы увидеть сотрудников
          </p>
        )}
      </div>
    </div>
  );
};

export default DepartmentTab;
