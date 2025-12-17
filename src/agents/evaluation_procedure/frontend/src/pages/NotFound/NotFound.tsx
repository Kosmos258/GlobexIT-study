import { Link } from 'react-router-dom';

export const NotFound = () => {
	return (
		<div>
			<div>Страница не найдена</div>
			<Link to={'/'}>Перейти на главную</Link>
		</div>
	);
};
