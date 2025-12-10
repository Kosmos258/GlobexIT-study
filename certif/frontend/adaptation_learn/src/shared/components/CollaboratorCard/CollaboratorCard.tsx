import { Card } from 'antd';
import { Collaborator } from '@shared/types/wt-objects/collaborator';
import './styles.scss';

export const CollaboratorCard = ({
	id,
	fullname,
	code,
	org_name,
}: Collaborator) => {
	return (
		<Card className="collaborator__card">
			<p className="collaborator__id">{id}</p>
			<p className="collaborator__name">{fullname}</p>
			<p className="collaborator__code">{code}</p>
			<p className="collaborator__org_name">{org_name}</p>
		</Card>
	);
};
