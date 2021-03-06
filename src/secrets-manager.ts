import SecretsManager from 'aws-sdk/clients/secretsmanager';

import { Config, SecretManagerFunctionFactory } from './types';

const secretsManagerFunctionFactory = (
	secretsManager: SecretsManager,
	fs: any,
	config: Config
): SecretManagerFunctionFactory => ({
	setSecrets: async (stage = 'dev'): Promise<void> => {
		try {
			await secretsManager
				.createSecret({
					Name: `${config.Name}-${stage}`,
					Description: config.Description,
					SecretString: config.SecretString
				})
				.promise();
			console.log('Envrionment variables saved on AWS Secret Manager!');
		} catch (error) {
			if (error.message.includes('already exists')) {
				await secretsManager
					.updateSecret({
						SecretId: `${config.Name}-${stage}`,
						Description: config.Description,
						SecretString: config.SecretString
					})
					.promise();
				console.log('Envrionment variables updated on AWS Secret Manager!');
			} else {
				console.error(error, error.stack);
				throw error;
			}
		}
	},

	pullSecrets: async (stage = 'dev'): Promise<void> => {
		try {
			const secretData = await secretsManager
				.getSecretValue({ SecretId: `${config.Name}-${stage}` })
				.promise();

			if (!secretData.SecretString) throw new Error('No data in secret.');

			const environmentVars = JSON.parse(secretData.SecretString);
			const envFileContent = Object.keys(environmentVars).reduce(
				(outputString, key) =>
					(outputString += `${key}=${environmentVars[key]} \n`),
				''
			);

			fs.writeFileSync('.env', envFileContent);
			console.log('The .env file has been written successfully!');
		} catch (error) {
			console.error(error, error.stack);
			throw error;
		}
	}
});

export default secretsManagerFunctionFactory;
