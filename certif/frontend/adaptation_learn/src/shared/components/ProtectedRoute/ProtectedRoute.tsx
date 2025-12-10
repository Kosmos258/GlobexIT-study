import { Navigate, Outlet } from 'react-router-dom';

type RouteProps = {
	roles: string[];
};

export const ProtectedRoute = ({ roles = [] }: RouteProps) => {
	const userStore = {
		isAuthenticated: true,
		accessType: 'admin',
	};

	if (roles.length > 0 && !roles.includes(userStore.accessType)) {
		return <Navigate to="/not-authorized" replace />;
	}

	return <Outlet />;
};
