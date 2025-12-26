import axios from 'axios';
import { BACKEND_URL } from '@app/config/templateVars';

export const getCertificates = async () => {
	try {
		const { data } = await axios.post(BACKEND_URL, {
			method: 'getCertificates',
		});

		return data.data;
	} catch (error) {
		console.error('Ошибка при выполнении запроса getCertificates: ', error);
	}
};