import axios from 'axios';
import { BACKEND_URL } from '@app/config/templateVars';

export const getProcedures = async () => {
	try {
		const { data } = await axios.post(BACKEND_URL, {
			method: 'getProcedures',
		});
		return data.data;
	} catch (error) {
		console.error('Ошибка при выполнении запроса getProcedures: ', error);
		return [];
	}
};

export const getPlans = async () => {
	try {
		const { data } = await axios.post(BACKEND_URL, {
			method: 'getPlans',
		});
		return data.data;
	} catch (error) {
		console.error('Ошибка при выполнении запроса getPlans: ', error);
		return [];
	}
};

export const getQuestionnaires = async () => {
	try {
		const { data } = await axios.post(BACKEND_URL, {
			method: 'getQuestionnaires',
		});
		return data.data;
	} catch (error) {
		console.error(
			'Ошибка при выполнении запроса getQuestionnaires: ',
			error,
		);
		return [];
	}
};
