import { Button } from 'antd';
import { NavLink } from 'react-router-dom';
import LogoImage from '@shared/assets/images/globex_logo.png';
import styles from './Header.module.scss';

export const Header = () => {
	return (
		<header className={styles.header}>
			<div>
				<div>
					<img src={LogoImage} alt="logo" />
				</div>
			</div>
			<nav>
				<Button variant="link">
					<NavLink to="/">Главная</NavLink>
				</Button>
				<Button variant="link">
					<NavLink to="/list">Вторая</NavLink>
				</Button>
			</nav>
		</header>
	);
};
