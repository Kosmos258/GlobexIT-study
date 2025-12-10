import { useState } from 'react';
import { Button } from 'antd';
import styles from './Home.module.scss';

export const Home = () => {
	const [count, setCount] = useState(0);

	return (
		<section className={styles['home-page']}>
			<p>Главная</p>
			<Button variant="outlined" onClick={() => setCount(count + 1)}>
				Count: {count}
			</Button>
		</section>
	);
};
