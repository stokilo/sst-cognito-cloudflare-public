import { createApp } from 'vue'
import App from './App.vue'
import Amplify from '@aws-amplify/core';
import Auth from '@aws-amplify/auth'
import awsConfig from './aws-config.json'

Amplify.configure({
    Auth: {
        region: awsConfig.region,
        userPoolId: awsConfig.userPoolId,
        userPoolWebClientId: awsConfig.userPoolClientId,
        identityPoolId: awsConfig.identityPoolId
    },

    API: {
        endpoints: [
            {
                name: awsConfig.apiNameIAM,
                endpoint: awsConfig.apiEndpoint,
                region: awsConfig.region
            },
            {
                name: awsConfig.apiNameJWT,
                endpoint: awsConfig.apiEndpoint,
                region: awsConfig.region,
                custom_header: async () => {
                    return {
                        Authorization: `Bearer ${(await Auth.currentSession()).getAccessToken().getJwtToken()}`
                    }
                }
            }
        ]
    },
    oauth: {
        domain: `${awsConfig.domainPrefix}.auth.${awsConfig.region}.amazoncognito.com`,
        scope: ['phone', 'email', 'profile', 'openid', 'aws.cognito.signin.user.admin'],
        redirectSignIn: awsConfig.redirectSignIn,
        redirectSignOut: awsConfig.redirectSignOut,
        responseType: 'code'
    }
});

createApp(App).mount('#app');

