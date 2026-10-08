import crypto from "node:crypto";
import { google } from "googleapis";

const cookieName = "kpi_session";

function getCredentials(){
  const privateKey = (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
  return {client_email:process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL, private_key:privateKey};
}
async function sheets(){
  const auth=new google.auth.GoogleAuth({credentials:getCredentials(),scopes:["https://www.googleapis.com/auth/spreadsheets.readonly"]});
  const client=await auth.getClient();
  return google.sheets({version:"v4",auth:client});
}
function sign(payload){
  const secret=process.env.SESSION_SECRET;
  if(!secret) throw new Error("SESSION_SECRET belum diatur di Netlify.");
  const body=Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig=crypto.createHmac("sha256",secret).update(body).digest("base64url");
  return `${body}.${sig}`;
}
function verify(token){
  try{
    const [body,sig]=token.split(".");
    const expected=crypto.createHmac("sha256",process.env.SESSION_SECRET).update(body).digest("base64url");
    if(!crypto.timingSafeEqual(Buffer.from(sig),Buffer.from(expected))) return null;
    const p=JSON.parse(Buffer.from(body,"base64url").toString());
    if(!p.exp || p.exp<Date.now()) return null;
    return p;
  }catch{return null}
}
function cookie(value,maxAge=28800){return `${cookieName}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`}

export async function handler(event){
  if(event.httpMethod!=="POST") return {statusCode:405,body:JSON.stringify({message:"Method tidak diizinkan"})};
  try{
    const {username,password}=JSON.parse(event.body||"{}");
    if(!username||!password)return {statusCode:400,body:JSON.stringify({message:"Username dan password wajib diisi."})};
    const s=await sheets();
    const id=process.env.GOOGLE_SPREADSHEET_ID;
    const r=await s.spreadsheets.values.get({spreadsheetId:id,range:"01_USERS!A:E"});
    const rows=r.data.values||[];const headers=rows.shift()||[];
    const u=rows.map(row=>Object.fromEntries(headers.map((h,i)=>[h,row[i]??""]))).find(x=>String(x.Username).trim()===String(username).trim());
    if(!u||String(u.Password)!==String(password)||String(u.Status).toUpperCase()!=="AKTIF"||String(u.Role).toUpperCase()!=="ADMIN")
      return {statusCode:401,body:JSON.stringify({message:"Username atau password salah."})};
    const token=sign({username:u.Username,nama:u.Nama,role:u.Role,exp:Date.now()+28800000});
    return {statusCode:200,headers:{"Content-Type":"application/json","Set-Cookie":cookie(token)},body:JSON.stringify({ok:true,nama:u.Nama})};
  }catch(e){console.error(e);return {statusCode:500,body:JSON.stringify({message:"Login gagal. Periksa koneksi Google Sheets/Netlify."})}}
}
export {verify};
