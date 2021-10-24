import { API } from '@aws-amplify/api'

class TestService {

  get(): Promise<string> {
    // return API.get(dev.apiName, '/private', {})
    return new Promise<string>( (resolve) => {
      resolve('')
    })
  }
}

export default new TestService();
