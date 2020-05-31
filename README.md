# global-auth

To make authentication easy we will be using one app login 

#### Steps to login/signup
1. When the user clicks on login/signup, take the user to 

    API

        https://auth.rajchandra.me?redirect_url=${your_redirect_url}

    for example: [https://auth.rajchandra.me?redirect_url=https://rajchandra.me](https://auth.rajchandra.me?redirect_url=https://rajchandra.me)

    Note: Please use http/https in the redirect url

2. Here the user can select a login type - as of now only google login will be available

3. Once the login is completed the user will be redirected back to the redirect_url provided

What data does the app provide:

1. It sets two cookie `me_apps_access_token` and `me_apps_user` with the **jwt** cookie and encoded userData

2. The userdata object with basic user information are available on `localstorage` and `cookie`

3. You can use `atob` to descypt the `me_apps_user`

4. There is a problem with localstorage, you can't access them in subdomains

This app uses the following libraries:
- Bootstrap
- Google Oauth