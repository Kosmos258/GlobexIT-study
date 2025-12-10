import axios from 'axios';
import { BACKEND_URL } from '@app/config/templateVars';

export const getUserRole = async () => {
	try {
		const { data } = await axios.post(BACKEND_URL, {
			method: 'getUserRole',
		});

		return data;
	} catch (error) {
		console.error('Ошибка при выполнении запроса getUserRole: ', error);
	}
};

export const getData = async (selectedFilters: { value: string }) => {
	try {
		const { data } = await axios.post(BACKEND_URL, {
			method: 'getData',
			params: selectedFilters,
		});

		return data;
	} catch (error) {
		console.error('Ошибка при выполнении запроса getTableData: ', error);
	}
};
