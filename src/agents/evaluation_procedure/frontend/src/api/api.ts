import axios from 'axios';
import { BACKEND_URL } from '@app/config/templateVars';

export const getAllData = async () => {
	try {
		const { data } = await axios.post(BACKEND_URL, {
			method: 'getAllData',
		});
		return data.data;
	} catch (error) {
		console.error('Ошибка при выполнении запроса getAllData: ', error);
		return [];
	}
};
