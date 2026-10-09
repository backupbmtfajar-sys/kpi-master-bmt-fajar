import { google } from "googleapis";
import crypto from "node:crypto";

const cookieName="kpi_session";
function verify(token){
  try{
    const [body,sig]=token.split(".");
    const expected=crypto.createHmac("sha256",process.env.SESSION_SECRET).update(body).digest("base64url");
    if(!crypto.timingSafeEqual(Buffer.from(sig),Buffer.from(expected)))return null;
    const p=JSON.parse(Buffer.from(body,"base64url").toString());return p.exp>Date.now()?p:null;
  }catch{return null}
}
function userFromEvent(event){
 const c=event.headers.cookie||"";const m=c.match(new RegExp(`${cookieName}=([^;]+)`));return m?verify(m[1]):null;
}
async function sheets(){
 const auth=new google.auth.GoogleAuth({credentials:{client_email:process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,private_key:(process.env.GOOGLE_PRIVATE_KEY||"").replace(/\\n/g,"\n")},scopes:["https://www.googleapis.com/auth/spreadsheets.readonly"]});
 const client=await auth.getClient();return google.sheets({version:"v4",auth:client});
}
async function getSheet(s,id,name){
 const r=await s.spreadsheets.values.get({spreadsheetId:id,range:`${name}!A:Z`});
 const rows=r.data.values||[];const headers=rows.shift()||[];
 return rows.map(row=>Object.fromEntries(headers.map((h,i)=>[h,row[i]??""])));
}
export async function handler(event){
 const user=userFromEvent(event);if(!user)return {statusCode:401,body:JSON.stringify({message:"Sesi tidak valid."})};
 try{
  const s=await sheets(),id=process.env.GOOGLE_SPREADSHEET_ID;
  const [employees,kpiAo,kpiFo,targetAo,targetFo]=await Promise.all([
   getSheet(s,id,"02_DATA_KARYAWAN"),getSheet(s,id,"03_KPI_AO"),getSheet(s,id,"04_KPI_FO"),getSheet(s,id,"05_TARGET_AO"),getSheet(s,id,"06_TARGET_FO")
  ]);
  return {statusCode:200,headers:{"Content-Type":"application/json","Cache-Control":"private, max-age=30"},body:JSON.stringify({user,employees,kpiAo,kpiFo,targetAo,targetFo})};
 }catch(e){console.error(e);return {statusCode:500,body:JSON.stringify({message:"Gagal membaca Google Spreadsheet.",detail:e.message})}}
}
