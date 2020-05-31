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
        Cookie.removeCookie(Cookie.userDataCookieName);
        let redirect_url=getQueryParams(location.href).redirect_url;
        redirect_url?
        location.href=redirect_url:
        null;
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
            Cookie.setCookie(Cookie.userDataCookieName,window.btoa(JSON.stringify(data.userData)),999);
            let redirect_url=getQueryParams(location.href).redirect_url;
            redirect_url?
            location.href=redirect_url:
            location.reload();
        }else{
            //error
            console.log(data);
        }
    }, (error) => {
        console.log(error);
    });
}


const onSuccess = (googleUser)=> {
    const shouldLogout = Boolean(getQueryParams(location.href).logout || false);
    shouldLogout?signOut():null;
    document.querySelector('.username').innerHTML = `${googleUser.getBasicProfile().getName()}(${googleUser.getBasicProfile().getEmail()})`;
    if(!Cookie.checkCookie(Cookie.userDataCookieName) 
    && !Cookie.checkCookie(Cookie.cookieName)){
        const raw = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token;
        const data = {
            id_token: raw
        }
        loginUsingGoogle(data);
    }else{
        let redirect_url=getQueryParams(location.href).redirect_url;
        redirect_url?
        location.href=redirect_url:
        null;
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
    const isLoggedIn = Cookie.checkCookie(Cookie.userDataCookieName) && Cookie.checkCookie('me_apps_access_token');
    if(isLoggedIn){
        let loggedin_elements = document.querySelectorAll('.loggedin');
        for(let ele of loggedin_elements) {
            ele.style.display='block';
        }

        let loggedout_elements = document.querySelectorAll('.logged-out');
        for(let ele of loggedout_elements) {
            ele.style.display='none';
        }
    }else{
        let loggedin_elements = document.querySelectorAll('.loggedin');
        for(let ele of loggedin_elements) {
            ele.style.display='none';
        }

        let loggedout_elements = document.querySelectorAll('.logged-out');
        for(let ele of loggedout_elements) {
            ele.style.display='block';
        }
    }
}

// document.getElementById('g-signin-btn').addEventListener('click',onSignIn);
document.querySelector('.google-logout-btn').addEventListener('click',signOut);

//register service worker

// register service worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', ()=> {
        navigator.serviceWorker.register('/serviceWorker.js').then((registration)=> {
            // Registration was successful
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
        }, (err)=> {
            // registration failed :(
            console.log('ServiceWorker registration failed: ', err);
        });
    });
}

