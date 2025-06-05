import { FC } from "react";
import { ChangeHistory, StateHistory, Employee } from "../../types/employees/types";
import "./AllEmployeesTab.scss";

interface EmployeeModalProps {
  isOpen: boolean;
  employee: Employee | null;
  changeHistory: ChangeHistory[];
  stateHistory: StateHistory[];
  onClose: () => void;
}

const formatChangeDate = (isoString: string): string => {
  const [datePart, timeWithOffset] = isoString.split("T");
  const timePart = timeWithOffset.split(/[+Z]/)[0];
  const formattedDate = datePart.split("-").reverse().join(".");
  return `${formattedDate} ${timePart}`;
};

const EmployeeModal: FC<EmployeeModalProps> = ({
  isOpen,
  employee,
  changeHistory,
  stateHistory,
  onClose,
}) => {
  if (!isOpen || !employee) return null;

  const renderStateLabel = (stateId: string): string => {
    if (stateId === "isue") return "Отпуск";
    if (stateId === "g5k8") return "В командировке";
    if (stateId === "stcv") return "В декрете";
    return stateId;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          &times;
        </button>

        <h2 className="modal-content__title"><strong>История изменений:</strong> {employee.name}</h2>
        <ul className="modal-content__list">
          {changeHistory.map((change, idx) => (
            <li key={`pos-${idx}`} className="modal-content__item">
              <strong>Дата изменения:</strong> {formatChangeDate(change.change_date)}
              <br />
              <strong>Должность:</strong> {change.position_name}
              <br />
              <strong>Подразделение:</strong> {change.department}
              <br />
              <strong>Организация:</strong> {change.organization}
            </li>
          ))}
        </ul>

        <h2 className="modal-content__title"><strong>История состояний:</strong> {employee.name}</h2>
        {stateHistory.length === 0 ? (
          <p>Нет истории состояний</p>
        ) : (
          <ul className="modal-content__list">
            {stateHistory.map((st, idx) => (
              <li key={`st-${idx}`} className="modal-content__item">
                <strong>Состояние:</strong> {renderStateLabel(st.state_id)}
                <br />
                <strong>Начало:</strong> {st.start_date}
                <br />
                <strong>Конец:</strong> {st.finish_date}
                <br />
                <strong>Комментарий:</strong> {st.komment}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default EmployeeModal;
