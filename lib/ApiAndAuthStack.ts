import * as sst from '@serverless-stack/resources'
import { HttpUserPoolAuthorizer } from "@aws-cdk/aws-apigatewayv2-authorizers";
import { ApiAuthorizationType, Auth } from '@serverless-stack/resources'
import { CorsHttpMethod } from '@aws-cdk/aws-apigatewayv2'
import { Function } from '@serverless-stack/resources'
import { ProviderAttribute, UserPool, UserPoolClient,
  UserPoolClientIdentityProvider, UserPoolIdentityProviderFacebook, UserPoolIdentityProviderGoogle,
  ClientAttributes} from '@aws-cdk/aws-cognito'
import { App, RemovalPolicy } from '@aws-cdk/core'
import * as SSM from '@aws-cdk/aws-ssm'
import * as SM from '@aws-cdk/aws-secretsmanager'

export default class ApiAndAuthStack extends sst.Stack {

  readonly DOMAIN_PREFIX= 'stokilo'

  constructor(scope: sst.App, id: string, props?: sst.StackProps) {
    super(scope, id, props)

    const userPool = new UserPool(this, 'TestUserPool', {
      userPoolName: 'TestUserPool',
      signInAliases: {email: true, phone: false, username: true},
      selfSignUpEnabled: true,
      removalPolicy: RemovalPolicy.DESTROY,
      lambdaTriggers: {
         postAuthentication: new Function(this, "PostHandlerLambda", {
          handler: "src/postAuthentication.handler"
        })
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: true
        }
      }
    })

    userPool.addDomain('CognitoDomain', {
      cognitoDomain: {
        domainPrefix: this.DOMAIN_PREFIX
      }
    })

    const apiSecrets = SM.Secret.fromSecretNameV2(this, 'AccountLevelApiSecrets',
      '/account/api/secrets',
    );

    const facebookProvider = new UserPoolIdentityProviderFacebook(this, 'Facebook', {
      userPool,
      clientId: apiSecrets.secretValueFromJson('FACEBOOK_CLIENT_ID').toString(),
      clientSecret: apiSecrets.secretValueFromJson('FACEBOOK_CLIENT_SECRET').toString(),
      scopes: ['public_profile', 'email'],
      attributeMapping: {
        email: ProviderAttribute.FACEBOOK_EMAIL
      }
    });

    const googleProvider = new UserPoolIdentityProviderGoogle(this, 'Google', {
      userPool,
      clientId: apiSecrets.secretValueFromJson('GOOGLE_CLIENT_ID').toString(),
      clientSecret: apiSecrets.secretValueFromJson('GOOGLE_CLIENT_SECRET').toString(),
      scopes: ['email'],
      attributeMapping: {
        email: ProviderAttribute.GOOGLE_EMAIL
      }
    })

    const userPoolClient = new UserPoolClient(this, 'TestUserPoolClient', {
      userPool,
      disableOAuth: false,
      oAuth: {
        callbackUrls: [process.env.IS_LOCAL ?  'http://localhost:8080/' :
         scope.stage === 'dev' ? 'https://dev.stokilo.com' : 'https://stokilo.com'],
       logoutUrls: [process.env.IS_LOCAL ?  'http://localhost:8080/' :
         scope.stage === 'dev' ? 'https://dev.stokilo.com' : 'https://stokilo.com'],
      },
      supportedIdentityProviders: [UserPoolClientIdentityProvider.FACEBOOK, UserPoolClientIdentityProvider.GOOGLE],
      readAttributes: new ClientAttributes().withStandardAttributes({
        email: true
      }),
      writeAttributes: new ClientAttributes().withStandardAttributes({
        email: true
      })
    })
    userPoolClient.node.addDependency(facebookProvider);
    userPoolClient.node.addDependency(googleProvider);

    const auth = new Auth(this, 'Auth', {
      cognito: {
        userPool,
        userPoolClient,
      }
    })

    const api = new sst.Api(this, 'Api', {
      defaultAuthorizationType: sst.ApiAuthorizationType.AWS_IAM,
      routes: {
        'GET /privateIAM': 'src/privateIAM.handler',
        "GET /privateJWT": {
          authorizationType: ApiAuthorizationType.JWT,
          authorizer: new HttpUserPoolAuthorizer({
            userPool,
            userPoolClient,
          }),
          function: "src/privateJWT.handler",
        },
      },
      cors: {
        allowMethods: [CorsHttpMethod.GET],
        allowOrigins: ['http://localhost:8080', 'https://stokilo.com', 'https://dev.stokilo.com'],
        allowHeaders: ['*']
      }
    })
    auth.attachPermissionsForAuthUsers([api])

    new SSM.StringParameter(this, `AccountLevelStacksConfiguration`, {
      parameterName: `/account/stacks-config`,
      description: 'Stacks config account level wide.',
      stringValue: JSON.stringify(
        {
        userPoolId: userPool.userPoolId,
        userPoolClientId: userPoolClient.userPoolClientId,
        identityPoolId: auth.cognitoCfnIdentityPool.ref,
        apiEndpoint: api.url,
        region: scope.region,
        domainPrefix: this.DOMAIN_PREFIX,
        apiName: 'TestAPI',
        apiNameIAM: 'TestAPIAuthorizeIAM',
        apiNameJWT: 'TestAPIAuthorizeJWT',
      })
    })

    this.addOutputs({
      userPoolId: userPool.userPoolId,
      userPoolClientId: userPoolClient.userPoolClientId,
      identityPoolId: auth.cognitoCfnIdentityPool.ref,
      apiEndpoint: api.url,
      region: scope.region,
      domainPrefix: this.DOMAIN_PREFIX,
      apiName: 'TestAPI',
      apiNameIAM: 'TestAPIAuthorizeIAM',
      apiNameJWT: 'TestAPIAuthorizeJWT',
    })
  }
}
