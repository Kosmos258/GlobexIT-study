import { useState, useEffect } from 'react';
import { getCertificates } from '../../api/api';
import './CertificatesList.scss';

interface Certificate {
	id: number;
	type_name: string;
	downloadUrl: string;
}

export const CertificatesList = () => {
	const [certificates, setCertificates] = useState<Certificate[]>([]);

	useEffect(() => {
		const fetchData = async () => {
			const data = await getCertificates();
			if (data) {
				setCertificates(data);
			}
		};

		fetchData();
	}, []);

	const handleDownload = (downloadUrl: string) => {
		const formattedUrl = window.location.origin + '/' + downloadUrl;
		window.open(formattedUrl, '_blank');
	};

	return (
		<div className="certificates">
			<h2 className="certificates__title">Мои сертификаты</h2>

			<div className="certificates__grid">
				{certificates.map((cert) => (
					<div key={cert.id} className="certificates__item">
						<h3 className="certificates__name">{cert.type_name}</h3>

						<button
							className="certificates__button"
							onClick={() => handleDownload(cert.downloadUrl)}
						>
							Скачать сертификат
						</button>
					</div>
				))}
			</div>
		</div>
	);
};