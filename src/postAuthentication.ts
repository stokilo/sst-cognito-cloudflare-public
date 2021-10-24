import {
  PostAuthenticationTriggerEvent,
  PostAuthenticationTriggerHandler
} from 'aws-lambda/trigger/cognito-user-pool-trigger/post-authentication'

export const handler: PostAuthenticationTriggerHandler = async (
  event: PostAuthenticationTriggerEvent
) => {

  console.log('--------------------- postAuthentication ------------------')
  console.log(event)

  return event
};
