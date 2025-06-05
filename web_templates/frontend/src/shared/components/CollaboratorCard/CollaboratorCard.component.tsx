import { Card } from "antd";
import { ISubdivision } from "../../types/subdivision/subdivision";
import "../../../shared/components/CollaboratorCard/CollaboratorCard.module.scss"

export const CollaboratorCard = ({ id, name, code, org_name } : ISubdivision) => {
  return <Card className="collaborator__card">
    <p className="collaborator__id">{id}</p>
    <p className="collaborator__name">{name}</p>
    <p className="collaborator__code">{code}</p>
    <p className="collaborator__org_name">{org_name}</p>
  </Card>;
};