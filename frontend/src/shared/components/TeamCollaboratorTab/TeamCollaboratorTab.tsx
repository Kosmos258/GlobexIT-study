import { useState, FC } from "react";
import { Tooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";
import { Employee } from "../../types/employees/types";

type Props = {
  team: Employee[];
  onRemoveFromTeam: (id: number) => void;
};

const TeamCollaboratorTab: FC<Props> = ({ team, onRemoveFromTeam }) => {
  const [search, setSearch] = useState("");

  const filteredTeam = team
    .filter((user) => user.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="team-tab">
      <div className="team-tab__search">
        <input
          type="text"
          className="searchbar"
          placeholder="Поиск по имени сотрудника..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filteredTeam.length === 0 ? (
        <p className="team-tab__message">Ваша команда пока пуста</p>
      ) : (
        <ul className="team-list">
          {filteredTeam.map((user) => (
            <li key={user.id} className="team-list__item">
              <span className="team-list__name">{user.name}</span>
              <button
                className="team-list__remove-button"
                data-tooltip-id={`remove-tooltip-${user.id}`}
                data-tooltip-content="Удалить из команды"
                onClick={() => onRemoveFromTeam(user.id)}
              >
                Удалить из команды
              </button>
              <Tooltip id={`remove-tooltip-${user.id}`} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TeamCollaboratorTab;
