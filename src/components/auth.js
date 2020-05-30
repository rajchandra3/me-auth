import Cookie from '../cookie.js';
import Config from '../config.js';
import Store from '../localstorage.js';
// import Mixpanel from '../../components/analytics/mixpanel.js';

const signOut = () => {
    let user = Store.getItem('userData');
    var googleAuth = gapi.auth2.getAuthInstance();
    googleAuth.signOut().then(function () {
        Store.empty();
        Cookie.removeCookie(Cookie.cookieName);
        location.reload();
    });
}
const getQueryParams = (url) => {
    let queryParams = {};
    //search property returns the query string of url
    let queryStrings = location.search.substring(1);
    let params = queryStrings.split('&');

    for (var i = 0; i < params.length; i++) {
        var pair = params[i].split('=');
        queryParams[pair[0]] = decodeURIComponent(pair[1]);
    }
    return queryParams;
};

const loginUsingGoogle = (raw)=>{
    // send a POST request
    axios({
        method: 'post',
        url: `${Config.urls.base_url}/auth/google`,
        data: raw
    })
    .then((response) => {
        const data=response.data;
        if(data.code===0){
            Cookie.setCookie(Cookie.cookieName,data.cookies.access_token,999);
            Store.setItem('userData',data.userData);
            let redirect_url=getQueryParams(location.href).redirect_url;
            location.href=redirect_url || Config.urls.base_url;
        }else{
            //error
            console.log(data);
        }
    }, (error) => {
        console.log(error);
    });
}


const onSuccess = (googleUser)=> {
//   console.log('Logged in as: ' + googleUser.getBasicProfile().getName());
    document.querySelector('.username').innerHTML = `${googleUser.getBasicProfile().getName()}(${googleUser.getBasicProfile().getEmail()})`;
    if(!Store.getItem('userData')){
        const raw = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token;
        const data = {
            id_token: raw
        }
        loginUsingGoogle(data);
    }else{
        let redirect_url=getQueryParams(location.href).redirect_url;
        // location.href=redirect_url || Config.urls.base_url;
        document.querySelector('.redirect_btn').innerHTML = 
            `<a class="btn btn-primary" href="${redirect_url || Config.urls.base_url}">Go Back to ${redirect_url || Config.urls.base_url}</a>`
        console.log('userdata is available!')
    }
}
const onFailure = (error)=> {
  console.log(`Error with google signin! ${error}`);
}
const renderButton = ()=> {
  gapi.signin2.render('g-signin-btn', {
    'scope': 'profile email',
    'width': 240,
    'height': 40,
    'longtitle': true,
    'theme': 'light',
    'onsuccess': onSuccess,
    'onfailure': onFailure
  });
}

window.onload=()=>{
    renderButton();
}

// document.getElementById('g-signin-btn').addEventListener('click',onSignIn);
document.querySelector('.google-logout-btn').addEventListener('click',signOut);
