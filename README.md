# global-auth

To make authentication easy we will be using one app login 

### Steps to accomplish this 
1. When the user clicks on login/signup, take the user to 

    API

        https://auth.rajchandra.me?redirect_url=${your_redirect_url}

    for example: [https://auth.rajchandra.me?redirect_url=https://rajchandra.me](https://auth.rajchandra.me?redirect_url=https://rajchandra.me)

    Note: Please use http/https in the redirect url

2. Here the user can select a login type - as of now only google login will be available

3. Once the login is completed the user will be redirected back to the redirect_url provided

What data does the app provide:

1. It sets a cookie `me_apps_access_token` with the **jwt** cookie

2. It also sets a userdata object with basic user information
3. Alternatively, you can use `atob` to descypt the _jwt token_

This app uses the following libraries:
- Bootstrap
- Google Oauth