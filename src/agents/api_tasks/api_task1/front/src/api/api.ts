import axios from 'axios';
import { BACKEND_URL } from '@app/config/templateVars';
import { IUser } from '../shared/types/IUser';

export const getUsers = async (): Promise<IUser[]> => {
	const { data } = await axios.post(BACKEND_URL, {
		method: 'getUsers',
	});

	return data.data;
};
