
let APP_URL: string | undefined = undefined;
export const SET_APP_URL = (url: string) => {
  APP_URL = url;
}

export const GET_APP_URL = () => {
  return APP_URL;
}