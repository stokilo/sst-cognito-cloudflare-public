<template>
  <div>
    <span>Test2: Facebook and Google auth integration with AmplifyJS and SST.</span>
    <br/>

    <div>
      <button @click="onClickFacebook">Facebook login</button>
    </div>

    <hr/>

    <div>
      <button @click="onClickGoogle">Google login</button>
    </div>

    <hr/>

    <div>
      <button @click="onShowUser">Show authenticated user</button>
    </div>
    <hr/>
    <div>
      <button @click="onApiGetIAM">Authenticated API GET with IAM</button>
    </div>
    <hr/>
    <div>
      <button @click="onApiGetJWT">Authenticated API GET with JWT</button>
    </div>

    <span>API GET with IAM result:</span>
    <pre><code>{{ JSON.stringify(this.apiCallResultIAM, null, 4) }}</code></pre>
    <span>API GET with JWT result:</span>
    <pre><code>{{ JSON.stringify(this.apiCallResultJWT, null, 4) }}</code></pre>
    <span>Auth.currentAuthenticatedUser():</span>
    <pre><code>{{ JSON.stringify(this.user, null, 4) }}</code></pre>
    <span>Auth.currentUserInfo():</span>
    <pre><code>{{ JSON.stringify(this.currentUserInfo, null, 4) }}</code></pre>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { Auth } from '@aws-amplify/auth'
import { API } from '@aws-amplify/api'
import { CognitoHostedUIIdentityProvider } from '@aws-amplify/auth/src/types/Auth'
import awsConfig from './aws-config.json'
import { Hub } from '@aws-amplify/core'

export default defineComponent({
  name: 'App',
  data() {
    return {
      user: '{}',
      currentUserInfo: '{}',
      apiCallResultIAM: '',
      apiCallResultJWT: ''
    }
  },

  mounted() {
    Hub.listen('auth', async () => await this.onShowUser())
  },

  methods: {
    async onClickFacebook() {
      const credentials = await Auth.federatedSignIn({provider: CognitoHostedUIIdentityProvider.Facebook})
      console.dir(credentials)
    },

    async onClickGoogle() {
      const credentials = await Auth.federatedSignIn({provider: CognitoHostedUIIdentityProvider.Google})
      console.dir(credentials)
    },

    async onShowUser() {
      this.user = await Auth.currentAuthenticatedUser()
      this.currentUserInfo = await Auth.currentUserInfo()
      console.info('user:', this.user)
      console.info('currentUserInfo', this.currentUserInfo)
    },

    async onApiGetIAM() {
      this.apiCallResultIAM = await API.get(awsConfig.apiNameIAM, '/privateIAM', {})
      console.info('apiCallResultIAM: ', this.apiCallResultIAM)
    },

    async onApiGetJWT() {
      this.apiCallResultJWT = await API.get(awsConfig.apiNameJWT, '/privateJWT', {})
      console.info('apiCallResultJWT: ', this.apiCallResultJWT)
    }

  }
})
</script>
