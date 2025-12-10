import { useState, useEffect } from 'react';
import axios from 'axios';
import './CertificatesList.scss';

interface Certificate {
	id: number;
	type_name: string;
	downloadUrl: string;
}

export const CertificatesList = () => {
	const [certificates, setCertificates] = useState<Certificate[]>([]);

	const fetchCertificates = async () => {
		try {
			const response = await axios.post(
				'http://localhost/custom_web_template.html?object_id=7230187328704344276',
				{ method: 'getCertificates' },
			);

			setCertificates(response.data.data);
		} catch (e: unknown) {
			throw new Error('fetchCertificates -> ' + e);
		}
	};

	useEffect(() => {
		const fetchData = async () => {
			await fetchCertificates();
		};

		fetchData();
	}, []);

	const handleDownload = (downloadUrl: string) => {
		if (!downloadUrl) {
			console.error('Ссылка для скачивания не указана');
			return;
		}

		let formattedUrl = downloadUrl;
		formattedUrl = window.location.origin + '/' + downloadUrl;

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
