import Cookie from './cookie.js';
const toggler = window.location.hostname === 'auth.rajchandra.me' ? 1 : 0;
const env=toggler?'production':'development';

const urls={
    base_url:`${env==="production"?'https://www.rajchandra.me':'http://localhost:8060'}`
}

const getAuthConfig = ()=>{
    //return auth headers
    return {
        Authorization: Cookie.checkCookie(Cookie.cookieName)?`Bearer ${Cookie.getCookie(Cookie.cookieName)}`:null
    }
}

export default { env, urls, getAuthConfig };
